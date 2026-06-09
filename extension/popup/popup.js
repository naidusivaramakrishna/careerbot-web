// popup.js — CareerBot Extension Popup

/** Fallback for broken extension icons — replaces img with a static SVG via DOM APIs. */
function cbIconFallback(parent, size) { // safe: static SVG, no user data
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', size); svg.setAttribute('height', size);
  svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'white');
  svg.setAttribute('stroke-width', '2'); svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round'); svg.setAttribute('viewBox', '0 0 24 24');
  [['M12 2L2 7l10 5 10-5-10-5z'], ['M2 17l10 5 10-5'], ['M2 12l10 5 10-5']].forEach(([d]) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
  });
  parent.replaceChildren(svg);
}

const BASE_URL   = CAREERBOT_CONFIG.BASE_URL;
const PORTAL_URL = CAREERBOT_CONFIG.PORTAL_URL;

// ─── Sidebar rail toggle ───────────────────────────────────────────────────────
const sideRail   = document.querySelector('.side-rail');
const openBtn    = document.getElementById('btn-open-rail');

document.getElementById('btn-toggle-rail').addEventListener('click', () => {
  sideRail.classList.add('rail-hidden');
  openBtn.classList.remove('hidden');
});

openBtn.addEventListener('click', () => {
  sideRail.classList.remove('rail-hidden');
  openBtn.classList.add('hidden');
});

// ─── State refs ───────────────────────────────────────────────────────────────
const states = {
  login:       document.getElementById('state-login'),
  loading:     document.getElementById('state-loading'),
  jdDetected:  document.getElementById('state-jd-detected'),
  idle:        document.getElementById('state-idle'),
  processing:  document.getElementById('state-processing'),
  results:     document.getElementById('state-results'),
  coverLetter: document.getElementById('state-cover-letter'),
};

function showState(name) {
  Object.values(states).forEach(el => el.classList.add('hidden'));
  if (states[name]) states[name].classList.remove('hidden');
}

// ─── API helpers ──────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function uploadResume(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE_URL}/parser/parse_resume/`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  if (!res.ok) throw new Error('Resume upload failed');
  const data = await res.json();
  return data.resume_id || data.id || data._id || null;
}

// ─── Parse JD in extension (handles duplicate JD gracefully) ──────────────────
async function parseJDInExtension(jdText) {
  const res = await fetch(`${BASE_URL}/jd/parse`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jd_texts: [jdText], skip_duplicate_check: false }),
  });
  const data = await res.json();
  if (!res.ok) {
    // Duplicate JD — still usable, backend returns existing_id
    if (data?.detail?.error === 'duplicate_jd' && data?.detail?.existing_id) {
      return { jd_id: data.detail.existing_id };
    }
    throw new Error(data?.detail?.msg || data?.detail || data?.message || `JD parse error ${res.status}`);
  }
  let jdId = data.jd_id || data.id;
  if (!jdId && Array.isArray(data.results) && data.results.length) {
    jdId = data.results[0].id || data.results[0].existing_id || data.results[0].jd_id;
  }
  return { jd_id: jdId };
}

// ─── Cached data for "Improve Resume" button ──────────────────────────────────
let cachedResumeId  = null;
let cachedJdText    = null;
let cachedJdId      = null;
let cachedJobMeta   = null;

