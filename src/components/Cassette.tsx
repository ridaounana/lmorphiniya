import type { FormEvent } from "react";
import { Reel } from "./Reel";

interface CassetteProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (word: string) => void;
  onSurprise: () => void;
}

export function Cassette({ value, onChange, onSearch, onSurprise }: CassetteProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSearch(value);
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-[28px] bg-shell p-4 shadow-[0_20px_50px_rgba(0,0,0,0.55)] sm:p-5">
      <div className="flex items-center justify-between px-2 pb-3">
        <div>
          <p className="font-display text-2xl tracking-wide text-cream sm:text-3xl">Morphinia</p>
          <p className="text-[11px] uppercase tracking-[0.25em] text-cream/50">one word. exact bar.</p>
        </div>
        <span className="tape-led h-2.5 w-2.5 rounded-full bg-red shadow-[0_0_8px_2px_rgba(224,71,59,0.6)]" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-tape p-4 shadow-[inset_0_2px_10px_rgba(0,0,0,0.6)] sm:p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <Reel icon="search" label="Search" type="submit" />
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="type a word…"
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-center font-sans text-lg text-cream placeholder:text-cream/30 focus:outline-none sm:text-xl"
          />
          <Reel icon="dice" label="Surprise me" type="button" onClick={onSurprise} />
        </div>
      </form>

      <div className="flex items-center justify-between px-2 pt-3 text-[10px] uppercase tracking-[0.2em] text-cream/25">
        <span>Side A</span>
        <span>Fan Edition</span>
      </div>
    </div>
  );
}
