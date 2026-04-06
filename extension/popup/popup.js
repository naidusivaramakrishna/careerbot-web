// popup.js — CareerBot Extension Popup

const BASE_URL  = 'http://localhost:8000/api/v1';
const PORTAL_URL = 'http://localhost:3000';

// ─── State refs ───────────────────────────────────────────────────────────────
const states = {
  login:      document.getElementById('state-login'),
  loading:    document.getElementById('state-loading'),
  jdDetected: document.getElementById('state-jd-detected'),
  idle:       document.getElementById('state-idle'),
  processing: document.getElementById('state-processing'),
  results:    document.getElementById('state-results'),
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

  // ── Skill Cards ────────────────────────────────────────────────────────────
  const tech = structuredSkills.tech || {};
  const soft = structuredSkills.soft || {};

  const allTechMissing = [...(tech.critical || []), ...(tech.important || []), ...(tech.niceToHave || [])];
  const allTechMatched = [...(tech.matchedCritical || []), ...(tech.matchedImportant || []), ...(tech.matchedNiceToHave || [])];
  const allSoftMissing = soft.missing || [];
  const allSoftMatched = soft.matched || [];

  const section = document.getElementById('missing-skills-section');
  if (!section) return;

  const hasAnyTech = allTechMissing.length || allTechMatched.length;
  const hasAnySoft = allSoftMissing.length || allSoftMatched.length;

  if (!hasAnyTech && !hasAnySoft) {
    section.style.display = 'none';
    return;
  }
  section.style.display = 'block';

  // Build a skill tag (variant: 'matched' | 'missing')
  const makeTag = (skill, variant) => {
    const tag = document.createElement('span');
    tag.className = `skill-tag ${variant}`;
    tag.textContent = (variant === 'matched' ? '✓ ' : '✗ ') + skill;
    return tag;
  };

  // Build a skill group showing matched then missing tags inline
  const makeAllSkillsGroup = (matchedSkills, missingSkills) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'margin-top:4px';
    matchedSkills.forEach(s => wrap.appendChild(makeTag(s, 'matched')));
    missingSkills.forEach(s => wrap.appendChild(makeTag(s, 'missing')));
    return wrap;
  };

  // Build legend
  const makeLegend = () => {
    const legend = document.createElement('div');
    legend.className = 'skills-legend';
    legend.innerHTML = `
      <span class="skills-legend-dot matched">Matched</span>
      <span class="skills-legend-dot missing">Missing</span>`;
    return legend;
  };

  // Update badge: "X matched · Y missing"
  const updateBadge = (id, matched, missing) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = `${matched} matched · ${missing} missing`;
    el.className = matched > 0 ? 'skill-card-badge matched-count' : 'skill-card-badge tech';
  };

  // ── Technical Skills Card ──
  const techContent = document.getElementById('tech-skills-content');
  if (techContent) {
    techContent.innerHTML = '';
    techContent.appendChild(makeLegend());
    techContent.appendChild(makeAllSkillsGroup(allTechMatched, allTechMissing));
  }
  updateBadge('tech-added-badge', allTechMatched.length, allTechMissing.length);

  // ── Soft Skills Card ──
  const softContent = document.getElementById('soft-skills-content');
  if (softContent) {
    softContent.innerHTML = '';
    softContent.appendChild(makeLegend());
    softContent.appendChild(makeAllSkillsGroup(allSoftMatched, allSoftMissing));
  }
  updateBadge('soft-added-badge', allSoftMatched.length, allSoftMissing.length);
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
    }
  });
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
}

// ─── Idle state — set up once ─────────────────────────────────────────────────
let _idleSetup = false;
function setupIdleState() {
  if (_idleSetup) return;
  _idleSetup = true;

  bindFileInput('resume-file-input', 'file-name-display', 'idle');

  document.getElementById('btn-manual-tailor').addEventListener('click', async () => {
    const jdText = document.getElementById('manual-jd-input')?.value?.trim();
    if (!jdText) { alert('Please paste a job description.'); return; }
    await analyzeScore(jdText, null, selectedFile, null);
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

// ─── Right sidebar navigation ─────────────────────────────────────────────────
function setSidebarActive(id) {
  document.querySelectorAll('.rsb-btn').forEach(btn => btn.classList.remove('active'));
  const btn = document.getElementById(id);
  if (btn) btn.classList.add('active');
}

document.getElementById('sb-analyze')?.addEventListener('click', async () => {
  setSidebarActive('sb-analyze');
  const { detectedJD } = await chrome.storage.local.get('detectedJD').catch(() => ({}));
  showState(detectedJD ? 'jdDetected' : 'idle');
});

document.getElementById('sb-profile')?.addEventListener('click', () => {
  setSidebarActive('sb-profile');
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
      avatarEl.innerHTML = `<img src="${user.avatar}" alt="" />`;
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

document.getElementById('sb-feedback')?.addEventListener('click', () => {
  setSidebarActive('sb-feedback');
  chrome.tabs.create({ url: `${PORTAL_URL}/feedback` });
});

document.getElementById('sb-settings')?.addEventListener('click', () => {
  setSidebarActive('sb-settings');
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

// ─── Start ────────────────────────────────────────────────────────────────────
init().catch(console.error);
