# SEO Handoff: Improve Google Ranking for “Ajai Upadhyaya”

## Project Goal
Improve the search visibility of `https://ajaiupadhyaya.com` so it becomes the primary/official result when someone searches **Ajai Upadhyaya**.

This is a personal-name SEO project. The main objective is not broad keyword traffic; it is entity clarity, crawlability, structured data, metadata, backlinks from authoritative personal profiles, and Search Console indexing.

---

## Target Domain

```txt
https://ajaiupadhyaya.com
```

Primary search query to optimize for:

```txt
Ajai Upadhyaya
```

Secondary identity phrases:

```txt
Ajai Upadhyaya UVA
Ajai Upadhyaya Computer Science Economics
Ajai Upadhyaya Quant Finance
Ajai Upadhyaya GitHub
Ajai Upadhyaya portfolio
```

---

## Expected Outcome
Within a few weeks to months, the personal website should move closer to the top result for “Ajai Upadhyaya,” ideally above or near LinkedIn/GitHub.

Do not use spammy SEO tactics. The site should be clean, credible, fast, crawlable, and clearly identify Ajai Upadhyaya as the owner.

---

## Core SEO Tasks

### 1. Add Strong Homepage Metadata

In the homepage `<head>`, add or update:

```html
<title>Ajai Upadhyaya | Computer Science, Economics, Quant Finance</title>
<meta name="description" content="Official website of Ajai Upadhyaya — Computer Science and Economics graduate focused on quantitative finance, machine learning, data science, economics, and creative technical projects.">
<link rel="canonical" href="https://ajaiupadhyaya.com/">
<meta name="robots" content="index, follow">
```

Add Open Graph and Twitter metadata:

```html
<meta property="og:type" content="profile">
<meta property="og:title" content="Ajai Upadhyaya | Official Website">
<meta property="og:description" content="Official website of Ajai Upadhyaya — projects in quantitative finance, machine learning, data science, economics, and software engineering.">
<meta property="og:url" content="https://ajaiupadhyaya.com/">
<meta property="og:site_name" content="Ajai Upadhyaya">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Ajai Upadhyaya | Official Website">
<meta name="twitter:description" content="Projects, writing, research, and technical work by Ajai Upadhyaya.">
```

If the site has a good preview image, add:

```html
<meta property="og:image" content="https://ajaiupadhyaya.com/og-image.png">
<meta name="twitter:image" content="https://ajaiupadhyaya.com/og-image.png">
```

Create `/public/og-image.png` if missing.

---

### 2. Add Person + ProfilePage Structured Data

Add JSON-LD to the homepage `<head>`.

Replace placeholder social URLs with the real ones.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "name": "Ajai Upadhyaya | Official Website",
  "url": "https://ajaiupadhyaya.com/",
  "mainEntity": {
    "@type": "Person",
    "name": "Ajai Upadhyaya",
    "url": "https://ajaiupadhyaya.com/",
    "sameAs": [
      "https://www.linkedin.com/in/REPLACE_WITH_REAL_LINKEDIN",
      "https://github.com/REPLACE_WITH_REAL_GITHUB"
    ],
    "alumniOf": {
      "@type": "CollegeOrUniversity",
      "name": "University of Virginia"
    },
    "knowsAbout": [
      "Computer Science",
      "Economics",
      "Quantitative Finance",
      "Machine Learning",
      "Data Science",
      "Software Engineering",
      "Financial Engineering"
    ]
  }
}
</script>
```

Validation requirement:

- Run Google Rich Results Test.
- Run Schema Markup Validator.
- Ensure no fatal structured-data errors.

---

### 3. Homepage Content Requirements

The homepage must include visible, crawlable text. Avoid having the whole site rely only on canvas animations, images, or JavaScript-rendered visual elements.

Add this content somewhere visible:

```html
<h1>Ajai Upadhyaya</h1>
<p>
  I’m Ajai Upadhyaya, a Computer Science and Economics graduate from the University of Virginia building projects in quantitative finance, machine learning, data science, economics, and creative computing.
