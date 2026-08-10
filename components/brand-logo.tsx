import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
  alt?: string;
};

export function BrandLogo({
  className,
  priority = false,
  alt = "MOVINIGHT",
}: BrandLogoProps) {
  return (
    <Image
      src="/logo.svg"
      alt={alt}
      width={240}
      height={72}
      priority={priority}
      className={cn(
        "h-10 w-auto object-contain dark:invert dark:brightness-110",
        className,
      )}
    />
  );
}