// ─── Analyze match score and show results in popup ────────────────────────────
async function analyzeScore(jdText, jobMeta, file, selectedId) {
  showState('processing');
  const stepEl = document.getElementById('processing-step');
  const fillEl = document.getElementById('progress-fill');
  const setStep = (text, pct) => {
    if (stepEl) stepEl.textContent = text;
    if (fillEl)  fillEl.style.width = `${pct}%`;
  };

  try {
    // Step 1: Resolve resume
    setStep('Parsing resume…', 20);
    let resumeId = selectedId || null;
    if (file) {
      try { resumeId = await uploadResume(file); }
      catch { if (!resumeId) throw new Error('Resume upload failed. Please try again.'); }
    }
    if (!resumeId) throw new Error('Please select or upload a resume.');

    // Step 2: Parse JD
    setStep('Analyzing job description…', 50);
    const jdResult = await parseJDInExtension(jdText);
    if (!jdResult.jd_id) throw new Error('Could not parse job description.');

    // Step 3: Match
    setStep('Calculating match score…', 80);
    const matchRes = await fetch(`${BASE_URL}/matcher/match`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_id: resumeId, jd_id: jdResult.jd_id }),
    });
    if (!matchRes.ok) throw new Error(`Match failed: ${matchRes.status}`);
    const matchData = await matchRes.json();

    // Extract score — backend stores as data.ats_score e.g. "78.2%" or a number
    const atsRaw = matchData?.data?.ats_score ?? matchData?.ats_score ?? '0';
    const score  = Math.min(100, Math.max(0, parseFloat(String(atsRaw).replace('%', '')) || 0));

    // Extract structured missing skills from actual API response
    const techSkills = matchData?.data?.match_result?.Technical_Skills || {};
    const softSkills = matchData?.data?.match_result?.Soft_Skills || {};

    const toNames = arr => (arr || []).map(s => (typeof s === 'string' ? s : s?.skill)).filter(Boolean);

    const structuredSkills = {
      tech: {
        matchedCritical:   toNames(techSkills.matched_critical_skills),
        matchedImportant:  toNames(techSkills.matched_important_skills),
        matchedNiceToHave: toNames(techSkills.matched_nice_to_have),
        critical:          toNames(techSkills.missing_critical_skills),
        important:         toNames(techSkills.missing_important_skills),
        niceToHave:        toNames(techSkills.missing_nice_to_have),
      },
      soft: {
        matched: toNames(softSkills.matched_skills),
        missing: toNames(softSkills.missing_skills),
      },
    };

    // Cache so "Improve Resume" can navigate to jobmatch
    cachedResumeId = resumeId;
    cachedJdText   = jdText;
    cachedJobMeta  = jobMeta;
    cachedJdId     = jdResult.jd_id;

    setStep('Done!', 100);
    setupResultsState();
    showResultsState(score, jobMeta, structuredSkills);

  } catch (err) {
    // Restore previous state
    const { detectedJD } = await chrome.storage.local.get('detectedJD').catch(() => ({}));
    showState(detectedJD ? 'jdDetected' : 'idle');
    alert(`Analysis failed: ${err.message}. Make sure you are logged in to CareerBot.`);
  }
}

