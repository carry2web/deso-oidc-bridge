"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [publicKey, setPublicKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publicKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.status === "pending") {
        router.push("/auth/pending");
      } else if (data.status === "approved") {
        router.push("/auth/success");
      } else {
        setError("Your account access has been rejected");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          Login with DeSo
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
          Enter your DeSo public key to authenticate
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="publicKey"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              DeSo Public Key
            </label>
            <input
              id="publicKey"
              type="text"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder="BC1YL..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? "Authenticating..." : "Login"}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> In production, this would integrate with DeSo Identity SDK.
            For testing, enter any public key starting with &quot;BC1YL&quot;.
          </p>
        </div>
      </div>
    </div>
  );
}
