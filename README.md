# DeSo OIDC Bridge

A Next.js application that acts as an OpenID Connect (OIDC) identity provider, bridging DeSo blockchain identities to Microsoft Entra ID (Azure AD). Users authenticate via DeSo Identity, receive admin approval, and are provisioned for SSO access.

## Features

- **DeSo Identity Authentication**: Users sign in using their DeSo blockchain public keys
- **Admin Approval Workflow**: New users require administrator approval before gaining access
- **OIDC Provider**: Full OpenID Connect implementation compatible with Microsoft Entra ID
- **User Management**: Admin dashboard for approving/rejecting user access
- **Session Management**: Secure session handling with encrypted cookies
- **Database Persistence**: SQLite database for storing users and sessions (easily swappable to PostgreSQL)

## Prerequisites

- Node.js 18+ and npm
- Basic understanding of OAuth 2.0 / OIDC
- Microsoft Entra ID tenant (for production use)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/carry2web/deso-oidc-bridge.git
cd deso-oidc-bridge
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure with your values.

4. Initialize the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Configuration

### Default Admin Account

On first run, a default admin account is created:
- **Username**: `admin`
- **Password**: `admin123`

**⚠️ Important**: Change this password immediately in production!

### OIDC Configuration

The OIDC provider configuration is available at:
```
http://localhost:3000/.well-known/openid-configuration
```

Key endpoints:
- Authorization: `/api/oidc/auth`
- Token: `/api/oidc/token`
- UserInfo: `/api/oidc/me`
- JWKS: `/api/oidc/jwks`

## Usage

### User Flow

1. **Login**: User navigates to `/auth/login` and enters their DeSo public key
2. **Approval**: If new, user sees "Pending Approval" message
3. **Admin Review**: Admin logs in at `/admin` and approves/rejects users
4. **OIDC Auth**: Once approved, users can authenticate through the OIDC flow

### Admin Flow

1. Navigate to `/admin`
2. Login with admin credentials
3. View pending user requests
4. Approve or reject users
5. Monitor user status

## API Routes

### User Authentication
- `POST /api/auth/login` - Authenticate with DeSo public key
- `POST /api/auth/logout` - Logout current user

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/users` - List all users (admin only)
- `PATCH /api/admin/users` - Approve/reject users (admin only)

### OIDC
- `GET /api/oidc/auth` - Authorization endpoint
- `POST /api/oidc/token` - Token endpoint
- `GET /api/oidc/me` - UserInfo endpoint
- `GET /api/oidc/jwks` - JWKS endpoint
- `GET /.well-known/openid-configuration` - Discovery endpoint

## Development

### Running Locally

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

### Database Management

View database in Prisma Studio:
```bash
npm run db:studio
```

Update database schema:
```bash
npm run db:push
```

## Security Considerations

1. **Change Default Credentials**: Update the default admin password immediately
2. **Use HTTPS in Production**: Set up SSL/TLS certificates
3. **Secure Session Secrets**: Use strong, random session secrets
4. **Environment Variables**: Never commit `.env` files
5. **Regular Updates**: Keep dependencies updated for security patches

## License

ISC
