import { createPopper, type Instance } from "@popperjs/core";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/** Direct @popperjs/core demo (Radix Tooltip elsewhere uses Floating UI — you asked for Popper explicitly). */
export function PopperDemo() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const inst = useRef<Instance | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!btnRef.current || !tipRef.current) return;
    inst.current = createPopper(btnRef.current, tipRef.current, {
      placement: "top",
      modifiers: [{ name: "offset", options: { offset: [0, 8] } }],
    });
    return () => {
      inst.current?.destroy();
      inst.current = null;
    };
  }, []);

  useEffect(() => {
    if (open) void inst.current?.update();
  }, [open]);

  return (
    <div className="relative inline-block">
      <Button
        ref={btnRef}
        type="button"
        variant="outline"
        size="sm"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        Popper tooltip
      </Button>
      <div
        ref={tipRef}
        role="tooltip"
        className={`pointer-events-none z-50 rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
      >
        Cut from felt, placed by Popper.
      </div>
    </div>
  );
}
