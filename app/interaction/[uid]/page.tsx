import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getOIDCProvider } from '@/lib/oidc-provider'

export default async function InteractionPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params
  const user = await getSessionUser()

  // If user is not logged in, redirect to login
  if (!user) {
    return redirect('/auth/login')
  }

  // If user is not approved, show error
  if (user.status !== 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your account is {user.status}. Please wait for administrator approval.
          </p>
        </div>
      </div>
    )
  }

  // Get the OIDC provider and interaction details
  const provider = getOIDCProvider()
  
  try {
    const details = await provider.interactionDetails({ headers: {}, method: 'GET', url: '', params: { uid } } as any, {} as any)
    
    // Automatically finish the interaction and redirect
    const result = {
      login: {
        accountId: user.id,
      },
    }

    await provider.interactionFinished({ headers: {}, method: 'GET', url: '', params: { uid } } as any, {} as any, result, { mergeWithLastSubmission: false })

    // This should redirect back to the client
    return redirect(details.returnTo || '/')
  } catch (error) {
    console.error('Interaction error:', error)
    
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Error
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            An error occurred during authentication. Please try again.
          </p>
        </div>
      </div>
    )
  }
}
