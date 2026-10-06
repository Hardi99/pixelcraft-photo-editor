import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  /** Réglage bipolaire (−1 → +1) : la jauge part du centre au lieu du minimum. */
  centered?: boolean;
};

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  ({ className, centered = false, min = 0, max = 100, value, ...props }, ref) => {
    const v = value?.[0] ?? 0;
    const toPercent = (n: number) => ((n - min) / (max - min)) * 100;
    const [from, to] = [toPercent(Math.min(0, v)), toPercent(Math.max(0, v))];

    return (
      <SliderPrimitive.Root
        ref={ref}
        min={min}
        max={max}
        value={value}
        className={cn("relative flex h-4 w-full touch-none select-none items-center", className)}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-line">
          {centered ? (
            <>
              <span className="absolute left-1/2 top-0 h-full w-px bg-dim/60" />
              <span className="absolute h-full bg-safelight" style={{ left: `${from}%`, width: `${to - from}%` }} />
            </>
          ) : (
            <SliderPrimitive.Range className="absolute h-full bg-safelight" />
          )}
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-3.5 w-3.5 rounded-full bg-paper shadow-[0_0_0_3px_hsl(var(--panel))] disabled:pointer-events-none disabled:opacity-50" />
      </SliderPrimitive.Root>
    );
  }
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
