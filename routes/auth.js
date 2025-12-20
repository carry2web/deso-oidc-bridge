import express from 'express';
import { checkUserExists } from '../lib/graphClient.js';

const router = express.Router();

/**
 * Login callback - receives DeSo login data
 */
router.post('/login', async (req, res) => {
  const { publicKey, username } = req.body;

  console.log('=== LOGIN REQUEST ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Public Key:', publicKey);
  console.log('Username:', username);

  if (!publicKey) {
    console.error('ERROR: Missing publicKey');
    return res.status(400).json({ error: 'Missing publicKey' });
  }

  // Store user session
  req.session.publicKey = publicKey;
  req.session.username = username || null;
  req.session.email = username ? `${username}@safetynet.social` : null;
  
  console.log('Session data set:', { publicKey, username, email: req.session.email });

  // Check if user exists in Entra ID
  let userExists = false;
  let debugLog = [];
  if (username) {
    try {
      debugLog.push(`Checking Entra ID for: ${username}@safetynet.social`);
      userExists = await checkUserExists(`${username}@safetynet.social`);
      debugLog.push(`✓ User ${username}@safetynet.social exists in Entra ID: ${userExists}`);
    } catch (error) {
      debugLog.push('ERROR checking Entra ID: ' + error.message);
      debugLog.push('Stack: ' + error.stack);
      return res.status(500).json({ error: 'Failed to verify user', debug: debugLog });
    }
  } else {
    debugLog.push('⚠ No username provided - cannot check Entra ID');
  }

  // If there's a pending auth request, redirect to complete it (only if user exists)
  if (req.session.authRequest) {
    console.log('Pending auth request found:', req.session.authRequest);
    const { client_id, redirect_uri, state } = req.session.authRequest;
    
    if (userExists) {
      console.log('✓ User exists - proceeding with OIDC flow');
      delete req.session.authRequest;
      // Redirect back to /authorize to complete the flow
      return res.json({
        success: true,
        redirect: `/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code${state ? `&state=${state}` : ''}`,
        debug: debugLog
      });
    } else {
      // User doesn't exist - need registration with justification
      console.log('✗ User does not exist - redirecting to registration');
      return res.json({ 
        success: true, 
        redirect: '/register.html',
        message: 'Welcome! To access SafetyNet.Social, please complete the membership registration.',
        debug: debugLog
      });
    }
  }

  // No pending auth request - direct login, show dashboard for existing users
  console.log('No pending auth request - direct login flow');
  if (userExists) {
    console.log('✓ Redirecting to dashboard');
    res.json({ 
      success: true, 
      redirect: '/dashboard.html',
      message: 'Login successful! You have access to SafetyNet.Social.',
      debug: debugLog
    });
  } else {
    console.log('✗ Redirecting to registration');
    res.json({ 
      success: true, 
      redirect: '/register.html',
      message: 'Welcome! Please complete membership registration to access SafetyNet.Social.',
      debug: debugLog
    });
  }
  console.log('=== END LOGIN REQUEST ===\n');
});

/**
 * Logout
 */
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

/**
 * Check session
 */
router.get('/session', (req, res) => {
  if (req.session.publicKey) {
    res.json({
      loggedIn: true,
      publicKey: req.session.publicKey,
      username: req.session.username,
      email: req.session.email,
    });
  } else {
    res.json({ loggedIn: false });
  }
});

export default router;
