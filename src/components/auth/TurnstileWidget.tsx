"use client";

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";

type TurnstileSize = "normal" | "compact" | "invisible";

type Props = {
  siteKey: string;
  size?: TurnstileSize; // default: invisible
  onToken?: (token: string) => void;
  onExpired?: () => void;
  onError?: () => void;
};

export type TurnstileHandle = {
  execute: () => Promise<string>; // useful only for invisible
  reset: () => void;
};

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript() {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if (window.turnstile) return resolve();

    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Turnstile script failed")));
      return;
    }

    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.dataset.turnstile = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Turnstile script failed"));
    document.head.appendChild(s);
  });

  return scriptPromise;
}

export const TurnstileWidget = forwardRef<TurnstileHandle, Props>(
  ({ siteKey, size = "invisible", onToken, onExpired, onError }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<string | null>(null);

    const pendingResolve = useRef<((t: string) => void) | null>(null);
    const pendingReject = useRef<((e: Error) => void) | null>(null);

    useEffect(() => {
      let mounted = true;

      (async () => {
        await loadTurnstileScript();
        if (!mounted) return;
        if (!containerRef.current) return;
        if (!window.turnstile) return;

        // Avoid double render in strict mode
        if (widgetIdRef.current) return;

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "dark",
          size,
          callback: (token) => {
            onToken?.(token);
            pendingResolve.current?.(token);
            pendingResolve.current = null;
            pendingReject.current = null;
          },
          "expired-callback": () => {
            onExpired?.();
          },
          "error-callback": () => {
            onError?.();
            pendingReject.current?.(new Error("Captcha failed"));
            pendingResolve.current = null;
            pendingReject.current = null;
          },
        });
      })().catch(() => {});

      return () => {
        mounted = false;
      };
    }, [siteKey, size, onToken, onExpired, onError]);

    useImperativeHandle(ref, () => ({
      execute: () => {
        return new Promise<string>((resolve, reject) => {
          if (!window.turnstile || !widgetIdRef.current) {
            reject(new Error("Captcha not ready"));
            return;
          }
          pendingResolve.current = resolve;
          pendingReject.current = reject;
          window.turnstile.execute(widgetIdRef.current);
        });
      },
      reset: () => {
        if (window.turnstile && widgetIdRef.current) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
    }));

    return (
      <div
        ref={containerRef}
        className={
          size === "invisible"
            ? "h-0 w-0 overflow-hidden"
            : "rounded-2xl border border-white/10 bg-surface/30 p-3"
        }
        aria-hidden={size === "invisible"}
      />
    );
  }
);

TurnstileWidget.displayName = "TurnstileWidget";
