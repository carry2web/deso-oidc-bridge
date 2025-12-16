import { Adapter, AdapterPayload } from 'oidc-provider'
import { prisma } from './db'

const modelNameMap = new Map([
  ['Session', 'OIDCSession'],
  ['AccessToken', 'OIDCSession'],
  ['AuthorizationCode', 'OIDCSession'],
  ['RefreshToken', 'OIDCSession'],
  ['DeviceCode', 'OIDCSession'],
  ['BackchannelAuthenticationRequest', 'OIDCSession'],
  ['ClientCredentials', 'OIDCSession'],
  ['Client', 'OIDCSession'],
  ['InitialAccessToken', 'OIDCSession'],
  ['RegistrationAccessToken', 'OIDCSession'],
  ['Interaction', 'OIDCSession'],
  ['ReplayDetection', 'OIDCSession'],
  ['PushedAuthorizationRequest', 'OIDCSession'],
  ['Grant', 'OIDCSession'],
])

export class PrismaAdapter implements Adapter {
  name: string

  constructor(name: string) {
    this.name = name
  }

  async upsert(
    id: string,
    payload: AdapterPayload,
    expiresIn: number
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + expiresIn * 1000)
    const data = {
      uid: id,
      grantId: payload.grantId,
      payload: JSON.stringify(payload),
      expiresAt,
    }

    await prisma.oIDCSession.upsert({
      where: { uid: id },
      update: data,
      create: data,
    })
  }

  async find(id: string): Promise<AdapterPayload | undefined> {
    const session = await prisma.oIDCSession.findUnique({
      where: { uid: id },
    })

    if (!session || session.expiresAt < new Date()) {
      return undefined
    }

    return JSON.parse(session.payload)
  }

  async findByUserCode(userCode: string): Promise<AdapterPayload | undefined> {
    const session = await prisma.oIDCSession.findFirst({
      where: {
        payload: {
          contains: userCode,
        },
      },
    })

    if (!session || session.expiresAt < new Date()) {
      return undefined
    }

    return JSON.parse(session.payload)
  }

  async findByUid(uid: string): Promise<AdapterPayload | undefined> {
    const session = await prisma.oIDCSession.findUnique({
      where: { uid },
    })

    if (!session || session.expiresAt < new Date()) {
      return undefined
    }

    return JSON.parse(session.payload)
  }

  async consume(id: string): Promise<void> {
    await prisma.oIDCSession.update({
      where: { uid: id },
      data: { consumedAt: new Date() },
    })
  }

  async destroy(id: string): Promise<void> {
    await prisma.oIDCSession.delete({
      where: { uid: id },
    }).catch(() => {
      // Ignore if not found
    })
  }

  async revokeByGrantId(grantId: string): Promise<void> {
    await prisma.oIDCSession.deleteMany({
      where: { grantId },
    })
  }
}

export function adapterFactory(name: string): PrismaAdapter {
  return new PrismaAdapter(name)
}
