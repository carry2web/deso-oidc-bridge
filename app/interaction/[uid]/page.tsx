import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'

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

  // For approved users, show OIDC authentication success
  // In production, this would be handled by the OIDC provider's interaction flow
  // which requires proper HTTP request/response context
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
          Authentication Ready
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          You are authenticated with DeSo OIDC Bridge. The OIDC provider will complete the login flow.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Interaction ID: {uid}
        </p>
      </div>
    </div>
  )
}
