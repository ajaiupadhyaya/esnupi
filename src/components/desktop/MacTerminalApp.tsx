import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { useEffect, useRef } from "react";
import "@xterm/xterm/css/xterm.css";

type FsNode = { type: "dir"; children: Record<string, FsNode> } | { type: "file"; content: string };

const ROOT: FsNode = {
  type: "dir",
  children: {
    home: {
      type: "dir",
      children: {
        guest: {
          type: "dir",
          children: {
            "README.txt": {
              type: "file",
              content:
                "Welcome to esnupi terminal.\nThis terminal runs inside your browser.\nUse `help` to list commands.",
            },
          },
        },
      },
    },
    projects: { type: "dir", children: {} },
    tmp: { type: "dir", children: {} },
  },
};

const cloneFs = (node: FsNode): FsNode => {
  if (node.type === "file") return { ...node };
  const next: Record<string, FsNode> = {};
  for (const [key, value] of Object.entries(node.children)) next[key] = cloneFs(value);
  return { type: "dir", children: next };
};

const normalize = (parts: string[]) => {
  const out: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") out.pop();
    else out.push(part);
  }
  return out;
};

const parseArgs = (input: string) => {
  const matches = input.match(/(?:[^\s"]+|"[^"]*")+/g);
  return (matches ?? []).map((token) => token.replace(/^"(.*)"$/, "$1"));
};

export function MacTerminalApp() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      lineHeight: 1.2,
      fontFamily: "Menlo, Monaco, Consolas, ui-monospace, monospace",
      theme: {
        background: "#111111",
        foreground: "#e8e8e8",
        cursor: "#f5f5f5",
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(el);
    fit.fit();

    const fs = cloneFs(ROOT);
    let cwd = "/home/guest";
    let line = "";
    const history: string[] = [];
    let historyIndex = -1;

    const prompt = () => {
      term.write(`\r\nguest@esnupi:${cwd}$ `);
    };

    const resolvePath = (input?: string) => {
      const raw = input?.trim() || "";
      if (!raw || raw === "~") return ["/", "home", "guest"];
      const fromRaw = raw.startsWith("/") ? raw.split("/") : [...cwd.split("/"), ...raw.split("/")];
      return ["/", ...normalize(fromRaw)];
    };

    const pathString = (parts: string[]) => {
      const items = parts.filter((p) => p !== "/");
      return items.length ? `/${items.join("/")}` : "/";
    };

    const getNode = (parts: string[]) => {
      let cur: FsNode = fs;
      for (const segment of parts.filter((p) => p !== "/")) {
        if (cur.type !== "dir") return undefined;
        cur = cur.children[segment];
        if (!cur) return undefined;
      }
      return cur;
    };

    const getParent = (parts: string[]) => {
      const parent = parts.slice(0, -1);
      const name = parts[parts.length - 1];
      if (!name || name === "/") return undefined;
      const parentNode = getNode(parent);
      if (!parentNode || parentNode.type !== "dir") return undefined;
      return { parentNode, name };
    };

    const run = (raw: string) => {
      const args = parseArgs(raw.trim());
      if (!args.length) return;
      const [cmd, ...rest] = args;

      if (cmd === "help") {
        term.writeln("Commands:");
        term.writeln("  help pwd ls cd cat mkdir touch rm rmdir echo clear date whoami uname");
        return;
      }
      if (cmd === "pwd") {
        term.writeln(cwd);
        return;
      }
      if (cmd === "whoami") {
        term.writeln("guest");
        return;
      }
      if (cmd === "uname") {
        term.writeln("Darwin esnupi 8.0.1");
        return;
      }
      if (cmd === "date") {
        term.writeln(new Date().toString());
        return;
      }
      if (cmd === "clear") {
        term.clear();
        return;
      }
      if (cmd === "echo") {
        term.writeln(rest.join(" "));
        return;
      }
      if (cmd === "ls") {
        const target = resolvePath(rest[0]);
        const node = getNode(target);
        if (!node) {
          term.writeln(`ls: cannot access '${rest[0] ?? ""}': No such file or directory`);
          return;
        }
        if (node.type === "file") {
          term.writeln(target[target.length - 1] ?? "");
          return;
        }
        term.writeln(Object.keys(node.children).sort().join("  "));
        return;
      }
      if (cmd === "cd") {
        const target = resolvePath(rest[0] || "~");
        const node = getNode(target);
        if (!node || node.type !== "dir") {
          term.writeln(`cd: no such file or directory: ${rest[0] ?? "~"}`);
          return;
        }
        cwd = pathString(target);
        return;
      }
      if (cmd === "cat") {
        if (!rest[0]) {
          term.writeln("cat: missing file operand");
          return;
        }
        const target = resolvePath(rest[0]);
        const node = getNode(target);
        if (!node || node.type !== "file") {
          term.writeln(`cat: ${rest[0]}: No such file`);
          return;
        }
        term.writeln(node.content);
        return;
      }
      if (cmd === "mkdir") {
        if (!rest[0]) {
          term.writeln("mkdir: missing operand");
          return;
        }
        const target = resolvePath(rest[0]);
        const parent = getParent(target);
        if (!parent) {
          term.writeln(`mkdir: cannot create directory '${rest[0]}'`);
          return;
        }
        if (parent.parentNode.children[parent.name]) {
          term.writeln(`mkdir: cannot create directory '${rest[0]}': File exists`);
          return;
        }
        parent.parentNode.children[parent.name] = { type: "dir", children: {} };
        return;
      }
      if (cmd === "touch") {
        if (!rest[0]) {
          term.writeln("touch: missing file operand");
          return;
        }
        const target = resolvePath(rest[0]);
        const parent = getParent(target);
        if (!parent) {
          term.writeln(`touch: cannot touch '${rest[0]}'`);
          return;
        }
        if (!parent.parentNode.children[parent.name]) {
          parent.parentNode.children[parent.name] = { type: "file", content: "" };
        }
        return;
      }
      if (cmd === "rm") {
        if (!rest[0]) {
          term.writeln("rm: missing operand");
          return;
        }
        const target = resolvePath(rest[0]);
        const parent = getParent(target);
        if (!parent || !parent.parentNode.children[parent.name]) {
          term.writeln(`rm: cannot remove '${rest[0]}': No such file or directory`);
          return;
        }
        if (parent.parentNode.children[parent.name]?.type === "dir") {
          term.writeln(`rm: cannot remove '${rest[0]}': Is a directory`);
          return;
        }
        delete parent.parentNode.children[parent.name];
        return;
      }
      if (cmd === "rmdir") {
        if (!rest[0]) {
          term.writeln("rmdir: missing operand");
          return;
        }
        const target = resolvePath(rest[0]);
        const parent = getParent(target);
        const node = parent?.parentNode.children[parent.name];
        if (!parent || !node || node.type !== "dir") {
          term.writeln(`rmdir: failed to remove '${rest[0]}': No such directory`);
          return;
        }
        if (Object.keys(node.children).length) {
          term.writeln(`rmdir: failed to remove '${rest[0]}': Directory not empty`);
          return;
        }
        delete parent.parentNode.children[parent.name];
        return;
      }

      term.writeln(`${cmd}: command not found`);
    };

    term.writeln("esnupi terminal 1.0");
    term.writeln("Type `help` for available commands.");
    term.write("guest@esnupi:/home/guest$ ");

    term.onData((data) => {
      if (data === "\r") {
        term.write("\r\n");
        const command = line.trim();
        if (command) {
          history.push(command);
          historyIndex = history.length;
          run(command);
        }
        line = "";
        prompt();
        return;
      }

      if (data === "\u0003") {
        line = "";
        prompt();
        return;
      }

      if (data === "\u007f") {
        if (line.length > 0) {
          line = line.slice(0, -1);
          term.write("\b \b");
        }
        return;
      }

      if (data === "\u001b[A") {
        if (!history.length) return;
        historyIndex = Math.max(0, historyIndex - 1);
        const next = history[historyIndex] ?? "";
        term.write(`\u001b[2K\rguest@esnupi:${cwd}$ ${next}`);
        line = next;
        return;
      }

      if (data === "\u001b[B") {
        if (!history.length) return;
        historyIndex = Math.min(history.length, historyIndex + 1);
        const next = history[historyIndex] ?? "";
        term.write(`\u001b[2K\rguest@esnupi:${cwd}$ ${next}`);
        line = next;
        return;
      }

      if (data >= " " && data <= "~") {
        line += data;
        term.write(data);
      }
    });

    const ro = new ResizeObserver(() => fit.fit());
    ro.observe(el);

    return () => {
      ro.disconnect();
      term.dispose();
    };
  }, []);

  return <div ref={containerRef} className="mac-terminal-host" />;
}
