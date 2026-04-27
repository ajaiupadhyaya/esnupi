import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { useEffect, useRef } from "react";
import "@xterm/xterm/css/xterm.css";
import { playMacTypeTick } from "@/lib/retroMacSounds";
import { appendSystemLog, subscribeSystemLog } from "@/lib/systemLog";

type FsNode = { type: "dir"; children: Record<string, FsNode> } | { type: "file"; content: string };

const SECRET_FILES: Record<string, string> = {
  "that_night.jpg": "[image: a kitchen, 3:41 AM, long exposure]\nyou were there. i was there. the light was bad.",
  "unsent_draft.txt":
    "subject: (no subject)\n\nhi — i kept starting this and then closing the window.\nthe drafts folder is the true museum.",
  "2019.mov":
    "[video, 0:47, no audio]\ncamera points at a ceiling fan.\nblinking shadow pattern on the wall.\neveryone in the room has already left.",
  "colophon.log":
    "built in a hallway. \n tested on an iMac G3. \n signed by hand.",
};

const FORTUNES = [
  "the machine loves you but does not know how to say it.",
  "every interaction has weight. even the ones you do not see.",
  "delete something today that nobody is reading.",
  "the mouse is a pointer and also a small animal.",
  "pick one thing. finish it. tell no one for a week.",
  "the right shade of beige is a kind of prayer.",
  "everything you name becomes slower.",
];

const MOTDS = [
  "Today is a good day to rotate something.",
  "128MB free. 128MB unspoken.",
  "Last login: somewhere in 1998.",
  "This terminal does not dream. But it could be convinced.",
  "Kernel: warm. Uptime: honest.",
  "Remember the feeling of a CD-R burning.",
];

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
            "notes.txt": {
              type: "file",
              content:
                "— do not forget the thing\n— the other thing, especially\n— a sunset, watched all the way through",
            },
          },
        },
      },
    },
    projects: { type: "dir", children: {} },
    tmp: { type: "dir", children: {} },
    secrets: {
      type: "dir",
      children: Object.fromEntries(
        Object.entries(SECRET_FILES).map(([k, v]) => [k, { type: "file", content: v } as FsNode]),
      ),
    },
    dev: {
      type: "dir",
      children: {
        mind: {
          type: "dir",
          children: {
            "leak.bin": {
              type: "file",
              content:
                "0000000: dead be ef  ca fe ba be  — you should not map this page\n0000010: 00 00 00 00 00 00 00 00  (quiet)\n",
            },
          },
        },
      },
    },
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

const NEOFETCH = `                   esnupi@retroterm
       .:'        --------------------------
    __ :'__       OS: System 8.1 (esnupi build)
 .'\`__\`-'__\`\`.    Kernel: 8.1.0-esnupi
:__________.-'   Uptime: since 1998
:_________:      Shell: tcsh 6.07
 :_________\`-;   Resolution: 1024x768 @72Hz
  \`.__.-.__.'    DE: System 7 Platinum
                 Terminal: xterm.js
                 CPU: PowerPC 604e @ 350MHz
                 GPU: hydra-synth (WebGL)
                 Memory: 32MB / 128MB
                 Disk: /dev/disk0s1 -- full of ideas
`;

type MacTerminalAppProps = {
  /** When true, keeps xterm’s textarea focused so typing reaches the shell. */
  windowActive?: boolean;
  onOpenWindow?: (id: "music") => void;
  onGlitch?: () => void;
  onMatrixMode?: () => void;
  /** Reading /dev/mind/leak.bin triggers a desktop “memory leak” sequence. */
  onMemoryLeak?: () => void;
};

