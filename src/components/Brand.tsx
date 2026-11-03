import Image from "next/image";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-lockup ${compact ? "brand-compact" : ""}`}>
      <Image
        src="/midsa-logo.png"
        alt="MIDSA logo"
        width={1110}
        height={967}
        sizes={compact ? "84px" : "94px"}
        priority
        className="brand-mark"
      />
      <span className="brand-name">MIDSprout</span>
    </div>
  );
}
