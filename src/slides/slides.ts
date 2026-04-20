/**
 * Slideshow source data.
 *
 * Each slide points at an asset bundled via Vite's URL import. Add new
 * entries to {@link SLIDES} to extend the portfolio — no other code change
 * is required. The slideshow reads this file at build time.
 *
 * `note`, when present, reveals a ¶ glyph in the viewer that opens an
 * overlay with longer-form text set in the serif content font.
 */

import feltfolder from "../../images/feltfolder.png";
import feltheart1 from "../../images/feltheart1.png";
import feltheart2 from "../../images/feltheart2.png";
import feltheart3 from "../../images/feltheart3.webp";
import feltheart4 from "../../images/feltheart4.webp";
import feltmoon from "../../images/feltmoon.png";
import homefelt from "../../images/homefelt.png";
import photobookfelt from "../../images/photobookfelt.png";

export type Slide = {
  src: string;
  title: string;
  year: number;
  medium: string;
  dimensions?: string;
  note?: string;
};

export const SLIDES: Slide[] = [
  {
    src: homefelt,
    title: "Hearth",
    year: 2024,
    medium: "felt, cotton, wood",
    dimensions: "34 × 28 cm",
    note: "The first piece I kept. Its edges are wrong in a way I no longer remember how to fix.",
  },
  {
    src: feltfolder,
    title: "Mirror, folded",
    year: 2024,
    medium: "paper, linen thread",
  },
  {
    src: feltheart1,
    title: "Chorus No. 1",
    year: 2024,
    medium: "hand-stitched felt",
    dimensions: "18 × 18 cm",
  },
  {
    src: feltheart2,
    title: "Chorus No. 2",
    year: 2024,
    medium: "hand-stitched felt",
    dimensions: "18 × 18 cm",
    note: "A study for a larger piece that never happened. I keep looking at this one anyway.",
  },
  {
    src: feltheart3,
    title: "Chorus No. 3",
    year: 2024,
    medium: "hand-stitched felt",
  },
  {
    src: feltheart4,
    title: "Chorus No. 4",
    year: 2025,
    medium: "hand-stitched felt, rupture red",
    dimensions: "22 × 22 cm",
  },
  {
    src: feltmoon,
    title: "Moon, at rest",
    year: 2025,
    medium: "felt on linen",
  },
  {
    src: photobookfelt,
    title: "Scrapbook (cover)",
    year: 2025,
    medium: "mixed media",
    note: "Not for sale. The inside is a room I let people visit.",
  },
];
