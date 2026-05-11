import { lazy, Suspense } from "react";
import { hydraStage } from "@/lib/hydraStage";
import { hasSupabaseConfig } from "@/lib/supabaseClient";
import type { SharedPhoto } from "@/lib/photobookStore";
import type { FilmPhoto } from "@/photography/library";
import type { MusicTrack } from "./panels/MusicPlayerPanel";
import { AboutThisMacPanel } from "./panels/AboutThisMacPanel";
import { SecretPanel } from "./panels/SecretPanel";
import { StickyNotePanel } from "./panels/StickyNotePanel";
import {
  AboutPanel as NewAboutPanel,
  WorkPanel,
  FindPanel,
  LabStubPanel,
  CalendarPanel,
  FeltMoonPanel,
} from "./panels/ContentPanels";
import type { AnyWindowId } from "./windowRegistry";
import { INITIAL } from "./windowRegistry";

const MacTerminalApp = lazy(() =>
  import("./MacTerminalApp").then((m) => ({ default: m.MacTerminalApp })),
);
const PhotoboothPanel = lazy(() =>
  import("./panels/PhotoboothPanel").then((m) => ({ default: m.PhotoboothPanel })),
);
const ScrapbookPanel = lazy(() =>
  import("./panels/ScrapbookPanel").then((m) => ({ default: m.ScrapbookPanel })),
);
const MusicPlayerPanel = lazy(() =>
  import("./panels/MusicPlayerPanel").then((m) => ({ default: m.MusicPlayerPanel })),
);
const WebBrowserPanel = lazy(() =>
  import("./panels/WebBrowserPanel").then((m) => ({ default: m.WebBrowserPanel })),
);
const MinesweeperPanel = lazy(() =>
  import("./panels/MinesweeperPanel").then((m) => ({ default: m.MinesweeperPanel })),
);
const ControlPanelsPanel = lazy(() =>
  import("./panels/ControlPanelsPanel").then((m) => ({ default: m.ControlPanelsPanel })),
);
const ClockPanel = lazy(() =>
  import("./programs/ClockPanel").then((m) => ({ default: m.ClockPanel })),
);
const TypistPanel = lazy(() =>
  import("./programs/TypistPanel").then((m) => ({ default: m.TypistPanel })),
);
const NotepadPanel = lazy(() =>
  import("./programs/NotepadPanel").then((m) => ({ default: m.NotepadPanel })),
);
const KaleidoscopePanel = lazy(() =>
  import("./programs/KaleidoscopePanel").then((m) => ({ default: m.KaleidoscopePanel })),
);
const SlideshowPanel = lazy(() =>
  import("./programs/SlideshowPanel").then((m) => ({ default: m.SlideshowPanel })),
);
const FilmPhotosPanel = lazy(() =>
  import("./panels/FilmPhotosPanel").then((m) => ({ default: m.FilmPhotosPanel })),
);
const InternalsPanel = lazy(() =>
  import("./panels/InternalsPanel").then((m) => ({ default: m.InternalsPanel })),
);
const FinderPanel = lazy(() =>
  import("./panels/FinderPanel").then((m) => ({ default: m.FinderPanel })),
);
const VisitorLogPanel = lazy(() =>
  import("./panels/VisitorLogPanel").then((m) => ({ default: m.VisitorLogPanel })),
);

export type MacintoshWindowPanelContentProps = {
  id: AnyWindowId;
  activeId: AnyWindowId | null;
  getInfoTarget: AnyWindowId | null;
  photos: SharedPhoto[];
  loadingPhotos: boolean;
  photoError: string | null;
  musicLibrary: MusicTrack[];
  filmItems: FilmPhoto[];
  onOpenWindow: (id: AnyWindowId, anchor?: { x: number; y: number }) => void;
  onNavigateArchive: (projectId?: string) => void;
  onNavigateGallery: () => void;
  onNavigateFeltMoon: () => void;
  onAddPhoto: (src: string) => void | Promise<void>;
  onWobbleIcons: () => void;
  onMatrixMode: () => void;
  onMemoryLeak: () => void;
};