</p>
```

Add links to important internal pages:

```html
<a href="/projects">Projects</a>
<a href="/about">About</a>
<a href="/writing">Writing</a>
<a href="/resume">Resume</a>
<a href="/contact">Contact</a>
```

Each major page should mention “Ajai Upadhyaya” naturally at least once.

---

### 4. Create or Update Key Pages

Create these pages if they do not exist:

```txt
/
/about
/projects
/resume
/contact
/writing
```

Recommended title tags:

```txt
/         -> Ajai Upadhyaya | Official Website
/about    -> About Ajai Upadhyaya
/projects -> Projects | Ajai Upadhyaya
/resume   -> Resume | Ajai Upadhyaya
/contact  -> Contact Ajai Upadhyaya
/writing  -> Writing | Ajai Upadhyaya
```

Recommended meta descriptions:

```txt
/about:
About Ajai Upadhyaya, a Computer Science and Economics graduate from the University of Virginia focused on quantitative finance, machine learning, and software engineering.

/projects:
Technical projects by Ajai Upadhyaya across quantitative finance, machine learning, data science, creative computing, and software engineering.

/resume:
Resume of Ajai Upadhyaya, including experience in software development, financial operations, data analysis, economics, and technical projects.

/contact:
Contact Ajai Upadhyaya for projects, research, technical work, and professional opportunities.

/writing:
Writing and research notes by Ajai Upadhyaya on quantitative finance, economics, machine learning, data science, and technology.
```

---

### 5. Add `robots.txt`

Create:

```txt
/public/robots.txt
```

Contents:

```txt
User-agent: *
Allow: /

Sitemap: https://ajaiupadhyaya.com/sitemap.xml
```

Acceptance check:

```bash
curl https://ajaiupadhyaya.com/robots.txt
```

Expected: file loads publicly.

---

### 6. Add `sitemap.xml`

If using Next.js, Astro, Vite, or another framework, either generate this automatically or create it manually.

Minimum sitemap:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://ajaiupadhyaya.com/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://ajaiupadhyaya.com/about</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://ajaiupadhyaya.com/projects</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://ajaiupadhyaya.com/resume</loc>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://ajaiupadhyaya.com/contact</loc>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://ajaiupadhyaya.com/writing</loc>
    <priority>0.6</priority>
  </url>
</urlset>
```

Acceptance check:

```bash
curl https://ajaiupadhyaya.com/sitemap.xml
```

Expected: sitemap loads publicly and includes canonical URLs.

---

### 7. Add `site.webmanifest`

Create:

```txt
/public/site.webmanifest
```

Contents:

```json
{
  "name": "Ajai Upadhyaya",
  "short_name": "Ajai",
  "description": "Official website of Ajai Upadhyaya.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#111111"
}
```

Add to `<head>`:

```html
<link rel="manifest" href="/site.webmanifest">
```

---

### 8. Add a Human-Readable Resume Page

Do not only link a PDF. Create an actual HTML resume page at:

```txt
/resume
```

It should include crawlable text for:

- Ajai Upadhyaya
- University of Virginia
- Computer Science
- Economics
- Quantitative finance
- Machine learning
- Data science
- Software engineering
- VITA
- Specialized Bicycling Components
- UVA Libraries
- Virginia Museum of Fine Arts

Also include a PDF download link if desired:

```html
<a href="/Ajai-Upadhyaya-Resume.pdf">Download PDF Resume</a>
```

---

### 9. Add Project Pages With Indexable Text

For each major project, create a dedicated page with:

- Project title
- One-sentence summary
- Longer explanation
- Tools/stack
- Screenshots if available
- GitHub/demo links
- What Ajai built/learned

Recommended project page slugs:

```txt
/projects/quant-finance-system
/projects/nba-stats-library
/projects/raspberry-pi-family-node
/projects/personal-website
/projects/private-credit-dashboard
```

Each page should use a title like:

