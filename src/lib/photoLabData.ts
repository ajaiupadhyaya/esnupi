import { SITE_OWNER_EMAIL } from "@/lib/siteIdentity";

export const LAB_NAME = "literaturevendingmachine photolab";

export const HERO = {
  name: LAB_NAME,
  tagline: "Hand-processed film developing and scanning, out of Richmond, Virginia.",
  serviceArea: "Serving Richmond & Midlothian, VA — mail-in developing available nationwide.",
  ctaLabel: "Email your order",
} as const;

const MAILTO_SUBJECT = `Film developing order — ${LAB_NAME}`;
export const CONTACT_EMAIL = SITE_OWNER_EMAIL;
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(MAILTO_SUBJECT)}`;

export type FilmProcess = "c41" | "bw" | "ecn2";
export type FilmFormat = "35mm" | "120";

export type PricingRow = {
  process: FilmProcess;
  label: string;
  format: FilmFormat;
  developOnly: number;
  developAndScan: number;
};

export const PRICING: PricingRow[] = [
  { process: "c41", label: "C-41 Color Negative", format: "35mm", developOnly: 10, developAndScan: 18 },
  { process: "c41", label: "C-41 Color Negative", format: "120", developOnly: 12, developAndScan: 20 },
  { process: "bw", label: "Black & White", format: "35mm", developOnly: 13, developAndScan: 21 },
  { process: "bw", label: "Black & White", format: "120", developOnly: 15, developAndScan: 23 },
  { process: "ecn2", label: "ECN-2 (Motion Picture Film)", format: "35mm", developOnly: 16, developAndScan: 24 },
  { process: "ecn2", label: "ECN-2 (Motion Picture Film)", format: "120", developOnly: 18, developAndScan: 26 },
];

export const SCAN_ONLY_PRICING: Array<{ format: FilmFormat; price: number }> = [
  { format: "35mm", price: 9 },
  { format: "120", price: 10 },
];

export const RUSH_FEE = 10;
export const BULK_DISCOUNT = { minRolls: 5, percentOff: 10 };
export const STANDARD_TURNAROUND = "5–7 business days from when we receive your film";
export const RUSH_TURNAROUND = "48 hours from receipt";

export type ProcessStep = { step: number; title: string; body: string };

export const PROCESS_STEPS: ProcessStep[] = [
  {
    step: 1,
    title: "Email us",
    body: "Tell us what you're sending — process (C-41, B&W, or ECN-2), format, how many rolls, and develop-only or develop + scan. We'll confirm pricing and turnaround, and send mailing or drop-off details.",
  },
  {
    step: 2,
    title: "Send or drop off your film",
    body: "Mail it to us in a padded envelope — we'll send the address once we've confirmed your order. Local to Richmond or Midlothian? Drop-off is available by appointment.",
  },
  {
    step: 3,
    title: "We develop and scan",
    body: "Each roll is hand-processed in small batches and hand-inspected before scanning. Scans are pulled on a Contax-based large-format scanning setup and finished in Negative Lab Pro.",
  },
  {
    step: 4,
    title: "Your negatives (and scans) come back",
    body: "Negatives are returned cut and sleeved in archival sleeves unless you ask us to leave them uncut. Digital scans are delivered by download link.",
  },
];

export const ABOUT_COPY = {
  heading: "About the lab",
  paragraphs: [
    "literaturevendingmachine photolab is a small, hand-run darkroom based in the Richmond / Midlothian, Virginia area. Every roll is processed in small batches and hand-inspected before it's scanned — no automated mini-lab line, no batch shortcuts.",
    "Scans are pulled in-house on a Contax-based large-format scanning setup and finished in Negative Lab Pro, so color and contrast are checked by eye on every roll rather than left to a default profile.",
    "Alongside standard C-41 color and black & white, the lab also runs ECN-2 — the process motion picture film actually calls for, remjet and all — a process most consumer labs don't offer in-house.",
  ],
} as const;

export const BEFORE_YOU_SEND: string[] = [
  "Pack your film securely — a padded mailer or a film canister wrapped in bubble wrap works well.",
  "Include a note with your name, email, and what you'd like done (process, develop-only or develop + scan).",
  "Email us first — we'll confirm your order, pricing, and turnaround, and send mailing or drop-off details.",
  "No minimum order. Orders of 5 or more rolls get 10% off developing.",
  "Payment is by Venmo, PayPal, or Cash App, arranged by email once your order is confirmed.",
];

export type FaqEntry = { q: string; a: string };

export const FAQ: FaqEntry[] = [
  {
    q: "How long does developing take?",
    a: "Standard turnaround is 5–7 business days from when we receive your film. A 48-hour rush is available for an extra $10 per order — just ask when you email us.",
  },
  {
    q: "Do you process expired or found film?",
    a: "Yes — we'll run expired, found, or otherwise mystery rolls at the standard price. We can't guarantee results on film that's expired or was stored poorly, but we'll always try.",
  },
  {
    q: "Can I send disposable cameras?",
    a: "Yes, standard drugstore disposables are welcome. We'll extract and process the roll as C-41 unless the camera specifies otherwise.",
  },
  {
    q: "Do you do push or pull processing?",
    a: "Not as a standard offering yet. Email us before sending — we'll let you know if we can accommodate it for your specific roll.",
  },
  {
    q: "How do I pay?",
    a: "Venmo, PayPal, or Cash App. We'll send payment details once your order is confirmed by email — no payment info needed up front.",
  },
  {
    q: "Can I drop off in person?",
    a: "Yes, if you're in the Richmond or Midlothian, Virginia area. Email us to arrange a time and location — there are no public studio hours, so everything is by appointment.",
  },
  {
    q: "What if something happens to my film?",
    a: "We handle every roll carefully, but developing carries some inherent risk from chemistry and equipment that's outside anyone's control, and we can't be responsible for loss or damage in the mail. If your roll is irreplaceable, please insure it when you ship, and mention that in your email so we can take extra care.",
  },
  {
    q: "How are my negatives returned?",
    a: "Cut into strips and sleeved in archival sleeves by default. Tell us in your order email if you'd like them left uncut.",
  },
];
