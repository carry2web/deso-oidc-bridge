import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import 'isomorphic-fetch';

const credential = new ClientSecretCredential(
  process.env.MICROSOFT_TENANT_ID,
  process.env.MICROSOFT_CLIENT_ID,
  process.env.MICROSOFT_CLIENT_SECRET
);

const client = Client.initWithMiddleware({
  authProvider: {
    getAccessToken: async () => {
      const token = await credential.getToken('https://graph.microsoft.com/.default');
      return token.token;
    }
  }
});

/**
 * Check if a user exists in Entra ID by email
 * @param {string} email - User email to check
 * @returns {Promise<boolean>} - True if user exists
 */
export async function checkUserExists(email) {
  console.log(`[GraphClient] Checking user existence: ${email}`);
  try {
    const user = await client.api(`/users/${email}`).get();
    console.log(`[GraphClient] ✓ User found:`, user.userPrincipalName);
    return true;
  } catch (error) {
    if (error.statusCode === 404) {
      console.log(`[GraphClient] ✗ User not found: ${email}`);
      return false;
    }
    console.error('[GraphClient] ERROR checking user:', error.message);
    console.error('[GraphClient] Status:', error.statusCode);
    console.error('[GraphClient] Response:', error.body);
    throw error;
  }
}

/**
 * Get user from Entra ID by email
 * @param {string} email - User email
 * @returns {Promise<object|null>} - User object or null
 */
export async function getUser(email) {
  console.log(`[GraphClient] Fetching user details: ${email}`);
  try {
    const user = await client.api(`/users/${email}`).get();
    console.log(`[GraphClient] ✓ User details retrieved:`, {
      id: user.id,
      userPrincipalName: user.userPrincipalName,
      displayName: user.displayName
    });
    return user;
  } catch (error) {
    if (error.statusCode === 404) {
      console.log(`[GraphClient] ✗ User not found: ${email}`);
      return null;
    }
    console.error('[GraphClient] ERROR fetching user:', error.message);
    console.error('[GraphClient] Status:', error.statusCode);
    throw error;
  }
}
