

console.log('=== [Startup] graphWebhookSubscription.js loaded ===');
// import 'dotenv/config';
// import fetch from 'node-fetch';
// import fs from 'fs';

const GRAPH_API = 'https://graph.microsoft.com/v1.0/subscriptions';
const TENANT_ID = process.env.MICROSOFT_TENANT_ID;
const CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://yourdomain.com/webhook/handleNewUser';
const CLIENT_STATE = process.env.GRAPH_CLIENT_STATE || 'SuperSecretState';
const SUBSCRIPTION_RENEWAL_MARGIN_MINUTES = 10;

let subscriptionId = null;
let expirationDateTime = null;


// Graph webhook subscription logic fully disabled for now
