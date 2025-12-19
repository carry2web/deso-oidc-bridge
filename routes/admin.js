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
  const { publicKey, username, email } = req.body;
  
  if (!publicKey) {
    return res.status(400).json({ error: 'Missing publicKey' });
  }
  
  const approvalId = nanoid();
  pendingApprovals.set(approvalId, {
    id: approvalId,
    publicKey,
    username,
    email,
    status: 'pending',
    createdAt: Date.now(),
  });
  
  res.json({ 
    success: true, 
    approvalId,
    message: 'Registration submitted for admin approval'
  });
});

export default router;
