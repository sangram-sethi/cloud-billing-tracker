"use client";

import { signIn } from "next-auth/react";

/**
 * Exchange our one-time loginToken for a NextAuth session
 * using the Credentials provider.
 *
 * Important: next-auth/react signIn() expects a plain object options bag.
 * Using FormData here can cause credentials to not be parsed correctly.
 */
export async function signInWithLoginToken(loginToken: string, redirectTo: string = "/app") {
  const res = await signIn("credentials", {
    loginToken,
    redirect: false,
    callbackUrl: redirectTo,
  });

  // next-auth returns 200 even on credentials errors; error is in payload.
  if (!res) {
    // Extremely defensive fallback
    window.location.href = redirectTo;
    return;
  }

  if (res.error) {
    throw new Error(res.error);
  }

  // If successful, res.url is where NextAuth wants to go next.
  window.location.href = res.url ?? redirectTo;
}
