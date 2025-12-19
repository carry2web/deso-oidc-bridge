import express from 'express';
import { createAuthCode, createAccessToken, createIdToken } from '../lib/jwt.js';
import { storeAuthCode, consumeAuthCode, storeAccessToken, getAccessToken, sessions } from '../lib/store.js';
import { getKeyPair } from '../lib/keys.js';

const router = express.Router();

/**
 * OIDC Discovery endpoint
 */
router.get('/.well-known/openid-configuration', (req, res) => {
  const issuer = process.env.OIDC_ISSUER || `${req.protocol}://${req.get('host')}`;
  
  res.json({
    issuer,
    authorization_endpoint: `${issuer}/authorize`,
    token_endpoint: `${issuer}/token`,
    userinfo_endpoint: `${issuer}/userinfo`,
    jwks_uri: `${issuer}/jwks`,
    response_types_supported: ['code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    scopes_supported: ['openid', 'profile', 'email'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    claims_supported: ['sub', 'name', 'email', 'preferred_username'],
  });
});

/**
 * JWKS endpoint
 */
router.get('/jwks', async (req, res) => {
  const { publicKey } = await getKeyPair();
  res.json({ keys: [publicKey] });
});

/**
 * Authorization endpoint
 */
router.get('/authorize', (req, res) => {
  const { client_id, redirect_uri, response_type, scope, state } = req.query;
  
  if (!client_id || !redirect_uri || response_type !== 'code') {
    return res.status(400).send('Invalid authorization request');
  }
  
  // Check if user is already logged in
  if (req.session.publicKey) {
    // User is logged in, generate auth code
    const code = createAuthCode();
    const userClaims = {
      sub: req.session.publicKey,
      name: req.session.username || req.session.publicKey,
      email: req.session.email,
      preferred_username: req.session.username,
    };
    
    storeAuthCode(code, { userClaims, clientId: client_id, redirectUri: redirect_uri });
    
    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set('code', code);
    if (state) redirectUrl.searchParams.set('state', state);
    
    return res.redirect(redirectUrl.toString());
  }
  
  // Store auth request in session and redirect to login
  req.session.authRequest = { client_id, redirect_uri, response_type, scope, state };
  res.redirect('/login.html');
});

/**
 * Token endpoint
 */
router.post('/token', async (req, res) => {
  const { grant_type, code, client_id, client_secret, redirect_uri } = req.body;
  
  if (grant_type !== 'authorization_code') {
    return res.status(400).json({ error: 'unsupported_grant_type' });
  }
  
  // Consume authorization code
  const authData = consumeAuthCode(code);
  if (!authData || authData.clientId !== client_id || authData.redirectUri !== redirect_uri) {
    return res.status(400).json({ error: 'invalid_grant' });
  }
  
  // Generate tokens
  const accessToken = createAccessToken();
  const idToken = await createIdToken(authData.userClaims, client_id);
  
  storeAccessToken(accessToken, { userClaims: authData.userClaims, clientId: client_id });
  
  res.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    id_token: idToken,
  });
});

/**
 * UserInfo endpoint
 */
router.get('/userinfo', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'invalid_token' });
  }
  
  const token = authHeader.substring(7);
  const tokenData = getAccessToken(token);
  
  if (!tokenData) {
    return res.status(401).json({ error: 'invalid_token' });
  }
  
  res.json(tokenData.userClaims);
});

export default router;