// ─── Render results state ─────────────────────────────────────────────────────
function showResultsState(score, jobMeta, structuredSkills = {}) {
  showState('results');

  // Job info
  const titleEl   = document.getElementById('result-job-title');
  const companyEl = document.getElementById('result-company');
  if (titleEl)   titleEl.textContent   = jobMeta?.title   || 'Job Position';
  if (companyEl) companyEl.textContent = jobMeta?.company || '';

  // Score percentage
  const pctEl = document.getElementById('score-pct');
  if (pctEl) pctEl.textContent = `${Math.round(score)}%`;

  // Animate arc  (circumference for r=68 → 2*π*68 ≈ 427)
  const circumference = 427;
  const arc = document.getElementById('score-arc');
  if (arc) {
    const color = score >= 80 ? '#22c55e' : score >= 60 ? '#2557a7' : score >= 40 ? '#f59e0b' : '#ef4444';
    arc.style.stroke = color;
    if (pctEl) pctEl.style.color = color;
    setTimeout(() => {
      arc.style.strokeDashoffset = circumference - (score / 100) * circumference;
    }, 50);
  }

  // Label + tip
  const labelEl = document.getElementById('score-label');
  const tipEl   = document.getElementById('score-tip');
  let labelText, labelColor, tipText;
  if (score >= 80) {
    labelText = 'Excellent Match'; labelColor = '#22c55e';
    tipText = 'Great! Your profile aligns well with this role.';
  } else if (score >= 60) {
    labelText = 'Good Match'; labelColor = '#2557a7';
    tipText = 'Add a few more skills to boost your score.';
  } else if (score >= 40) {
    labelText = 'Fair Match'; labelColor = '#f59e0b';
    tipText = 'Several key skills are missing. Click below to improve.';
  } else {
    labelText = 'Needs Improvement'; labelColor = '#ef4444';
    tipText = 'Many required skills are missing. Click Improve Resume to see what to add.';
  }
  if (labelEl) { labelEl.textContent = labelText; labelEl.style.color = labelColor; }
  if (tipEl)   tipEl.textContent = tipText;

  // ── Skills Section ─────────────────────────────────────────────────────────
  const tech = structuredSkills.tech || {};
  const soft = structuredSkills.soft || {};

  const allTechMissing = [...(tech.critical || []), ...(tech.important || []), ...(tech.niceToHave || [])];
  const allTechMatched = [...(tech.matchedCritical || []), ...(tech.matchedImportant || []), ...(tech.matchedNiceToHave || [])];
  const allSoftMissing = soft.missing || [];
  const allSoftMatched = soft.matched || [];

  const section = document.getElementById('missing-skills-section');
  if (!section) return;

  const makeChip = (text, variant) => {
    const chip = document.createElement('span');
    chip.className = `skill-chip ${variant}`;
    chip.textContent = text;
    return chip;
  };

  const fillGroup = (groupId, chipsId, countId, chips) => {
    const group = document.getElementById(groupId);
    const chipsEl = document.getElementById(chipsId);
    const countEl = document.getElementById(countId);
    if (!group || !chipsEl || !chips.length) { if (group) group.style.display = 'none'; return; }
    group.style.display = 'block';
    chipsEl.replaceChildren(...chips);
    if (countEl) countEl.textContent = chips.length;
  };

  // Matched skills
  fillGroup('matched-group', 'matched-chips', 'matched-count',
    allTechMatched.slice(0, 8).map(s => makeChip(s, 'matched')));

  // Missing skills
  fillGroup('missing-group', 'missing-chips', 'missing-count',
    allTechMissing.slice(0, 8).map(s => makeChip(s, 'missing')));

  // Soft skills
  const softChips = [
    ...allSoftMatched.slice(0, 4).map(s => makeChip(s, 'soft-matched')),
    ...allSoftMissing.slice(0, 4).map(s => makeChip(s, 'soft-missing')),
  ];
  fillGroup('soft-group', 'soft-chips', null, softChips);

  const hasAny = allTechMissing.length || allTechMatched.length || allSoftMissing.length || allSoftMatched.length;
  section.style.display = hasAny ? 'flex' : 'none';

  // ── ATS Improvements ───────────────────────────────────────────────────────
  const improvements = [];
  if (allTechMissing.length > 0) improvements.push(`Add ${allTechMissing.slice(0,3).join(', ')} to Skills`);
  if (score < 70) improvements.push('Improve Professional Summary');
  if (allTechMissing.length > 3) improvements.push('Add missing ATS keywords');

  const atsSection = document.getElementById('ats-improvements');
  const atsItems   = document.getElementById('ats-items');
  if (atsSection && atsItems && improvements.length) {
    atsSection.style.display = 'block';
    atsItems.replaceChildren(...improvements.map(text => {
      const row = document.createElement('div');
      row.className = 'ats-item';
      const check = document.createElement('span');
      check.className = 'ats-check';
      check.innerHTML = '<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      row.appendChild(check);
      const label = document.createElement('span');
      label.textContent = text;
      row.appendChild(label);
      return row;
    }));
  }
}

// ─── Wire up results state buttons (idempotent) ───────────────────────────────
let _resultsSetup = false;
function setupResultsState() {
  if (_resultsSetup) return;
  _resultsSetup = true;

  document.getElementById('btn-improve-resume').addEventListener('click', async () => {
    if (!cachedResumeId || !cachedJdText) {
      alert('Session expired. Please analyze again.');
      showState('jdDetected');
      return;
    }
    await doTailor(cachedJdText, cachedJobMeta, cachedResumeId);
  });

  document.getElementById('btn-result-try-again').addEventListener('click', async () => {
    const { detectedJD } = await chrome.storage.local.get('detectedJD').catch(() => ({}));
    showState(detectedJD ? 'jdDetected' : 'idle');
  });

}

