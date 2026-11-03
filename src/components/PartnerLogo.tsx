import { cn } from "@/lib/utils";

const PALETTE = ["#007BFF", "#1aa7c4", "#3d7ea6", "#5b9bd5", "#0e6ba8"];

function hueIndex(seed: string) {
  return seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function PartnerLogo({
  acronym,
  name,
  logoUrl = "",
  size = "md",
}: {
  acronym: string;
  name: string;
  logoUrl?: string;
  size?: "sm" | "md";
}) {
  const color = PALETTE[hueIndex(acronym || name) % PALETTE.length];
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center font-semibold text-white shadow-sm",
        logoUrl ? "rounded-xl" : "rounded-tl-2xl rounded-br-2xl rounded-tr-sm rounded-bl-sm",
        size === "sm" ? "h-9 w-9 text-[10px]" : "h-11 w-11 text-xs",
      )}
      style={logoUrl ? { backgroundImage: `url("${logoUrl}")`, backgroundSize: "cover", backgroundPosition: "center" } : { background: color }}
      role="img"
      aria-label={`${name} logo`}
    >
      {!logoUrl && (acronym || name).slice(0, 3).toUpperCase()}
    </div>
  );
}
