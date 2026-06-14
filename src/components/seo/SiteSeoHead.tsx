import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { resolveSeoMeta, SITE_OG_IMAGE } from "@/lib/seoMeta";
import { buildStructuredDataGraph } from "@/lib/structuredData";
import { SITE_OWNER_FULL_NAME } from "@/lib/siteIdentity";

const JSON_LD_ID = "site-json-ld";

function upsertMeta(
  key: string,
  content: string,
  attr: "name" | "property" = "name",
) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

function upsertJsonLd(pathname: string) {
  let el = document.getElementById(JSON_LD_ID) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = JSON_LD_ID;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(buildStructuredDataGraph(pathname));
}

/**
 * Syncs document title, meta tags, canonical URL, and JSON-LD per route.
 * Critical for ranking on a personal name across SPA sub-routes.
 */
export function SiteSeoHead() {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = resolveSeoMeta(pathname);

    document.title = meta.title;
    upsertCanonical(meta.canonicalUrl);

    upsertMeta("description", meta.description);
    upsertMeta("author", SITE_OWNER_FULL_NAME);
    upsertMeta("application-name", meta.title);

    upsertMeta("og:title", meta.title, "property");
    upsertMeta("og:description", meta.description, "property");
    upsertMeta("og:url", meta.canonicalUrl, "property");
    upsertMeta("og:type", meta.ogType, "property");
    upsertMeta("og:image", SITE_OG_IMAGE, "property");
    upsertMeta("og:site_name", SITE_OWNER_FULL_NAME, "property");
    upsertMeta("og:locale", "en_US", "property");

    upsertMeta("twitter:card", "summary_large_image");
    upsertMeta("twitter:title", meta.title);
    upsertMeta("twitter:description", meta.description);
    upsertMeta("twitter:image", SITE_OG_IMAGE);

    upsertJsonLd(pathname);
  }, [pathname]);

  return null;
}
