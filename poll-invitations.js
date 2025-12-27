// Polls Microsoft Graph every 5 minutes for accepted guest invitations and sets the desoHandle attribute on the user.
// Requires: approvals store with inviteId → desoHandle mapping, and Microsoft Graph credentials in .env

import dotenv from 'dotenv';
dotenv.config();
import { getPendingApprovals, markApprovalCompleted } from './lib/store.js';
import { setDesoHandleAttribute } from './lib/setDesoHandle.js';
import { getGraphClient } from './lib/graphClient.js';

const POLL_INTERVAL_MS = 5 * 60 * 1000;

async function pollAcceptedInvitations() {
  const graph = getGraphClient();
  const approvals = getPendingApprovals(); // Should return array of { inviteId, desoHandle, email, completed }
  if (!approvals.length) return;

  console.log(`[PollInvitations] Checking ${approvals.length} pending approvals...`);

  // Get all invitations with status 'Completed'
  const response = await graph.api('/invitations').get();
  const completedInvites = response.value.filter(invite => invite.status === 'Completed');

  for (const approval of approvals) {
    const match = completedInvites.find(invite => invite.id === approval.inviteId);
    if (match && match.invitedUser && match.invitedUser.id) {
      try {
        await setDesoHandleAttribute(match.invitedUser.id, approval.desoHandle, approval.email);
        markApprovalCompleted(approval.inviteId);
        console.log(`[PollInvitations] Set desoHandle for user ${match.invitedUser.id} (${approval.email})`);
      } catch (err) {
        console.error(`[PollInvitations] Error setting desoHandle:`, err.message);
      }
    }
  }
}

setInterval(pollAcceptedInvitations, POLL_INTERVAL_MS);
console.log(`[PollInvitations] Started polling every ${POLL_INTERVAL_MS / 60000} minutes.`);
