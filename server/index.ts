import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import Groq from 'groq-sdk';
import { Client, Account, Query, ID } from 'node-appwrite';
import Stripe from 'stripe';
import { getServerAppwrite } from './appwrite.js';
import { parseERDSchema } from '../src/lib/schema.js';
import { ERD_SYSTEM_PROMPT } from '../src/lib/prompts/erd-system-prompt.js';
import { stripe } from './lib/stripe.js';
import { createUropayCheckoutSession } from './lib/uropay.js';
import {
  PLAN_FEATURES,
  findStripePlanByPriceId,
  findUropayPlanByPlanId,
  getPaidPriceConfig,
  getPlanEntitlements,
  type PlanTier,
} from './pricing-config.js';

// Load environment variables
dotenv.config({ path: ['.env.local', '.env'] });

const app = express();
const PORT = process.env.PORT || 3001;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());

type ActivePlan = PlanTier;

function isActiveSubscriptionStatus(status: string | undefined): boolean {
  return status === 'active' || status === 'trialing' || status === 'past_due';
}

function getMonthBounds(date = new Date()): { start: string; end: string } {
  const startDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0));
  return { start: startDate.toISOString(), end: endDate.toISOString() };
}

async function getPrimaryWorkspaceForUser(adminAppwrite: ReturnType<typeof getServerAppwrite>, userId: string) {
  const workspaceResponse = await adminAppwrite.databases.listDocuments('instanterd', 'workspaces', [
    Query.equal('ownerUserId', userId),
    Query.orderAsc('$createdAt'),
    Query.limit(1),
  ]);
  return workspaceResponse.documents[0];
}

async function getWorkspaceSubscription(adminAppwrite: ReturnType<typeof getServerAppwrite>, workspaceId: string) {
  try {
    return await adminAppwrite.databases.getDocument('instanterd', 'subscriptions', workspaceId);
  } catch {
    const response = await adminAppwrite.databases.listDocuments('instanterd', 'subscriptions', [
      Query.equal('workspaceId', workspaceId),
      Query.limit(1),
    ]);
    return response.documents[0] || null;
  }
}

async function upsertWorkspaceSubscription(
  adminAppwrite: ReturnType<typeof getServerAppwrite>,
  workspaceId: string,
  data: Record<string, unknown>,
) {
  try {
    return await adminAppwrite.databases.createDocument('instanterd', 'subscriptions', workspaceId, data);
  } catch (err: any) {
    if (err?.code === 409) {
      return await adminAppwrite.databases.updateDocument('instanterd', 'subscriptions', workspaceId, data);
    }
    throw err;
  }
}

async function resolveWorkspaceEntitlements(adminAppwrite: ReturnType<typeof getServerAppwrite>, workspace: any) {
  const subscription = await getWorkspaceSubscription(adminAppwrite, workspace.$id);
  const activePlan: ActivePlan = subscription && isActiveSubscriptionStatus(subscription.status)
    ? (subscription.plan as ActivePlan)
    : (workspace.plan as ActivePlan) || 'free';
  const planEntitlements = getPlanEntitlements(activePlan);
  const limit = subscription?.generationsLimit || planEntitlements.generationsLimit;
  const seats = subscription?.seatLimit || planEntitlements.seatLimit;
  const { start, end } = getMonthBounds();

  const usageResponse = await adminAppwrite.databases.listDocuments('instanterd', 'generations', [
    Query.equal('workspaceId', workspace.$id),
    Query.equal('success', true),
    Query.greaterThanEqual('$createdAt', start),
    Query.lessThan('$createdAt', end),
    Query.limit(1),
  ]);

  const used = usageResponse.total;
  const remaining = Math.max(0, limit - used);

  return {
    workspaceId: workspace.$id,
    plan: activePlan,
    entitlements: {
      ...planEntitlements,
      generationsLimit: limit,
      seatLimit: seats,
    },
    usage: {
      generationCountThisMonth: used,
      generationRemainingThisMonth: remaining,
      resetAt: end,
    },
    subscription,
  };
}

