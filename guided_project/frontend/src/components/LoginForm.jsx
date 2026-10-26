import React, { useState } from "react";
import { loginUser, setToken } from "../lib/api";

export default function LoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Call your FastAPI /auth/token endpoint
      const data = await loginUser({ email, password });

      // 2. Save the returned JWT access token
      setToken(data.access_token);

      // 3. Notify parent component (App.jsx) to refresh UI
      onLoginSuccess();
    } catch (err) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50/40 p-4">
      <div className="bg-white border border-brand-100 rounded-3xl p-8 max-w-md w-full shadow-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-brand-100 mx-auto flex items-center justify-center text-2xl text-brand-500 mb-3">
            <i className="fa-solid fa-book-open" />
          </div>
          <h2 className="serif-title text-2xl font-bold text-brand-700">Welcome to Kokoronal</h2>
          <p className="text-xs text-brand-500 mt-1">Sign in to access your mindful journaling space</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-full font-semibold text-sm shadow transition cursor-pointer disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}