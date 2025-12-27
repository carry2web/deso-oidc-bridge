import { identity } from '/deso-protocol.js';
import { getDesoProfile } from './deso-profile.js';

const form = document.getElementById('registerForm');
const statusDiv = document.getElementById('status');
const userInfo = document.getElementById('userInfo');
const debugInfo = document.getElementById('debugInfo');
const emailGroup = document.getElementById('emailGroup');
const justificationGroup = document.getElementById('justificationGroup');
const regTypeMember = document.getElementById('regTypeMember');
const regTypeGuest = document.getElementById('regTypeGuest');
const emailInput = document.getElementById('email');
const publicKeyInput = document.getElementById('publicKey');
const usernameInput = document.getElementById('username');
const justificationInput = document.getElementById('justification');

let currentUser = null;
let currentUsername = null;

function showStatus(message, type = 'info') {
  statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`;
}

function updateDebugInfo(data) {
  const details = {
    'Identity publicKey': data.identity?.publicKey?.slice(0, 20) + '...' || 'NOT FOUND',
    'Profile Username': data.profile?.Profile?.Username || 'NOT FOUND',
    'Profile Description': data.profile?.Profile?.Description?.slice(0, 30) + '...' || 'NOT FOUND'
  };
  let html = '<strong>DeSo Data:</strong><br>';
  for (const [key, value] of Object.entries(details)) {
    html += `${key}: <code>${value}</code><br>`;
  }
  html += '<br><strong>Full Profile Object:</strong><br>';
  html += `<pre style="max-height: 150px; overflow: auto; font-size: 9px; text-align: left;">${JSON.stringify(data.profile, null, 2)}</pre>`;
  debugInfo.innerHTML = html;
}

function fillIdentityFields(user, username) {
  if (!user?.publicKey) return;
  publicKeyInput.value = user.publicKey;
  usernameInput.value = username || 'N/A';
  userInfo.textContent = `Logged in as: ${username || user.publicKey.slice(0, 10) + '...'}`;
  if (regTypeMember.checked && username) {
    emailInput.value = `${username}@safetynet.social`;
  }
}

function updateRegTypeUI() {
  if (regTypeMember.checked) {
    emailGroup.style.display = '';
    justificationGroup.style.display = '';
    emailInput.required = true;
    emailInput.readOnly = true;
    justificationInput.required = true;
    if (currentUsername) {
      emailInput.value = `${currentUsername}@safetynet.social`;
    } else {
      emailInput.value = '';
    }
    emailInput.placeholder = 'username@safetynet.social';
  } else {
    emailGroup.style.display = '';
    justificationGroup.style.display = 'none';
    emailInput.required = true;
    emailInput.readOnly = false;
    justificationInput.required = false;
    if (emailInput.readOnly) {
      emailInput.value = '';
    }
    emailInput.placeholder = 'Enter your email for guest access';
  }
}

identity.subscribe(async ({ currentUser: user, event }) => {
  if (user?.publicKey) {
    currentUser = user;
    const profile = await getDesoProfile(user.publicKey);
    currentUsername = profile?.Username || null;
    updateDebugInfo({ identity: user, profile: { Profile: profile } });
    fillIdentityFields(user, currentUsername);
    updateRegTypeUI();
  } else if (event === 'LOGOUT') {
    window.location.href = '/login.html';
  }
});

regTypeMember.addEventListener('change', updateRegTypeUI);
regTypeGuest.addEventListener('change', updateRegTypeUI);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const type = regTypeMember.checked ? 'member' : 'guest';
  const justification = justificationInput.value.trim();
  const email = emailInput.value.trim();
  if (type === 'member') {
    if (justification.length < 50) {
      showStatus('✗ Please provide a more detailed justification (at least 50 characters)', 'error');
      return;
    }
    if (!email) {
      showStatus('✗ Email is required for membership', 'error');
      return;
    }
  }
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';
  try {
    const response = await fetch('/admin/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: publicKeyInput.value,
        username: usernameInput.value,
        email: type === 'member' ? email : email, // always send email for summary
        justification: type === 'member' ? justification : '',
        registrationType: type
      }),
    });
    const data = await response.json();
    if (data.success) {
      // Hide form and show summary/next steps
      form.style.display = 'none';
      // Hide logout button to prevent logout errors
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) logoutBtn.style.display = 'none';
      let summaryHtml = `<div class="status success">✓ ${data.message}</div>`;
      summaryHtml += `<div style="margin-bottom:1.5rem;"><strong>Registration Details:</strong><br>`;
      summaryHtml += `Username: <code>${usernameInput.value}</code><br>`;
      summaryHtml += `Email: <code>${emailInput.value || '(none)'}</code><br>`;
      summaryHtml += `Public Key: <code>${publicKeyInput.value}</code><br>`;
      summaryHtml += `Type: <code>${type}</code></div>`;
      if (type === 'guest') {
        summaryHtml += `<button id="proceedBtn" class="btn" style="width:auto;">Go to Microsoft Teams</button>`;
        statusDiv.innerHTML = summaryHtml;
        // Add event for proceed button
        setTimeout(() => {
          const proceedBtn = document.getElementById('proceedBtn');
          if (proceedBtn) {
            proceedBtn.addEventListener('click', () => {
              window.location.href = 'https://teams.microsoft.com';
            });
          }
        }, 100);
        // Optionally auto-redirect after 5s
        setTimeout(() => {
          window.location.href = 'https://teams.microsoft.com';
        }, 5000);
      } else {
        summaryHtml += `<div class='status info'>Thank you for your registration. Your request will be reviewed by an admin. Please wait for an approval email before you can log in.</div>`;
        statusDiv.innerHTML = summaryHtml;
      }
    } else {
      // Show Microsoft Graph error or any backend error in a styled way
      let errorMsg = data.error || 'Unknown error';
      if (errorMsg.includes('Microsoft Graph error:')) {
        errorMsg = `<b>Microsoft Graph error:</b><br><span style="font-size:13px;">${errorMsg.replace('Microsoft Graph error:', '').trim()}</span>`;
      } else {
        errorMsg = `<b>Registration failed:</b> ${errorMsg}`;
      }
      statusDiv.innerHTML = `<div class="status error">${errorMsg}</div>`;
    }
  } catch (error) {
    showStatus('✗ Registration failed: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Registration';
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await identity.logout();
});

// Collapsible debug area
window.addEventListener('DOMContentLoaded', () => {
  const debugInfoDiv = document.getElementById('debugInfo');
  const toggleDebugBtn = document.getElementById('toggleDebug');
  let debugVisible = false;
  toggleDebugBtn.addEventListener('click', () => {
    debugVisible = !debugVisible;
    debugInfoDiv.style.display = debugVisible ? 'block' : 'none';
    toggleDebugBtn.textContent = debugVisible ? 'Hide Debug Info ▲' : 'Show Debug Info ▼';
  });
});

// Show version in footer (local or prod) and log to console
window.addEventListener('DOMContentLoaded', async () => {
  const versionDiv = document.querySelector('#footer > div');
  let version = 'BUILD_TIMESTAMP';
  try {
    const resp = await fetch('/package.json');
    if (resp.ok) {
      const pkg = await resp.json();
      if (pkg.version) {
        version = pkg.version;
      }
    }
  } catch {}
  versionDiv.textContent = `Version: ${version}`;
  console.log(`[DeSo OIDC Bridge] Version: ${version}`);
});

// Check if logged in
setTimeout(() => {
  if (!currentUser) {
    window.location.href = '/login.html';
  }
}, 1000);
