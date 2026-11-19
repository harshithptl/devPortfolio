// Renders the site's HTML pages from content.json, the single source of
// truth for everything the site says (and what the resume should match).
//
//   npm run build:html     regenerate index.html and clearline.html
//   npm run check          fail if generated HTML is stale or any page has an em dash
//
// Generated pages are committed: Netlify serves the repo as static files,
// so no build step runs on deploy.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { architecture, settlementFlow } from './diagrams.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const c = JSON.parse(readFileSync(join(root, 'content.json'), 'utf8'));
const id = c.identity;

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const list = (items, cls = '') => `<ul class="${cls}">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
const chips = (items) => `<div class="skills">${items.map((i) => `<div class="skills__skill">${esc(i)}</div>`).join('')}</div>`;
const ext = (href, label, cls) =>
  `<a href="${esc(href)}" class="${cls}" target="_blank" rel="noreferrer">${esc(label)}</a>`;

function head(title, description) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="ie=edge" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="icon" type="image/png" sizes="32x32" href="./assets/png/logo.png" />
  <link rel="stylesheet" href="./css/style.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700;900&display=swap" rel="stylesheet" />
</head>
<body>
<!-- Generated from content.json by scripts/build.mjs. Edit content.json, then run npm run build:html. -->`;
}

const navItems = [
  ['Home', './index.html'],
  ['About', './index.html#about'],
  ['Clearline', './index.html#featured'],
  ['Experience', './index.html#experience'],
  ['Projects', './index.html#projects'],
  ['Contact', './index.html#contact'],
];

function header() {
  const links = navItems
    .map(([l, h]) => `<li class="header__link-wrapper"><a href="${h}" class="header__link">${l}</a></li>`)
    .join('');
  const sm = navItems.map(([l, h]) => `<li class="header__sm-menu-link"><a href="${h}">${l}</a></li>`).join('');
  return `
<header class="header">
  <div class="header__content">
    <div class="header__logo-container">
      <div class="header__logo-img-cont">
        <img src="./assets/png/profile-photo.png" alt="${esc(id.name)}" class="header__logo-img" />
      </div>
      <span class="header__logo-sub">${esc(id.name)}</span>
    </div>
    <div class="header__main">
      <ul class="header__links">${links}</ul>
      <div class="header__main-ham-menu-cont">
        <img src="./assets/svg/ham-menu.svg" alt="hamburger menu" class="header__main-ham-menu" />
        <img src="./assets/svg/ham-menu-close.svg" alt="hamburger menu close" class="header__main-ham-menu-close d-none" />
      </div>
    </div>
  </div>
  <div class="header__sm-menu"><div class="header__sm-menu-content"><ul class="header__sm-menu-links">${sm}</ul></div></div>
</header>`;
}

function socials(cls, iconCls) {
  return [
    [id.linkedin, 'linkedin-ico.png', 'LinkedIn'],
    [id.github, 'github-ico.png', 'GitHub'],
    [`mailto:${id.email}`, 'mailbox-icon.png', 'Email'],
  ]
    .map(
      ([href, icon, alt]) =>
        `<a href="${esc(href)}" class="${cls}" target="_blank" rel="noreferrer"><img src="./assets/png/${icon}" alt="${alt}" class="${iconCls}" /></a>`,
    )
    .join('\n');
}

function footer() {
  return `
<footer class="main-footer">
  <div class="main-container">
    <div class="main-footer__upper">
      <div class="main-footer__row main-footer__row-1">
        <h2 class="heading heading-sm main-footer__heading-sm"><span>Social</span></h2>
        <div class="main-footer__social-cont">${socials('', 'main-footer__icon')}</div>
      </div>
      <div class="main-footer__row main-footer__row-2">
        <h4 class="heading heading-sm text-lt">${esc(id.name)}</h4>
        <p class="main-footer__short-desc">${esc(id.headline)}. ${esc(id.location)}. ${esc(id.availability)}</p>
      </div>
    </div>
    <div class="main-footer__lower">
      &copy; ${new Date().getFullYear()}. Built by <a rel="noreferrer" target="_blank" href="${esc(id.github)}">${esc(id.name)}</a>.
      Template credits to <a rel="noreferrer" target="_blank" href="https://rammaheshwari.com">Ram Maheshwari</a>.
    </div>
  </div>
</footer>
<script src="./index.js"></script>
</body>
</html>
`;
}