// ─── File input handlers ──────────────────────────────────────────────────────
let selectedFile = null;
let selectedFileJD = null;

function bindFileInput(inputId, displayId, fileVar) {
  const input   = document.getElementById(inputId);
  const display = document.getElementById(displayId);
  if (!input || !display) return;
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (file) {
      if (fileVar === 'idle') selectedFile = file;
      else selectedFileJD = file;
      display.textContent = file.name;
      // Enable analyze button when file selected in idle state
      if (fileVar === 'idle') {
        const btn = document.getElementById('btn-manual-tailor');
        if (btn) btn.disabled = false;
      }
    }
  });
}

// ─── JD toggle (idle state) ────────────────────────────────────────────────────
function setupJDToggles() {
  // Idle state toggle
  const toggleBtn  = document.getElementById('jd-toggle-btn');
  const expandArea = document.getElementById('jd-expand-area');
  const toggleIcon = document.getElementById('jd-toggle-icon');
  const jdInput    = document.getElementById('manual-jd-input');
  let expanded = false;
  if (toggleBtn && expandArea) {
    const row = document.querySelector('.jd-toggle-row');
    const clickHandler = () => {
      expanded = !expanded;
      expandArea.classList.toggle('hidden', !expanded);
      if (toggleIcon) toggleIcon.style.transform = expanded ? 'rotate(180deg)' : '';
    };
    toggleBtn.addEventListener('click', clickHandler);
    if (row) row.addEventListener('click', (e) => { if (e.target !== toggleBtn) clickHandler(); });
  }
  // Enable analyze when JD typed
  if (jdInput) {
    jdInput.addEventListener('input', () => {
      const btn = document.getElementById('btn-manual-tailor');
      if (btn) btn.disabled = !jdInput.value.trim();
    });
  }

  // JD detected state expand
  const previewToggle    = document.getElementById('jd-preview-toggle');
  const expandDetected   = document.getElementById('jd-expand-area-detected');
  const previewEditBtn   = document.getElementById('jd-preview-edit');
  let detectedExpanded = false;
  if (previewToggle && expandDetected) {
    const detectedClickHandler = () => {
      detectedExpanded = !detectedExpanded;
      expandDetected.classList.toggle('hidden', !detectedExpanded);
      if (previewEditBtn) previewEditBtn.textContent = detectedExpanded ? 'Collapse ↑' : 'Edit ↓';
    };
    previewToggle.addEventListener('click', detectedClickHandler);
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  showState('loading');

  let user;
  try {
    user = await apiFetch('/extension/verify');
  } catch {
    updateProfileCard(null);
    showState('login');
    return;
  }

  updateProfileCard(user);

  // Set up idle state once (event listeners attached once here)
  setupIdleState();

  // Check for auto-detected JD and show correct state
  await applyStoredJD(user);

  // Live update: scraper fires AFTER popup opens
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.detectedJD?.newValue) {
      applyJDContent(changes.detectedJD.newValue);
    } else if (changes.detectedJD && !changes.detectedJD.newValue) {
      // JD was cleared — go back to idle
      showState('idle');
    }
  });

  // Re-check when popup regains focus (e.g. user clicks "Tailor Resume" on banner
  // while popup window was already open and in idle state)
  window.addEventListener('focus', () => applyStoredJD(user));
}

// ─── Get the currently active browser tab (not popup/extension pages) ────────
async function getActiveBrowserTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true });
    return tabs.find(t =>
      t.url &&
      !t.url.startsWith('chrome-extension://') &&
      !t.url.startsWith('chrome://') &&
      !t.url.startsWith('about:')
    ) || null;
  } catch {
    return null;
  }
}

