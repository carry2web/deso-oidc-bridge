// In-memory stores
export const authCodes = new Map(); // code -> { userClaims, clientId, redirectUri, expiresAt }
export const accessTokens = new Map(); // token -> { userClaims, clientId, expiresAt }
export const sessions = new Map(); // sessionId -> { publicKey, username, email }
export const pendingApprovals = new Map(); // approvalId -> { publicKey, username, email, status, createdAt }

// Admin users
export const adminUsers = new Set(
  (process.env.ADMIN_PUBLIC_KEYS || '').split(',').filter(Boolean)
);

/**
 * Store authorization code
 */
export function storeAuthCode(code, data) {
  authCodes.set(code, {
    ...data,
    expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
  });
}

/**
 * Consume authorization code (one-time use)
 */
export function consumeAuthCode(code) {
  const data = authCodes.get(code);
  if (!data || data.expiresAt < Date.now()) {
    authCodes.delete(code);
    return null;
  }
  authCodes.delete(code);
  return data;
}

/**
 * Store access token
 */
export function storeAccessToken(token, data) {
  accessTokens.set(token, {
    ...data,
    expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
  });
}

/**
 * Get access token data
 */
export function getAccessToken(token) {
  const data = accessTokens.get(token);
  if (!data || data.expiresAt < Date.now()) {
    accessTokens.delete(token);
    return null;
  }
  return data;
}

/**
 * Check if user is admin
 */
export function isAdmin(publicKey) {
  return adminUsers.has(publicKey);
}
