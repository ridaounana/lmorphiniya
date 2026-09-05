import { useState } from "react";

interface ReelProps {
  icon: "search" | "dice";
  label: string;
  type?: "button" | "submit";
  onClick?: () => void;
}

export function Reel({ icon, label, type = "button", onClick }: ReelProps) {
  const [burst, setBurst] = useState(false);

  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      onClick={() => {
        setBurst(true);
        onClick?.();
      }}
      onAnimationEnd={() => setBurst(false)}
      className="group relative h-16 w-16 shrink-0 rounded-full bg-gradient-to-b from-neutral-800 to-black
        shadow-[inset_0_0_0_2px_rgba(242,233,216,0.15),0_2px_6px_rgba(0,0,0,0.6)] outline-none
        transition-transform focus-visible:ring-2 focus-visible:ring-amber active:scale-95 sm:h-[4.5rem] sm:w-[4.5rem]"
    >
      <span
        className={`absolute inset-1.5 rounded-full border-4 border-dashed border-amber/25 ${
          burst ? "reel-burst" : "reel-idle group-hover:[animation-duration:1.5s]"
        }`}
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <ReelIcon kind={icon} />
      </span>
    </button>
  );
}

function ReelIcon({ kind }: { kind: "search" | "dice" }) {
  if (kind === "dice") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-cream" strokeWidth={1.6}>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <circle cx="8.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="15.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="8.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="15.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-cream" strokeWidth={1.8}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="15.3" y1="15.3" x2="20.5" y2="20.5" strokeLinecap="round" />
    </svg>
  );
}
