// Persistent storage for pending approvals
import fs from 'fs';
const FILE = './data/pending-approvals.json';

export function loadApprovalsFromDisk() {
  try {
    if (fs.existsSync(FILE)) {
      const raw = fs.readFileSync(FILE, 'utf8');
      const arr = JSON.parse(raw);
      return arr;
    }
  } catch (e) {
    console.error('[store-persist] Failed to load approvals:', e.message);
  }
  return [];
}

export function saveApprovalsToDisk(approvalsArr) {
  try {
    fs.mkdirSync('./data', { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(approvalsArr, null, 2), 'utf8');
  } catch (e) {
    console.error('[store-persist] Failed to save approvals:', e.message);
  }
}
