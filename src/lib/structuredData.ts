import { resolveSeoMeta } from "@/lib/seoMeta";
import {
  SITE_BRAND,
  SITE_OWNER_DOMAIN,
  SITE_OWNER_EMAIL,
  SITE_OWNER_FULL_NAME,
  SITE_OWNER_GITHUB,
  SITE_OWNER_GIVEN_NAME,
  SITE_OWNER_FAMILY_NAME,
  SITE_OWNER_LINKEDIN,
  SITE_OWNER_SUBSTACK,
} from "@/lib/siteIdentity";

const PERSON_ID = `${SITE_OWNER_DOMAIN}#person`;
const WEBSITE_ID = `${SITE_OWNER_DOMAIN}#website`;

function personNode() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: SITE_OWNER_FULL_NAME,
    givenName: SITE_OWNER_GIVEN_NAME,
    familyName: SITE_OWNER_FAMILY_NAME,
    url: SITE_OWNER_DOMAIN,
    email: `mailto:${SITE_OWNER_EMAIL}`,
    image: `${SITE_OWNER_DOMAIN}og-cover.png`,
    jobTitle: "Finance",
    description: `Official portfolio of ${SITE_OWNER_FULL_NAME} — finance, film photography, and writing.`,
    sameAs: [SITE_OWNER_GITHUB, SITE_OWNER_LINKEDIN, SITE_OWNER_SUBSTACK],
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "University of Virginia",
      url: "https://www.virginia.edu/",
    },
    knowsAbout: [
      "Finance",
      "Quantitative Finance",
      "Economics",
      "Film Photography",
      "Private Credit",
    ],
    identifier: [
      {
        "@type": "PropertyValue",
        propertyID: "website",
        value: "ajaiupadhyaya.com",
      },
      {
        "@type": "PropertyValue",
        propertyID: "github",
        value: "ajaiupadhyaya",
      },
    ],
  };
}

function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_OWNER_FULL_NAME,
    alternateName: [SITE_BRAND, `${SITE_OWNER_FULL_NAME} portfolio`, "ajaiupadhyaya.com"],
    url: SITE_OWNER_DOMAIN,
    description: `Official website of ${SITE_OWNER_FULL_NAME}.`,
    inLanguage: "en-US",
    author: { "@id": PERSON_ID },
    publisher: { "@id": PERSON_ID },
  };
}

function photoLabNode() {
  return {
    "@type": "LocalBusiness",
    "@id": `${SITE_OWNER_DOMAIN}photolab#business`,
    name: "literaturevendingmachine photolab",
    description:
      "Film developing and scanning lab offering C-41, black & white, and ECN-2 processing for 35mm and 120 film, based in the Richmond/Midlothian, Virginia area with nationwide mail-in service.",
    url: `${SITE_OWNER_DOMAIN}photolab`,
    email: `mailto:${SITE_OWNER_EMAIL}`,
    priceRange: "$9-$26",
    founder: { "@id": PERSON_ID },
    areaServed: [
      { "@type": "City", name: "Richmond, VA" },
      { "@type": "City", name: "Midlothian, VA" },
      { "@type": "Country", name: "United States" },
    ],
  };
}

/** Route-aware JSON-LD for crawlers (injected client-side on navigation). */
export function buildStructuredDataGraph(pathname: string) {
  const meta = resolveSeoMeta(pathname);
  const pageUrl = meta.canonicalUrl;
  const pageId = `${pageUrl}#webpage`;

  const breadcrumbItems = [
    { name: SITE_OWNER_FULL_NAME, item: SITE_OWNER_DOMAIN },
  ];
  if (meta.canonicalPath !== "/") {
    breadcrumbItems.push({
      name: meta.title.split(" — ")[0] ?? meta.title,
      item: pageUrl,
    });
  }

  const normalized = pathname.replace(/\/+$/, "") || "/";
  const graph: Record<string, unknown>[] = [
    personNode(),
    websiteNode(),
    {
      "@type": "ProfilePage",
      "@id": `${SITE_OWNER_DOMAIN}#profile`,
      url: SITE_OWNER_DOMAIN,
      name: `${SITE_OWNER_FULL_NAME} — Official Portfolio`,
      isPartOf: { "@id": WEBSITE_ID },
      mainEntity: { "@id": PERSON_ID },
      about: { "@id": PERSON_ID },
    },
    {
      "@type": "WebPage",
      "@id": pageId,
      url: pageUrl,
      name: meta.title,
      description: meta.description,
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": PERSON_ID },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: `${SITE_OWNER_DOMAIN}og-cover.png`,
      },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems.map((crumb, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: crumb.name,
          item: crumb.item,
        })),
      },
    },
  ];

  if (normalized === "/photolab") {
    graph.push(photoLabNode());
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}
