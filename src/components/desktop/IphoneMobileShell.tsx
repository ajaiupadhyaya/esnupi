import { DateTime } from "luxon";
import { useCallback, useEffect, useState } from "react";
import type { SharedPhoto } from "@/lib/photobookStore";
import { playMacIconOpen } from "@/lib/retroMacSounds";
import { MacintoshWindowPanelContent } from "./MacintoshWindowPanelContent";
import type { AnyWindowId } from "./windowRegistry";
import { DOCK_APPS, INITIAL, MOBILE_EXTRA_APPS, FILM_PHOTO_ITEMS, MUSIC_LIBRARY } from "./windowRegistry";
import "./retro-iphone-shell.css";

const DOCK_LAUNCH_IDS: AnyWindowId[] = ["about", "contact", "music", "browser"];

export type IphoneMobileShellProps = {
  photos: SharedPhoto[];
  loadingPhotos: boolean;
  photoError: string | null;
  getInfoTarget: AnyWindowId | null;
  setGetInfoTarget: (id: AnyWindowId | null) => void;
  onOpenWindow: (id: AnyWindowId, anchor?: { x: number; y: number }) => void;
  onNavigateArchive: (projectId?: string) => void;
  onNavigateGallery: () => void;
  onNavigateFeltMoon: () => void;
  onAddPhoto: (src: string) => void | Promise<void>;
  onWobbleIcons: () => void;
  onMatrixMode: () => void;
  onMemoryLeak: () => void;
  /** Parent sets this (e.g. Konami) to force-open an app; consumed on mount/update. */
  pendingOpenId: AnyWindowId | null;
  onConsumedPendingOpen: () => void;
};

export function IphoneMobileShell({
  photos,
  loadingPhotos,
  photoError,
  getInfoTarget,
  setGetInfoTarget,
  onOpenWindow,
  onNavigateArchive,
  onNavigateGallery,
  onNavigateFeltMoon,
  onAddPhoto,
  onWobbleIcons,
  onMatrixMode,
  onMemoryLeak,
  pendingOpenId,
  onConsumedPendingOpen,
}: IphoneMobileShellProps) {
  const [screen, setScreen] = useState<"home" | "app">("home");
  const [openAppId, setOpenAppId] = useState<AnyWindowId | null>(null);
  const [clock, setClock] = useState(() => DateTime.now().toLocaleString(DateTime.TIME_SIMPLE));

  useEffect(() => {
    const id = window.setInterval(() => {
      setClock(DateTime.now().toLocaleString(DateTime.TIME_SIMPLE));
    }, 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    document.body.classList.add("ios-retro-active");
    return () => document.body.classList.remove("ios-retro-active");
  }, []);

  useEffect(() => {
    if (!pendingOpenId) return;
    setOpenAppId(pendingOpenId);
    setScreen("app");
    onConsumedPendingOpen();
  }, [pendingOpenId, onConsumedPendingOpen]);

  const goHome = useCallback(() => {
    setScreen("home");
    setOpenAppId(null);
    setGetInfoTarget(null);
  }, [setGetInfoTarget]);

  /** Keeps the in-phone stack in sync when panels open other panels (e.g. Photobooth → Photobook). */
  const openInPhone = useCallback(
    (id: AnyWindowId, anchor?: { x: number; y: number }) => {
      playMacIconOpen();
      setOpenAppId(id);
      setScreen("app");
      onOpenWindow(id, anchor);
    },
    [onOpenWindow],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (screen === "app") {
        e.preventDefault();
        goHome();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, goHome]);

  const gridApps = [...DOCK_APPS, ...MOBILE_EXTRA_APPS];
  const dockApps = DOCK_LAUNCH_IDS.map((id) => DOCK_APPS.find((a) => a.id === id)).filter(
    (a): a is (typeof DOCK_APPS)[number] => Boolean(a),
  );

  const title =
    openAppId && openAppId === "getinfo" && getInfoTarget
      ? `Info: ${INITIAL[getInfoTarget].title}`
      : openAppId
        ? INITIAL[openAppId].title
        : "esnupi";

  return (
    <div
      className={`ios-retro-root${screen === "home" ? " ios-retro-root--home" : ""}`}
      role="application"
      aria-label="Retro phone home"
    >
      <header className="ios-retro-status">
        <div className="ios-retro-status__carrier" aria-hidden>
          <span className="ios-retro-status__dots">
            <span />
            <span />
            <span />
            <span />
            <span />
          </span>
          esnupi
        </div>
        <div className="ios-retro-status__time">{clock}</div>
        <div className="ios-retro-status__battery" aria-hidden>
          100% ▮
        </div>
      </header>

      {screen === "home" ? (
        <>
          <div className="ios-retro-home">
            <nav className="ios-retro-home__page" aria-label="Apps">
              {gridApps.map((app) => (
                <button
                  key={`${app.id}-${app.label}`}
                  type="button"
                  className="ios-retro-icon-btn"
                  onClick={() => openInPhone(app.id)}
                >
                  <span className="ios-retro-icon-btn__tile">
                    <img src={app.icon} alt="" draggable={false} />
                  </span>
                  <span className="ios-retro-icon-btn__label">{app.label}</span>
                </button>
              ))}
            </nav>
          </div>
          <div className="ios-retro-dock" aria-label="Quick launch">
            {dockApps.map((app) => (
              <button
                key={`dock-${app.id}`}
                type="button"
                className="ios-retro-icon-btn"
                onClick={() => openInPhone(app.id)}
              >
                <span className="ios-retro-icon-btn__tile">
                  <img src={app.icon} alt="" draggable={false} />
                </span>
                <span className="ios-retro-icon-btn__label">{app.label}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="ios-retro-app">
          <nav className="ios-retro-nav">
            <button type="button" className="ios-retro-nav__back" onClick={goHome}>
              {"\u2039"} Home
            </button>
            <h1 className="ios-retro-nav__title">{title}</h1>
            <span className="ios-retro-nav__spacer" aria-hidden />
          </nav>
          <div className="ios-retro-app__body">
            <div className="ios-retro-app__body-inner">
              {openAppId ? (
                <MacintoshWindowPanelContent
                  id={openAppId}
                  activeId={openAppId}
                  getInfoTarget={getInfoTarget}
                  photos={photos}
                  loadingPhotos={loadingPhotos}
                  photoError={photoError}
                  musicLibrary={MUSIC_LIBRARY}
                  filmItems={FILM_PHOTO_ITEMS}
                  onOpenWindow={openInPhone}
                  onNavigateArchive={onNavigateArchive}
                  onNavigateGallery={onNavigateGallery}
                  onNavigateFeltMoon={onNavigateFeltMoon}
                  onAddPhoto={onAddPhoto}
                  onWobbleIcons={onWobbleIcons}
                  onMatrixMode={onMatrixMode}
                  onMemoryLeak={onMemoryLeak}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