function archFlow(steps, note) {
  const items = steps
    .map((s, i) => `<li class="arch__step${s.startsWith('Kafka') ? ' arch__step--topic' : ''}">${esc(s)}</li>${i < steps.length - 1 ? '<li class="arch__arrow" aria-hidden="true">&rarr;</li>' : ''}`)
    .join('');
  return `<ol class="arch" aria-label="Clearline architecture, in order">${items}</ol><p class="arch__note">${esc(note)}</p>`;
}

function stats(items) {
  return `<div class="stats">${items
    .map((s) => `<div class="stats__item"><div class="stats__value">${esc(s.value)}</div><div class="stats__label">${esc(s.label)}</div></div>`)
    .join('')}</div>`;
}

function context(text) {
  return `<p class="context-note"><strong>Measured on:</strong> ${esc(text)}</p>`;
}

function section(idAttr, cls, title, sub, body, light = false) {
  const lt = light ? ' heading-sec__main--lt' : '';
  const sublt = light ? ' heading-sec__sub--lt' : '';
  return `
<section id="${idAttr}" class="${cls} sec-pad">
  <div class="main-container">
    <h2 class="heading heading-sec heading-sec__mb-med">
      <span class="heading-sec__main${lt}">${esc(title)}</span>
      <span class="heading-sec__sub${sublt}">${esc(sub)}</span>
    </h2>
    ${body}
  </div>
</section>`;
}