// ─── Read storage and apply the right state ────────────────────────────────────
async function applyStoredJD(_user) {
  const { detectedJD } = await chrome.storage.local.get('detectedJD');
  if (detectedJD) {
    // Discard JDs older than 10 minutes
    const age = Date.now() - (detectedJD.timestamp || 0);
    if (age > 10 * 60 * 1000) {
      await chrome.storage.local.remove('detectedJD');
      showState('idle');
      return false;
    }

    // Only show JD if it belongs to the currently active browser tab.
    // Prevents showing Naukri JD when user switches to a Glassdoor tab.
    const activeTab = await getActiveBrowserTab();
    if (activeTab && detectedJD.tabId && detectedJD.tabId !== activeTab.id) {
      showState('idle');
      return false;
    }

    applyJDContent(detectedJD);
    return true;
  }
  showState('idle');
  return false;
}

// ─── Show company logo in detected banner ────────────────────────────────────
function setCompanyLogo(meta) {
  const imgEl      = document.getElementById('jd-company-logo');
  const fallbackEl = document.getElementById('jd-fallback-icon');
  const initialsEl = document.getElementById('jd-company-initials');
  if (!imgEl) return;

  const company = meta?.company;
  if (!company) return;

  const showInitials = () => {
    if (!initialsEl) return;
    const words    = company.trim().split(/\s+/);
    const initials = words.length >= 2
      ? words[0][0] + words[1][0]
      : words[0].slice(0, 2);
    initialsEl.textContent   = initials.toUpperCase();
    initialsEl.style.display = 'flex';
    if (fallbackEl) fallbackEl.style.display = 'none';
  };

  // Guess company domain from name
  const domain = company
    .toLowerCase()
    .replace(/\b(ltd|limited|inc|corp|corporation|pvt|private|technologies|technology|solutions|services|group|global|india|infotech|infosystems|motors|healthcare)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim() + '.com';

  const sources = [
    `https://logo.clearbit.com/${domain}`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ];
  let attempt = 0;

  const tryNext = () => {
    if (attempt >= sources.length) { showInitials(); return; }
    imgEl.src     = sources[attempt++];
    imgEl.onload  = () => {
      imgEl.style.display = 'block';
      if (fallbackEl)  fallbackEl.style.display = 'none';
      if (initialsEl)  initialsEl.style.display  = 'none';
    };
    imgEl.onerror = tryNext;
  };
  tryNext();
}

// ─── Fill JD into the detected state (safe to call multiple times) ────────────
function applyJDContent(detectedJD) {
  setupJDState(); // wire up buttons & file input (idempotent — runs only once)
  showState('jdDetected');

  const jdTextarea = document.getElementById('jd-textarea-main');
  if (jdTextarea) jdTextarea.value = detectedJD.jd || '';

  const titleEl   = document.getElementById('jd-job-title');
  const companyEl = document.getElementById('jd-company');
  if (titleEl)   titleEl.textContent   = detectedJD.meta?.title   || '';
  if (companyEl) companyEl.textContent = detectedJD.meta?.company || '';

  setCompanyLogo(detectedJD.meta);
  updateDetectPill(true, detectedJD.meta?.company, detectedJD.meta?.title);
}

// ─── Idle state — set up once ─────────────────────────────────────────────────
let _idleSetup = false;
function setupIdleState() {
  if (_idleSetup) return;
  _idleSetup = true;

  bindFileInput('resume-file-input', 'idle-resume-name', 'idle');
  setupJDToggles();

  document.getElementById('btn-manual-tailor').addEventListener('click', async () => {
    const jdText = document.getElementById('manual-jd-input')?.value?.trim();
    if (!jdText) { alert('Please paste a job description.'); return; }
    await analyzeScore(jdText, null, selectedFile, null);
  });

  document.getElementById('njn-try-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://www.linkedin.com/jobs/' });
  });
}

