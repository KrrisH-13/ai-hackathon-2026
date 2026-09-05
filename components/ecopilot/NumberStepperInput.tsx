"use client";

interface NumberStepperInputProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  className?: string;
}

// Native <input type="number"> spin arrows trigger a known Chromium/Windows bug
// where the mouse cursor icon disappears after clicking them. Custom +/- buttons
// with the native spinner hidden sidestep the bug entirely.
export function NumberStepperInput({ value, onChange, min, max, step = 1, className = "" }: NumberStepperInputProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Number.isNaN(n) ? min : n));

  return (
    <div className={`flex items-stretch rounded-xl border border-slate-200 bg-slate-50 overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        className="px-2.5 font-bold text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition"
        aria-label="Decrease"
      >
        −
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        min={min}
        max={max}
        step={step}
        className="visible-text-cursor w-full min-w-0 px-1 py-2 bg-transparent text-center text-xs font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        className="px-2.5 font-bold text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
