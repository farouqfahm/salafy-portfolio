import Hero from "@/components/Hero";
import TrackRecord from "@/components/TrackRecord";
import Climatrix from "@/components/Climatrix";
import ProofWall from "@/components/ProofWall";
import Gallery from "@/components/Gallery";
import Projects from "@/components/Projects";
import Socials from "@/components/Socials";
import Skills from "@/components/Skills";
import Research from "@/components/Research";
import Recognizers from "@/components/Recognizers";
import WorldMap from "@/components/WorldMap";
import Bi from "@/components/Bi";
import { Section } from "@/components/ui";
import { BlogPreview, Contact, Updates } from "@/components/Sections";
import {
  Awards,
  Certifications,
  EducationList,
  Memberships,
  Publications,
  Testimonials,
  WorkExperience,
} from "@/components/Profile";
import {
  type Award,
  getAchievements,
  getAwards,
  getBlogPosts,
  getCertifications,
  getEducation,
  getExperience,
  getMediaItems,
  getMemberships,
  getProjects,
  getProof,
  getPublications,
  getRecognisedCountries,
  getRecognizers,
  getResearchProfile,
  getShowcase,
  getSkills,
  getSocialPosts,
  getTestimonials,
  getUpdates,
} from "@/lib/content";

export default function Home() {
  const achievements = getAchievements();
  const projects = getProjects();
  const research = getResearchProfile();
  const recognisedCountries = getRecognisedCountries();

  // Awards = anything in /content/awards + every achievement tagged "Award" or "Recognition".
  const awards: Award[] = [
    ...getAwards(),
    ...achievements
      .filter((a) => a.tags.some((t) => t === "Award" || t === "Recognition"))
      .map((a) => ({
        slug: a.slug,
        title: a.title,
        titleAr: a.titleAr,
        org: a.org,
        date: a.date,
        level: a.level,
        country: a.country,
        url: a.links[0]?.url || "",
        image: a.media.find((m) => m.type === "image")?.src || "",
        imageFit: a.media.find((m) => m.type === "image")?.fit || "cover",
        note: "",
        featured: a.featured,
      })),
  ]
    // Highlights first, then newest first
    .sort((x, y) => Number(!!y.featured) - Number(!!x.featured) || y.date.localeCompare(x.date));

  // Gallery = dedicated media + photos attached to achievements and projects (logos excluded)
  const media = [
    ...getMediaItems(),
    ...achievements.flatMap((a) => a.media),
    ...projects.flatMap((p) => p.media),
  ].filter((m, i, all) => m.type !== "image" || (m.fit !== "contain" && all.findIndex((x) => x.src === m.src) === i));

  const stats = {
    awards: awards.length,
    programmes: achievements.filter((a) => a.tags.includes("Program")).length,
    countries: recognisedCountries.length,
  };

  return (
    <>
      <Hero stats={stats} research={research} />
      <Recognizers items={getRecognizers()} />
      <Research profile={research} />
      <TrackRecord items={achievements} />
      <Awards items={awards} />
      <WorldMap codes={recognisedCountries} />
      <Climatrix showcase={getShowcase()} />
      <Section id="projects" title={<Bi k="projects.title" />} sub={<Bi k="projects.sub" />}>
        <Projects items={projects} />
      </Section>
      <Skills items={getSkills()} />
      <WorkExperience items={getExperience()} />
      <ProofWall items={getProof()} />
      <Certifications items={getCertifications()} />
      <EducationList items={getEducation()} />
      <Publications items={getPublications()} />
      <Memberships items={getMemberships()} />
      <Testimonials items={getTestimonials()} />
      <Section id="media" title={<Bi en="Media" ar="الوسائط" />} accent={<Bi en="& talks" ar="ولقاءات" />} sub={<Bi en="Photos, videos and talk clips. Click a photo to enlarge." ar="صور ومقاطع فيديو ولقطات. انقر صورة لتكبيرها." />}>
        <Gallery items={media} />
      </Section>
      <Updates items={getUpdates()} />
      <BlogPreview items={getBlogPosts()} />
      <Section id="socials" title={<Bi en="Socials" ar="الشبكات" />} sub={<Bi en="Latest from LinkedIn and X." ar="آخر ما على LinkedIn وX." />}>
        <Socials items={getSocialPosts()} />
      </Section>
      <Contact />
    </>
  );
}
