import { useEffect, useRef, useState } from "react";

interface RunawayGeniusButtonProps {
  href: string;
}

// The cursor is never allowed within this many px of the button's center —
// it flees while the cursor is still approaching, not after it arrives.
const FLEE_RADIUS = 90;

/**
 * The inside joke: looks like a shortcut to the lyrics on Genius, but a
 * mouse or finger can never actually land on it — it watches cursor
 * proximity continuously (not just its own hover state) and runs to the far
 * side of its box the instant anything gets close, horizontally only, and
 * clipped so it can never visually leave that box. Distance is real 2D
 * (x and y) — checking x alone made every instance on screen flee together
 * whenever the cursor merely passed the same horizontal position, no matter
 * how far away vertically. Needs real horizontal room to work: the parent
 * must be a `relative` box wide enough (roughly the card's full width) for
 * a flee to reliably clear FLEE_RADIUS. Keyboard users aren't affected —
 * Tab + Enter reaches it, since that never brings a cursor near it — so
 * it's not *actually* dead, just uncatchable the normal way.
 */
export function RunawayGeniusButton({ href }: RunawayGeniusButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const [left, setLeft] = useState(0);

  const fleeFrom = (clientX: number, clientY: number) => {
    const container = containerRef.current;
    const button = buttonRef.current;
    if (!container || !button) return;

    const buttonRect = button.getBoundingClientRect();
    const dx = clientX - (buttonRect.left + buttonRect.width / 2);
    const dy = clientY - (buttonRect.top + buttonRect.height / 2);
    if (Math.sqrt(dx * dx + dy * dy) > FLEE_RADIUS) return;

    const maxLeft = Math.max(container.clientWidth - button.offsetWidth, 0);
    if (maxLeft === 0) return;

    const containerRect = container.getBoundingClientRect();
    const cursorInContainer = clientX - containerRect.left;
    // Run to whichever end of the box the cursor is farther from, landing
    // somewhere in that far quarter rather than always the exact corner.
    const fleeRight = cursorInContainer < maxLeft / 2;
    const next = fleeRight ? maxLeft - Math.random() * (maxLeft / 4) : Math.random() * (maxLeft / 4);

    setLeft(next);
  };

  // Tracks the cursor globally, not just hover on the button itself — a
  // fast, deliberate mouse movement reaches a stationary target long before
  // a "mouseenter" on that tiny target would ever fire. No cooldown here on
  // purpose: throttling reposition calls opened a timing gap a fast mouse
  // could close before the next allowed flee.
  useEffect(() => {
    const handleMove = (e: MouseEvent) => fleeFrom(e.clientX, e.clientY);
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <a
        ref={buttonRef}
        href={href}
        target="_blank"
        rel="noreferrer"
        onTouchStart={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          if (touch) fleeFrom(touch.clientX, touch.clientY);
        }}
        onClick={(e) => {
          // detail is 0 for a click synthesized from keyboard activation
          // (Enter/Space on focus) and >=1 for a real pointer click — the
          // fleeing should make the latter essentially impossible already,
          // this just refuses it outright if it somehow ever lands.
          if (e.detail !== 0) {
            e.preventDefault();
            fleeFrom(e.clientX, e.clientY);
          }
        }}
        style={{ left }}
        className="absolute top-0 whitespace-nowrap rounded-full bg-shell-light px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-cream/60 transition-[left] duration-100 ease-out hover:text-cream"
      >
        genius
      </a>
    </div>
  );
}
