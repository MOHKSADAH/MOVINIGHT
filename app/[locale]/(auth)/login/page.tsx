"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

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

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const t = useTranslations("auth");

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailError, setEmailError] = useState<string>();
  const [codeError, setCodeError] = useState<string>();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError(t("emailRequired"));
      return;
    }
    if (!isValidEmail(trimmed)) {
      setEmailError(t("emailInvalid"));
      return;
    }
    setEmailError(undefined);
    setLoading(true);
    try {
      await signIn("email-otp", { email: trimmed });
      setStep("code");
      toast.success(t("toastCodeSent"));
    } catch (error) {
      const detail =
        error instanceof Error && error.message.trim()
          ? error.message
          : t("toastSendCodeFailed");
      console.error("email-otp send failed:", error);
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setCodeError(t("codeRequired"));
      return;
    }
    if (trimmed.length !== 6) {
      setCodeError(t("codeInvalid"));
      return;
    }
    setCodeError(undefined);
    setLoading(true);
    try {
      await signIn("email-otp", { email: email.trim(), code: trimmed });
      router.push("/");
    } catch {
      toast.error(t("toastInvalidCode"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setCode("");
    setCodeError(undefined);
    try {
      await signIn("email-otp", { email: email.trim() });
      toast.success(t("toastNewCodeSent"));
    } catch {
      toast.error(t("toastResendFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await signIn("google", { redirectTo: "/" });
    } catch {
      toast.error(t("toastGoogleFailed"));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.65rem]">
          {step === "email" ? t("takeYourSeats") : t("enterYourCode")}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {step === "email"
            ? t("signInSubtitle")
            : t("codeSentTo", { email })}
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
              setCodeError(undefined);
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("back")}
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
              {googleLoading ? t("redirecting") : t("continueWithGoogle")}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.18em]">
                <span className="bg-card px-2.5 text-muted-foreground">
                  {t("orEmail")}
                </span>
              </div>
            </div>

            <form onSubmit={handleEmailSubmit} noValidate className="space-y-3">
              <FieldGroup>
                <Field data-invalid={emailError ? true : undefined}>
                  <FieldLabel htmlFor="email">{t("emailLabel")}</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(undefined);
                    }}
                    autoComplete="email"
                    autoFocus
                    aria-invalid={emailError ? true : undefined}
                  />
                  <FieldError>{emailError}</FieldError>
                </Field>
              </FieldGroup>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                <Mail className="h-4 w-4" />
                {loading ? t("sendingCode") : t("sendSignInCode")}
              </Button>
            </form>
          </>
        )}

        {step === "code" && (
          <form onSubmit={handleCodeSubmit} noValidate className="space-y-3 pt-1">
            <FieldGroup>
              <Field data-invalid={codeError ? true : undefined}>
                <FieldLabel htmlFor="code">{t("sixDigitCodeLabel")}</FieldLabel>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder={t("codePlaceholder")}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, ""));
                    if (codeError) setCodeError(undefined);
                  }}
                  autoFocus
                  aria-invalid={codeError ? true : undefined}
                  className="h-11 text-center font-mono text-lg tracking-widest"
                />
                <FieldError>{codeError}</FieldError>
              </Field>
            </FieldGroup>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || code.length !== 6}
            >
              {loading ? t("verifying") : t("signIn")}
            </Button>
            <div className="flex justify-end text-sm">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleResend}
                disabled={loading}
              >
                {t("resendCode")}
              </button>
            </div>
          </form>
        )}
      </div>

      <p className="text-center text-[11px] text-muted-foreground leading-relaxed px-2">
        {t("agreePrefix")}{" "}
        <Link
          href="/terms"
          className="text-sky-700/80 underline underline-offset-2 hover:text-sky-800 dark:text-sky-400/70 dark:hover:text-sky-300"
        >
          {t("termsLink")}
        </Link>{" "}
        {t("and")}{" "}
        <Link
          href="/privacy"
          className="text-sky-700/80 underline underline-offset-2 hover:text-sky-800 dark:text-sky-400/70 dark:hover:text-sky-300"
        >
          {t("privacyLink")}
        </Link>
        .
      </p>
    </div>
  );
}