```txt
Quant Finance Research System | Ajai Upadhyaya
```

---

### 10. Add Backlinks From Existing Profiles

This is not code, but it is essential.

Update these profiles to link to `https://ajaiupadhyaya.com`:

- LinkedIn profile website field
- GitHub profile website field
- GitHub profile README
- GitHub repo descriptions
- Resume PDF header
- Any portfolio/project documentation
- Any personal bio pages
- Any UVA-related pages if applicable

Use consistent naming:

```txt
Ajai Upadhyaya
Official website: https://ajaiupadhyaya.com
```

---

## Framework-Specific Notes

### If Site Uses Next.js App Router

Use `metadata` in `app/layout.tsx` or page-level metadata.

Example:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://ajaiupadhyaya.com"),
  title: {
    default: "Ajai Upadhyaya | Official Website",
    template: "%s | Ajai Upadhyaya",
  },
  description:
    "Official website of Ajai Upadhyaya — Computer Science and Economics graduate focused on quantitative finance, machine learning, data science, and software engineering.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "profile",
    url: "https://ajaiupadhyaya.com/",
    title: "Ajai Upadhyaya | Official Website",
    description:
      "Projects, writing, research, and technical work by Ajai Upadhyaya.",
    siteName: "Ajai Upadhyaya",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ajai Upadhyaya | Official Website",
    description:
      "Projects, writing, research, and technical work by Ajai Upadhyaya.",
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

Add JSON-LD in the homepage component:

```tsx
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  name: "Ajai Upadhyaya | Official Website",
  url: "https://ajaiupadhyaya.com/",
  mainEntity: {
    "@type": "Person",
    name: "Ajai Upadhyaya",
    url: "https://ajaiupadhyaya.com/",
    sameAs: [
      "https://www.linkedin.com/in/REPLACE_WITH_REAL_LINKEDIN",
      "https://github.com/REPLACE_WITH_REAL_GITHUB",
    ],
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "University of Virginia",
    },
    knowsAbout: [
      "Computer Science",
      "Economics",
      "Quantitative Finance",
      "Machine Learning",
      "Data Science",
      "Software Engineering",
    ],
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <h1>Ajai Upadhyaya</h1>
        <p>
          I’m Ajai Upadhyaya, a Computer Science and Economics graduate from
          the University of Virginia building projects in quantitative finance,
          machine learning, data science, economics, and creative computing.
        </p>
      </main>
    </>
  );
}
```

Create sitemap in `app/sitemap.ts`:

```tsx
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://ajaiupadhyaya.com";

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resume`,
      lastModified: new Date(),
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      priority: 0.6,
    },
    {
      url: `${baseUrl}/writing`,
      lastModified: new Date(),
      priority: 0.6,
    },
  ];
}
```

Create robots in `app/robots.ts`:

```tsx
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://ajaiupadhyaya.com/sitemap.xml",
  };
}
```

---

## SEO Audit Script

Add this script as:

```txt
scripts/seo-audit.mjs
```

```js
import fs from "node:fs/promises";
import { execSync } from "node:child_process";

const SITE = "https://ajaiupadhyaya.com";
const URLS = [
  `${SITE}/`,
  `${SITE}/about`,
  `${SITE}/projects`,
  `${SITE}/resume`,
  `${SITE}/contact`,
  `${SITE}/writing`,
  `${SITE}/robots.txt`,
  `${SITE}/sitemap.xml`,
];

async function checkUrl(url) {
  const res = await fetch(url, { redirect: "manual" });
  return {
    url,
    status: res.status,
    contentType: res.headers.get("content-type"),
  };
}

