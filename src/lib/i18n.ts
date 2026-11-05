// Static-export-friendly bilingual (English / Arabic) layer.
//
// There is no routing or server negotiation: BOTH languages are rendered into
// the HTML, and CSS (globals.css) shows only the active one based on the
// <html data-lang="en|ar"> attribute, which a tiny inline script in <head>
// sets before paint. A user's toggle choice is saved in localStorage.
//
// UI strings live in DICT below. Content entries (Markdown front-matter) carry
// their own optional *_ar fields and are rendered with <Bi en={..} ar={..}/>.

export type Lang = "en" | "ar";

export const LANGS: Lang[] = ["en", "ar"];
export const RTL_LANGS = new Set<Lang>(["ar"]);

// Every UI string, keyed. Arabic for hero, about, research, section headings,
// nav, buttons, chat. Organisation / programme names stay in Latin script.
export const DICT: Record<string, { en: string; ar: string }> = {
  // Nav
  "nav.about": { en: "About", ar: "نبذة" },
  "nav.track": { en: "Track record", ar: "السجل" },
  "nav.awards": { en: "Awards", ar: "الجوائز" },
  "nav.climatrix": { en: "ClimatrixAI", ar: "ClimatrixAI" },
  "nav.projects": { en: "Projects", ar: "المشاريع" },
  "nav.experience": { en: "Experience", ar: "الخبرة" },
  "nav.skills": { en: "Skills", ar: "المهارات" },
  "nav.credentials": { en: "Credentials", ar: "المؤهلات" },
  "nav.publications": { en: "Publications", ar: "المنشورات" },
  "nav.blog": { en: "Blog", ar: "المدوّنة" },
  "nav.contact": { en: "Contact", ar: "تواصل" },
  "nav.menu": { en: "Menu", ar: "القائمة" },

  // Buttons / common
  "btn.book": { en: "Book a call", ar: "احجز مكالمة" },
  "btn.bookUmar": { en: "Book a call with Umar", ar: "احجز مكالمة مع عمر" },
  "btn.getInTouch": { en: "Get in touch", ar: "تواصل معنا" },
  "btn.email": { en: "Email", ar: "البريد" },
  "btn.allStories": { en: "All stories", ar: "كل المقالات" },
  "btn.requestDemo": { en: "Request a live demo", ar: "اطلب عرضًا مباشرًا" },
  "btn.source": { en: "Source", ar: "المصدر" },
  "common.theme": { en: "Toggle theme", ar: "تبديل المظهر" },
  "common.phone": { en: "Phone", ar: "الهاتف" },
  "common.company": { en: "Company", ar: "الشركة" },

  // Hero
  "hero.badge": { en: "Founder & Chief AI Officer, ClimatrixAI", ar: "المؤسس ورئيس الذكاء الاصطناعي، ClimatrixAI" },
  "hero.h1a": { en: "Umar Fahm builds", ar: "عمر فهم يبني" },
  "hero.h1b": { en: "climate intelligence", ar: "ذكاءً مناخيًا" },
  "hero.h1c": { en: "for the next billion.", ar: "للمليار القادم." },
  "hero.recognizedBy": { en: "Recognized by", ar: "باعتراف من" },
  "hero.statAwards": { en: "Awards & recognitions since 2025", ar: "جوائز وتكريمات منذ 2025" },
  "hero.statProgrammes": { en: "Global programmes & accelerators", ar: "برامج ومسرّعات عالمية" },
  "hero.statPatent": { en: "Provisional patent", ar: "براءة اختراع مؤقتة" },
  "hero.statCountries": { en: "Countries recognised in", ar: "دول نال فيها اعترافًا" },

  // About
  "about.role": { en: "Founder & Chief AI Officer", ar: "المؤسس ورئيس الذكاء الاصطناعي" },
  "about.loc": { en: "Nigeria · working globally", ar: "نيجيريا · يعمل عالميًا" },
  "about.body": {
    en: "Umar (Salafy) turns satellite data into physics-based climate risk scores that people can check, with an agentic AI layer on top. ClimatrixAI was named one of UNICEF's top 5 climate ventures in emerging markets, the only one from Africa. He graduated First Class as Best Graduating Student in his faculty.",
    ar: "يحوّل عمر (سلفي) بيانات الأقمار الصناعية إلى درجات مخاطر مناخية قائمة على الفيزياء يمكن التحقق منها، مع طبقة ذكاء اصطناعي وكيلة فوقها. اختيرت ClimatrixAI ضمن أفضل 5 مشاريع مناخية لليونيسف في الأسواق الناشئة، وهي الوحيدة من أفريقيا. تخرّج بامتياز وكأفضل خريج في كليته.",
  },

  // Research profile
  "research.title": { en: "Research", ar: "البحث" },
  "research.sub": { en: "Profile and research interests.", ar: "النبذة والاهتمامات البحثية." },

  // Section titles / subs
  "track.title": { en: "Track", ar: "السجل" },
  "track.accent": { en: "record", ar: "المهني" },
  "track.sub": { en: "Awards, programmes and milestones, newest first.", ar: "جوائز وبرامج ومحطات، الأحدث أولًا." },
  "awards.title": { en: "Awards", ar: "الجوائز" },
  "awards.accent": { en: "& recognition", ar: "والتكريم" },
  "projects.title": { en: "Projects", ar: "المشاريع" },
  "projects.sub": { en: "Completed and in progress, with photos and video overviews.", ar: "مكتملة وقيد التنفيذ، مع صور ومقاطع فيديو." },
  "skills.title": { en: "Skills", ar: "المهارات" },
  "skills.sub": { en: "Languages, hardware, AI and the tools behind the work.", ar: "لغات وعتاد وذكاء اصطناعي والأدوات وراء العمل." },
  "climatrix.title": { en: "ClimatrixAI", ar: "ClimatrixAI" },
  "climatrix.how": { en: "How ClimatrixAI works", ar: "كيف تعمل ClimatrixAI" },
  "contact.heading1": { en: "Building for climate risk?", ar: "تبني حلولًا لمخاطر المناخ؟" },
  "contact.heading2": { en: "Let's talk.", ar: "لنتحدث." },
  "contact.body": { en: "Investors, grant committees, governments, press and founders. Pick a time, or just send an email.", ar: "مستثمرون، لجان مِنَح، حكومات، صحافة ومؤسسون. اختر وقتًا، أو أرسل بريدًا." },

  // Pipeline steps
  "pipe.data": { en: "Satellite & sensor data", ar: "بيانات الأقمار والمستشعرات" },
  "pipe.physics": { en: "Physics engine", ar: "محرّك الفيزياء" },
  "pipe.agentic": { en: "Agentic AI layer", ar: "طبقة الذكاء الوكيل" },
  "pipe.alerts": { en: "Alerts & decisions", ar: "تنبيهات وقرارات" },
  "pipe.dataD": { en: "Earth observation and local sensors, per location.", ar: "رصد الأرض ومستشعرات محلية، لكل موقع." },
  "pipe.physicsD": { en: "Stated rules turn that data into a risk score.", ar: "قواعد معلنة تحوّل البيانات إلى درجة مخاطر." },
  "pipe.agenticD": { en: "Agents explain the score in plain language.", ar: "وكلاء يشرحون الدرجة بلغة واضحة." },
  "pipe.alertsD": { en: "Residents and authorities get what to do next.", ar: "يعرف السكان والجهات الخطوة التالية." },
  "pipe.hardware": { en: "Hardware & products", ar: "العتاد والمنتجات" },

  // Chat assistant
  "chat.open": { en: "Work with Umar", ar: "اعمل مع عمر" },
  "chat.title": { en: "Umar's assistant", ar: "مساعد عمر" },
  "chat.subtitle": { en: "Ask about Umar, invest, press or book a call", ar: "اسأل عن عمر، الاستثمار، الصحافة أو احجز مكالمة" },
  "chat.placeholder": { en: "Type a message…", ar: "اكتب رسالة…" },
  "chat.send": { en: "Send", ar: "إرسال" },
  "chat.close": { en: "Close", ar: "إغلاق" },
  "chat.privacy": { en: "Details you share here go to Umar.", ar: "التفاصيل التي تشاركها هنا تصل إلى عمر." },
  "chat.booking": { en: "Book a call", ar: "احجز مكالمة" },
  "chat.q1": { en: "Who is Umar?", ar: "من هو عمر؟" },
  "chat.q2": { en: "Invest / partner", ar: "استثمار / شراكة" },
  "chat.q3": { en: "Press", ar: "صحافة" },
  "chat.q4": { en: "Book a call", ar: "احجز مكالمة" },
  "chat.thinking": { en: "Thinking…", ar: "جارٍ التفكير…" },

  // Footer
  "footer.sitemap": { en: "Sitemap", ar: "خريطة الموقع" },
  "footer.rights": { en: "Umar Fahm (Salafy) · ClimatrixAI", ar: "عمر فهم (سلفي) · ClimatrixAI" },

  // Not found
  "nf.title": { en: "Page not found", ar: "الصفحة غير موجودة" },
  "nf.body": { en: "That page moved or never existed.", ar: "هذه الصفحة انتقلت أو لم تكن موجودة." },
  "nf.home": { en: "Back home", ar: "العودة للرئيسية" },
};

export function t(key: string, lang: Lang): string {
  const e = DICT[key];
  if (!e) return key;
  return e[lang] || e.en;
}

// Inline script that applies the saved / detected language + theme before paint
// to avoid a flash. Injected once in <head>. Pure string (no React).
export const PRE_PAINT_SCRIPT = `
(function(){try{
  var d=document.documentElement;
  // Theme
  var th=localStorage.getItem('theme');
  if(!th){th=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}
  d.setAttribute('data-theme',th);
  // Language: the visitor's own choice (asked on first visit), else English.
  var lg=localStorage.getItem('lang');
  if(lg!=='ar'){lg='en';}
  d.setAttribute('data-lang',lg);d.setAttribute('lang',lg);d.setAttribute('dir',lg==='ar'?'rtl':'ltr');
  // Arabic text is swapped in after load; never keep the page hidden for long.
  if(lg==='ar'){setTimeout(function(){d.setAttribute('data-i18n','ready');},2500);}else{d.setAttribute('data-i18n','ready');}
}catch(e){}})();
`;