export function MacTerminalApp({
  windowActive,
  onOpenWindow,
  onGlitch,
  onMatrixMode,
  onMemoryLeak,
}: MacTerminalAppProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);

  useEffect(() => {
    if (!windowActive) return;
    termRef.current?.focus();
  }, [windowActive]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Nord-informed terminal palette (green output, soft blue prompt,
    // muted blue paths, near-white input), warmer than a pure #000 screen.
    // The block cursor is rupture red — a single dramatic choice that
    // makes this terminal unmistakably esnupi's.
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "block",
      fontSize: 13,
      lineHeight: 1.2,
      fontFamily: 'IBM Plex Mono, Menlo, Monaco, Consolas, ui-monospace, monospace',
      theme: {
        background: "#0d1117",
        foreground: "#a3be8c",
        cursor: "#ff3b00",
        cursorAccent: "#0d1117",
        selectionBackground: "#0000cc",
        selectionForeground: "#ffffff",
        brightBlue: "#88c0d0",
        blue: "#81a1c1",
        white: "#d8dee9",
        brightWhite: "#eceff4",
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(el);
    fit.fit();
    termRef.current = term;

    const focusTerm = () => term.focus();
    el.addEventListener("pointerdown", focusTerm, { capture: true });

    const unsubLog = subscribeSystemLog((line) => {
      term.writeln(`\u001b[33m${line}\u001b[0m`);
    });

    const fs = cloneFs(ROOT);
    let cwd = "/home/guest";
    let line = "";
    let cursorPos = 0; // cursor position within `line`
    const history: string[] = [];
    let historyIndex = -1;
    let busy = false;

    const MOTD = MOTDS[Math.floor(Math.random() * MOTDS.length)];

    const prompt = () => {
      term.write(`\r\nguest@esnupi:${cwd}$ `);
    };

    const redrawLine = () => {
      term.write(`\u001b[2K\rguest@esnupi:${cwd}$ ${line}`);
      // Move cursor to the requested position
      const back = line.length - cursorPos;
      if (back > 0) term.write(`\u001b[${back}D`);
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

    const writelnSlow = async (lines: string[], delay = 18) => {
      busy = true;
      try {
        for (const l of lines) {
          term.writeln(l);
          await new Promise((r) => setTimeout(r, delay));
        }
      } finally {
        busy = false;
      }
    };

    const runMatrix = async () => {
      busy = true;
      onMatrixMode?.();
      const chars = "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789";
      const cols = term.cols;
      const start = Date.now();
      while (Date.now() - start < 10_000) {
        let row = "";
        for (let i = 0; i < cols; i += 1) {
          row += Math.random() < 0.2 ? chars[Math.floor(Math.random() * chars.length)] : " ";
        }
        term.writeln("\u001b[32m" + row + "\u001b[0m");
        await new Promise((r) => setTimeout(r, 55));
      }
      term.writeln("\r\n\u001b[2m(exiting the matrix)\u001b[0m");
      busy = false;
    };

    const runSnake = async () => {
      busy = true;
      const W = 28;
      const H = 12;
      let dir: [number, number] = [1, 0];
      let snake: Array<[number, number]> = [[5, 6], [4, 6], [3, 6]];
      let food: [number, number] = [20, 6];
      let alive = true;
      let score = 0;

      const render = () => {
        term.write("\u001b[2J\u001b[H");
        term.writeln("┌" + "─".repeat(W) + "┐");
        for (let y = 0; y < H; y += 1) {
          let row = "│";
          for (let x = 0; x < W; x += 1) {
            if (snake.some(([sx, sy]) => sx === x && sy === y)) row += "█";
            else if (food[0] === x && food[1] === y) row += "●";
            else row += " ";
          }
          row += "│";
          term.writeln(row);
        }
        term.writeln("└" + "─".repeat(W) + "┘");
        term.writeln(`score: ${score}   (arrow keys to steer, q to quit)`);
      };

      const onKey = ({ key }: { key: string }) => {
        if (key === "\u001b[A" && dir[1] !== 1) dir = [0, -1];
        else if (key === "\u001b[B" && dir[1] !== -1) dir = [0, 1];
        else if (key === "\u001b[C" && dir[0] !== -1) dir = [1, 0];
        else if (key === "\u001b[D" && dir[0] !== 1) dir = [-1, 0];
        else if (key === "q" || key === "\u0003") alive = false;
      };
      const sub = term.onData((key) => onKey({ key }));

      while (alive) {
        const head: [number, number] = [snake[0]![0] + dir[0], snake[0]![1] + dir[1]];
        if (head[0] < 0 || head[1] < 0 || head[0] >= W || head[1] >= H) {
          alive = false;
          break;
        }
        if (snake.some(([sx, sy]) => sx === head[0] && sy === head[1])) {
          alive = false;
          break;
        }
        snake = [head, ...snake];
        if (head[0] === food[0] && head[1] === food[1]) {
          score += 1;
          food = [Math.floor(Math.random() * W), Math.floor(Math.random() * H)];
        } else {
          snake.pop();
        }
        render();
        await new Promise((r) => setTimeout(r, 110));
      }
      sub.dispose();
      term.writeln("\r\nsnake: game over.");
      busy = false;
    };

    const runWeather = async () => {
      busy = true;
      term.writeln("fetching Point Reyes, CA…");
      await new Promise((r) => setTimeout(r, 500));
      term.writeln("");
      term.writeln("    \\   /     Point Reyes, CA");
      term.writeln("     .-.      Fog, 54°F");
      term.writeln("  ― (   ) ―   feels like: memory");
      term.writeln("     `-'      wind: from the sea");
      term.writeln("    /   \\     visibility: depends");
      term.writeln("");
      term.writeln("(cached. the real coast is always different.)");
      busy = false;
    };

    const runManLove = () => {
      const lines = [
        "LOVE(1)                     esnupi user manual                     LOVE(1)",
        "",
        "NAME",
        "     love — a daemon that runs despite itself",
        "",
        "SYNOPSIS",
        "     love [person]... [--ignoring no] [--attention high]",
        "",
        "DESCRIPTION",
        "     love is a resident process. It accepts input at unpredictable intervals",
        "     and writes to stdout in unexpected formats. love cannot be killed with",
        "     SIGTERM. love survives reboots, power loss, and deletion. love is not",
        "     compatible with irony.",
        "",
        "BUGS",
        "     love leaks memory. you will not get that memory back.",
        "     love occasionally writes to /dev/null when you expect it not to.",
        "",
        "SEE ALSO",
        "     friendship(1), attention(3), time(7)",
      ];
      lines.forEach((l) => term.writeln(l));
    };

    const COMMANDS = [
      "help", "pwd", "ls", "cd", "cat", "mkdir", "touch", "rm", "rmdir",
      "echo", "clear", "date", "whoami", "uname", "neofetch", "fortune",
      "matrix", "weather", "snake", "man", "play", "ssh", "sudo",
      "shutdown", "restart",
    ];

    const tabComplete = () => {
      const tokens = line.slice(0, cursorPos).split(" ");
      const tail = tokens[tokens.length - 1] ?? "";
      let candidates: string[] = [];
      if (tokens.length === 1) {
        candidates = COMMANDS.filter((c) => c.startsWith(tail));
      } else {
        const parts = resolvePath(tail.includes("/") ? tail.slice(0, tail.lastIndexOf("/")) : ".");
        const node = getNode(parts);
        if (node && node.type === "dir") {
          const frag = tail.includes("/") ? tail.slice(tail.lastIndexOf("/") + 1) : tail;
          candidates = Object.keys(node.children).filter((n) => n.startsWith(frag));
        }
      }
      if (candidates.length === 1) {
        const first = candidates[0]!;
        const before = line.slice(0, cursorPos - tail.length);
        const after = line.slice(cursorPos);
        line = before + first + (tokens.length === 1 ? " " : "") + after;
        cursorPos = (before + first + (tokens.length === 1 ? " " : "")).length;
        redrawLine();
      } else if (candidates.length > 1) {
        term.writeln("");
        term.writeln(candidates.join("  "));
        prompt();
        term.write(line);
      }
    };

    const run = async (raw: string) => {
      const args = parseArgs(raw.trim());
      if (!args.length) return;
      const [cmd, ...rest] = args;

      if (cmd === "help") {
        term.writeln("Commands: " + COMMANDS.join(" "));
        term.writeln("Try: neofetch, fortune, matrix, weather, snake, `man love`.");
        term.writeln("Hidden paths exist under /dev (mind the leak).");
        return;
      }
      if (cmd === "pwd") return term.writeln(cwd);
      if (cmd === "whoami") return term.writeln("guest");
      if (cmd === "uname") return term.writeln("Darwin esnupi 8.0.1 powerpc");
      if (cmd === "date") return term.writeln(new Date().toString());
      if (cmd === "clear") return term.clear();
      if (cmd === "echo") return term.writeln(rest.join(" "));
      if (cmd === "neofetch") return term.write(NEOFETCH);
      if (cmd === "fortune") {
        return term.writeln("  " + FORTUNES[Math.floor(Math.random() * FORTUNES.length)]);
      }
      if (cmd === "matrix") return runMatrix();
      if (cmd === "weather") return runWeather();
      if (cmd === "snake") return runSnake();
      if (cmd === "man") {
        if (rest[0] === "love") return runManLove();
        term.writeln(`No manual entry for ${rest[0] ?? "(nothing)"}.`);
        return;
      }
      if (cmd === "play") {
        onOpenWindow?.("music");
        term.writeln("opening music player…");
        return;
      }
      if (cmd === "ssh") {
        const host = rest[0] ?? "";
        term.writeln(`ssh: connecting to ${host}...`);
        await new Promise((r) => setTimeout(r, 900));
        term.writeln("ssh: connect to host esnupi.local port 22: Connection refused.");
        term.writeln("but you tried.");
        return;
      }
      if (cmd === "sudo") {
        const phrase = rest.join(" ");
        if (phrase === "rm -rf /" || phrase === "rm -rf /*") {
          term.writeln("nice try.");
          onGlitch?.();
          return;
        }
        term.writeln(`guest is not in the sudoers file. This incident will be remembered fondly.`);
        return;
      }
      if (cmd === "shutdown") {
        term.writeln("halt scheduled for now.\nuse the Special menu to really shut down.");
        return;
      }
      if (cmd === "restart") {
        term.writeln("use Special → Restart… for a real restart.");
        return;
      }
      if (cmd === "ls") {
        const flags = rest.filter((r) => r.startsWith("-"));
        const target = resolvePath(rest.find((r) => !r.startsWith("-")));
        const node = getNode(target);
        if (!node) {
          term.writeln(`ls: cannot access '${rest[0] ?? ""}': No such file or directory`);
          return;
        }
        if (node.type === "file") return term.writeln(target[target.length - 1] ?? "");
        const entries = Object.entries(node.children).sort(([a], [b]) => a.localeCompare(b));
        if (flags.some((f) => f.includes("l") || f.includes("a"))) {
          entries.forEach(([name, child]) => {
            const kind = child.type === "dir" ? "drwx-----" : "-rw-------";
            term.writeln(`${kind}  1 guest  staff    0 Sep 21  1998  ${name}`);
          });
          return;
        }
        term.writeln(entries.map(([n]) => n).join("  "));
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
        if (!rest[0]) return term.writeln("cat: missing file operand");
        const target = resolvePath(rest[0]);
        const node = getNode(target);
        if (!node || node.type !== "file") return term.writeln(`cat: ${rest[0]}: No such file`);
        const fullPath = pathString(target);
        if (fullPath === "/dev/mind/leak.bin") {
          appendSystemLog("kernel: page fault on mapped device /dev/mind/leak.bin — initiating leak");
          term.writeln("\u001b[31m-- MEMORY LEAK: userland mapped kernel phantom page\u001b[0m");
          onMemoryLeak?.();
        }
        node.content.split("\n").forEach((l) => term.writeln(l));
        return;
      }
      if (cmd === "mkdir") {
        if (!rest[0]) return term.writeln("mkdir: missing operand");
        const target = resolvePath(rest[0]);
        const parent = getParent(target);
        if (!parent) return term.writeln(`mkdir: cannot create directory '${rest[0]}'`);
        if (parent.parentNode.children[parent.name]) return term.writeln(`mkdir: cannot create directory '${rest[0]}': File exists`);
        parent.parentNode.children[parent.name] = { type: "dir", children: {} };
        return;
      }
      if (cmd === "touch") {
        if (!rest[0]) return term.writeln("touch: missing file operand");
        const target = resolvePath(rest[0]);
        const parent = getParent(target);
        if (!parent) return term.writeln(`touch: cannot touch '${rest[0]}'`);
        if (!parent.parentNode.children[parent.name]) parent.parentNode.children[parent.name] = { type: "file", content: "" };
        return;
      }
      if (cmd === "rm") {
        if (!rest[0]) return term.writeln("rm: missing operand");
        const target = resolvePath(rest[0]);
        const parent = getParent(target);
        if (!parent || !parent.parentNode.children[parent.name]) {
          return term.writeln(`rm: cannot remove '${rest[0]}': No such file or directory`);
        }
        if (parent.parentNode.children[parent.name]?.type === "dir") {
          return term.writeln(`rm: cannot remove '${rest[0]}': Is a directory`);
        }
        delete parent.parentNode.children[parent.name];
        return;
      }
      if (cmd === "rmdir") {
        if (!rest[0]) return term.writeln("rmdir: missing operand");
        const target = resolvePath(rest[0]);
        const parent = getParent(target);
        const node = parent?.parentNode.children[parent.name];
        if (!parent || !node || node.type !== "dir") return term.writeln(`rmdir: failed to remove '${rest[0]}': No such directory`);
        if (Object.keys(node.children).length) return term.writeln(`rmdir: failed to remove '${rest[0]}': Directory not empty`);
        delete parent.parentNode.children[parent.name];
        return;
      }

      term.writeln(`${cmd}: command not found`);
    };

    void writelnSlow(
      [
        "esnupi terminal 1.0  (you may try `help`, `neofetch`, `matrix`, `snake`)",
        `motd — ${MOTD}`,
      ],
      16,
    ).then(() => {
      term.write("\r\nguest@esnupi:/home/guest$ ");
      term.focus();
    });

    term.onData(async (data) => {
      if (busy) return;
      if (data === "\r") {
        term.write("\r\n");
        const command = line.trim();
        if (command) {
          history.push(command);
          historyIndex = history.length;
          await run(command);
        }
        line = "";
        cursorPos = 0;
        prompt();
        return;
      }

      if (data === "\u0003") {
        line = "";
        cursorPos = 0;
        prompt();
        return;
      }

      if (data === "\u007f") {
        if (cursorPos > 0) {
          line = line.slice(0, cursorPos - 1) + line.slice(cursorPos);
          cursorPos -= 1;
          redrawLine();
        }
        return;
      }

      if (data === "\t") {
        tabComplete();
        return;
      }

      if (data === "\u001b[A") {
        if (!history.length) return;
        historyIndex = Math.max(0, historyIndex - 1);
        const next = history[historyIndex] ?? "";
        line = next;
        cursorPos = next.length;
        redrawLine();
        return;
      }

      if (data === "\u001b[B") {
        if (!history.length) return;
        historyIndex = Math.min(history.length, historyIndex + 1);
        const next = history[historyIndex] ?? "";
        line = next;
        cursorPos = next.length;
        redrawLine();
        return;
      }

      if (data === "\u001b[C") {
        if (cursorPos < line.length) {
          cursorPos += 1;
          term.write("\u001b[C");
        }
        return;
      }

      if (data === "\u001b[D") {
        if (cursorPos > 0) {
          cursorPos -= 1;
          term.write("\u001b[D");
        }
        return;
      }

      if (data >= " " && data <= "~") {
        if (Math.random() < 0.7) playMacTypeTick();
        line = line.slice(0, cursorPos) + data + line.slice(cursorPos);
        cursorPos += 1;
        redrawLine();
      }
    });

    const ro = new ResizeObserver(() => {
      try { fit.fit(); } catch { /* ignore */ }
    });
    ro.observe(el);

    return () => {
      el.removeEventListener("pointerdown", focusTerm, { capture: true });
      unsubLog();
      ro.disconnect();
      term.dispose();
      termRef.current = null;
    };
  }, [onOpenWindow, onGlitch, onMatrixMode, onMemoryLeak]);

  return <div ref={containerRef} className="mac-terminal-host" />;
}