async function main() {
  console.log(`Running SEO checks for ${SITE}\n`);

  const results = [];
  for (const url of URLS) {
    try {
      results.push(await checkUrl(url));
    } catch (err) {
      results.push({ url, error: err.message });
    }
  }

  console.table(results);

  console.log("\nRunning Lighthouse if available...\n");
  try {
    execSync(`npx lighthouse ${SITE} --quiet --chrome-flags="--headless" --output=json --output-path=./lighthouse-seo.json`, {
      stdio: "inherit",
    });
    console.log("Lighthouse report saved to lighthouse-seo.json");
  } catch {
    console.log("Lighthouse failed or is not installed. Run manually with: npx lighthouse https://ajaiupadhyaya.com --view");
  }

  await fs.writeFile("seo-url-checks.json", JSON.stringify(results, null, 2));
  console.log("URL checks saved to seo-url-checks.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Add to `package.json`:

```json
{
  "scripts": {
    "seo:audit": "node scripts/seo-audit.mjs",
    "seo:lighthouse": "npx lighthouse https://ajaiupadhyaya.com --view"
  }
}
```

---

## Local Testing Checklist

Run:

```bash
npm run build
npm run lint
npm run seo:audit
npx lighthouse https://ajaiupadhyaya.com --view
```

Check:

- Homepage has exactly one `<h1>` containing “Ajai Upadhyaya”.
- Every page has a unique `<title>`.
- Every page has a meta description.
- Site is not blocked by `robots.txt`.
- `/sitemap.xml` loads.
- `/robots.txt` loads.
- Canonical URL points to HTTPS domain.
- JSON-LD is valid.
- Lighthouse SEO score is 90+.
- Lighthouse performance score is preferably 80+.
- No broken internal links.

Optional crawl tool:

```bash
npx linkinator https://ajaiupadhyaya.com --recurse
```

---

## Google Search Console Tasks

After deployment:

1. Add property for `ajaiupadhyaya.com`.
2. Verify ownership via DNS TXT record or HTML file.
3. Submit sitemap:

```txt
https://ajaiupadhyaya.com/sitemap.xml
```

4. Use URL Inspection for:

```txt
https://ajaiupadhyaya.com/
https://ajaiupadhyaya.com/about
https://ajaiupadhyaya.com/projects
https://ajaiupadhyaya.com/resume
```

5. Request indexing for each important URL.
6. After indexing, monitor:

```txt
Performance > Search results > Queries > “Ajai Upadhyaya”
```

---

## Manual Off-Site SEO Tasks

The coding agent may not be able to do these, but they matter.

Update LinkedIn:

```txt
Website: https://ajaiupadhyaya.com
Headline/bio should use the exact name “Ajai Upadhyaya”.
```

Update GitHub:

```txt
Profile website: https://ajaiupadhyaya.com
Profile README should link to the domain.
```

Update resume PDF:

```txt
Header should include: ajaiupadhyaya.com
```

Update GitHub repo descriptions:

```txt
Built by Ajai Upadhyaya — more at https://ajaiupadhyaya.com
```

---

## Avoid

Do not:

- Keyword stuff “Ajai Upadhyaya” unnaturally.
- Buy backlinks.
- Hide text.
- Generate fake pages.
- Block crawlers with JavaScript-only navigation.
- Use multiple canonical URLs for the same page.
- Redirect the root domain incorrectly.
- Serve different content to Googlebot than users.

---

## Final Acceptance Criteria

The job is complete when:

- `https://ajaiupadhyaya.com` loads quickly and correctly.
- The homepage title includes “Ajai Upadhyaya”.
- The homepage has visible text identifying Ajai Upadhyaya.
- Person/ProfilePage JSON-LD is present and valid.
- `/robots.txt` exists and allows crawling.
- `/sitemap.xml` exists and lists all important pages.
- All major pages have unique titles and descriptions.
- Google Search Console is connected.
- Sitemap is submitted.
- Important URLs are requested for indexing.
- LinkedIn and GitHub link back to the personal site.

---

## Priority Order

1. Homepage metadata and visible name/content.
2. JSON-LD structured data.
3. Sitemap and robots.txt.
4. About/projects/resume pages.
5. Search Console submission.
6. Backlinks from LinkedIn/GitHub/resume.
7. Performance and broken-link cleanup.

