import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <h1 className="text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
          DeSo OIDC Bridge
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
          OpenID Connect identity provider bridging DeSo blockchain identities to Microsoft Entra ID
        </p>

        <div className="space-y-4">
          <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              User Login
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Sign in with your DeSo identity
            </p>
            <Link
              href="/auth/login"
              className="block w-full text-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Login with DeSo
            </Link>
          </div>

          <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Admin Panel
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Manage user approvals and access
            </p>
            <Link
              href="/admin"
              className="block w-full text-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Admin Login
            </Link>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            OIDC Discovery
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Configuration available at:{" "}
            <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
              /.well-known/openid-configuration
            </code>
          </p>
        </div>
      </main>

      <footer className="mt-8 text-center text-gray-500 dark:text-gray-400">
        <p>Powered by Next.js and oidc-provider</p>
      </footer>
    </div>
  );
}