function indexPage() {
  const cl = c.clearline;
  const hero = `
<section class="home-hero">
  <div class="home-hero__content">
    <h1 class="heading-primary">${esc(id.name)}</h1>
    <div class="home-hero__info">
      <p class="text-primary"><strong>${esc(id.headline)}</strong></p>
      <p class="text-primary home-hero__availability">${esc(id.availability)}</p>
    </div>
    <div class="home-hero__cta">
      <a href="${esc(id.resume)}" class="btn btn--bg" target="_blank" download>Download Resume</a>
    </div>
  </div>
  <div class="home-hero__socials">${socials('home-hero__social-icon-link', 'home-hero__social-icon')
    .split('\n')
    .map((a) => `<div class="home-hero__social">${a}</div>`)
    .join('')}</div>
  <div class="home-hero__mouse-scroll-cont"><div class="mouse"></div></div>
</section>`;

  const education = c.education
    .map(
      (e) => `
<div class="about__education-panel">
  <div class="about__education-panel-img"><img src="${esc(e.logo)}" alt="${esc(e.school)}" /></div>
  <div class="about__education-panel-details">
    <div class="about__education-panel-details-uni">${esc(e.school)}</div>
    <div class="about__education-panel-details-major">${esc(e.degree)}</div>
    ${e.coursework ? `<div class="about__education-coursework">Coursework: ${esc(e.coursework)}</div>` : ''}
  </div>
  <div class="about__education-panel-year">${esc(e.dates)}</div>
</div>`,
    )
    .join('');

  const about = section(
    'about',
    'about',
    'About Me',
    `${id.location}. ${id.availability}`,
    `<div class="about__content">
      <div class="about__content-main">
        <h3 class="about__content-title">Get to know me</h3>
        <div class="about__content-details">${c.bio.map((p) => `<p class="about__content-details-para">${esc(p)}</p>`).join('')}</div>
        <a href="#contact" class="btn btn--med btn--theme dynamicBgClr">Contact</a>
      </div>
      <div class="about__content-side">
        <div class="about__education"><h3 class="about__education-title">Education</h3>${education}</div>
      </div>
    </div>`,
  );

  const featured = section(
    'featured',
    'featured',
    'Featured: Clearline',
    cl.tagline,
    `<div class="featured__card">
      <p class="featured__summary">${esc(cl.summary)}</p>
      ${stats(cl.headlineStats)}
      ${context(cl.resultsContext)}
      ${archFlow(cl.architecture, cl.architectureNote)}
      <div class="featured__ctas">
        <a href="./clearline.html" class="btn btn--med btn--theme dynamicBgClr">Case Study</a>
        ${ext(cl.repo, 'Code on GitHub', 'btn btn--med btn--theme-inv')}
      </div>
    </div>`,
  );

  const jobs = c.experience
    .map(
      (job) => `
<div class="experience__row">
  <div class="experience__row-left">
    <div class="experience__row-company">${esc(job.company)}</div>
    ${job.roles.map((r) => `<div class="experience__row-role">${esc(r.title)} <span class="experience__row-dates">${esc(r.dates)}</span></div>`).join('')}
  </div>
  <div class="experience__row-right">
    <div class="experience__row-location"><em>${esc(job.location)}</em></div>
    ${job.note ? `<div class="experience__row-note">${esc(job.note)}</div>` : ''}
  </div>
  ${list(job.points, 'experience__row-points')}
</div>`,
    )
    .join('');
  const interns = `
<div class="interns">
  <h3 class="interns__title">Earlier internships</h3>
  <ul class="interns__list">${c.internships
    .map((i) => `<li><strong>${esc(i.company)}</strong>, ${esc(i.title)}, ${esc(i.dates)}. ${esc(i.summary)}</li>`)
    .join('')}</ul>
</div>`;
  const experience = section('experience', 'experience', 'Experience', 'Where I have worked.', `<div class="experience__content">${jobs}${interns}</div>`);

  const panels = c.projects
    .map(
      (p) => `
<div class="projects__panel">
  <h3 class="projects__panel-title">${esc(p.title)}</h3>
  <p class="projects__panel-sub">${esc(p.subtitle)}</p>
  ${list(p.points, 'projects__panel-points')}
  ${p.repo ? ext(p.repo, 'Code on GitHub', 'btn btn--med btn--theme dynamicBgClr projects__panel-btn') : ''}
</div>`,
    )
    .join('');
  const more = `<ul class="more-projects">${c.moreProjects
    .map((p) => `<li><a href="${esc(p.href)}">${esc(p.title)}</a>: ${esc(p.summary)}</li>`)
    .join('')}</ul>`;
  const projects = section('projects', 'projects', 'Other Projects', 'Systems work outside my day job.', `<div class="projects__content">${panels}</div><h3 class="more-projects__title">More</h3>${more}`);

  const skills = section(
    'skills',
    'skills-sec',
    'Skills',
    'What I work with.',
    `<div class="skill-groups">${c.skills.map((g) => `<div class="skill-groups__group"><h3 class="skill-groups__title">${esc(g.group)}</h3>${chips(g.items)}</div>`).join('')}</div>`,
  );

  const contact = `
<section id="contact" class="contact sec-pad dynamicBg">
  <div class="main-container">
    <h2 class="heading heading-sec heading-sec__mb-med">
      <span class="heading-sec__main heading-sec__main--lt">Contact</span>
      <span class="heading-sec__sub heading-sec__sub--lt">Email <a class="contact__email" href="mailto:${esc(id.email)}">${esc(id.email)}</a>, or send a message here.</span>
    </h2>
    <div class="contact__form-container">
      <form name="contact" method="POST" data-netlify="true" class="contact__form">
        <div class="contact__form-field"><label class="contact__form-label" for="name">Name</label>
          <input required placeholder="Enter Your Name" type="text" class="contact__form-input" name="name" id="name" /></div>
        <div class="contact__form-field"><label class="contact__form-label" for="email">Email</label>
          <input required placeholder="Enter Your Email" type="email" class="contact__form-input" name="email" id="email" /></div>
        <div class="contact__form-field"><label class="contact__form-label" for="message">Message</label>
          <textarea required cols="30" rows="10" class="contact__form-input" placeholder="Enter Your Message" name="message" id="message"></textarea></div>
        <button type="submit" class="btn btn--theme contact__btn">Submit</button>
      </form>
    </div>
  </div>
</section>`;

  return (
    head(`${id.name} | Software Engineer`, `${id.name}: ${id.headline}. ${id.availability}`) +
    header() + hero + about + featured + experience + projects + skills + contact + footer()
  );
}

