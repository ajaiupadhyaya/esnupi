import emailfelt from "../../../images/emailfelt.png";
import feltheart1 from "../../../images/feltheart1.png";
import feltheart2 from "../../../images/feltheart2.png";
import feltheart3 from "../../../images/feltheart3.webp";
import feltheart4 from "../../../images/feltheart4.webp";
import feltfolder from "../../../images/feltfolder.png";
import feltmoon from "../../../images/feltmoon.png";
import photobookfelt from "../../../images/photobookfelt.png";
import photoboothfelt from "../../../images/photoboothfelt.png";
import framefelt from "../../../images/framefelt.png";
import homefelt from "../../../images/homefelt.png";
import phonefelt from "../../../images/phonefelt.png";

import filmblob from "../../../images/filmblob.png";

export type WindowId =
  | "about"
  | "projects"
  | "contact"
  | "lab"
  | "terminal"
  | "photobooth"
  | "photobook"
  | "music"
  | "browser";

export type DesktopIconDef = {
  id: string;
  label: string;
  src: string;
  windowId: WindowId;
  /** Alternate organic frames so icons read on the Hydra wallpaper */
  frame: "blob1" | "blob2";
  /** Position within the desktop icon layer (percent, top-left of icon stack) */
  xPct: number;
  yPct: number;
};

/** Blob art used as icon backing frame */
export const FELT_FRAME = {
  blob1: filmblob,
  blob2: filmblob,
} as const;

/**
 * All felt art icons scattered on the desktop (order is arbitrary; positions are fixed %).
 * Several icons may open the same window (e.g. email + phone → contact).
 */
export const DESKTOP_ICONS: DesktopIconDef[] = [
  { id: "email", label: "Email", src: emailfelt, windowId: "contact", frame: "blob1", xPct: 7, yPct: 16 },
  { id: "phone", label: "Phone", src: phonefelt, windowId: "contact", frame: "blob2", xPct: 74, yPct: 12 },
  { id: "home", label: "Home", src: homefelt, windowId: "about", frame: "blob1", xPct: 16, yPct: 8 },
  { id: "folder", label: "Profiler", src: feltfolder, windowId: "projects", frame: "blob2", xPct: 44, yPct: 22 },
  { id: "frame", label: "MDX Lab", src: framefelt, windowId: "lab", frame: "blob1", xPct: 81, yPct: 38 },
  { id: "moon", label: "Moon", src: feltmoon, windowId: "about", frame: "blob2", xPct: 9, yPct: 48 },
  { id: "heart1", label: "Heart 1", src: feltheart1, windowId: "projects", frame: "blob1", xPct: 31, yPct: 58 },
  { id: "heart2", label: "Heart 2", src: feltheart2, windowId: "about", frame: "blob2", xPct: 63, yPct: 52 },
  { id: "heart3", label: "Heart 3", src: feltheart3, windowId: "contact", frame: "blob1", xPct: 19, yPct: 74 },
  { id: "heart4", label: "Heart 4", src: feltheart4, windowId: "lab", frame: "blob2", xPct: 86, yPct: 68 },
  { id: "photobooth", label: "Photobooth", src: photoboothfelt, windowId: "photobooth", frame: "blob1", xPct: 48, yPct: 74 },
  { id: "photobook", label: "Photobook", src: photobookfelt, windowId: "photobook", frame: "blob2", xPct: 72, yPct: 80 },
];
