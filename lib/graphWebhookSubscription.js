
import 'dotenv/config';
import fetch from 'node-fetch';
import fs from 'fs';

const GRAPH_API = 'https://graph.microsoft.com/v1.0/subscriptions';
const TENANT_ID = process.env.MICROSOFT_TENANT_ID;
const CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://yourdomain.com/webhook/handleNewUser';
const CLIENT_STATE = process.env.GRAPH_CLIENT_STATE || 'SuperSecretState';
const SUBSCRIPTION_RENEWAL_MARGIN_MINUTES = 10;

let subscriptionId = null;
let expirationDateTime = null;

async function getAccessToken() {
  // Use client credentials flow
  const url = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('scope', 'https://graph.microsoft.com/.default');

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });
  const data = await res.json();
  if (!data.access_token) {
    const banner = '\n================= GRAPH TOKEN ENDPOINT ERROR =================\n';
    const msg = `${banner}[Graph Auth Debug] Token endpoint response:\n${JSON.stringify(data, null, 2)}\n${banner}`;
    // Print to both stdout and stderr for maximum visibility
    console.error(msg);
    console.log(msg);
    // Write to a persistent log file in /tmp (always writable on Azure)
    try {
      fs.writeFileSync('/tmp/graph-token-error.json', JSON.stringify(data, null, 2));
    } catch (e) {
      // If this fails, ignore
    }
    throw new Error('Failed to get access token');
  }
  return data.access_token;
}

async function createOrRenewSubscription() {
  const accessToken = await getAccessToken();
  const now = new Date();
  const expiration = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
  const expirationDateTimeStr = expiration.toISOString();

  const body = {
    changeType: 'created',
    notificationUrl: WEBHOOK_URL,
    resource: 'users',
    expirationDateTime: expirationDateTimeStr,
    clientState: CLIENT_STATE
  };

  let url = GRAPH_API;
  let method = 'POST';
  if (subscriptionId) {
    url = `${GRAPH_API}/${subscriptionId}`;
    method = 'PATCH';
    body.expirationDateTime = expirationDateTimeStr;
  }

  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (data.id) {
    subscriptionId = data.id;
    expirationDateTime = data.expirationDateTime;
    console.log(`[Webhook] Subscription ${method === 'POST' ? 'created' : 'renewed'}:`, subscriptionId, expirationDateTime);
  } else {
    console.error('[Webhook] Subscription error:', data);
  }
}

function scheduleRenewal() {
  if (!expirationDateTime) return;
  const expiration = new Date(expirationDateTime);
  const now = new Date();
  const msUntilRenewal = expiration - now - SUBSCRIPTION_RENEWAL_MARGIN_MINUTES * 60 * 1000;
  setTimeout(async () => {
    await createOrRenewSubscription();
    scheduleRenewal();
  }, Math.max(msUntilRenewal, 60 * 1000)); // At least 1 min before expiration
}

(async () => {
  await createOrRenewSubscription();
  scheduleRenewal();
})();
