import {
  SITE_BRAND,
  SITE_DESCRIPTION,
  SITE_OWNER_DOMAIN,
  SITE_OWNER_FULL_NAME,
  SITE_OWNER_GIVEN_NAME,
  SITE_OWNER_FAMILY_NAME,
  SITE_OWNER_SEO_PHRASES,
  SITE_TITLE,
} from "@/lib/siteIdentity";
import { SITE_INDEXABLE_ROUTES, SITE_PROFILE_LINKS } from "@/lib/seoMeta";

/**
 * Off-screen semantic outline: crawlable links + one h1. Does not affect layout.
 * Prefer real <a href> over repeated keyword spans — Google uses internal links.
 */
export function HiddenSiteIdentity() {
  return (
    <div className="seo-visually-hidden" data-site-owner={SITE_OWNER_FULL_NAME}>
      <h1>{SITE_OWNER_FULL_NAME} — official portfolio</h1>
      <p id="seo-lead">{SITE_DESCRIPTION}</p>
      <p>
        {SITE_TITLE}. {SITE_BRAND} is the personal website of {SITE_OWNER_FULL_NAME} (
        {SITE_OWNER_GIVEN_NAME} {SITE_OWNER_FAMILY_NAME}) at {SITE_OWNER_DOMAIN}
      </p>

      <nav aria-label={`Pages by ${SITE_OWNER_FULL_NAME}`}>
        <ul>
          {SITE_INDEXABLE_ROUTES.map(({ path, label }) => (
            <li key={path}>
              <a href={path}>{label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label={`${SITE_OWNER_FULL_NAME} profiles`}>
        <ul>
          {SITE_PROFILE_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} {...("rel" in link ? { rel: link.rel } : {})}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section aria-label={`About ${SITE_OWNER_FULL_NAME}`}>
        <h2>{SITE_OWNER_FULL_NAME}</h2>
        <ul>
          {SITE_OWNER_SEO_PHRASES.map((phrase, i) => (
            <li key={`${phrase}-${i}`}>{phrase}</li>
          ))}
        </ul>
      </section>

      <footer>
        <p>
          © {new Date().getFullYear()} {SITE_OWNER_FULL_NAME}. All rights reserved.{" "}
          <a href={SITE_OWNER_DOMAIN}>{SITE_OWNER_FULL_NAME}</a>
        </p>
      </footer>
    </div>
  );
}
