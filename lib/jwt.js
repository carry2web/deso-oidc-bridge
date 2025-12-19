import { SignJWT, importJWK } from 'jose';
import { nanoid } from 'nanoid';
import { getKeyPair } from './keys.js';

/**
 * Create JWT token for OIDC
 */
export async function createIdToken(userClaims, clientId) {
  const { publicKey, privateKey } = await getKeyPair();
  
  const now = Math.floor(Date.now() / 1000);
  const issuer = process.env.OIDC_ISSUER || 'http://localhost:3000';
  
  const jwt = await new SignJWT({
    ...userClaims,
    aud: clientId,
    azp: clientId,
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'default' })
    .setIssuedAt(now)
    .setIssuer(issuer)
    .setSubject(userClaims.sub)
    .setExpirationTime(now + 3600) // 1 hour
    .sign(await importJWK(privateKey));
  
  return jwt;
}

/**
 * Create authorization code
 */
export function createAuthCode() {
  return nanoid(32);
}

/**
 * Create access token
 */
export function createAccessToken() {
  return nanoid(64);
}
