import Link from "next/link";

export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-yellow-600 dark:text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
          Approval Pending
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Your account has been created and is awaiting administrator approval.
          You will receive access once an admin reviews your request.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
