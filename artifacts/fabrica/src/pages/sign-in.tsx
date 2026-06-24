import { SignIn } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Only accept internal, same-origin relative paths to prevent open-redirect.
// Rejects absolute URLs, protocol-relative (`//host`), and backslash tricks.
function safeRedirect(raw: string | null): string | undefined {
  if (!raw) return undefined;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return undefined;
  return raw;
}

export function SignInPage() {
  const rawRedirect = new URLSearchParams(window.location.search).get("redirect_url");
  // When a redirect_url is present, FORCE a validated destination so Clerk can
  // never honor the raw (attacker-controllable) query param — invalid values
  // fall back to a safe internal default. Absent param → keep Clerk's default.
  const forceRedirectUrl = rawRedirect
    ? (safeRedirect(rawRedirect) ?? `${basePath}/dashboard`)
    : undefined;
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="relative z-10">
        <SignIn
          routing="path"
          path={`${basePath}/sign-in`}
          signUpUrl={`${basePath}/sign-up`}
          forceRedirectUrl={forceRedirectUrl}
        />
      </div>
    </div>
  );
}
