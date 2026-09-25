// Naukri JD scraper

(function () {

  // querySelectorAll('*') also returns SVG leaves (<path>, <circle>) from
  // decorative icons. innerText is an HTMLElement property, so on those it is
  // undefined and .trim() throws -- one icon inside a chip container was
  // enough to abort extraction entirely. Read defensively.
  function leafText(el) {
    const t = typeof el?.innerText === 'string' ? el.innerText : (el?.textContent || '');
    return t.trim();
  }

  if (window.__careerbotNaukri) return;
  window.__careerbotNaukri = true;

  // Inject critical CSS to lock banner positioning
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
    return document.querySelector('.job-desc') !== null ||
           document.querySelector('[class*="job-desc"]') !== null ||
           /naukri\.com\/.+-jobs/.test(window.location.href);
  }

  // Extract key skills chips as a comma-separated list so the backend
  // can recognise each skill individually (innerText merges them without spaces).
  function extractKeySkills() {
    const chipSelectors = [
      '.key-skill',
      '[class*="key-skill"]',
      '[class*="keySkill"]',
      '.chip',
      '[class*="chip"]',
      '.styles_key-skill__GIPn_ a',
      '[class*="skills"] a',
      '[class*="skill-tags"] span',
      '[class*="skillTag"]',
    ];
    for (const sel of chipSelectors) {
      const chips = document.querySelectorAll(sel);
      if (chips.length >= 2) {
        const skills = Array.from(chips)
          .map(c => c.innerText.trim())
          .filter(Boolean);
        if (skills.length >= 2) return skills.join(', ');
      }
    }

    // Fallback: Naukri rotates its CSS-module class hashes on every deploy,
    // which breaks the class-based selectors above and causes the chip
    // list to fall through to the page's raw innerText — where adjacent
    // chips have no whitespace between them and merge into one blob (e.g.
    // "Python DevelopmentMachine Learning"). Locate the "Key Skills" label
    // by its text instead (stable across deploys) and read each chip as
    // its own DOM element, so skills stay separated regardless of hash.
    const heading = Array.from(document.querySelectorAll('label, span, div, h2, h3, h4, strong'))
      .find(el => el.children.length === 0 && /^key skills$/i.test(el.innerText.trim()));
    if (heading) {
      // Chips sit as siblings/cousins under the same wrapping container as
      // the heading — NOT in an unrelated section that follows it. Hopping
      // to the wrapper's *next* sibling (as this fallback previously did)
      // reached past the skills widget into the neighbouring "About the
      // company" card and picked up badges/news text as if they were
      // skills (e.g. "Private", "Forbes Global 2000", article headlines).
      const containers = [heading.nextElementSibling, heading.parentElement].filter(Boolean);
      for (const container of containers) {
        const skills = Array.from(container.querySelectorAll('*'))
          .filter(el => el.children.length === 0)
          .map(el => leafText(el))
          // Skill names are short phrases; anything longer is prose from an
          // unrelated section, not a chip — drop it rather than risk
          // polluting the list.
          .filter(s => s && s.length <= 60 && !/preferred keyskills/i.test(s) && !/^key skills$/i.test(s));
        const unique = [...new Set(skills)];
        if (unique.length >= 2 && unique.length <= 40) return unique.join(', ');
      }
    }

    return null;
  }

  // Drops the raw "Key Skills" heading/legend line and the merged,
  // un-separated chip line(s) (e.g. "TypeScriptAI AgentsJavascript...")
  // from the scraped JD text, since a clean comma-separated version is
  // appended separately by the caller and would otherwise be duplicated.
  function stripRawKeySkillsLines(jdText, skills) {
    if (!skills?.length) return jdText;
    const lines = jdText.split('\n').filter(line => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (/^key skills$/i.test(trimmed)) return false;
      if (/preferred keyskills/i.test(trimmed)) return false;
      let remainder = trimmed;
      let matched = 0;
      for (const skill of skills) {
        if (skill && remainder.includes(skill)) {
          remainder = remainder.split(skill).join('');
          matched++;
        }
      }
      // Loosened from requiring an exactly-empty remainder: Naukri's raw
      // innerText can carry a stray star/bullet glyph or extra whitespace
      // around each chip that the DOM-extracted skill text doesn't include
      // (e.g. a "☆" preferred-skill marker), so an exact-match check left a
      // tiny non-empty remainder and kept the whole un-separated blob line
      // instead of dropping it.
      return !(matched >= 2 && remainder.trim().length <= 3);
    });
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  function extractJobDescription() {
    const selectors = [
      '.job-desc',
      '[class*="job-desc"]',
      '.dang-inner-html',
      '[class*="jobDescriptionText"]',
      '.styles_JDC__dang-inner-html__h0K4t',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.trim().length > 100) {
        let jdText = el.innerText.trim();
        // Append key skills as a clean comma-separated list so the backend
        // can parse each skill separately instead of one merged blob.
        const skills = extractKeySkills();
        if (skills) {
          // The raw scrape above still contains Naukri's own "Key Skills"
          // heading/legend and the merged, un-separated chip text (e.g.
          // "TypeScriptAI AgentsJavascript..."). Strip that out so it isn't
          // duplicated alongside the clean list appended below.
          jdText = stripRawKeySkillsLines(jdText, skills.split(', '));
          return `${jdText}\n\nKey Skills: ${skills}`;
        }
        return jdText;
      }
    }
    return null;
  }

  function extractMeta() {
    const titleEl    = document.querySelector('h1.styles_jd-header-title__rZwM1, h1[class*="title"], .jd-header-title');
    const companyEl  = document.querySelector('.styles_jd-header-comp-name__MvqAI a, [class*="comp-name"] a');
    // Naukri renders location differently depending on page type:
    //  - Search-results card view (e.g. naukri.com/jobs-in-<city>, job shown
    //    inline in a list): location is a link with a native title tooltip
    //    ("Jobs in Bengaluru") — its class is the abbreviated "loc", which
    //    [class*="location"] does NOT match (it's a substring check the
    //    other way around: "loc" doesn't contain "location").
    //  - Standalone job-detail page: location sits near the header, scoped
    //    query below.
    // An unscoped [class*="location"] query as a last resort risks matching
    // the search bar's own location filter or a different job's location
    // elsewhere on the page, but it's better than nothing if both misses.
    const locationEl = document.querySelector('a[title^="Jobs in "]')
      || document.querySelector('[class*="jd-header"] [class*="location" i]')
      || document.querySelector('[class*="location" i]');
    return {
      title:    titleEl?.innerText?.trim()   || document.title,
      company:  companyEl?.innerText?.trim() || '',
      location: locationEl?.innerText?.trim() || '',
      url:      window.location.href,
      source:   'naukri',
    };
  }

  let lastDetectedJd = null;

  function tryDetect() {
    if (!isJobPage()) return;
    const jd = extractJobDescription();
    if (!jd) return;

    // Checking only the JD text (not banner presence) means a closed banner
    // stays closed for this job — checking document.getElementById
    // ('cb-shadow-host') here treated the user's own close click as "not
    // shown yet" and reopened the banner on the next retry/mutation.
    if (jd === lastDetectedJd) return;
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