// ─── JD Detected state — set up once ──────────────────────────────────────────
let _jdSetup = false;
function setupJDState() {
  if (_jdSetup) return;
  _jdSetup = true;

  bindFileInput('resume-file-input-jd', 'file-name-display-jd', 'jd');

  document.getElementById('btn-tailor').addEventListener('click', async () => {
    const jdText = document.getElementById('jd-textarea-main')?.value?.trim();
    if (!jdText) { alert('Job description is empty.'); return; }
    const { detectedJD } = await chrome.storage.local.get('detectedJD');
    await analyzeScore(jdText, detectedJD?.meta || null, selectedFileJD, null);
  });

  document.getElementById('btn-dismiss').addEventListener('click', async () => {
    await chrome.storage.local.remove('detectedJD');
    chrome.action.setBadgeText({ text: '' });
    showState('idle');
  });
}

// ─── showJDState: show the JD detected panel ──────────────────────────────────
function showJDState(detectedJD) {
  setupJDState();
  applyJDContent(detectedJD);
}

// ─── Resolve resume ID (upload file or use selected) ─────────────────────────
async function resolveResumeId(file, selectedId) {
  if (file) {
    try {
      return await uploadResume(file);
    } catch {
      alert('Resume upload failed. Using saved resume if available.');
    }
  }
  return selectedId || null;
}

// ─── Load resumes into select ─────────────────────────────────────────────────
async function loadResumesIntoSelect(selectEl) {
  if (!selectEl) return;
  try {
    const resumes = await apiFetch('/resumes/');
    if (resumes && resumes.length > 0) {
      resumes.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id || r._id;
        opt.textContent = r.personalInfo?.fullname
          ? `${r.personalInfo.fullname}'s Resume`
          : `Resume (${(r.id || r._id || '').slice(0, 8)}…)`;
        selectEl.appendChild(opt);
      });
    }
  } catch { /* silent */ }
}