export function MacintoshWindowPanelContent({
  id,
  activeId,
  getInfoTarget,
  photos,
  loadingPhotos,
  photoError,
  musicLibrary,
  filmItems,
  onOpenWindow,
  onNavigateArchive,
  onNavigateGallery,
  onNavigateFeltMoon,
  onAddPhoto,
  onWobbleIcons,
  onMatrixMode,
  onMemoryLeak,
}: MacintoshWindowPanelContentProps) {
  return (
    <>
      {id === "about" && <NewAboutPanel />}
      {id === "projects" && <WorkPanel onOpenArchive={onNavigateArchive} />}
      {id === "contact" && (
        <FindPanel
          onOpenStudy={onNavigateGallery}
          onOpenCalendar={() => onOpenWindow("calendar")}
        />
      )}
      {id === "lab" && <LabStubPanel />}
      {id === "calendar" && <CalendarPanel />}
      {id === "feltmoon" && <FeltMoonPanel onOpenGallery={onNavigateFeltMoon} />}
      <Suspense fallback={<div className="mac-panel-fallback" aria-hidden />}>
        {id === "terminal" && (
          <MacTerminalApp
            windowActive={activeId === id}
            onOpenWindow={(w) => onOpenWindow(w)}
            onGlitch={onWobbleIcons}
            onMatrixMode={onMatrixMode}
            onMemoryLeak={onMemoryLeak}
          />
        )}
        {id === "photobooth" && (
          <PhotoboothPanel
            onCapture={onAddPhoto}
            onOpenPhotobook={() => onOpenWindow("photobook")}
          />
        )}
        {id === "photobook" && (
          <ScrapbookPanel
            photos={photos}
            loading={loadingPhotos}
            error={photoError}
            sharedEnabled={hasSupabaseConfig}
          />
        )}
        {id === "visitorlog" && <VisitorLogPanel />}
        {id === "music" && <MusicPlayerPanel library={musicLibrary} />}
        {id === "photos" && <FilmPhotosPanel items={filmItems} />}
        {id === "browser" && <WebBrowserPanel />}
        {id === "controls" && <ControlPanelsPanel />}
        {id === "minesweeper" && <MinesweeperPanel />}
        {id === "clock" && <ClockPanel />}
        {id === "typist" && (
          <TypistPanel
            onMagicWord={() => {
              onOpenWindow("internals");
              window.setTimeout(() => hydraStage.pulse(), 80);
            }}
          />
        )}
        {id === "notepad" && <NotepadPanel />}
        {id === "kaleidoscope" && <KaleidoscopePanel />}
        {id === "slideshow" && <SlideshowPanel />}
      </Suspense>
      {id === "aboutMac" && <AboutThisMacPanel />}
      {id === "secret" && <SecretPanel />}
      {id === "sticky" && <StickyNotePanel />}
      {id === "getinfo" && <GetInfoPanel target={getInfoTarget ?? "about"} />}
      {id === "internals" && <InternalsPanel />}
      {id === "finder" && <FinderPanel onOpen={(target) => onOpenWindow(target as AnyWindowId)} />}
    </>
  );
}

function GetInfoPanel({ target }: { target: AnyWindowId }) {
  const info = INITIAL[target];
  return (
    <section className="mac-getinfo">
      <h3 className="mac-getinfo__title">Info — {info.title}</h3>
      <dl>
        <div><dt>Kind</dt><dd>desktop window</dd></div>
        <div><dt>Where</dt><dd>/esnupi/windows/{String(target)}</dd></div>
        <div><dt>Size</dt><dd>{info.w}×{info.h} px</dd></div>
        <div><dt>Created</dt><dd>1998-09-21 03:41</dd></div>
        <div><dt>Modified</dt><dd>when you opened it</dd></div>
        <div><dt>Locked</dt><dd>no. but it knows you are reading this.</dd></div>
      </dl>
      <p className="mac-getinfo__comment">
        Comments: a window is a polite request to look inside. thank you for knocking.
      </p>
    </section>
  );
}
