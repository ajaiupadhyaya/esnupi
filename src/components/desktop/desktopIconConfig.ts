import emailfelt from "@/assets/icons/emailfelt.png";
import feltheart3 from "@/assets/icons/feltheart3.webp";
import feltfolder from "@/assets/icons/feltfolder.png";
import feltmoon from "@/assets/icons/feltmoon.png";
import feltcalendar from "@/assets/icons/feltcalendar.png";
import photobookfelt from "@/assets/icons/photobookfelt.png";
import photoboothfelt from "@/assets/icons/photoboothfelt.png";
import framefelt from "@/assets/icons/framefelt.png";
import homefelt from "@/assets/icons/homefelt.png";
import feltlog from "@/assets/icons/feltlog.png";

import filmblob from "@/assets/icons/filmblob.png";

export type WindowId =
  | "about"
  | "projects"
  | "contact"
  | "lab"
  | "terminal"
  | "photobooth"
  | "photobook"
  | "visitorlog"
  | "music"
  | "photos"
  | "browser"
  | "calendar"
  | "feltmoon";

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
  { id: "email", label: "Contact", src: emailfelt, windowId: "contact", frame: "blob1", xPct: 7, yPct: 16 },
  { id: "home", label: "Home", src: homefelt, windowId: "about", frame: "blob1", xPct: 16, yPct: 8 },
  { id: "folder", label: "Profiler", src: feltfolder, windowId: "projects", frame: "blob2", xPct: 44, yPct: 22 },
  { id: "frame", label: "My Work", src: framefelt, windowId: "lab", frame: "blob1", xPct: 81, yPct: 38 },
  { id: "calendar", label: "Calendar", src: feltcalendar, windowId: "calendar", frame: "blob2", xPct: 86, yPct: 14 },
  { id: "moon", label: "Life Outlook", src: feltmoon, windowId: "feltmoon", frame: "blob2", xPct: 9, yPct: 48 },
  { id: "heart1", label: "Recent Activity", src: feltheart3, windowId: "projects", frame: "blob1", xPct: 31, yPct: 58 },
  { id: "photobooth", label: "Photobooth", src: photoboothfelt, windowId: "photobooth", frame: "blob1", xPct: 48, yPct: 74 },
  { id: "photobook", label: "Photobook", src: photobookfelt, windowId: "photobook", frame: "blob2", xPct: 72, yPct: 80 },
  {
    id: "visitorlog",
    label: "Guest Log",
    src: feltlog,
    windowId: "visitorlog",
    frame: "blob1",
    xPct: 58,
    yPct: 14,
  },
];
