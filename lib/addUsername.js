// Add a username (DeSo handle) to an existing Entra user
// Usage: await addUsernameToUser(email, desoHandle)
import { getCredentialAndClient } from './graphClient.js';

export async function addUsernameToUser(email, desoHandle) {
  const client = getCredentialAndClient(email);
  // 1. Lookup user by email to get their object ID and identities
  let user;
  try {
    const users = await client.api('/users')
      .filter(`identities/any(c:c/issuerAssignedId eq '${email}' and c/issuer eq '${process.env.MICROSOFT_TENANT_DOMAIN}')`)
      .select('id,identities')
      .get();
    if (!users.value || users.value.length === 0) {
      throw new Error('User not found for email: ' + email);
    }
    user = users.value[0];
  } catch (err) {
    console.error('[GraphClient] Error looking up user for username patch:', err.message);
    throw err;
  }
  // 2. Prepare new identities array with username
  const identities = user.identities.filter(i => i.signInType !== 'userName');
  identities.push({
    signInType: 'userName',
    issuer: process.env.MICROSOFT_TENANT_DOMAIN,
    issuerAssignedId: desoHandle
  });
  // 3. Patch user
  try {
    await client.api(`/users/${user.id}`)
      .update({ identities });
    console.log(`[GraphClient] Username '${desoHandle}' added to user ${email}`);
    return true;
  } catch (err) {
    console.error('[GraphClient] Error patching user with username:', err.message);
    throw err;
  }
}
