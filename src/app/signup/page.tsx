"use client";

import React, { useState } from "react";
import Link from "next/link";

const inputClass =
  "w-full bg-[#0b0f0d] border border-gray-700 rounded-lg px-4 py-3 outline-none focus:border-lime-400 transition";
  const API_URL = '/api';

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        }
      );

      // Don't crash if the server returns non-JSON (e.g. an HTML error page)
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Registration failed"
        );
      }

      setSuccess("Account created successfully. Check your email to verify your account.");
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0f0d] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold">
            Project<span className="text-lime-400">ly</span>
          </h1>
          <p className="text-gray-400 mt-2">
            Manage your projects. Track your progress.
          </p>
        </div>

        {/* Signup card */}
        <div className="bg-[#111713] border border-lime-400/20 rounded-2xl p-8 shadow-2xl">
          <div className="mb-7">
            <h2 className="text-2xl font-semibold">Create your account</h2>
            <p className="text-gray-400 text-sm mt-1">
              Start organizing your projects today.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm text-gray-300 mb-2">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                className={inputClass}
              />
            </div>

            {/* Error / success messages */}
            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                {error}
              </p>
            )}
            {success && (
              <p className="text-lime-400 text-sm bg-lime-400/10 border border-lime-400/20 rounded-lg px-4 py-3">
                {success}
              </p>
            )}

            {/* Signup button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lime-400 text-black font-semibold py-3 rounded-lg hover:bg-lime-300 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{" "}
            <Link href="/" className="text-lime-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-600 mt-8">
          Projectly · Project management made simple
        </p>
      </div>
    </main>
  );
}
