"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s0-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await signIn("email-otp", { email: email.trim() });
      setStep("code");
      toast.success("Check your email for the 6-digit code");
    } catch {
      toast.error("Failed to send code. Check your email address.");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      await signIn("email-otp", { email: email.trim(), code: code.trim() });
      router.push("/");
    } catch {
      toast.error("Invalid or expired code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setCode("");
    try {
      await signIn("email-otp", { email: email.trim() });
      toast.success("New code sent");
    } catch {
      toast.error("Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await signIn("google", { redirectTo: "/" });
    } catch {
      toast.error("Google sign in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.65rem]">
          {step === "email" ? "Take your seats" : "Enter your code"}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {step === "email"
            ? "Sign in to plan nights, vote on films, and keep score with your crew."
            : `We sent a 6-digit code to ${email}`}
        </p>
      </div>

      <div className="rounded-lg border border-border/80 bg-card/70 p-5 shadow-sm backdrop-blur-sm space-y-4">
        {step === "code" && (
          <button
            type="button"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => {
              setStep("email");
              setCode("");
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
        )}

        {step === "email" && (
          <>
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 h-10 bg-background/60"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
            >
              <GoogleIcon />
              {googleLoading ? "Redirecting..." : "Continue with Google"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.18em]">
                <span className="bg-card px-2.5 text-muted-foreground">
                  or email
                </span>
              </div>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                <Mail className="h-4 w-4" />
                {loading ? "Sending code..." : "Send sign-in code"}
              </Button>
            </form>
          </>
        )}

        {step === "code" && (
          <form onSubmit={handleCodeSubmit} className="space-y-3 pt-1">
            <div className="space-y-2">
              <label className="text-sm font-medium block pt-1" htmlFor="code">
                6-digit code
              </label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
                className="text-center text-lg tracking-widest font-mono h-11"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || code.length !== 6}
            >
              {loading ? "Verifying..." : "Sign in"}
            </Button>
            <div className="flex justify-end text-sm">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleResend}
                disabled={loading}
              >
                Resend code
              </button>
            </div>
          </form>
        )}
      </div>

      <p className="text-center text-[11px] text-muted-foreground leading-relaxed px-2">
        By continuing you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
