import express from 'express';
import { isAdmin, pendingApprovals } from '../lib/store.js';
import { sendInvitation, getInvitationStatus, getUser } from '../lib/graphClient.js';
import { setDesoHandleAttribute } from '../lib/setDesoHandle.js';
import { addUsernameToUser } from '../lib/addUsername.js';
import { nanoid } from 'nanoid';

const router = express.Router();

/**
 * Check admin status
 */
router.get('/check', (req, res) => {
  const { publicKey } = req.query;
  res.json({ isAdmin: isAdmin(publicKey) });
});

/**
 * Get all approvals (for admin overview)
 */
router.get('/approvals', async (req, res) => {
  const { publicKey } = req.query;
  if (!isAdmin(publicKey)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  // Add invite status for each approval (for all, not just pending)
  const approvals = await Promise.all(Array.from(pendingApprovals.values())
    .map(async a => {
      let inviteStatus = '';
      if (a.email && a.registrationType === 'guest') {
        inviteStatus = await getInvitationStatus(a.email);
      }
      return { ...a, inviteStatus };
    }));
  res.json({ success: true, approvals });
});

/**
 * Approve or reject registration
 */
router.post('/approvals', async (req, res) => {
  const { approvalId, action, adminPublicKey } = req.body;
  if (!isAdmin(adminPublicKey)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const approval = pendingApprovals.get(approvalId);
  if (!approval) {
    return res.status(404).json({ error: 'Approval not found' });
  }
  if (action === 'approve') {
    approval.status = 'approved';
    approval.approvedAt = Date.now();
    approval.approvedBy = adminPublicKey;
    // Send invitation for guest registrations
    if (approval.registrationType === 'guest' && approval.email) {
      try {
        const inviteMessage = 'You have been invited to join SafetyNet.Social and access Microsoft Teams as a guest using your DeSo identity.';
        const redirectUrl = 'https://teams.microsoft.com';
        const inviteResult = await sendInvitation(approval.email, inviteMessage, redirectUrl);
        approval.inviteStatus = 'pending';
        approval.inviteId = inviteResult.id;
      } catch (err) {
        approval.inviteStatus = 'error';
        approval.inviteError = err.message;
      }
    }
  } else if (action === 'reject') {
    approval.status = 'rejected';
    approval.rejectedAt = Date.now();
    approval.rejectedBy = adminPublicKey;
  }
  pendingApprovals.set(approvalId, approval);
  res.json({ success: true });
});

/**
 * Submit registration request
 */
router.post('/register', async (req, res) => {
  console.log('=== REGISTRATION REQUEST ===');
  console.log('[DEBUG] Raw req.body at start:', JSON.stringify(req.body, null, 2));
  console.log('[DEBUG] typeof req.body:', typeof req.body);
  console.log('[DEBUG] Object.keys(req.body):', Object.keys(req.body));
  const { publicKey, username, email, justification, registrationType } = req.body;
  console.log('[DEBUG] Destructured:', { publicKey, username, email, justification, registrationType });

  if (!publicKey) {
    console.error('ERROR: Missing publicKey');
    return res.status(400).json({ error: 'Missing publicKey' });
  }

  if (registrationType === 'member') {
    // Work tenant: justification and email required
    if (!email || !email.toLowerCase().endsWith('@safetynet.social')) {
      return res.status(400).json({ error: 'Email must be @safetynet.social for membership' });
    }
    if (!justification || justification.length < 50) {
      console.error('ERROR: Justification too short or missing:', justification?.length || 0, 'chars');
      return res.status(400).json({ error: 'Justification must be at least 50 characters' });
    }
    // Check if already registered
    const existing = Array.from(pendingApprovals.values())
      .find(a => a.publicKey === publicKey && a.status === 'pending');
    if (existing) {
      console.log('⚠ User already has pending request:', existing.id);
      return res.status(400).json({
        error: 'You already have a pending registration request',
        approvalId: existing.id
      });
    }
    const approvalId = nanoid();
    const approval = {
      id: approvalId,
      publicKey,
      username,
      email,
      justification,
      registrationType,
      status: 'pending',
      createdAt: Date.now(),
    };
    pendingApprovals.set(approvalId, approval);
    console.log('✓ Registration created (work tenant, pending approval):', approvalId);
    console.log('Approval details:', approval);
    console.log('=== END REGISTRATION REQUEST ===\n');
    // Try to set DeSo handle as extension attribute for member (work tenant)
    setTimeout(async () => {
      try {
        const user = await getUser(email);
        if (user && user.id) {
          await setDesoHandleAttribute(user.id, username, email);
        }
      } catch (err) {
        console.error('[DEBUG] Failed to set DeSo handle attribute (member):', err.message);
      }
    }, 10000); // Wait 10s to allow user creation
    return res.json({
      success: true,
      approvalId,
      message: 'Membership request submitted! An admin will review your application.'
    });
  } else {
    // Guest/external: require email, auto-approve and send invitation immediately
    console.log('[DEBUG] Guest registration received:', req.body);
    console.log('[DEBUG] req.body.email:', req.body.email, '| typeof:', typeof req.body.email);
    console.log('[DEBUG] Object.keys(req.body):', Object.keys(req.body));
    if (!req.body.email) {
      console.warn('[DEBUG] req.body.email is missing or falsy:', req.body.email);
      return res.status(400).json({ error: 'Email is required for guest registration' });
    }
    const approvalId = nanoid();
    console.log('[DEBUG] About to create approval object for guest:');
    console.log('[DEBUG] Using values:', {
      id: approvalId,
      publicKey: req.body.publicKey,
      username: req.body.username,
      email: req.body.email,
      justification: req.body.justification,
      registrationType: req.body.registrationType
    });
    const approval = {
      id: approvalId,
      publicKey: req.body.publicKey,
      username: req.body.username,
      email: req.body.email,
      justification: req.body.justification || '',
      registrationType: req.body.registrationType,
      status: 'approved',
      createdAt: Date.now(),
      approvedAt: Date.now(),
      approvedBy: 'auto',
    };
    console.log('[DEBUG] Approval object at save:', JSON.stringify(approval, null, 2));
    // Send invitation immediately
    let inviteError = null;
    try {
      const inviteMessage = 'You have been invited to join SafetyNet.Social and access Microsoft Teams as a guest using your DeSo identity.';
      const redirectUrl = 'https://teams.microsoft.com';
      console.log('[DEBUG] About to call sendInvitation with:', req.body.email, inviteMessage, redirectUrl);
      const inviteResult = await sendInvitation(req.body.email, inviteMessage, redirectUrl);
      approval.inviteStatus = 'pending';
      approval.inviteId = inviteResult.id;
      console.log('[DEBUG] Invitation sent, inviteResult:', inviteResult);
      // Try to patch the user with their DeSo handle as username (after invite, user may not exist yet)
      setTimeout(async () => {
        try {
          await addUsernameToUser(req.body.email, req.body.username);
        } catch (err) {
          console.error('[DEBUG] Failed to add username to user:', err.message);
        }
        // Also set DeSo handle as extension attribute for guest (external tenant)
        try {
          const user = await getUser(req.body.email);
          if (user && user.id) {
            await setDesoHandleAttribute(user.id, req.body.username, req.body.email);
          }
        } catch (err) {
          console.error('[DEBUG] Failed to set DeSo handle attribute (guest):', err.message);
        }
      }, 10000); // Wait 10s to allow user creation
    } catch (err) {
      approval.inviteStatus = 'error';
      approval.inviteError = err.message;
      inviteError = err && err.body ? err.body : err.message;
      console.error('[DEBUG] Error sending invitation:', err);
    }
    pendingApprovals.set(approvalId, approval);
    console.log('✓ Registration auto-approved and invited (guest/external):', approvalId);
    console.log('Approval details:', approval);
    console.log('=== END REGISTRATION REQUEST ===\n');
    if (inviteError) {
      return res.status(400).json({
        success: false,
        approvalId,
        error: `Microsoft Graph error: ${inviteError}`
      });
    }
    return res.json({
      success: true,
      approvalId,
      message: 'Registration successful! Invitation sent. Check your email for Teams access.'
    });
  }
});

export default router;
