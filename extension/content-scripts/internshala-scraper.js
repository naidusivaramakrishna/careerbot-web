// Internshala JD scraper

(function () {
  if (window.__careerbotInternshala) return;
  window.__careerbotInternshala = true;

  const style = document.createElement('style');
  style.textContent = `
    #careerbot-banner {
      position: fixed !important;
      top: 50% !important;
      right: 24px !important;
      bottom: auto !important;
      left: auto !important;
      width: auto !important;
      height: auto !important;
      z-index: 2147483647 !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: flex-end !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      box-shadow: none !important;
      background: transparent !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      transform: translateY(-50%) !important;
      pointer-events: auto !important;
      inset: 50% 24px auto auto !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);

  function isJobPage() {
    return /internshala\.com\/(jobs|internship)\/detail\//.test(window.location.href) ||
           document.querySelector('.internship_other_details_container') !== null ||
           document.querySelector('.about_company_text_container') !== null;
  }

  // Internshala shows several useful structured fields (Start Date,
  // CTC/Stipend, Experience, Apply By, Perks, Number of openings) outside
  // the "About the job" text block, so they were never captured — only the
  // free-text description was, even though the rest of the page carries
  // real job data. Same heading-anchored technique as the JD-section
  // extraction below: find each field by its label text (stable across
  // markup changes) and read the value from the sibling that follows it.
  function extractDetailByLabel(labelText) {
    const leaves = Array.from(document.querySelectorAll('div, span, label, strong, h3, h4, h5'))
      .filter(el => el.children.length === 0);
    const heading = leaves.find(el => el.innerText.trim().toLowerCase() === labelText.toLowerCase());
    if (!heading) return null;
    const candidates = [heading.nextElementSibling, heading.parentElement?.nextElementSibling].filter(Boolean);
    for (const node of candidates) {
      const text = node.innerText.trim();
      // A genuine field value is short. Anything longer means the sibling
      // walked past this field into an unrelated section — skip it rather
      // than risk pulling in the wrong content (see the Naukri key-skills
      // fix, which hit the same failure mode).
      if (text && text.length <= 120) return text;
    }
    return null;
  }

  // Location has no visible label next to it (unlike Start Date/CTC/etc.),
  // so it can't be found by extractDetailByLabel — it needs its own
  // selector, same as title/company in extractMeta() below.
  function extractLocation() {
    const el = document.querySelector(
      '#location_names, .location_link, .locations, [class*="location_link"], [class*="location_names"]'
    );
    const text = el?.innerText?.trim();
    return text && text.length <= 120 ? text : null;
  }

  // "Skill(s) required" is a chip list, not a single value, so it needs the
  // same chip-reading technique used for Naukri's Key Skills fix: search
  // within the heading's own parent (where the chips actually live as
  // siblings), not a section that follows it — hopping past the wrapper
  // previously reached into the neighbouring "Earn certifications in these
  // skills" block on Naukri's equivalent widget, so this stays scoped the
  // same safe way.
  function extractRequiredSkills() {
    const leaves = Array.from(document.querySelectorAll('div, span, label, strong, h3, h4, h5'))
      .filter(el => el.children.length === 0);
    const heading = leaves.find(el => /^skill\(s\)\s*required$/i.test(el.innerText.trim()));
    if (!heading) return null;
    const containers = [heading.nextElementSibling, heading.parentElement].filter(Boolean);
    for (const container of containers) {
      const skills = Array.from(container.querySelectorAll('*'))
        .filter(el => el.children.length === 0)
        .map(el => el.innerText.trim())
        .filter(s => s && s.length <= 60 && !/^skill\(s\)\s*required$/i.test(s));
      const unique = [...new Set(skills)];
      if (unique.length >= 1 && unique.length <= 40) return unique.join(', ');
    }
    return null;
  }

  function extractJobMeta() {
    const lines = [];
    const push = (label, value) => { if (value) lines.push(`${label}: ${value}`); };

    push('Location', extractLocation());
    push('Start Date', extractDetailByLabel('Start Date'));
    // CTC (jobs), Stipend (internships), and Salary (a duplicate restated
    // further down the page) all describe the same figure — take the first
    // that matches instead of repeating it three times.
    push('Pay', extractDetailByLabel('CTC (Annual)') || extractDetailByLabel('Stipend') || extractDetailByLabel('Salary'));
    push('Experience', extractDetailByLabel('Experience'));
    push('Apply By', extractDetailByLabel('Apply By'));
    push('Skills Required', extractRequiredSkills());
    push('Perks', extractDetailByLabel('Perks'));
    push('Number of Openings', extractDetailByLabel('Number of openings'));

    return lines.length ? lines.join('\n') : null;
  }

  function extractJobDescription() {
    const details = extractJobMeta();
    const withDetails = (text) => (details ? `${details}\n\n${text}` : text);

    // Primary: find the JD section by its heading text. This is far more
    // stable across Internshala markup changes than CSS class names, and
    // (unlike class selectors) it can't accidentally match the "About
    // Company" section instead of the actual role description.
    const headingTexts = ['about the internship', 'about the job', 'job description', 'about this job'];
    const leaves = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, div, span, strong, label'))
      .filter(el => el.children.length === 0);
    for (const wanted of headingTexts) {
      const heading = leaves.find(el => el.innerText.trim().toLowerCase() === wanted);
      if (!heading) continue;
      const candidates = [heading.nextElementSibling, heading.parentElement?.nextElementSibling].filter(Boolean);
      for (const node of candidates) {
        const text = node.innerText.trim();
        if (text.length > 100) return withDetails(text);
      }
    }

    // Fallback: known JD container classes. Deliberately excludes the
    // about-company selectors (.about_company_text_container, #about-company,
    // .about-section) — those hold the company bio, not the role
    // description, and were previously being returned as the JD by mistake
    // whenever the real JD selector failed to match (the reported bug:
    // "About KocharTech..." scraped instead of "About the internship...").
    const jdSelectors = [
      '.internship_other_details_container',
      '[class*="job_description"]',
      '.job-description-paragraph',
      '.container-fluid .row .col-8',
    ];
    for (const sel of jdSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.trim().length > 100) return withDetails(el.innerText.trim());
    }

    return null;
  }

  function extractMeta() {
    const titleEl   = document.querySelector('.profile h1, .heading_4_5.profile, h1[class*="profile"]');
    const companyEl = document.querySelector('.company_name a, .company-name a, [class*="company_name"] a');
    return {
      title:   titleEl?.innerText?.trim()   || document.title,
      company: companyEl?.innerText?.trim() || '',
      url:     window.location.href,
      source:  'internshala',
    };
  }

  let lastDetectedJd = null;

  function tryDetect() {
    if (!isJobPage()) return;
    const jd = extractJobDescription();
    if (!jd) return;

    if (jd === lastDetectedJd && document.getElementById('cb-shadow-host')) return;
    lastDetectedJd = jd;

    const meta = extractMeta();
    chrome.runtime.sendMessage({ type: 'JD_DETECTED', data: { jd, meta } }).catch(() => {});
    injectBanner(meta, jd);
  }

  function injectBanner(meta, jd) {
    document.getElementById('cb-shadow-host')?.remove();

    const host = document.createElement('div');
    host.id = 'cb-shadow-host';
    host.style.cssText = 'position:fixed!important;top:50%!important;right:24px!important;bottom:auto!important;left:auto!important;transform:translateY(-50%)!important;z-index:2147483647!important;pointer-events:auto!important;margin:0!important;padding:0!important;border:none!important;background:transparent!important;';

    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
  :host {
    position: fixed !important;
    top: 50% !important;
    right: 24px !important;
    bottom: auto !important;
    left: auto !important;
    transform: translateY(-50%) !important;
    z-index: 2147483647 !important;
    pointer-events: auto !important;
    display: block !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    background: transparent !important;
  }

  @keyframes cb-in {
    from { transform: translateY(20px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  .cb-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #ffffff;
    border: 1.5px solid #ede9fe;
    border-left: 5px solid #7c3aed;
    border-radius: 14px;
    padding: 13px 16px 13px 14px;
    box-shadow: 0 4px 24px rgba(109,40,217,0.18), 0 1px 4px rgba(0,0,0,0.08);
    width: 340px;
    max-width: calc(100vw - 48px);
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: cb-in 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }

  .cb-icon {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #f5f3ff, #ede9fe);
    border: 1px solid #ddd6fe;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    overflow: hidden;
  }

  .cb-icon img {
    width: 30px;
    height: 30px;
    object-fit: contain;
  }

  .cb-meta {
    flex: 1;
    min-width: 0;
  }

  .cb-title {
    display: block;
    font-size: 13px;
    font-weight: 700;
    color: #111827;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
  }

  .cb-company {
    display: block;
    font-size: 11px;
    color: #6b7280;
    margin-top: 1px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cb-badge {
    display: inline-block;
    font-size: 9px;
    font-weight: 700;
    color: #7c3aed;
    background: #f5f3ff;
    border: 1px solid #ddd6fe;
    border-radius: 4px;
    padding: 1px 5px;
    margin-top: 3px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .cb-btn {
    flex-shrink: 0;
    padding: 9px 15px;
    background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%);
    color: #fff;
    border: none;
    border-radius: 9px;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(124,58,237,0.4);
    transition: transform 0.15s, box-shadow 0.15s;
    font-family: inherit;
  }

  .cb-btn:hover {
    background: linear-gradient(135deg, #6d28d9, #7c3aed);
    box-shadow: 0 4px 16px rgba(124,58,237,0.5);
    transform: translateY(-1px);
  }

  .cb-btn:active {
    transform: translateY(0);
    box-shadow: 0 1px 4px rgba(124,58,237,0.3);
  }

  .cb-close {
    flex-shrink: 0;
    width: 25px;
    height: 25px;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    color: #9ca3af;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s;
    font-family: inherit;
  }

  .cb-close:hover {
    background: #fee2e2;
    border-color: #fca5a5;
    color: #ef4444;
  }
`;

    const wrap = document.createElement('div');
    wrap.className = 'cb-wrap';
    // Static structure only — user data set via textContent below to prevent XSS
    const staticBanner = `
      <div class="cb-icon">✨</div>
      <div class="cb-meta">
        <span class="cb-title"></span>
        <span class="cb-company"></span>
        <span class="cb-badge"></span>
      </div>
      <button class="cb-btn" id="cb-tailor-btn">✦ Tailor Resume</button>
      <button class="cb-close" id="cb-close-btn">✕</button>
    `;
    wrap.innerHTML = staticBanner; // safe: static structure only, user data via textContent
    wrap.querySelector('.cb-title').textContent = meta.title || 'Job Detected';
    const companyEl = wrap.querySelector('.cb-company');
    if (meta.company) { companyEl.textContent = meta.company; } else { companyEl.remove(); }
    wrap.querySelector('.cb-badge').textContent = meta.source || 'careerbot';
    setBrandIcon(wrap.querySelector('.cb-icon'));

    shadow.appendChild(style);
    shadow.appendChild(wrap);
    document.body.appendChild(host);

    shadow.getElementById('cb-tailor-btn').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'JD_TAILOR_NOW', data: { jd, meta } }).catch(() => {});
      host.remove();
    });

    shadow.getElementById('cb-close-btn').addEventListener('click', () => {
      host.remove();
    });
  }

  setTimeout(tryDetect, 2000);

  // Show the CareerBot brand icon in the banner (static — not the company's logo).
  function setBrandIcon(iconEl) {
    if (!iconEl) return;
    const img = document.createElement('img');
    img.src = chrome.runtime.getURL('icons/logo.png');
    img.alt = 'CareerBot';
    img.onerror = () => { iconEl.textContent = '✨'; };
    iconEl.replaceChildren(img);
  }

})();
