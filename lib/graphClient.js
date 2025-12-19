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
  try {
    await client.api(`/users/${email}`).get();
    return true;
  } catch (error) {
    if (error.statusCode === 404) {
      return false;
    }
    console.error('Error checking user in Entra ID:', error);
    throw error;
  }
}

/**
 * Get user from Entra ID by email
 * @param {string} email - User email
 * @returns {Promise<object|null>} - User object or null
 */
export async function getUser(email) {
  try {
    const user = await client.api(`/users/${email}`).get();
    return user;
  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }
    console.error('Error getting user from Entra ID:', error);
    throw error;
  }
}
