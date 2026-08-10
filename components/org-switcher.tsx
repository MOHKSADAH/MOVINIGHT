"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Settings2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function OrgSwitcher({ collapsed }: { collapsed?: boolean }) {
  const t = useTranslations("org");
  const orgs = useQuery(api.organizations.listMine);
  const active = useQuery(api.organizations.getActive);
  const setActive = useMutation(api.organizations.setActive);

  if (!orgs || orgs.length === 0) return null;

  const handleChange = (value: string) => {
    if (!value) return;
    void setActive({ orgId: value as Id<"organizations"> }).catch(
      (err: unknown) =>
        toast.error(err instanceof Error ? err.message : "Failed"),
    );
  };

  if (collapsed) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
        asChild
      >
        <Link href="/org/settings" title={active?.name ?? t("switcherLabel")}>
          <Settings2 />
        </Link>
      </Button>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1 px-1")}>
      <p className="px-2 text-xs text-muted-foreground">{t("switcherLabel")}</p>
      <Select value={active?._id ?? undefined} onValueChange={handleChange}>
        <SelectTrigger className="w-full bg-sidebar" size="default">
          <SelectValue placeholder={t("switcherLabel")} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {orgs.map((org) => (
              <SelectItem key={org._id} value={org._id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto justify-start gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
        asChild
      >
        <Link href="/org/settings">
          <Settings2 className="size-3.5" />
          {t("settings")}
        </Link>
      </Button>
    </div>
  );
}
