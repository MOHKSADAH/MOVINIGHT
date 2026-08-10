"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function OrgSettingsPage() {
  const t = useTranslations("org");
  const active = useQuery(api.organizations.getActive);
  const members = useQuery(
    api.organizations.listMembers,
    active ? { orgId: active._id } : "skip",
  );
  const invites = useQuery(
    api.organizationInvites.listPending,
    active ? { orgId: active._id } : "skip",
  );
  const rotateCode = useMutation(api.organizations.rotateCode);
  const rename = useMutation(api.organizations.rename);
  const removeMember = useMutation(api.organizations.removeMember);
  const leave = useMutation(api.organizations.leave);
  const createInvite = useMutation(api.organizationInvites.create);
  const revokeInvite = useMutation(api.organizationInvites.revoke);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string>();

  if (active === undefined) {
    return (
      <AppShell>
        <Skeleton className="h-40 w-full" />
      </AppShell>
    );
  }

  if (!active) {
    return (
      <AppShell>
        <p className="text-muted-foreground">{t("joinSubtitle")}</p>
      </AppShell>
    );
  }

  const isOwner = active.role === "owner";

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-8 p-4 md:p-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("settingsTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {active.name} · {active.code}
          </p>
        </div>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="rounded bg-muted px-2 py-1 text-sm">
              {active.code}
            </code>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(active.code);
                toast.success(t("codeCopied"));
              }}
            >
              {t("copyCode")}
            </Button>
          </div>

          {isOwner && (
            <form
              className="flex flex-wrap gap-2"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void (async () => {
                  try {
                    if (name.trim()) {
                      await rename({ orgId: active._id, name: name.trim() });
                    }
                    if (code.trim()) {
                      await rotateCode({
                        orgId: active._id,
                        code: code.trim(),
                      });
                      toast.success(t("codeUpdated"));
                      setCode("");
                    }
                  } catch (err) {
                    toast.error(
                      err instanceof Error ? err.message : t("createFailed"),
                    );
                  }
                })();
              }}
            >
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("orgName")}
                className="max-w-xs"
              />
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t("orgCode")}
                className="max-w-xs"
              />
              <Button type="submit" size="sm">
                {t("rotateCode")}
              </Button>
            </form>
          )}
          {!isOwner && (
            <p className="text-sm text-muted-foreground">{t("ownerOnly")}</p>
          )}
        </section>

        {isOwner && (
          <section className="space-y-3">
            <h2 className="font-medium">{t("inviteEmail")}</h2>
            <form
              className="space-y-2"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = email.trim();
                if (!trimmed) {
                  setEmailError(t("inviteEmailRequired"));
                  return;
                }
                if (!isValidEmail(trimmed)) {
                  setEmailError(t("inviteEmailInvalid"));
                  return;
                }
                setEmailError(undefined);
                void (async () => {
                  try {
                    await createInvite({
                      orgId: active._id,
                      email: trimmed,
                    });
                    toast.success(t("inviteSent"));
                    setEmail("");
                  } catch (err) {
                    toast.error(
                      err instanceof Error ? err.message : t("inviteFailed"),
                    );
                  }
                })();
              }}
            >
              <FieldGroup className="gap-2 sm:flex-row sm:items-start">
                <Field
                  className="min-w-0 flex-1"
                  data-invalid={emailError ? true : undefined}
                >
                  <FieldLabel className="sr-only" htmlFor="invite-email">
                    {t("inviteEmail")}
                  </FieldLabel>
                  <Input
                    id="invite-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(undefined);
                    }}
                    placeholder={t("inviteEmailPlaceholder")}
                    className="max-w-sm"
                    aria-invalid={emailError ? true : undefined}
                  />
                  <FieldError>{emailError}</FieldError>
                </Field>
                <Button type="submit" size="sm" className="shrink-0">
                  {t("sendInvite")}
                </Button>
              </FieldGroup>
            </form>
            <ul className="space-y-2 text-sm">
              {invites === undefined && <Skeleton className="h-8 w-full" />}
              {invites?.length === 0 && (
                <li className="text-muted-foreground">{t("noInvites")}</li>
              )}
              {invites?.map((invite) => (
                <li
                  key={invite._id}
                  className="flex items-center justify-between gap-2 rounded border border-border px-3 py-2"
                >
                  <span>{invite.email}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      void revokeInvite({ inviteId: invite._id }).catch(
                        (err: unknown) =>
                          toast.error(
                            err instanceof Error
                              ? err.message
                              : t("inviteFailed"),
                          ),
                      )
                    }
                  >
                    {t("revoke")}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="font-medium">{t("members")}</h2>
          <ul className="space-y-2 text-sm">
            {members === undefined && <Skeleton className="h-8 w-full" />}
            {members?.length === 0 && (
              <li className="text-muted-foreground">{t("noMembers")}</li>
            )}
            {members?.map((member) => (
              <li
                key={member.membershipId}
                className="flex items-center justify-between gap-2 rounded border border-border px-3 py-2"
              >
                <span>
                  {member.name ?? member.email ?? member.userId}{" "}
                  <span className="text-muted-foreground">
                    (
                    {member.role === "owner"
                      ? t("roleOwner")
                      : t("roleMember")}
                    )
                  </span>
                </span>
                {isOwner && member.role !== "owner" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      void removeMember({
                        orgId: active._id,
                        userId: member.userId,
                      }).catch((err: unknown) =>
                        toast.error(
                          err instanceof Error ? err.message : t("joinFailed"),
                        ),
                      )
                    }
                  >
                    {t("remove")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            void leave({ orgId: active._id })
              .then(() => {
                window.location.href = "/join-org";
              })
              .catch((err: unknown) =>
                toast.error(
                  err instanceof Error ? err.message : t("joinFailed"),
                ),
              )
          }
        >
          {t("leave")}
        </Button>
      </div>
    </AppShell>
  );
}