// --- WEBHOOKS (Must be before express.json to get exact raw body) ---
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    if (!sig || !webhookSecret) throw new Error('Missing signature or secret');
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const adminAppwrite = getServerAppwrite();
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspaceId;
      if (!workspaceId) throw new Error('No workspaceId in metadata');

      const metadataPlan = session.metadata?.plan as PlanTier | undefined;
      const metadataCycle = session.metadata?.billingCycle || 'monthly';
      const metadataCurrency = session.metadata?.currency || 'USD';
      const stripePriceId = session.metadata?.priceId;
      const priceMatch = stripePriceId ? findStripePlanByPriceId(stripePriceId) : undefined;
      const plan = metadataPlan && metadataPlan !== 'free'
        ? metadataPlan
        : (priceMatch?.tier || (session.amount_total && session.amount_total >= 2900 ? 'team' : 'pro'));
      const entitlements = getPlanEntitlements(plan);

      let currentPeriodStart: string | undefined;
      let currentPeriodEnd: string | undefined;
      if (typeof session.subscription === 'string') {
        try {
          const stripeSub = await stripe.subscriptions.retrieve(session.subscription);
          currentPeriodStart = new Date(stripeSub.current_period_start * 1000).toISOString();
          currentPeriodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();
        } catch (subErr) {
          console.error('Failed to fetch Stripe subscription details', subErr);
        }
      }

      // Ensure customer exists
      await upsertWorkspaceSubscription(adminAppwrite, workspaceId, {
        workspaceId,
        teamId: workspaceId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        stripePriceId: stripePriceId || undefined,
        paymentProvider: 'stripe',
        plan,
        status: 'active',
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
        generationsLimit: entitlements.generationsLimit,
        seatLimit: entitlements.seatLimit,
      });

      await adminAppwrite.databases.updateDocument('instanterd', 'workspaces', workspaceId, { plan });
      await adminAppwrite.databases.createDocument('instanterd', 'audit_log', ID.unique(), {
        workspaceId,
        action: 'subscription.upgraded',
        resourceType: 'subscription',
        diff: JSON.stringify({
          provider: 'stripe',
          plan,
          billingCycle: metadataCycle,
          currency: metadataCurrency,
        }),
      });
    } else if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription;
      const docs = await adminAppwrite.databases.listDocuments('instanterd', 'subscriptions', [
        Query.equal('stripeSubscriptionId', sub.id),
        Query.limit(1),
      ]);
      if (docs.documents.length) {
        const subDoc = docs.documents[0];
        await adminAppwrite.databases.updateDocument('instanterd', 'subscriptions', subDoc.$id, {
          status: sub.status,
          currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
          currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
          canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : undefined,
          trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : undefined,
        });
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      // Fetch by stripe string
      const docs = await adminAppwrite.databases.listDocuments('instanterd', 'subscriptions', [Query.equal('stripeSubscriptionId', sub.id)]);
      if (docs.documents.length) {
        const subDoc = docs.documents[0];
        await adminAppwrite.databases.updateDocument('instanterd', 'subscriptions', subDoc.$id, {
          status: 'canceled',
          plan: 'free',
          generationsLimit: 10,
          seatLimit: 1,
          canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : new Date().toISOString(),
        });
        await adminAppwrite.databases.updateDocument('instanterd', 'workspaces', subDoc.workspaceId, { plan: 'free' });
        await adminAppwrite.databases.createDocument('instanterd', 'audit_log', ID.unique(), {
          workspaceId: subDoc.workspaceId, action: 'subscription.canceled', resourceType: 'subscription'
        });
      }
    }
    // Return 200 for everything Handled + Unhandled
    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Stripe Webhook Processing Error', err);
    res.status(200).json({ received: true }); // Still return 200 to Stripe
  }
});