// ─── Core tailor flow ─────────────────────────────────────────────────────────
async function doTailor(jdText, jobMeta, resumeId) {
  showState('processing');
  const stepEl = document.getElementById('processing-step');
  const fillEl = document.getElementById('progress-fill');

  const setStep = (text, pct) => {
    if (stepEl) stepEl.textContent = text;
    if (fillEl)  fillEl.style.width = `${pct}%`;
  };

  try {
    setStep('Creating session…', 30);

    const payload = {
      job_description: jdText,
      job_title:       jobMeta?.title   || null,
      company:         jobMeta?.company || null,
      job_url:         jobMeta?.url     || null,
      resume_id:       resumeId,
      jd_id:           cachedJdId       || null,
    };

    const session = await apiFetch('/extension/prefill', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setStep('Opening portal…', 80);

    const portalUrl = `${PORTAL_URL}/jobmatch?session=${session.session_id}`;

    const existingTabs = await chrome.tabs.query({ url: `${PORTAL_URL}/*` });
    if (existingTabs.length > 0) {
      await chrome.tabs.update(existingTabs[0].id, { url: portalUrl, active: true });
      await chrome.windows.update(existingTabs[0].windowId, { focused: true });
    } else {
      await chrome.tabs.create({ url: portalUrl });
    }

    setStep('Done!', 100);
    await chrome.storage.local.remove('detectedJD');
    chrome.action.setBadgeText({ text: '' });
    setTimeout(() => window.close(), 600);

  } catch (err) {
    showState('idle');
    alert(`Failed: ${err.message}. Make sure you are logged in to CareerBot.`);
  }
}

// ─── Page detection pill ───────────────────────────────────────────────────────
function updateDetectPill(detected, source, title) {
  const pill  = document.getElementById('page-detect-pill');
  const label = pill?.querySelector('.detect-label');
  if (!pill || !label) return;
  if (detected && (source || title)) {
    pill.className = 'detect-pill detect-active';
    label.textContent = [source, title].filter(Boolean).join(' · ').slice(0, 28) || 'Job Detected';
  } else {
    pill.className = 'detect-pill detect-scanning';
    label.textContent = 'Scanning…';
  }
}

// ─── Bottom nav ────────────────────────────────────────────────────────────────
function setNavActive(id) {
  document.querySelectorAll('.bn-btn').forEach(btn => btn.classList.remove('active'));
  const btn = document.getElementById(id);
  if (btn) btn.classList.add('active');
}

document.getElementById('sb-analyze')?.addEventListener('click', async () => {
  setNavActive('sb-analyze');
  const { detectedJD } = await chrome.storage.local.get('detectedJD').catch(() => ({}));
  showState(detectedJD ? 'jdDetected' : 'idle');
});

document.getElementById('sb-dashboard')?.addEventListener('click', () => {
  setNavActive('sb-dashboard');
  chrome.tabs.create({ url: `${PORTAL_URL}/dashboard` });
});

document.getElementById('sb-profile')?.addEventListener('click', () => {
  chrome.tabs.create({ url: `${PORTAL_URL}/dashboard/profile` });
});

// ─── Profile popover: update based on auth state ──────────────────────────────
function updateProfileCard(user) {
  const nameEl   = document.getElementById('rpc-name');
  const subEl    = document.getElementById('rpc-sub');
  const btnEl    = document.getElementById('rpc-action-btn');
  const avatarEl = document.getElementById('rpc-avatar-wrap');

  if (user) {
    // Logged in
    const displayName = user.name || user.full_name || user.email || 'My Account';
    const email       = user.email || '';
    if (nameEl)   nameEl.textContent   = displayName;
    if (subEl)    subEl.textContent    = email;

    // Populate sidebar profile popover
    const srpName  = document.getElementById('srp-name');
    const srpEmail = document.getElementById('srp-email');
    const srAvatar = document.getElementById('sr-avatar-initials');
    if (srpName)  srpName.textContent  = displayName;
    if (srpEmail) srpEmail.textContent = email;
    if (srAvatar) srAvatar.textContent = (displayName[0] || 'U').toUpperCase();
    if (btnEl) {
      btnEl.textContent = 'Sign Out';
      btnEl.className   = 'rpc-btn danger';
      btnEl.onclick = async () => {
        await fetch(`${BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
        updateProfileCard(null);
        showState('login');
      };
    }
    // Avatar image if available
    if (avatarEl && user.avatar) {
      const img = document.createElement('img');
      img.src = user.avatar;
      img.alt = '';
      img.referrerPolicy = 'no-referrer';
      avatarEl.replaceChildren(img);
    }
  } else {
    // Logged out
    if (nameEl) nameEl.textContent = 'Profile';
    if (subEl)  subEl.textContent  = 'Sign in to access your profile';
    if (btnEl) {
      btnEl.textContent = 'Sign In';
      btnEl.className   = 'rpc-btn';
      btnEl.onclick = () => chrome.tabs.create({ url: `${PORTAL_URL}/?showLogin=true` });
    }
  }
}

// ─── Profile popover ──────────────────────────────────────────────────────────
const profilePopover = document.getElementById('sr-profile-popover');
document.getElementById('sb-profile-rail')?.addEventListener('click', (e) => {
  e.stopPropagation();
  profilePopover?.classList.toggle('open');
});
document.addEventListener('click', () => profilePopover?.classList.remove('open'));

document.getElementById('srp-dashboard')?.addEventListener('click', () => {
  profilePopover?.classList.remove('open');
  chrome.tabs.create({ url: `${PORTAL_URL}/dashboard` });
});

document.getElementById('srp-signout')?.addEventListener('click', async () => {
  profilePopover?.classList.remove('open');
  try {
    await fetch(`${BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch { /* silent */ }
  await chrome.storage.local.remove('detectedJD');
  chrome.action.setBadgeText({ text: '' });
  showState('login');
});

document.getElementById('sb-feedback')?.addEventListener('click', () => {
  setNavActive('sb-feedback');
  chrome.tabs.create({ url: `${PORTAL_URL}/feedback` });
});

document.getElementById('sb-settings')?.addEventListener('click', () => {
  chrome.tabs.create({ url: `${PORTAL_URL}/dashboard/profile` });
});


// ─── Auth buttons ─────────────────────────────────────────────────────────────
document.getElementById('btn-login')?.addEventListener('click', () => {
  chrome.tabs.create({ url: `${PORTAL_URL}/?showLogin=true` });
});
document.getElementById('btn-signup')?.addEventListener('click', () => {
  chrome.tabs.create({ url: `${PORTAL_URL}/signup` });
});
document.getElementById('footer-logout')?.addEventListener('click', async () => {
  await fetch(`${BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
  showState('login');
});
document.getElementById('footer-settings')?.addEventListener('click', () => {
  chrome.tabs.create({ url: `${PORTAL_URL}/dashboard/profile` });
});

// ─── Cover Letter ─────────────────────────────────────────────────────────────
let clLetterId = null;

async function generateCoverLetter() {
  const { detectedJD } = await chrome.storage.local.get('detectedJD').catch(() => ({}));
  const jdText  = detectedJD?.jd  || document.getElementById('jd-textarea-main')?.value?.trim() || '';
  const jobMeta = detectedJD?.meta || {};

  if (!jdText) {
    alert('No job description found. Please paste a job description first.');
    return;
  }

  showState('coverLetter');

  // Set header label
  const label = [jobMeta.title, jobMeta.company].filter(Boolean).join(' · ');
  const labelEl = document.getElementById('cl-job-label');
  if (labelEl) labelEl.textContent = label || 'Cover Letter';

  // Show generating spinner
  const genEl    = document.getElementById('cl-generating');
  const outputEl = document.getElementById('cl-output');
  const errorEl  = document.getElementById('cl-error');
  genEl.classList.remove('hidden');
  outputEl.classList.add('hidden');
  errorEl.classList.add('hidden');

  try {
    const resumeId = await resolveResumeId(null, cachedResumeId || null);
    const idempotencyKey = `ext-cl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const res = await apiFetch('/cover-letter/generate', {
      method: 'POST',
      headers: {
        'Content-Type':   'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        job_description: jdText,
        job_title:       jobMeta.title   || null,
        company_name:    jobMeta.company || null,
        resume_id:       resumeId        || null,
        options:         { include_debug_metadata: false },
      }),
    });

    clLetterId = res?.letter_id || res?.id || null;
    const content = res?.content || res?.cover_letter || res?.letter || '';

    genEl.classList.add('hidden');
    outputEl.value = content;
    outputEl.classList.remove('hidden');

  } catch (err) {
    genEl.classList.add('hidden');
    const errMsgEl = document.getElementById('cl-error-msg');
    if (errMsgEl) errMsgEl.textContent = err?.message || 'Failed to generate. Please try again.';
    errorEl.classList.remove('hidden');
  }
}

document.getElementById('btn-cover-letter')?.addEventListener('click', generateCoverLetter);
document.getElementById('btn-cl-regenerate')?.addEventListener('click', generateCoverLetter);

document.getElementById('btn-cl-back')?.addEventListener('click', async () => {
  const { detectedJD } = await chrome.storage.local.get('detectedJD').catch(() => ({}));
  showState(detectedJD ? 'jdDetected' : 'idle');
});

document.getElementById('btn-cl-copy')?.addEventListener('click', () => {
  const outputEl = document.getElementById('cl-output');
  const copyBtn  = document.getElementById('btn-cl-copy');
  if (!outputEl?.value) return;
  navigator.clipboard.writeText(outputEl.value).then(() => {
    copyBtn.classList.add('copied');
    copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
    }, 2000);
  });
});

document.getElementById('btn-cl-open-web')?.addEventListener('click', () => {
  const url = clLetterId
    ? `${PORTAL_URL}/cover-letter/${clLetterId}`
    : `${PORTAL_URL}/cover-letter`;
  chrome.tabs.create({ url });
});

// ─── Start ────────────────────────────────────────────────────────────────────
init().catch(console.error);
