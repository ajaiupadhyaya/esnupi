import {
  SITE_BRAND,
  SITE_OWNER_DOMAIN,
  SITE_OWNER_FULL_NAME,
  SITE_OWNER_GITHUB,
  SITE_OWNER_LINKEDIN,
  SITE_OWNER_SUBSTACK,
} from "@/lib/siteIdentity";

export const SITE_OG_IMAGE = `${SITE_OWNER_DOMAIN}og-cover.png`;

export type SeoMeta = {
  title: string;
  description: string;
  canonicalPath: string;
  ogType: "website" | "profile";
};

const BASE = SITE_OWNER_DOMAIN.replace(/\/$/, "");

/** Indexable public routes (used for sitemap + internal SEO nav). */
export const SITE_INDEXABLE_ROUTES = [
  { path: "/", label: `${SITE_OWNER_FULL_NAME} home` },
  { path: "/archive", label: `${SITE_OWNER_FULL_NAME} project archive` },
  { path: "/gallery", label: `${SITE_OWNER_FULL_NAME} photography gallery` },
  { path: "/feltmoon", label: `${SITE_OWNER_FULL_NAME} felt moon room` },
] as const;

export const SITE_PROFILE_LINKS = [
  { href: SITE_OWNER_GITHUB, label: `${SITE_OWNER_FULL_NAME} on GitHub`, rel: "me" },
  { href: SITE_OWNER_LINKEDIN, label: `${SITE_OWNER_FULL_NAME} on LinkedIn`, rel: "me" },
  { href: SITE_OWNER_SUBSTACK, label: `${SITE_OWNER_FULL_NAME} on Substack`, rel: "me" },
  { href: `mailto:ajaiupad@gmail.com`, label: `Email ${SITE_OWNER_FULL_NAME}` },
] as const;

function canonicalUrl(path: string) {
  if (path === "/" || path === "/desktop") return `${BASE}/`;
  return `${BASE}${path}`;
}

export function resolveSeoMeta(pathname: string): SeoMeta & { canonicalUrl: string } {
  const normalized = pathname.replace(/\/+$/, "") || "/";

  if (normalized === "/archive") {
    return {
      title: `${SITE_OWNER_FULL_NAME} — Project Archive | ${SITE_BRAND}`,
      description: `Selected software, design, and internship work by ${SITE_OWNER_FULL_NAME}. Official project archive on ajaiupadhyaya.com.`,
      canonicalPath: "/archive",
      ogType: "website",
      canonicalUrl: canonicalUrl("/archive"),
    };
  }

  if (normalized === "/gallery") {
    return {
      title: `${SITE_OWNER_FULL_NAME} — Photography Gallery | ${SITE_BRAND}`,
      description: `Film and study photography by ${SITE_OWNER_FULL_NAME}. Gallery of images and sequences from ${SITE_OWNER_FULL_NAME}'s portfolio.`,
      canonicalPath: "/gallery",
      ogType: "website",
      canonicalUrl: canonicalUrl("/gallery"),
    };
  }

  if (normalized === "/feltmoon") {
    return {
      title: `${SITE_OWNER_FULL_NAME} — Felt Moon | ${SITE_BRAND}`,
      description: `Interactive felt room and horizontal scroll experience by ${SITE_OWNER_FULL_NAME}. Part of the ${SITE_OWNER_FULL_NAME} portfolio.`,
      canonicalPath: "/feltmoon",
      ogType: "website",
      canonicalUrl: canonicalUrl("/feltmoon"),
    };
  }

  return {
    title: `${SITE_OWNER_FULL_NAME} — Official Portfolio | ${SITE_BRAND}`,
    description: `${SITE_OWNER_FULL_NAME} is a UVA computer science and economics student. Official personal site: projects, photography, writing, and contact for ${SITE_OWNER_FULL_NAME}.`,
    canonicalPath: "/",
    ogType: "profile",
    canonicalUrl: canonicalUrl("/"),
  };
}
