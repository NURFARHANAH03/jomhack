import React, { useState } from "react";
import { loginUser, signupUser, setToken, setGuestMode } from "../lib/api";

export default function LoginForm({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const data = await signupUser({ email, password });
        if (data?.access_token) {
          setToken(data.access_token);
          onLoginSuccess();
        } else {
          setMessage("Account created! Check your email if verification is required.");
        }
      } else {
        const data = await loginUser({ email, password });
        setToken(data.access_token);
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleGuestAccess() {
    setGuestMode();
    onLoginSuccess();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50/40 p-4">
      <div className="bg-white border border-brand-100 rounded-3xl p-8 max-w-md w-full shadow-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-brand-100 mx-auto flex items-center justify-center text-2xl text-brand-500 mb-3">
            <i className="fa-solid fa-book-open" />
          </div>
          <h2 className="serif-title text-2xl font-bold text-brand-700">
            {isSignUp ? "Create an Account" : "Welcome to Kokoronal"}
          </h2>
          <p className="text-xs text-brand-500 mt-1">
            {isSignUp ? "Join us and save your stories securely" : "Sign in to access your mindful space"}
          </p>
        </div>

        {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3 mb-4">{error}</div>}
        {message && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl p-3 mb-4">{message}</div>}

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
            {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="mt-4 text-center space-y-3">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setMessage(null);
            }}
            className="text-xs text-brand-600 hover:underline font-medium"
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Create one"}
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-3 text-xs text-gray-400">or</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <button
            type="button"
            onClick={handleGuestAccess}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-full font-semibold text-xs transition cursor-pointer"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}