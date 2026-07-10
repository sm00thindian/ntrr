import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "inverse";
};

const sizes = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
};

export function Logo({ className, href = "/dashboard", size = "md", variant = "default" }: LogoProps) {
  const content = (
    <span
      className={cn(
        "font-display inline-flex items-baseline font-bold lowercase tracking-tight",
        sizes[size],
        variant === "inverse" ? "text-primary-foreground" : "text-foreground",
        className,
      )}
    >
      ntrr
      <span
        className="bg-brand ml-px inline-block h-[0.38em] w-[0.38em] translate-y-[0.06em] rounded-full"
        aria-hidden="true"
      />
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0" aria-label="NTRR home">
        {content}
      </Link>
    );
  }

  return content;
}