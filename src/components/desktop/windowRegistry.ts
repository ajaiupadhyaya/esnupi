import type { MusicTrack } from "./panels/MusicPlayerPanel";
import type { WindowId } from "./desktopIconConfig";
import { buildFilmPhotoLibrary } from "@/photography/library";

import homefeltImg from "../../../images/homefelt.png";
import feltfolderImg from "../../../images/feltfolder.png";
import emailfeltImg from "../../../images/emailfelt.png";
import framefeltImg from "../../../images/framefelt.png";
import photoboothfeltImg from "../../../images/photoboothfelt.png";
import photobookfeltImg from "../../../images/photobookfelt.png";
import feltterminalImg from "../../../images/feltterminal.png";
import musicplayerfeltImg from "../../../images/musicplayerfelt.png";
import feltphotosappImg from "../../../images/feltphotosapp.png";
import feltbrowserImg from "../../../images/feltbrowser.png";
import feltcalendarImg from "../../../images/feltcalendar.png";
import feltlogImg from "../../../images/feltlog.png";
import feltmoonImg from "../../../images/feltmoon.png";
import phonefeltImg from "../../../images/phonefelt.png";

export type AnyWindowId =
  | WindowId
  | "aboutMac"
  | "secret"
  | "sticky"
  | "minesweeper"
  | "getinfo"
  | "controls"
  | "clock"
  | "typist"
  | "notepad"
  | "kaleidoscope"
  | "slideshow"
  | "internals"
  | "finder";

export const INITIAL: Record<AnyWindowId, { title: string; w: number; h: number }> = {
  about: { title: "About", w: 700, h: 580 },
  projects: { title: "System Profiler", w: 820, h: 640 },
  contact: { title: "Contact", w: 760, h: 620 },
  lab: { title: "My Work", w: 860, h: 640 },
  calendar: { title: "Calendar", w: 820, h: 640 },
  terminal: { title: "Terminal", w: 1000, h: 680 },
  photobooth: { title: "Photobooth", w: 880, h: 760 },
  photobook: { title: "Scrapbook", w: 1120, h: 780 },
  visitorlog: { title: "Guest Log", w: 820, h: 640 },
  music: { title: "iTunes", w: 780, h: 640 },
  photos: { title: "Photos", w: 1140, h: 780 },
  browser: { title: "Browser", w: 1200, h: 840 },
  feltmoon: { title: "Moon, at rest", w: 660, h: 680 },
  aboutMac: { title: "About this Mac", w: 560, h: 540 },
  secret: { title: "— private collection —", w: 780, h: 640 },
  sticky: { title: "Note", w: 320, h: 300 },
  minesweeper: { title: "Minefield", w: 680, h: 620 },
  getinfo: { title: "Get Info", w: 440, h: 380 },
  controls: { title: "Control Panels", w: 640, h: 600 },
  clock: { title: "Clock", w: 340, h: 420 },
  typist: { title: "Typist", w: 780, h: 640 },
  notepad: { title: "Notepad", w: 720, h: 580 },
  kaleidoscope: { title: "Kaleidoscope", w: 800, h: 700 },
  slideshow: { title: "Slideshow", w: 1040, h: 760 },
  internals: { title: "INTERNALS", w: 880, h: 680 },
  finder: { title: "Desktop", w: 760, h: 580 },
};

export const DOCK_APPS: Array<{ id: WindowId; label: string; icon: string }> = [
  { id: "about", label: "Home", icon: homefeltImg },
  { id: "projects", label: "Profiler", icon: feltfolderImg },
  { id: "contact", label: "Contact", icon: emailfeltImg },
  { id: "lab", label: "My Work", icon: framefeltImg },
  { id: "calendar", label: "Calendar", icon: feltcalendarImg },
  { id: "terminal", label: "Terminal", icon: feltterminalImg },
  { id: "photobooth", label: "Photobooth", icon: photoboothfeltImg },
  { id: "photobook", label: "Photobook", icon: photobookfeltImg },
  { id: "music", label: "iTunes", icon: musicplayerfeltImg },
  { id: "photos", label: "Photos", icon: feltphotosappImg },
  { id: "browser", label: "Browser", icon: feltbrowserImg },
];

/** Extra launchers for the retro-phone home grid (not in the Mac dock). */
export const MOBILE_EXTRA_APPS: Array<{ id: AnyWindowId; label: string; icon: string }> = [
  { id: "visitorlog", label: "Guest Log", icon: feltlogImg },
  { id: "feltmoon", label: "Life Outlook", icon: feltmoonImg },
  { id: "controls", label: "Settings", icon: phonefeltImg },
];

const musicModules = import.meta.glob("/src/music/*.{mp3,wav,ogg,m4a,flac,aac}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

export const MUSIC_LIBRARY: MusicTrack[] = Object.entries(musicModules)
  .map(([path, src]) => {
    const name = path.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "Untitled";
    const title = name.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
    return {
      id: path,
      title: title.length ? title : "Untitled",
      src,
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

export const FILM_PHOTO_ITEMS = buildFilmPhotoLibrary();
