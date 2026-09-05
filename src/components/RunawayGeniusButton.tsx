import { useRef, useState } from "react";

interface RunawayGeniusButtonProps {
  href: string;
}

/**
 * The inside joke: looks like a shortcut to the lyrics on Genius, but it
 * dodges sideways the instant a cursor or finger gets close, so a mouse or
 * touch user can never actually land on it. Keyboard users (Tab + Enter)
 * aren't affected — focus doesn't trigger the dodge — so it's not *actually*
 * dead, just uncatchable the normal way.
 */
export function RunawayGeniusButton({ href }: RunawayGeniusButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const [left, setLeft] = useState(0);

  const dodge = () => {
    const container = containerRef.current;
    const button = buttonRef.current;
    if (!container || !button) return;

    const maxLeft = Math.max(container.clientWidth - button.offsetWidth, 0);
    if (maxLeft === 0) return;

    let next = Math.random() * maxLeft;
    // Reject a landing spot too close to the current one so a fast cursor
    // can't just nudge a pixel over and recatch it immediately.
    if (Math.abs(next - left) < maxLeft * 0.35) next = maxLeft - next;
    setLeft(next);
  };

  return (
    <div ref={containerRef} className="relative h-6 w-28 shrink-0 overflow-hidden">
      <a
        ref={buttonRef}
        href={href}
        target="_blank"
        rel="noreferrer"
        onMouseEnter={dodge}
        onTouchStart={(e) => {
          e.preventDefault();
          dodge();
        }}
        style={{ left }}
        className="absolute top-0 whitespace-nowrap rounded-full bg-shell-light px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-cream/60 transition-[left] duration-150 ease-out hover:text-cream"
      >
        genius
      </a>
    </div>
  );
}
