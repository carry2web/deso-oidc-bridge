import { NextRequest } from 'next/server'
import { getOIDCProvider } from '@/lib/oidc-provider'

// Handle all OIDC provider routes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  const provider = getOIDCProvider()
  const path = resolvedParams.path ? `/${resolvedParams.path.join('/')}` : '/'
  
  return handleOIDCRequest(request, provider, path)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  const provider = getOIDCProvider()
  const path = resolvedParams.path ? `/${resolvedParams.path.join('/')}` : '/'
  
  return handleOIDCRequest(request, provider, path)
}

async function handleOIDCRequest(
  request: NextRequest,
  provider: any,
  path: string
) {
  try {
    // Create a mock Node.js request/response
    const req: any = {
      url: path + (request.nextUrl.search || ''),
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: request.body,
    }

    const res: any = {
      statusCode: 200,
      headers: {},
      setHeader(name: string, value: string | string[]) {
        this.headers[name.toLowerCase()] = value
      },
      getHeader(name: string) {
        return this.headers[name.toLowerCase()]
      },
      removeHeader(name: string) {
        delete this.headers[name.toLowerCase()]
      },
      end(body?: any) {
        this.body = body
      },
      redirect(url: string) {
        this.statusCode = 302
        this.setHeader('location', url)
      },
    }

    // Handle the OIDC request
    await provider.callback()(req, res)

    // Convert response to Next.js response
    const responseInit: ResponseInit = {
      status: res.statusCode || 200,
      headers: res.headers,
    }

    return new Response(res.body || '', responseInit)
  } catch (error) {
    console.error('OIDC error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