app.post('/api/uropay/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // UROPay webhook similar implementation mock
  const sig = req.headers['x-uropay-signature'];
  if (!sig || sig !== process.env.UROPAY_WEBHOOK_SECRET) {
    return res.status(401).send(`Webhook Error: Unsigned`);
  }
  
  try {
    const rawBody = req.body.toString('utf8');
    const event = JSON.parse(rawBody);
    const adminAppwrite = getServerAppwrite();

    if (event.type === 'payment.success') {
      const { workspaceId, planId, customerId, subscriptionId } = event.data;
      const match = findUropayPlanByPlanId(planId);
      const plan = match?.tier || (planId.includes('team') ? 'team' : 'pro');
      const entitlements = getPlanEntitlements(plan);

      await upsertWorkspaceSubscription(adminAppwrite, workspaceId, {
        workspaceId,
        teamId: workspaceId,
        uropayCustomerId: customerId,
        uropaySubscriptionId: subscriptionId,
        paymentProvider: 'uropay',
        plan,
        status: 'active',
        cancelAtPeriodEnd: false,
        generationsLimit: entitlements.generationsLimit,
        seatLimit: entitlements.seatLimit,
      });

      await adminAppwrite.databases.updateDocument('instanterd', 'workspaces', workspaceId, { plan });
    }
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('UROPay Webhook Error', err);
    res.status(200).json({ received: true });
  }
});

app.use(express.json({ limit: '5mb' }));

app.get('/api/pricing/config', (_req, res) => {
  const paidConfig = getPaidPriceConfig();
  res.status(200).json({
    currencies: ['USD', 'INR'],
    billingCycles: ['monthly', 'annual'],
    annualLabel: '2 months free',
    freePlan: {
      name: 'Free',
      displayPriceByCurrency: {
        USD: '$0',
        INR: '₹0',
      },
      suffix: 'forever',
      features: PLAN_FEATURES.free,
      lockedBadges: ['SQL + Mix input', 'SVG/PDF export', 'Watermark-free sharing', 'Version history', 'API access'],
    },
    paid: paidConfig,
    planFeatures: PLAN_FEATURES,
  });
});

app.get('/api/entitlements', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'unauthorized', message: 'Missing or invalid JWT' });
    }
    const jwt = authHeader.split(' ')[1];

    const userClient = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.APPWRITE_PROJECT_ID || '')
      .setJWT(jwt);
    const account = new Account(userClient);
    const user = await account.get();

    const adminAppwrite = getServerAppwrite();
    const workspace = await getPrimaryWorkspaceForUser(adminAppwrite, user.$id);

    if (!workspace) {
      return res.status(404).json({ error: 'no_workspace', message: 'No workspace found for user.' });
    }

    const snapshot = await resolveWorkspaceEntitlements(adminAppwrite, workspace);
    return res.status(200).json(snapshot);
  } catch (error) {
    console.error('Entitlements Error:', error);
    return res.status(500).json({ error: 'api_error', message: error instanceof Error ? error.message : 'Unknown' });
  }
});

