import { cn } from "@/lib/utils";

type AppIconProps = {
  className?: string;
  size?: number;
};

export function AppIcon({ className, size = 32 }: AppIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="NTRR"
      className={cn("shrink-0", className)}
    >
      <rect width="64" height="64" rx="14" fill="currentColor" className="text-foreground" />
      <text
        x="32"
        y="41"
        textAnchor="middle"
        fill="white"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="22"
        fontWeight="700"
      >
        [N]
      </text>
    </svg>
  );
}