import Provider, { Configuration } from 'oidc-provider'
import { adapterFactory } from './oidc-adapter'
import { prisma } from './db'

const configuration: Configuration = {
  adapter: adapterFactory,
  clients: [
    {
      client_id: process.env.OIDC_CLIENT_ID || 'azure-ad-client',
      client_secret: process.env.OIDC_CLIENT_SECRET || 'change-me',
      redirect_uris: [
        'https://login.microsoftonline.com/common/federation/oauth2',
        'https://login.microsoftonline.com/common/oauth2/nativeclient',
        'http://localhost:3000/callback',
      ],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'client_secret_basic',
    },
  ],
  cookies: {
    keys: [process.env.SESSION_SECRET || 'change-this-secret-key'],
  },
  claims: {
    openid: ['sub'],
    profile: ['name', 'preferred_username'],
    email: ['email', 'email_verified'],
  },
  features: {
    devInteractions: { enabled: false },
    resourceIndicators: {
      enabled: true,
    },
  },
  findAccount: async (ctx, id) => {
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user || user.status !== 'approved') {
      return undefined
    }

    return {
      accountId: id,
      async claims(use, scope) {
        return {
          sub: user.id,
          email: user.email || '',
          email_verified: !!user.email,
          name: user.name || user.desoPublicKey.substring(0, 8),
          preferred_username: user.name || user.desoPublicKey.substring(0, 8),
          deso_public_key: user.desoPublicKey,
        }
      },
    }
  },
  interactions: {
    url(ctx, interaction) {
      return `/interaction/${interaction.uid}`
    },
  },
  ttl: {
    AccessToken: 60 * 60, // 1 hour
    AuthorizationCode: 10 * 60, // 10 minutes
    IdToken: 60 * 60, // 1 hour
    RefreshToken: 14 * 24 * 60 * 60, // 14 days
    Session: 14 * 24 * 60 * 60, // 14 days
  },
}

let provider: Provider | null = null

export function getOIDCProvider(): Provider {
  if (!provider) {
    const issuer = process.env.OIDC_ISSUER || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    provider = new Provider(issuer, configuration)
  }
  return provider
}
