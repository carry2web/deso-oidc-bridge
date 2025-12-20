import express from 'express';
import { isAdmin, pendingApprovals } from '../lib/store.js';
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
 * Get pending approvals
 */
router.get('/approvals', (req, res) => {
  const { publicKey } = req.query;
  
  if (!isAdmin(publicKey)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  const approvals = Array.from(pendingApprovals.values())
    .filter(a => a.status === 'pending');
  
  res.json({ success: true, approvals });
});

/**
 * Approve or reject registration
 */
router.post('/approvals', (req, res) => {
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
    // TODO: Provision user in Microsoft 365
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
router.post('/register', (req, res) => {
  const { publicKey, username, email, justification } = req.body;
  
  console.log('=== REGISTRATION REQUEST ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  if (!publicKey) {
    console.error('ERROR: Missing publicKey');
    return res.status(400).json({ error: 'Missing publicKey' });
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
    status: 'pending',
    createdAt: Date.now(),
  };
  
  pendingApprovals.set(approvalId, approval);
  console.log('✓ Registration created:', approvalId);
  console.log('Approval details:', approval);
  console.log('=== END REGISTRATION REQUEST ===\n');
  
  res.json({ 
    success: true, 
    approvalId,
    message: 'Membership request submitted! An admin will review your application.'
  });
});

export default router;
