/**
 * Send Microsoft Graph invitation to external user
 * @param {string} email - Email to invite
 * @param {string} message - Invitation message
 * @param {string} redirectUrl - Redirect URL after invite acceptance
 * @returns {Promise<object>} - Invitation response
 */
export async function sendInvitation(email, message, redirectUrl) {
  const client = getCredentialAndClient('admin@safetynet.social'); // Always use work tenant for invites
  try {
    const payload = {
      invitedUserEmailAddress: email,
      inviteRedirectUrl: redirectUrl,
      sendInvitationMessage: true,
      invitedUserMessageInfo: {
        customizedMessageBody: message,
      },
    };
    console.log('[GraphClient] Sending invitation:', JSON.stringify(payload, null, 2));
    const invite = await client.api('/invitations').post(payload);
    console.log('[GraphClient] Invitation response:', JSON.stringify(invite, null, 2));
    return invite;
  } catch (error) {
    console.error('[GraphClient] ERROR sending invitation:', error.message);
    if (error.body) {
      console.error('[GraphClient] ERROR body:', JSON.stringify(error.body, null, 2));
    }
    console.error('[GraphClient] ERROR object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    throw error;
  }
}

/**
 * Get invitation status for a user by email
 * @param {string} email
 * @returns {Promise<string>} - 'pending', 'accepted', or 'not_found'
 */
export async function getInvitationStatus(email) {
  const client = getCredentialAndClient('admin@safetynet.social');
  try {
    console.log(`[GraphClient] Fetching invitation status for: ${email}`);
    const invitations = await client.api('/invitations').get();
    console.log('[GraphClient] Invitations response:', JSON.stringify(invitations, null, 2));
    const invite = invitations.value.find(i => i.invitedUserEmailAddress === email);
    if (invite) {
      console.log(`[GraphClient] Found invitation for ${email}:`, JSON.stringify(invite, null, 2));
      return invite.status;
    } else {
      console.log(`[GraphClient] No invitation found for ${email}`);
      return 'not_found';
    }
  } catch (error) {
    console.error('[GraphClient] ERROR getting invitation status:', error.message);
    return 'not_found';
  }
}

import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import 'isomorphic-fetch';

export function getCredentialAndClient(email) {
  const isWork = email && email.toLowerCase().endsWith('@safetynet.social');
  let tenantId, clientId, clientSecret;
  if (isWork) {
    tenantId = process.env.MICROSOFT_TENANT_ID;
    clientId = process.env.MICROSOFT_CLIENT_ID;
    clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  } else {
    tenantId = process.env.MICROSOFT_EXTERNAL_TENANT_ID;
    clientId = process.env.MICROSOFT_EXTERNAL_CLIENT_ID;
    clientSecret = process.env.MICROSOFT_EXTERNAL_CLIENT_SECRET;
  }
  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  const client = Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await credential.getToken('https://graph.microsoft.com/.default');
        return token.token;
      }
    }
  });
  return client;
}

/**
 * Check if a user exists in Entra ID by email
 * @param {string} email - User email to check
 * @returns {Promise<boolean>} - True if user exists
 */
export async function checkUserExists(email) {
  console.log(`[GraphClient] Checking user existence: ${email}`);
  const client = getCredentialAndClient(email);
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
  const client = getCredentialAndClient(email);
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
