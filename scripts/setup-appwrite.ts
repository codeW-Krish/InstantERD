import { Client, Databases, Storage, ID, Permission, Role, IndexType } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;

if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
  console.error("Missing APPWRITE_PROJECT_ID or APPWRITE_API_KEY in .env.local");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const DB_ID = 'instanterd';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForAttribute(dbId: string, collId: string, key: string) {
  console.log(`Waiting for attribute ${key} to be available...`);
  while (true) {
    try {
      const attr = await databases.getAttribute(dbId, collId, key);
      if (attr.status === 'available') return;
      await delay(1000);
    } catch (e: any) {
      if (e.code !== 404) throw e;
      await delay(1000);
    }
  }
}

async function run() {
  try {
    console.log(`Creating database ${DB_ID}...`);
    try {
      await databases.create(DB_ID, 'InstantERD DB');
      console.log('Database created.');
    } catch (e: any) {
      if (e.code === 409) console.log('Database already exists.');
      else throw e;
    }

    const collections = [
      {
        id: 'profiles',
        perms: [Permission.read(Role.users()), Permission.create(Role.users()), Permission.update(Role.users())],
        attributes: [
          { type: 'string', key: 'userId', size: 36, req: true },
          { type: 'string', key: 'displayName', size: 255, req: false },
          { type: 'string', key: 'avatarUrl', size: 2048, req: false },
          { type: 'string', key: 'email', size: 255, req: false },
          { type: 'string', key: 'metadata', size: 8192, req: false, default: '{}' }
        ],
        indexes: [
          { key: 'userId_unique', type: 'unique', attributes: ['userId'] },
          { key: 'email_key', type: 'key', attributes: ['email'] }
        ]
      },
      {
        id: 'workspaces',
        perms: [Permission.read(Role.users()), Permission.create(Role.users()), Permission.update(Role.users())],
        attributes: [
          { type: 'string', key: 'teamId', size: 36, req: true },
          { type: 'string', key: 'name', size: 255, req: true },
          { type: 'string', key: 'slug', size: 50, req: true },
          { type: 'string', key: 'ownerUserId', size: 36, req: true },
          { type: 'enum', key: 'plan', elements: ['free', 'pro', 'team'], req: true, default: 'free' },
          { type: 'string', key: 'avatarUrl', size: 2048, req: false },
          { type: 'string', key: 'metadata', size: 8192, req: false, default: '{}' },
          { type: 'datetime', key: 'deletedAt', req: false }
        ],
        indexes: [
          { key: 'teamId_unique', type: 'unique', attributes: ['teamId'] },
          { key: 'slug_unique', type: 'unique', attributes: ['slug'] },
          { key: 'ownerUserId_key', type: 'key', attributes: ['ownerUserId'] }
        ]
      },
      {
        id: 'projects',
        perms: [Permission.read(Role.users()), Permission.create(Role.users()), Permission.update(Role.users()), Permission.delete(Role.users())],
        attributes: [
          { type: 'string', key: 'workspaceId', size: 36, req: true },
          { type: 'string', key: 'teamId', size: 36, req: true },
          { type: 'string', key: 'name', size: 255, req: true },
          { type: 'string', key: 'slug', size: 60, req: true },
          { type: 'string', key: 'description', size: 1000, req: false },
          { type: 'string', key: 'color', size: 7, req: false },
          { type: 'string', key: 'createdByUserId', size: 36, req: true },
          { type: 'datetime', key: 'deletedAt', req: false }
        ],
        indexes: [
          { key: 'workspaceId_key', type: 'key', attributes: ['workspaceId'] },
          { key: 'teamId_key', type: 'key', attributes: ['teamId'] }
        ]
      },
      {
        id: 'diagrams',
        perms: [Permission.read(Role.users()), Permission.create(Role.users()), Permission.update(Role.users()), Permission.delete(Role.users())],
        attributes: [
          { type: 'string', key: 'workspaceId', size: 36, req: true },
          { type: 'string', key: 'teamId', size: 36, req: true },
          { type: 'string', key: 'projectId', size: 36, req: false },
          { type: 'string', key: 'createdByUserId', size: 36, req: true },
          { type: 'string', key: 'lastEditedByUserId', size: 36, req: false },
          { type: 'string', key: 'title', size: 500, req: true, default: 'Untitled diagram' },
          { type: 'string', key: 'schema', size: 500000, req: false },
          { type: 'string', key: 'rawInput', size: 100000, req: false, default: '{}' },
          { type: 'enum', key: 'inputMode', elements: ['nl', 'sql', 'mix'], req: true, default: 'nl' },
          { type: 'string', key: 'layoutOverrides', size: 50000, req: false, default: '{}' },
          { type: 'integer', key: 'version', req: true, default: 1 },
          { type: 'boolean', key: 'isPublic', req: true, default: false },
          { type: 'string', key: 'shareToken', size: 32, req: false },
          { type: 'string', key: 'exportSvgPath', size: 500, req: false },
          { type: 'string', key: 'exportPngPath', size: 500, req: false },
          { type: 'string', key: 'exportPdfPath', size: 500, req: false },
          { type: 'string', key: 'tags', size: 1000, req: false, default: '[]' },
          { type: 'datetime', key: 'deletedAt', req: false },
          { type: 'string', key: 'deletedByUserId', size: 36, req: false }
        ],
        indexes: [
          { key: 'workspaceId_key', type: 'key', attributes: ['workspaceId'] },
          { key: 'teamId_key', type: 'key', attributes: ['teamId'] },
          { key: 'projectId_key', type: 'key', attributes: ['projectId'] },
          { key: 'shareToken_unique', type: 'unique', attributes: ['shareToken'] },
          { key: 'title_fulltext', type: 'fulltext', attributes: ['title'] }
        ]
      },
      {
        id: 'diagram_versions',
        perms: [Permission.read(Role.users()), Permission.create(Role.users())],
        attributes: [
          { type: 'string', key: 'diagramId', size: 36, req: true },
          { type: 'string', key: 'workspaceId', size: 36, req: true },
          { type: 'string', key: 'teamId', size: 36, req: true },
          { type: 'integer', key: 'versionNumber', req: true },
          { type: 'string', key: 'schema', size: 500000, req: true },
          { type: 'string', key: 'rawInput', size: 100000, req: true },
          { type: 'string', key: 'changeSummary', size: 500, req: false },
          { type: 'string', key: 'createdByUserId', size: 36, req: true }
        ],
        indexes: [
          { key: 'diagramId_key', type: 'key', attributes: ['diagramId'] },
          { key: 'workspaceId_key', type: 'key', attributes: ['workspaceId'] },
          { key: 'diagramId_versionNumber', type: 'key', attributes: ['diagramId', 'versionNumber'] }
        ]
      },
      {
        id: 'generations',
        perms: [],
        attributes: [
          { type: 'string', key: 'workspaceId', size: 36, req: true },
          { type: 'string', key: 'teamId', size: 36, req: true },
          { type: 'string', key: 'userId', size: 36, req: true },
          { type: 'string', key: 'diagramId', size: 36, req: false },
          { type: 'string', key: 'diagramVersionId', size: 36, req: false },
          { type: 'string', key: 'idempotencyKey', size: 64, req: false },
          { type: 'enum', key: 'inputMode', elements: ['nl', 'sql', 'mix'], req: true, default: 'nl' },
          { type: 'integer', key: 'inputCharCount', req: false },
          { type: 'string', key: 'sqlDialect', size: 20, req: false },
          { type: 'integer', key: 'inputTokens', req: false },
          { type: 'integer', key: 'outputTokens', req: false },
          { type: 'integer', key: 'latencyMs', req: false },
          { type: 'string', key: 'model', size: 50, req: true, default: 'AI LLM -sonnet-4-6' },
          { type: 'boolean', key: 'success', req: true, default: true },
          { type: 'string', key: 'errorCode', size: 50, req: false },
          { type: 'string', key: 'errorMessage', size: 1000, req: false },
          { type: 'enum', key: 'planAtTime', elements: ['free', 'pro', 'team'], req: true, default: 'free' }
        ],
        indexes: [
          { key: 'workspaceId_key', type: 'key', attributes: ['workspaceId'] },
          { key: 'userId_key', type: 'key', attributes: ['userId'] },
          { key: 'diagramId_key', type: 'key', attributes: ['diagramId'] },
          { key: 'idempotencyKey_unique', type: 'unique', attributes: ['idempotencyKey'] },
          { key: 'workspaceId_success_key', type: 'key', attributes: ['workspaceId', 'success'] }
        ]
      },
      {
        id: 'subscriptions',
        perms: [Permission.read(Role.users())],
        attributes: [
          { type: 'string', key: 'workspaceId', size: 36, req: true },
          { type: 'string', key: 'teamId', size: 36, req: true },
          { type: 'string', key: 'stripeCustomerId', size: 50, req: false },
          { type: 'string', key: 'stripeSubscriptionId', size: 50, req: false },
          { type: 'string', key: 'stripePriceId', size: 50, req: false },
          { type: 'enum', key: 'paymentProvider', elements: ['stripe', 'uropay'], req: true, default: 'stripe' },
          { type: 'string', key: 'uropayCustomerId', size: 100, req: false },
          { type: 'string', key: 'uropaySubscriptionId', size: 100, req: false },
          { type: 'enum', key: 'plan', elements: ['free', 'pro', 'team'], req: true, default: 'free' },
          { type: 'enum', key: 'status', elements: ['trialing', 'active', 'past_due', 'canceled', 'incomplete', 'paused'], req: true, default: 'active' },
          { type: 'datetime', key: 'currentPeriodStart', req: false },
          { type: 'datetime', key: 'currentPeriodEnd', req: false },
          { type: 'boolean', key: 'cancelAtPeriodEnd', req: true, default: false },
          { type: 'datetime', key: 'canceledAt', req: false },
          { type: 'datetime', key: 'trialEndsAt', req: false },
          { type: 'integer', key: 'generationsLimit', req: true, default: 10 },
          { type: 'integer', key: 'seatLimit', req: true, default: 1 }
        ],
        indexes: [
          { key: 'workspaceId_unique', type: 'unique', attributes: ['workspaceId'] },
          { key: 'stripeCustomerId_unique', type: 'unique', attributes: ['stripeCustomerId'] },
          { key: 'stripeSubscriptionId_unique', type: 'unique', attributes: ['stripeSubscriptionId'] },
          { key: 'uropaySubscriptionId_key', type: 'key', attributes: ['uropaySubscriptionId'] }
        ]
      },
      {
        id: 'api_keys',
        perms: [Permission.read(Role.users())],
        attributes: [
          { type: 'string', key: 'workspaceId', size: 36, req: true },
          { type: 'string', key: 'teamId', size: 36, req: true },
          { type: 'string', key: 'createdByUserId', size: 36, req: true },
          { type: 'string', key: 'name', size: 100, req: true },
          { type: 'string', key: 'keyHash', size: 256, req: true },
          { type: 'string', key: 'keyPrefix', size: 12, req: true },
          { type: 'datetime', key: 'lastUsedAt', req: false },
          { type: 'datetime', key: 'revokedAt', req: false },
          { type: 'string', key: 'revokedByUserId', size: 36, req: false }
        ],
        indexes: [
          { key: 'workspaceId_key', type: 'key', attributes: ['workspaceId'] },
          { key: 'keyHash_key', type: 'key', attributes: ['keyHash'] }
        ]
      },
      {
        id: 'feature_flags',
        perms: [],
        attributes: [
          { type: 'string', key: 'workspaceId', size: 36, req: true },
          { type: 'string', key: 'teamId', size: 36, req: true },
          { type: 'string', key: 'flag', size: 100, req: true },
          { type: 'boolean', key: 'enabled', req: true, default: true },
          { type: 'string', key: 'metadata', size: 2000, req: false, default: '{}' }
        ],
        indexes: [
          { key: 'workspaceId_flag_key', type: 'key', attributes: ['workspaceId', 'flag'] }
        ]
      },
      {
        id: 'usage_events',
        perms: [],
        attributes: [
          { type: 'string', key: 'workspaceId', size: 36, req: true },
          { type: 'string', key: 'teamId', size: 36, req: true },
          { type: 'string', key: 'userId', size: 36, req: true },
          { type: 'string', key: 'eventType', size: 50, req: true },
          { type: 'string', key: 'properties', size: 10000, req: false, default: '{}' }
        ],
        indexes: [
          { key: 'workspaceId_eventType_key', type: 'key', attributes: ['workspaceId', 'eventType'] },
          { key: 'userId_eventType_key', type: 'key', attributes: ['userId', 'eventType'] }
        ]
      },
      {
        id: 'audit_log',
        perms: [],
        attributes: [
          { type: 'string', key: 'workspaceId', size: 36, req: true },
          { type: 'string', key: 'actorUserId', size: 36, req: false },
          { type: 'string', key: 'action', size: 60, req: true },
          { type: 'string', key: 'resourceType', size: 30, req: true },
          { type: 'string', key: 'resourceId', size: 36, req: false },
          { type: 'string', key: 'diff', size: 50000, req: false },
          { type: 'string', key: 'ipAddress', size: 45, req: false },
          { type: 'string', key: 'userAgent', size: 500, req: false }
        ],
        indexes: [
          { key: 'workspaceId_key', type: 'key', attributes: ['workspaceId'] },
          { key: 'actorUserId_key', type: 'key', attributes: ['actorUserId'] },
          { key: 'action_key', type: 'key', attributes: ['action'] }
        ]
      }
    ];

    for (const coll of collections) {
      console.log(`\n--- Setting up Collection: ${coll.id} ---`);
      try {
        await databases.createCollection(DB_ID, coll.id, coll.id, coll.perms);
        console.log(`Created collection: ${coll.id}`);
      } catch (e: any) {
        if (e.code === 409) console.log(`Collection ${coll.id} already exists.`);
        else throw e;
      }

      for (const attr of coll.attributes) {
        try {
          if (attr.type === 'string') {
            await databases.createStringAttribute(DB_ID, coll.id, attr.key, attr.size!, attr.req, attr.default as string, false);
          } else if (attr.type === 'enum') {
            await databases.createEnumAttribute(DB_ID, coll.id, attr.key, attr.elements!, attr.req, attr.default as string, false);
          } else if (attr.type === 'datetime') {
            await databases.createDatetimeAttribute(DB_ID, coll.id, attr.key, attr.req, attr.default as string, false);
          } else if (attr.type === 'integer') {
            await databases.createIntegerAttribute(DB_ID, coll.id, attr.key, attr.req, undefined, undefined, attr.default as number, false);
          } else if (attr.type === 'boolean') {
            await databases.createBooleanAttribute(DB_ID, coll.id, attr.key, attr.req, attr.default as boolean, false);
          }
          console.log(`Created attribute: ${attr.key}`);
          await waitForAttribute(DB_ID, coll.id, attr.key);
        } catch (e: any) {
          if (e.code === 409) console.log(`Attribute ${attr.key} already exists.`);
          else throw e;
        }
      }

      for (const idx of coll.indexes) {
        try {
          await databases.createIndex(DB_ID, coll.id, idx.key, idx.type as IndexType, idx.attributes, []);
          console.log(`Created index: ${idx.key}`);
        } catch (e: any) {
          if (e.code === 409) console.log(`Index ${idx.key} already exists.`);
          else throw e;
        }
      }
    }

    console.log(`\n--- Setting up Storage Bucket: diagram-exports ---`);
    try {
      await storage.createBucket('diagram-exports', 'Diagram Exports', [
        // default bucket permissions are managed at the document level
      ], true, true, 10485760, ['png', 'svg', 'pdf']);
      console.log('Bucket created.');
    } catch (e: any) {
      if (e.code === 409) console.log('Bucket already exists.');
      else throw e;
    }

    console.log('\n✅ All schemas deployed successfully!');
  } catch (error) {
    console.error('Error during setup:', error);
  }
}

run();
