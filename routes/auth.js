import express from 'express';
import { checkUserExists } from '../lib/graphClient.js';

const router = express.Router();

/**
 * Login callback - receives DeSo login data
 */
router.post('/login', async (req, res) => {
  const { publicKey, username } = req.body;

  if (!publicKey) {
    return res.status(400).json({ error: 'Missing publicKey' });
  }

  // Store user session
  req.session.publicKey = publicKey;
  req.session.username = username || null;
  req.session.email = username ? `${username}@safetynet.social` : null;

  // Check if user exists in Entra ID
  let userExists = false;
  if (username) {
    try {
      userExists = await checkUserExists(`${username}@safetynet.social`);
      console.log(`User ${username}@safetynet.social exists in Entra ID:`, userExists);
    } catch (error) {
      console.error('Error checking Entra ID:', error);
      return res.status(500).json({ error: 'Failed to verify user' });
    }
  }

  // If there's a pending auth request, redirect to complete it (only if user exists)
  if (req.session.authRequest) {
    const { client_id, redirect_uri, state } = req.session.authRequest;
    
    if (userExists) {
      delete req.session.authRequest;
      // Redirect back to /authorize to complete the flow
      return res.json({
        success: true,
        redirect: `/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code${state ? `&state=${state}` : ''}`
      });
    } else {
      // User doesn't exist - need registration with justification
      return res.json({ 
        success: true, 
        redirect: '/register.html',
        message: 'Welcome! To access SafetyNet.Social, please complete the membership registration.' 
      });
    }
  }

  // No pending auth request - direct login, show dashboard for existing users
  if (userExists) {
    res.json({ 
      success: true, 
      redirect: '/dashboard.html',
      message: 'Login successful! You have access to SafetyNet.Social.' 
    });
  } else {
    res.json({ 
      success: true, 
      redirect: '/register.html',
      message: 'Welcome! Please complete membership registration to access SafetyNet.Social.' 
    });
  }
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
