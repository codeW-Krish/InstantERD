import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const UROPAY_API_KEY = process.env.UROPAY_API_KEY || '';

export async function createUropayCheckoutSession(planId: string, workspaceId: string, customerEmail: string) {
  // In a real implementation this would make a Server-to-Server request to UROPay
  console.log(`[UROPay Mock] Creating checkout session...`);
  console.log(`Plan: ${planId}, Workspace: ${workspaceId}, Email: ${customerEmail}`);
  
  // Fake a UROPay URL for demo purposes.
  return `https://demo.uropay.in/checkout?workspaceId=${workspaceId}&planId=${planId}&email=${encodeURIComponent(customerEmail)}`;
}
