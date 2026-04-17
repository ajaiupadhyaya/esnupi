/**
 * Put PNG/WebP icons in /images and import them here. Currently uses one placeholder for all slots.
 */
import filmblob from "../../../images/filmblob.png";

export type WindowId = "about" | "projects" | "contact" | "lab";

export type DesktopIconDef = {
  id: string;
  label: string;
  src: string;
  windowId: WindowId;
  frame: "blob1" | "blob2";
  xPct: number;
  yPct: number;
};

export const FELT_FRAME = {
  blob1: filmblob,
  blob2: filmblob,
} as const;

export const DESKTOP_ICONS: DesktopIconDef[] = [
  { id: "email", label: "Email", src: filmblob, windowId: "contact", frame: "blob1", xPct: 7, yPct: 16 },
  { id: "phone", label: "Phone", src: filmblob, windowId: "contact", frame: "blob2", xPct: 74, yPct: 12 },
  { id: "home", label: "Home", src: filmblob, windowId: "about", frame: "blob1", xPct: 16, yPct: 8 },
  { id: "folder", label: "Projects", src: filmblob, windowId: "projects", frame: "blob2", xPct: 44, yPct: 22 },
  { id: "frame", label: "MDX Lab", src: filmblob, windowId: "lab", frame: "blob1", xPct: 81, yPct: 38 },
  { id: "moon", label: "Moon", src: filmblob, windowId: "about", frame: "blob2", xPct: 9, yPct: 48 },
  { id: "heart1", label: "Heart 1", src: filmblob, windowId: "projects", frame: "blob1", xPct: 31, yPct: 58 },
  { id: "heart2", label: "Heart 2", src: filmblob, windowId: "about", frame: "blob2", xPct: 63, yPct: 52 },
  { id: "heart3", label: "Heart 3", src: filmblob, windowId: "contact", frame: "blob1", xPct: 19, yPct: 74 },
  { id: "heart4", label: "Heart 4", src: filmblob, windowId: "lab", frame: "blob2", xPct: 86, yPct: 68 },
];
