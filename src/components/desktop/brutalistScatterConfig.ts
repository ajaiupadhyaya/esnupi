import scatterImg from "../../../images/filmblob.png";

/**
 * Bare prints on the desk — add more files to /images and import them here (one entry per photo).
 */
export type BrutalistScatterPic = {
  id: string;
  src: string;
  xPct: number;
  yPct: number;
  rotDeg: number;
  widthPx: number;
};

export const BRUTALIST_SCATTER: BrutalistScatterPic[] = [
  { id: "b1", src: scatterImg, xPct: 38, yPct: 36, rotDeg: -6, widthPx: 168 },
  { id: "b2", src: scatterImg, xPct: 52, yPct: 58, rotDeg: 4, widthPx: 142 },
  { id: "b3", src: scatterImg, xPct: 22, yPct: 62, rotDeg: -3, widthPx: 155 },
  { id: "b4", src: scatterImg, xPct: 66, yPct: 28, rotDeg: 5, widthPx: 148 },
  { id: "b5", src: scatterImg, xPct: 12, yPct: 34, rotDeg: -2, widthPx: 138 },
  { id: "b6", src: scatterImg, xPct: 48, yPct: 78, rotDeg: 7, widthPx: 160 },
];
