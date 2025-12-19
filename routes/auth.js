import express from 'express';

const router = express.Router();

/**
 * Login callback - receives DeSo login data
 */
router.post('/login', (req, res) => {
  const { publicKey, username } = req.body;
  
  if (!publicKey) {
    return res.status(400).json({ error: 'Missing publicKey' });
  }
  
  // Store user session
  req.session.publicKey = publicKey;
  req.session.username = username || null;
  req.session.email = username ? `${username}@safetynet.social` : null;
  
  // If there's a pending auth request, redirect to complete it
  if (req.session.authRequest) {
    const { client_id, redirect_uri, state } = req.session.authRequest;
    delete req.session.authRequest;
    
    // Redirect back to /authorize to complete the flow
    return res.json({ 
      success: true,
      redirect: `/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code${state ? `&state=${state}` : ''}`
    });
  }
  
  res.json({ success: true });
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
