# Umar Fahm (Salafy) — personal site

Next.js 15 + Tailwind. Every piece of content is a Markdown file in `/content`.
Add a file, the site updates. No design code to touch.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

## Add an update (under 1 minute)

Create `content/updates/2026-11-10-my-update.md`:

```md
---
date: "2026-11-10"
tag: "PILOT"          # LAUNCH, PILOT, AWARD, GRANT, TALK, PRESS, PRODUCT, FIELD, LOG
links:
  - label: "Read more"
    url: "https://example.com"
media:
  - type: image
    src: "/media/my-photo.jpg"
---
One or two lines about what happened.
```

It shows at the top of the Updates log and in the RSS feed at `/rss.xml`.

## Add an achievement (under 2 minutes)

Create `content/achievements/2026-my-award.md`:

```md
---
title: "Award name"
date: "2026-11-10"
location: "Lagos, Nigeria"
lat: 6.52            # adds a pin on the field map
lng: 3.38
tags: [Award]
metrics:
  - label: "Applicants"
    value: "1,200"
media:
  - type: image          # image | video | youtube | vimeo
    src: "/media/award.jpg"
    alt: "Receiving the award"
  - type: youtube
    src: "VIDEO_ID"      # the part after watch?v=
links:
  - label: "Announcement"
    url: "https://example.com"
---
One paragraph: what it was, why it mattered, what changed after.
```

It appears in the Track record timeline, on the field map, and its photos join the Media gallery.

Put images in `public/media/` and reference them as `/media/file.jpg`.

## Other content folders

| Folder | Shows in |
| --- | --- |
| `content/projects/` | Projects. `status: "Completed"` or `"In progress"` drives the filter tabs. Add an `image` plus a `youtube`/`vimeo`/`video` media item to get a "Video overview" button. |
| `content/experience/` | Work experience (`role`, `org`, `start`, `end: "Present"`, `highlights` list) |
| `content/awards/` | Awards & recognition (`level`: Winner, Finalist, Fellow…) |
| `content/certifications/` | Certifications (`credential_id`, `url` = verify link) |
| `content/education/` | Education (`kind`: Degree, Diploma, Exam) |
| `content/publications/` | Publications (`type`: Paper, Report, Article, Talk, Patent) |
| `content/memberships/` | Memberships |
| `content/testimonials/` | Testimonials. Only use words the person agreed to share. |
| `content/proof/` | Proof wall (`kind`: Grant, Program, Pilot, Patent, Press, Partner) |
| `content/blog/` | Stories section + `/blog` (Markdown body, `linkedin` / `twitter` post links) |
| `content/social/` | Socials feed (see below) |
| `content/media/gallery.md` | Media gallery and videos |

## Country and flag

Every entry has a `country` field. Type a country name and its flag appears next to it everywhere on the site.

```md
country: "Nigeria"            # any country name, e.g. "United Kingdom", "Rwanda"
country: "Nigeria, Ghana"     # several countries
country: "Global"             # or "Africa" for pan-African or online: shows a globe
```

Short forms work too: `UK`, `USA`, `UAE`, `Cabo Verde`, `Ivory Coast`. In `/admin` it is a searchable dropdown.
Flags come from `country-flag-icons` (MIT) and are copied into `public/flags` on install, dev and build.

## Award images

Award cards use the first image in the matching achievement's `media`. Use your own event photo where you can.
For a logo, set `fit: "contain"` so the whole logo shows on a light tile.
With no image, the card shows a tile with the result (e.g. "Top 10") over that country's flag.

## Socials feed (LinkedIn + X)

LinkedIn and X do not give personal sites a free API to pull your posts automatically. So each post is one small file (or one form in `/admin` → Social posts) holding the post link:

```md
---
platform: "linkedin"   # or "x"
date: "2026-11-10"
url: "https://www.linkedin.com/posts/farouqfahm_...-activity-7254321098765432109-AbCd"
---
```

The site turns that link into the official LinkedIn or X embed. On LinkedIn use "… → Copy link to post"; on X use "Share → Copy link".

## Lead agent → Boardy

The "Work with Umar" button opens a short guided chat. It asks who the visitor is, what they need, their organisation, name, email and timeline, then:

1. Sends the lead to you, scored Hot / Warm / Cool (same answers always give the same score).
2. Offers "Book a time on Boardy" → your calendar at `cal.boardy.ai/farouqfahm`.
3. Offers "Ask Boardy for a warm intro" → a ready email to `boardy@boardy.ai` that the visitor reviews and sends from their own inbox. Boardy has no public API, and nothing reaches Boardy without the visitor sending it.

Where leads go:

- **Production:** set `LEAD_WEBHOOK_URL` in your host's environment variables. Point it at a Zapier/Make/n8n webhook, a Google Sheet, or a Slack incoming webhook (the payload includes a ready `text` line for Slack). Without it, leads are only logged.
- **Local dev:** leads are also saved to `.leads/leads.jsonl` (gitignored).

The endpoint `/api/leads` is public by design (visitors post to it). It validates every field, caps lengths, has a hidden honeypot field for bots and allows 5 requests per IP per 10 minutes.

Contact links, email, booking link and X handle live in `src/lib/site.ts`.

Any text containing `[REPLACE]` is shown highlighted in amber, so placeholders are never mistaken for real claims.

## Post from your phone: `/admin`

`/admin` runs [Decap CMS](https://decapcms.org): forms with image upload, video links and text. Saving commits a Markdown file to the repo, which redeploys the site.

One-time setup (Netlify, free tier):

1. Push this folder to a GitHub repo.
2. Import the repo in Netlify (build command `npm run build`).
3. Netlify → Site configuration → Identity → Enable. Set Registration to **Invite only**.
4. Identity → Services → enable **Git Gateway**.
5. Invite your own email. Accept the invite, set a password.
6. Open `https://your-site/admin/` on your phone and log in.

Only invited users can log in, so `/admin` is password protected.
Hosting on Vercel instead? Change `backend` in `public/admin/config.yml` to `github` and add a GitHub OAuth provider.

Edit locally without login: run `npx decap-server` next to `npm run dev`, then open `http://localhost:3000/admin/`.

## Notes

- The ClimatrixAI risk dashboard is an **illustrative demo** with simple, stated rules and sample sites. It is labelled as such on the page. Replace it with real outputs when ready (`src/components/RiskDemo.tsx`).
- Fonts load through `next/font` (Inter, JetBrains Mono).