app.post('/api/generate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'unauthorized', message: 'Missing or invalid JWT' });
    }
    const jwt = authHeader.split(' ')[1];

    // Verify User JWT
    const userClient = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.APPWRITE_PROJECT_ID || '')
      .setJWT(jwt);
    const account = new Account(userClient);
    const user = await account.get();

    // Verify Subscription Limits and feature unlocks from server-side entitlements.
    const adminAppwrite = getServerAppwrite();
    const workspace = await getPrimaryWorkspaceForUser(adminAppwrite, user.$id);
    
    if (!workspace) {
      return res.status(403).json({ error: 'no_workspace', message: 'No workspace found for user.' });
    }

    const { mode, naturalLanguage, sqlSchema, sqlDialect, additionalContext, options } = req.body;
    const entitlementSnapshot = await resolveWorkspaceEntitlements(adminAppwrite, workspace);
    const allowedModes = entitlementSnapshot.entitlements.allowedModes;

    if (!allowedModes.includes(mode)) {
      return res.status(403).json({
        error: 'feature_locked',
        message: `${mode.toUpperCase()} mode is available on Pro and Team plans.`,
        currentPlan: entitlementSnapshot.plan,
        requiredPlan: 'pro',
      });
    }

    if (entitlementSnapshot.usage.generationRemainingThisMonth <= 0) {
      return res.status(429).json({
        error: 'limit_reached',
        message: `Monthly generation limit reached for ${entitlementSnapshot.plan} plan.`,
        limit: entitlementSnapshot.entitlements.generationsLimit,
        used: entitlementSnapshot.usage.generationCountThisMonth,
        resetAt: entitlementSnapshot.usage.resetAt,
      });
    }

    let userMessage = '';
    if (mode === 'nl') {
      userMessage = naturalLanguage || '';
    } else if (mode === 'sql') {
      userMessage = `SQL Dialect: ${sqlDialect}\n\n${sqlSchema}\n\nAdditional context: ${additionalContext || ''}`;
    } else if (mode === 'mix') {
      userMessage = `Domain description:\n${naturalLanguage}\n\nSQL Schema (${sqlDialect}):\n${sqlSchema}\n\nAdditional context: ${additionalContext || ''}`;
    }

    userMessage += `\n\nOptions to respect:\n${JSON.stringify(options, null, 2)}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: ERD_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      model: 'mixtral-8x7b-32768', // Adjust the model as needed
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const responseText = chatCompletion.choices[0].message.content || '{}';
    
    try {
      const parsedJson = JSON.parse(responseText);
      const validatedSchema = parseERDSchema(parsedJson);

      // Log generation success
      await adminAppwrite.databases.createDocument('instanterd', 'generations', ID.unique(), {
        workspaceId: workspace.$id,
        teamId: workspace.teamId,
        userId: user.$id,
        inputMode: mode || 'nl',
        model: 'mixtral-8x7b-32768',
        success: true,
        planAtTime: entitlementSnapshot.plan
      });

      res.status(200).json({ schema: validatedSchema, workspaceId: workspace.$id, teamId: workspace.teamId });
    } catch (parseErr: any) {
      return res.status(422).json({ error: 'schema_invalid', details: parseErr.message, raw: responseText });
    }

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'api_error', message: error instanceof Error ? error.message : 'Unknown' });
  }
});

// --- STRIPE ENDPOINTS ---

app.post('/api/stripe/checkout', async (req, res) => {
  try {
    const { priceId, workspaceId, userEmail } = req.body;
    if (!priceId || !workspaceId) return res.status(400).json({ error: 'Missing required parameters' });

    const priceConfig = findStripePlanByPriceId(priceId);
    if (!priceConfig) {
      return res.status(400).json({ error: 'Unknown Stripe priceId' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: userEmail || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin || 'http://localhost:3000'}/dashboard?upgraded=true`,
      cancel_url: `${req.headers.origin || 'http://localhost:3000'}/pricing`,
      metadata: {
        workspaceId,
        plan: priceConfig.tier,
        billingCycle: priceConfig.billingCycle,
        currency: priceConfig.currency,
        priceId,
      },
    });

    res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/stripe/portal', async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) return res.status(400).json({ error: 'Missing customerId' });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.headers.origin || 'http://localhost:3000'}/dashboard`
    });

    res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Portal Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- UROPAY ENDPOINTS ---

app.post('/api/uropay/checkout', async (req, res) => {
  try {
    const { planId, workspaceId, userEmail } = req.body;
    if (!planId || !workspaceId) return res.status(400).json({ error: 'Missing required parameters' });

    const planConfig = findUropayPlanByPlanId(planId);
    if (!planConfig) {
      return res.status(400).json({ error: 'Unknown UROPay planId' });
    }

    const url = await createUropayCheckoutSession(planId, workspaceId, userEmail || 'unknown@example.com');
    res.status(200).json({ url });
  } catch (error: any) {
    console.error('UROPay Checkout Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/uropay/portal', async (req, res) => {
  try {
    const { customerId } = req.body;
    // Mock URL for portal
    const url = `https://demo.uropay.in/portal/${customerId}?returnUrl=${encodeURIComponent(req.headers.origin || 'http://localhost:3000')}/dashboard`;
    res.status(200).json({ url });
  } catch (error: any) {
    console.error('UROPay Portal Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`API Server running on http://localhost:${PORT}`);
});