function clearlinePage() {
  const cl = c.clearline;
  const body = `
<section class="project-cs-hero">
  <div class="project-cs-hero__content">
    <h1 class="heading-primary">${esc(cl.title)}</h1>
    <div class="project-cs-hero__info"><p class="text-primary">${esc(cl.tagline)}</p></div>
    <div class="project-cs-hero__cta">${ext(cl.repo, 'Code on GitHub', 'btn btn--bg')}</div>
  </div>
</section>
<section class="project-details">
  <div class="main-container">
    <div class="project-details__content">
      <div class="project-details__desc">
        <h3 class="project-details__content-title">What it is</h3>
        <p class="project-details__desc-para">${esc(cl.summary)}</p>
        <p class="project-details__desc-para">${esc(cl.meta)}</p>
      </div>
      <div class="project-details__desc cs-diagram">
        <h3 class="project-details__content-title">Architecture</h3>
        <figure class="diagram-figure">
          ${architecture(cl.diagram)}
          <figcaption>${esc(cl.diagram.caption)}</figcaption>
        </figure>
      </div>
      <div class="project-details__desc cs-diagram">
        <h3 class="project-details__content-title">Exactly-once settlement</h3>
        <figure class="diagram-figure">
          ${settlementFlow(cl.settleFlow)}
          <figcaption>One transaction per partition batch. The Kafka offset is committed only after COMMIT, so any crash means redelivery, and the dedupe insert makes redelivery harmless.</figcaption>
        </figure>
      </div>
      <div class="project-details__desc">
        <h3 class="project-details__content-title">Results</h3>
        ${stats(cl.headlineStats)}
        ${list(cl.results, 'cs-list')}
        ${context(cl.resultsContext)}
        <img class="cs-figure" src="${esc(cl.images.chart)}" alt="Order-to-ledger p99 against settled trades per second for the baseline and the two batching steps" loading="lazy" />
      </div>
      <div class="project-details__desc">
        <h3 class="project-details__content-title">Key engineering</h3>
        ${list(cl.engineering, 'cs-list')}
      </div>
      <div class="project-details__desc">
        <h3 class="project-details__content-title">Engineering stories</h3>
        ${cl.stories.map((s) => `<h4 class="cs-story__title">${esc(s.title)}</h4><p class="project-details__desc-para">${esc(s.text)}</p>`).join('')}
      </div>
      <div class="project-details__desc">
        <h3 class="project-details__content-title">Live dashboard</h3>
        <img class="cs-figure" src="${esc(cl.images.dashboard)}" alt="Clearline dashboard: live balances, order form and trade tape" loading="lazy" />
      </div>
      <div class="project-details__tools-used">
        <h3 class="project-details__content-title">Stack</h3>
        ${chips(cl.stack)}
        <p class="project-details__desc-para cs-scale">${esc(cl.scale)}</p>
      </div>
      <div class="project-details__links">
        <h3 class="project-details__content-title">See Code</h3>
        ${ext(cl.repo, 'Code on GitHub', 'btn btn--med btn--theme project-details__links-btn')}
      </div>
    </div>
  </div>
</section>`;
  return head(`${cl.title} | ${id.name}`, `${cl.title}: ${cl.tagline}`) + header() + body + footer();
}

const pages = { 'index.html': indexPage(), 'clearline.html': clearlinePage() };
const checkOnly = process.argv.includes('--check');
let failed = false;
for (const [file, html] of Object.entries(pages)) {
  const path = join(root, file);
  if (checkOnly) {
    let current = '';
    try {
      current = readFileSync(path, 'utf8');
    } catch {
      /* missing counts as stale */
    }
    if (current !== html) {
      console.error(`${file} is stale: run npm run build:html`);
      failed = true;
    }
  } else {
    writeFileSync(path, html);
    console.log(`wrote ${file}`);
  }
}
if (checkOnly) {
  const emDash = String.fromCharCode(0x2014);
  for (const f of readdirSync(root).filter((n) => n.endsWith('.html') || n === 'content.json')) {
    if (readFileSync(join(root, f), 'utf8').includes(emDash)) {
      console.error(`${f} contains an em dash`);
      failed = true;
    }
  }
  if (failed) process.exit(1);
  console.log('content check passed');
}
