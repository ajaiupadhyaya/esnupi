import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { useEffect, useRef } from "react";
import "@xterm/xterm/css/xterm.css";

export function PlaygroundTerminal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      theme: {
        background: "#0c0c0e",
        foreground: "#e8e2d9",
        cursor: "#e07a4a",
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(el);
    fit.fit();
    term.writeln("\x1b[38;5;214mesnupi\x1b[0m — xterm.js ready.");
    term.writeln("type \x1b[1mhelp\x1b[0m (demo only)");
    let line = "";
    term.onData((data) => {
      if (data === "\r") {
        term.writeln("");
        if (line.trim() === "help") {
          term.writeln("  try: echo felt, clear, date");
        } else if (line.startsWith("echo ")) {
          term.writeln(line.slice(5));
        } else if (line.trim() === "clear") {
          term.clear();
        } else if (line.trim() === "date") {
          term.writeln(new Date().toISOString());
        } else if (line.length) {
          term.writeln(`command not found: ${line}`);
        }
        line = "";
        term.write("$ ");
        return;
      }
      if (data === "\x7f" || data === "\b") {
        line = line.slice(0, -1);
        term.write("\b \b");
        return;
      }
      line += data;
      term.write(data);
    });
    term.write("$ ");

    const ro = new ResizeObserver(() => fit.fit());
    ro.observe(el);

    return () => {
      ro.disconnect();
      term.dispose();
    };
  }, []);

  return <div ref={containerRef} className="h-44 w-full overflow-hidden rounded-md border border-border" />;
}
