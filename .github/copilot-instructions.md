# DeSo OIDC Bridge - Express.js Project Setup

## Project Overview
Simple Express.js OIDC provider bridging DeSo Identity to Microsoft 365.

## DeSo Integration Patterns (CRITICAL - DO NOT GUESS)

### DeSo Identity SDK
- **Import**: `import { identity } from 'deso-protocol'` (uses `/deso-protocol.js` bundle)
- **Identity object returns**: `{ publicKey }` ONLY - no profile data included
- **Never assume**: Identity object contains username, profile pic, or any profile data

### Getting User Profile Data
1. **Get publicKey from Identity**: `identity.subscribe(({ currentUser }) => { ... })`
2. **Fetch profile from DeSo node**:
```javascript
const response = await fetch('https://node.deso.org/api/v0/get-single-profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ PublicKeyBase58Check: publicKey })
});
const data = await response.json();
const username = data.Profile?.Username;
const profilePic = data.Profile?.ProfilePic;
```

### Key API Endpoints
- **Get profile**: POST `https://node.deso.org/api/v0/get-single-profile`
  - Param: `PublicKeyBase58Check`
  - Returns: `{ Profile: { Username, Description, ProfilePic, ... } }`

### Required Pattern
1. Authenticate via `identity.login()` → get `publicKey`
2. Fetch profile data via API call with `publicKey`
3. Extract username from `response.Profile.Username`
4. Handle cases where profile doesn't exist (new users)

## Setup Progress
- [x] Create copilot-instructions.md
- [x] Clarify project requirements  
- [x] Scaffold Express.js project
- [x] Create OIDC endpoints
- [x] Add DeSo Identity integration
- [x] Implement JWT signing
- [x] Setup Docker deployment
- [x] CI/CD GitHub Actions workflow
- [x] Version footer with build timestamps
- [x] Debug mode for troubleshooting

