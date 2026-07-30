import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: React.ElementType;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
  compact?: boolean;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
  compact = false,
}: EmptyStateProps) {
  const action = actionLabel ? (
    actionHref ? (
      <Button asChild variant="default" size="sm" className="mt-4">
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    ) : (
      <Button
        type="button"
        variant="default"
        size="sm"
        className="mt-4"
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    )
  ) : null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-card/60",
        compact ? "px-4 py-10 min-h-[220px]" : "px-6 py-14 min-h-[280px]",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="text-xs text-muted-foreground mt-1.5 max-w-[240px] leading-relaxed">
          {description}
        </p>
      ) : null}
      {action}
    </div>
  );
}
