"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [message, setMessage] = useState("Verifying your email...");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (!token) {
      setMessage("The verification link is missing its token.");
      setLoading(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        const apiUrl = "/api";
        const response = await fetch(
          `${apiUrl}/auth/verify-email?token=${encodeURIComponent(token)}`,
          {
            method: "GET",
            credentials: "include",
          },
        );
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Email verification failed. The link may have expired.",
          );
        }
        setSuccess(true);
        setMessage(
          data?.message || "Your email has been verified successfully!",
        );
      } catch (error) {
        setSuccess(false);
        setMessage(
          error instanceof Error
            ? error.message
            : "Something went wrong while verifying your email.",
        );
      } finally {
        setLoading(false);
      }
    };

    void verifyEmail();
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold">
          Project<span className="text-green-400">ly</span>
        </h1>
        <h2 className="mt-8 text-xl font-semibold">Email Verification</h2>
        <p className="mt-4 text-sm leading-6 text-gray-300">{message}</p>

        {loading && (
          <div className="mx-auto mt-6 h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-green-500" />
        )}

        {!loading && (
          <div className="mt-6">
            {success ? (
              <Link
                href="/"
                className="inline-block rounded-lg bg-green-600 px-5 py-3 font-medium text-white transition hover:bg-green-500"
              >
                Continue to Login
              </Link>
            ) : (
              <Link
                href="/signup"
                className="inline-block rounded-lg border border-gray-700 px-5 py-3 font-medium text-white transition hover:bg-gray-800"
              >
                Back to Sign Up
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
