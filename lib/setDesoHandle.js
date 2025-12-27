// Set the DeSo handle as a custom attribute (extension property) on a user
// Usage: await setDesoHandleAttribute(userId, desoHandle)
import { getCredentialAndClient } from './graphClient.js';

// Replace with your actual extension property name (see Azure AD schema extensions)
const EXTENSION_ATTR = process.env.DESO_EXTENSION_ATTR || 'extension_desoHandle';

export async function setDesoHandleAttribute(userId, desoHandle, email) {
  const client = getCredentialAndClient(email);
  const patch = {};
  patch[EXTENSION_ATTR] = desoHandle;
  try {
    await client.api(`/users/${userId}`).update(patch);
    console.log(`[GraphClient] Set DeSo handle '${desoHandle}' on user ${userId}`);
    return true;
  } catch (err) {
    console.error('[GraphClient] Error setting DeSo handle attribute:', err.message);
    throw err;
  }
}
