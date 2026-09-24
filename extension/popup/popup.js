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

// Navigate to a CareerBot web page — reusing an already-open CareerBot tab
// (any tab under PORTAL_URL, any path) instead of piling up a new duplicate
// tab every time the panel sends the user to the portal. Same behavior
// doTailor's "Improve Resume" flow already used just for its one call site;
// every other PORTAL_URL navigation in this file was still doing a bare
// chrome.tabs.create.
async function openPortalUrl(url) {
  try {
    const existingTabs = await chrome.tabs.query({ url: `${PORTAL_URL}/*` });
    if (existingTabs.length > 0) {
      // tabs.query's return order is NOT "most recently viewed" — with
      // several CareerBot tabs open (JobMatch, Mock Test, Cover Letter
      // history, ...) blindly taking existingTabs[0] silently updates
      // whichever tab happened to be first/opened-earliest, while the tab
      // the user is actually looking at never navigates anywhere. Picking
      // by lastAccessed targets the tab they were just on.
      const target = existingTabs.reduce((best, t) =>
        (t.lastAccessed ?? 0) > (best.lastAccessed ?? 0) ? t : best
      );
      await chrome.tabs.update(target.id, { url, active: true });
      await chrome.windows.update(target.windowId, { focused: true });
      return;
    }
  } catch {
    // Reusing an existing tab is a nice-to-have — a tab that closed/got
    // discarded between the query and the update (or any other transient
    // failure here) must never leave the user with nothing happening at all
    // when they click through to the portal. Fall through to opening a new
    // tab instead of silently swallowing the click.
  }
  await chrome.tabs.create({ url });
}

// ─── Upload / input constraints ───────────────────────────────────────────────
const MAX_RESUME_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_RESUME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]);
const ALLOWED_RESUME_EXTENSIONS = ['.pdf', '.docx'];
const MAX_JD_TEXT_LENGTH = 30000; // ~30k chars — generous for a real JD, caps abuse

function validateResumeFile(file) {
  if (!file) return 'No file selected.';
  if (file.size === 0) return 'The selected file is empty.';
  if (file.size > MAX_RESUME_FILE_BYTES) return 'Resume file is too large (max 10MB).';
  const name = (file.name || '').toLowerCase();
  const hasAllowedExt = ALLOWED_RESUME_EXTENSIONS.some(ext => name.endsWith(ext));
  const hasAllowedType = !file.type || ALLOWED_RESUME_TYPES.has(file.type);
  if (!hasAllowedExt || !hasAllowedType) return 'Only PDF and DOCX resumes are supported.';
  return null;
}

function clampJdText(text) {
  return typeof text === 'string' ? text.slice(0, MAX_JD_TEXT_LENGTH) : '';
}

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
  idle:        document.getElementById('state-idle'),
  processing:  document.getElementById('state-processing'),
  results:     document.getElementById('state-results'),
  coverLetter: document.getElementById('state-cover-letter'),
};

// Timestamp of the most recent entry into 'processing' — lets tabs.onActivated
// tell a genuinely stuck flow apart from one that's still legitimately running
// (see the guard below).
let processingSince = 0;

function showState(name) {
  Object.values(states).forEach(el => el.classList.add('hidden'));
  if (states[name]) states[name].classList.remove('hidden');
  document.getElementById('app')?.setAttribute('data-state', name);
  if (name === 'processing') processingSince = Date.now();
  if (['idle', 'processing', 'results', 'coverLetter'].includes(name)) {
    setNavActive('sb-analyze');
  }
  // Stop polling as soon as we leave the login state
  if (name !== 'login') stopLoginPoll();
}

function unlockRail(unlock) {
  ['sb-analyze', 'sb-dashboard'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    if (unlock) {
      btn.classList.remove('sr-locked');
      btn.removeAttribute('aria-disabled');
      btn.title = id === 'sb-analyze' ? 'Analyze' : 'Tracker';
    } else {
      btn.classList.add('sr-locked');
      btn.setAttribute('aria-disabled', 'true');
      btn.title = id === 'sb-analyze' ? 'Sign in to unlock Analyze' : 'Sign in to unlock Tracker';
    }
  });
  const profileWrap = document.querySelector('.sr-profile-wrap');
  if (profileWrap) profileWrap.classList.toggle('rail-profile-hidden', !unlock);
  const caption = document.querySelector('.sr-unlock-caption');
  if (caption) caption.style.display = unlock ? 'none' : '';
}

// ─── API helpers ──────────────────────────────────────────────────────────────
const API_TIMEOUT_MS = 60000;
// Resume parsing is AI-driven and can legitimately run past 60s for larger/
// denser resumes (observed up to ~69s in backend logs) — the generic
// API_TIMEOUT_MS aborts the request client-side before the backend finishes,
// which then completes anyway and warms the cache, making a same-resume
// retry succeed instantly and masking the real cause as "random" flakiness.
// Matches the web app's axios timeout (src/lib/http.ts) for the same call.
const RESUME_UPLOAD_TIMEOUT_MS = 120000;
// Sequential fetchWithTimeout calls in the longest flow (doTailor: upload →
// parse JD → match → tailor). Used to budget the stuck-flow detection below.
const MAX_FLOW_CALLS = 4;

async function fetchWithTimeout(url, options = {}, timeoutMs = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Request timed out. Please try again.');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Backend's actual error envelope (app/core/exception_handler.py):
//   { success: false, error: { message, error_code, ..., details: { error: 'INSUFFICIENT_CREDITS', credits_required, credits_remaining, ... } } }
// — the specific machine-readable code lives at error.details.error (or
// error.error_code for the generic HTTP_<status> case), NOT at a top-level
// `detail` key like a stock FastAPI HTTPException body. Most failures still
// stay generic to the user by design (only known-safe codes are special-
// cased below) — but insufficient-credits and auth are meaningful and
// actionable enough to surface directly, instead of the guess-prone
// "make sure you're logged in" catch-all every failure used to get.
function describeApiError(status, data) {
  const errorObj = data?.error && typeof data.error === 'object' ? data.error : null;
  const details = errorObj?.details && typeof errorObj.details === 'object' ? errorObj.details : null;
  const code = details?.error || errorObj?.error_code;

  // 402 Payment Required means insufficient credits by HTTP-status convention
  // in this app regardless of whether this particular route's error body
  // populated the INSUFFICIENT_CREDITS code — same defensive status-first
  // check src/api/mockTestApi.ts already relies on for the same reason.
  if (code === 'INSUFFICIENT_CREDITS' || status === 402) {
    const need = details?.credits_required;
    const have = details?.credits_remaining;
    return typeof need === 'number' && typeof have === 'number'
      ? `You don't have enough credits for this (need ${need}, have ${have}). Upgrade your plan or wait for your credits to reset.`
      : "You don't have enough credits for this. Upgrade your plan or wait for your credits to reset.";
  }
  if (status === 401) {
    return 'Please log in to CareerBot to continue.';
  }
  return 'Something went wrong. Please try again.';
}

async function apiFetch(path, options = {}) {
  const res = await fetchWithTimeout(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) {
    let data = null;
    try { data = await res.json(); } catch { /* ignore */ }
    console.error(`[apiFetch] ${res.status} ${path}`, data);
    const err = new Error(describeApiError(res.status, data));
    err.status = res.status;
    err.detail = data;
    throw err;
  }
  return res.json();
}


// Clear auth cookies on both the portal and backend origins so the session
// is truly gone regardless of which host set them.
async function clearAuthCookies() {
  if (!chrome.cookies?.remove) return true;
  const origins = [
    PORTAL_URL.replace(/\/$/, ''),
    BASE_URL.replace(/\/api\/v1\/?$/, ''),
  ];
  const names = ['access_token', 'refresh_token', 'admin_access_token', 'admin_refresh_token'];
  await Promise.allSettled(
    origins.flatMap(url =>
      names.map(name => new Promise((resolve) => {
        chrome.cookies.remove({ url, name }, (removed) => {
          // removed is null if the cookie didn't exist or couldn't be removed
          // (e.g. url didn't match the cookie's domain/path attributes).
          resolve({ url, name, removed: Boolean(removed) || !chrome.runtime.lastError });
        });
      }))
    )
  );

  // Re-check that no session cookie actually remains, since `remove` can
  // silently no-op if the url doesn't match the cookie's domain/path.
  let stillPresent = false;
  for (const url of origins) {
    for (const name of names) {
      const cookie = await new Promise((resolve) => chrome.cookies.get({ url, name }, resolve));
      if (cookie) { stillPresent = true; break; }
    }
    if (stillPresent) break;
  }
  if (stillPresent) console.warn('[clearAuthCookies] a session cookie may still be present after logout');
  return !stillPresent;
}

// Requires the backend to confirm an authenticated flag, not just the
// presence of fields that a non-auth error payload could also contain.
function isSafeHttpUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidUser(data) {
  if (!data || typeof data !== 'object') return false;
  if (data.authenticated === false || data.success === false || data.error) return false;
  const u = data.user || data;
  return Boolean(u.email || u.id || u._id || u.full_name || u.name);
}

async function verifyExtensionUser() {
  const result = await apiFetch('/extension/verify');
  if (!isValidUser(result)) throw new Error('Not signed in');
  return result;
}

async function uploadResume(file) {
  const validationError = validateResumeFile(file);
  if (validationError) throw new Error(validationError);
  const form = new FormData();
  form.append('file', file);
  const res = await fetchWithTimeout(`${BASE_URL}/parser/parse_resume/`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  }, RESUME_UPLOAD_TIMEOUT_MS);
  if (!res.ok) throw new Error('Resume upload failed');
  const data = await res.json();
  return data.resume_id || data.id || data._id || null;
}

// ─── Parse JD in extension (handles duplicate JD gracefully) ──────────────────
async function parseJDInExtension(jdText) {
  const res = await fetchWithTimeout(`${BASE_URL}/jd/parse`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jd_texts: [clampJdText(jdText)], skip_duplicate_check: false }),
  });
  const data = await res.json();
  if (!res.ok) {
    // Duplicate JD — still usable, backend returns existing_id
    if (data?.detail?.error === 'duplicate_jd' && data?.detail?.existing_id) {
      return { jd_id: data.detail.existing_id };
    }
    console.error(`[parseJDInExtension] ${res.status}`, data);
    throw new Error(describeApiError(res.status, data));
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
  jdText = clampJdText(jdText);
  showState('processing');
  const stepEl = document.getElementById('processing-step');
  const setStep = (text) => {
    if (stepEl) stepEl.textContent = text;
  };

  try {
    // Step 1: Resolve resume
    setStep('Parsing resume…');
    let resumeId = selectedId || null;
    if (file) {
      try { resumeId = await uploadResume(file); }
      catch { if (!resumeId) throw new Error('Resume upload failed. Please try again.'); }
    }
    if (!resumeId) throw new Error('Please select or upload a resume.');

    // Step 2: Parse JD
    setStep('Analyzing job description…');
    const jdResult = await parseJDInExtension(jdText);
    if (!jdResult.jd_id) throw new Error('Could not parse job description.');

    // Step 3: Match
    setStep('Calculating match score…');
    const matchRes = await fetchWithTimeout(`${BASE_URL}/matcher/match`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_id: resumeId, jd_id: jdResult.jd_id }),
    });
    const matchData = await matchRes.json().catch(() => null);
    if (!matchRes.ok) {
      console.error(`[analyzeScore] matcher/match ${matchRes.status}`, matchData);
      throw new Error(describeApiError(matchRes.status, matchData));
    }

    // Extract score — backend stores as data.ats_score e.g. "78.2%" or a number
    const atsRaw = matchData?.data?.ats_score ?? matchData?.ats_score ?? '0';
    const score  = Math.min(100, Math.max(0, Number.parseFloat(String(atsRaw).replace('%', '')) || 0));

    // Extract structured missing skills from actual API response.
    // The AI layer renamed these two keys (Technical_Skills -> Technical_Skills_Check,
    // Soft_Skills -> Soft_Skills_Check); match_result documents from before the rename
    // still carry only the old name, so both must be checked (see careerbot-api
    // app/shared/contracts/matcher_keys.py).
    const matchResult = matchData?.data?.match_result || {};

    // Backend returns success (200) with a 0% score and eligible:false when
    // the resume structurally can't qualify (e.g. required years of
    // experience the candidate doesn't have) — see match_result.reason. Not
    // an HTTP failure, so the res.ok check above doesn't catch it; without
    // this, the panel shows a 0% "Needs Improvement" score with no
    // explanation instead of the reason the backend already computed.
    if (matchResult.eligible === false) {
      throw new Error(matchResult.reason || "Your resume doesn't meet this job's requirements.");
    }

    const techSkills = matchResult.Technical_Skills_Check || matchResult.Technical_Skills || {};
    const softSkills = matchResult.Soft_Skills_Check || matchResult.Soft_Skills || {};

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

    setStep('Done!');
    setupResultsState();
    showResultsState(score, jobMeta, structuredSkills);

  } catch (err) {
    // Restore previous state
    const detectedJD = await getActiveDetectedJD();
    if (detectedJD) applyJDContent(detectedJD);
    else showState('idle');
    alert(`Analysis failed: ${err.message}`);
  }
}

// ─── Render results state ─────────────────────────────────────────────────────
function applyJobInfo(jobMeta) {
  const titleEl   = document.getElementById('result-job-title');
  const companyEl = document.getElementById('result-company');
  if (titleEl)   titleEl.textContent   = jobMeta?.title   || 'Job Position';
  if (companyEl) companyEl.textContent = jobMeta?.company || '';
}

function applyScorePercent(score) {
  const pctEl = document.getElementById('score-pct');
  if (pctEl) pctEl.textContent = `${Math.round(score)}%`;
  return pctEl;
}

function scoreColor(score) {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#2557a7';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

// Animate arc  (circumference for r=46 → 2*π*46 ≈ 289)
function animateScoreArc(score, pctEl) {
  const circumference = 289;
  const arc = document.getElementById('score-arc');
  if (!arc) return;
  const color = scoreColor(score);
  arc.style.stroke = color;
  if (pctEl) pctEl.style.color = color;
  setTimeout(() => {
    arc.style.strokeDashoffset = circumference - (score / 100) * circumference;
  }, 50);
}

function scoreLabelInfo(score) {
  if (score >= 80) {
    return { labelText: 'Excellent Match', labelColor: '#22c55e', tipText: 'Great! Your profile aligns well with this role.' };
  }
  if (score >= 60) {
    return { labelText: 'Good Match', labelColor: '#2557a7', tipText: 'Add a few more skills to boost your score.' };
  }
  if (score >= 40) {
    return { labelText: 'Fair Match', labelColor: '#f59e0b', tipText: 'Several key skills are missing. Click below to improve.' };
  }
  return { labelText: 'Needs Improvement', labelColor: '#ef4444', tipText: 'Many required skills are missing. Click Improve Resume to see what to add.' };
}

function applyScoreLabel(score) {
  const labelEl = document.getElementById('score-label');
  const tipEl   = document.getElementById('score-tip');
  const { labelText, labelColor, tipText } = scoreLabelInfo(score);
  if (labelEl) { labelEl.textContent = labelText; labelEl.style.color = labelColor; }
  if (tipEl)   tipEl.textContent = tipText;
}

function makeSkillChip(text, variant) {
  const chip = document.createElement('span');
  chip.className = `skill-chip ${variant}`;
  chip.textContent = text;
  return chip;
}

function fillSkillGroup(groupId, chipsId, countId, chips, trueCount) {
  const group = document.getElementById(groupId);
  const chipsEl = document.getElementById(chipsId);
  const countEl = document.getElementById(countId);
  if (!group || !chipsEl || !chips.length) {
    if (group) { group.style.display = 'none'; }
    return;
  }
  group.style.display = 'block';
  chipsEl.replaceChildren(...chips);
  if (countEl) countEl.textContent = trueCount ?? chips.length;
}

// ── Skills Section ─────────────────────────────────────────────────────────
// Returns the missing-tech-skills list (used by renderAtsImprovements below),
// or null if the section isn't on this page — callers must skip ATS
// improvements too in that case, matching the original all-in-one function's
// early return.
function renderSkillGroups(structuredSkills) {
  const tech = structuredSkills.tech || {};
  const soft = structuredSkills.soft || {};

  const allTechMissing = [...(tech.critical || []), ...(tech.important || []), ...(tech.niceToHave || [])];
  const allTechMatched = [...(tech.matchedCritical || []), ...(tech.matchedImportant || []), ...(tech.matchedNiceToHave || [])];
  const allSoftMissing = soft.missing || [];
  const allSoftMatched = soft.matched || [];

  const section = document.getElementById('missing-skills-section');
  if (!section) return null;

  // Matched skills — only the first 8 chips render (popup space is limited),
  // but the count badge must reflect the true total or it reads as a lower
  // match than the full jobmatch page reports for the same result.
  fillSkillGroup('matched-group', 'matched-chips', 'matched-count',
    allTechMatched.slice(0, 8).map(s => makeSkillChip(s, 'matched')), allTechMatched.length);

  // Missing skills — same true-total-vs-rendered-chips split as above.
  fillSkillGroup('missing-group', 'missing-chips', 'missing-count',
    allTechMissing.slice(0, 8).map(s => makeSkillChip(s, 'missing')), allTechMissing.length);

  // Soft skills
  const softChips = [
    ...allSoftMatched.slice(0, 4).map(s => makeSkillChip(s, 'soft-matched')),
    ...allSoftMissing.slice(0, 4).map(s => makeSkillChip(s, 'soft-missing')),
  ];
  fillSkillGroup('soft-group', 'soft-chips', null, softChips);

  const hasAny = allTechMissing.length || allTechMatched.length || allSoftMissing.length || allSoftMatched.length;
  section.style.display = hasAny ? 'flex' : 'none';

  const emptyNoteEl = document.getElementById('skills-empty-note');
  if (emptyNoteEl) emptyNoteEl.style.display = hasAny ? 'none' : 'flex';
  document.getElementById('state-results')?.classList.toggle('is-compact', !hasAny);

  return allTechMissing;
}

function makeAtsImprovementRow(text) {
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
}

// ── ATS Improvements ───────────────────────────────────────────────────────
function renderAtsImprovements(score, allTechMissing) {
  const improvements = [];
  if (allTechMissing.length > 0) improvements.push(`Add ${allTechMissing.slice(0,3).join(', ')} to Skills`);
  if (score < 70) improvements.push('Improve Professional Summary');
  if (allTechMissing.length > 3) improvements.push('Add missing ATS keywords');
  if (!improvements.length) return;

  const atsSection = document.getElementById('ats-improvements');
  const atsItems   = document.getElementById('ats-items');
  if (!atsSection || !atsItems) return;

  atsSection.style.display = 'block';
  atsItems.replaceChildren(...improvements.map(makeAtsImprovementRow));
}

function showResultsState(score, jobMeta, structuredSkills = {}) {
  showState('results');
  applyJobInfo(jobMeta);
  const pctEl = applyScorePercent(score);
  animateScoreArc(score, pctEl);
  applyScoreLabel(score);
  const allTechMissing = renderSkillGroups(structuredSkills);
  if (allTechMissing) renderAtsImprovements(score, allTechMissing);
}

// ─── Wire up results state buttons (idempotent) ───────────────────────────────
let _resultsSetup = false;
function setupResultsState() {
  if (_resultsSetup) return;
  _resultsSetup = true;

  document.getElementById('btn-improve-resume').addEventListener('click', async () => {
    if (!cachedResumeId || !cachedJdText) {
      alert('Session expired. Please analyze again.');
      await applyStoredJD();
      return;
    }
    await doTailor(cachedJdText, cachedJobMeta, cachedResumeId);
  });

  document.getElementById('btn-result-try-again').addEventListener('click', async () => {
    const detectedJD = await getActiveDetectedJD();
    if (detectedJD) applyJDContent(detectedJD);
    else showState('idle');
  });

}

// ─── File input handlers ──────────────────────────────────────────────────────
let selectedFile = null;
let jdIsDetected = false;

function updateIdleActionButtons(ready) {
  ['btn-idle-get-started', 'btn-manual-tailor', 'btn-cover-letter-idle'].forEach((id) => {
    const button = document.getElementById(id);
    if (button) button.disabled = !ready;
  });
}

function updateIdleStatusLabel(hasJobDescription) {
  const status = document.querySelector('#state-idle .jdt-label');
  if (status) status.textContent = hasJobDescription ? 'Job description added' : 'No job description added';
}

function idleHelpText(hasResume, hasJobDescription) {
  if (!hasResume && !hasJobDescription) return 'Add a resume and job description to continue';
  if (!hasResume) return 'Add a resume to continue';
  return 'Add a job description to continue';
}

function updateIdleActionsHelp(ready, hasResume, hasJobDescription) {
  const helpEl = document.getElementById('idle-actions-help');
  if (!helpEl) return;
  helpEl.hidden = ready;
  if (!ready) helpEl.textContent = idleHelpText(hasResume, hasJobDescription);
}

function syncIdleActions() {
  const hasResume = Boolean(selectedFile);
  const hasJobDescription = Boolean(document.getElementById('manual-jd-input')?.value?.trim());
  const ready = hasResume && hasJobDescription;

  updateIdleActionButtons(ready);
  if (!ready) closeIdleActionMenu();
  updateIdleStatusLabel(hasJobDescription);

  document.getElementById('idle-step-number-1')?.classList.toggle('is-complete', hasResume);
  document.getElementById('idle-step-number-2')?.classList.toggle('is-complete', hasJobDescription);

  updateIdleActionsHelp(ready, hasResume, hasJobDescription);
}

function openIdleActionMenu() {
  const backdrop = document.getElementById('idle-action-modal-backdrop');
  const btn = document.getElementById('btn-idle-get-started');
  if (!backdrop || !btn || btn.disabled) return;
  backdrop.classList.remove('hidden');
  btn.setAttribute('aria-expanded', 'true');
}

function closeIdleActionMenu() {
  const backdrop = document.getElementById('idle-action-modal-backdrop');
  const btn = document.getElementById('btn-idle-get-started');
  if (backdrop) backdrop.classList.add('hidden');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

function bindFileInput(inputId, displayId) {
  const input   = document.getElementById(inputId);
  const display = document.getElementById(displayId);
  if (!input || !display) return;
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;

    const validationError = validateResumeFile(file);
    if (validationError) {
      alert(validationError);
      input.value = '';
      selectedFile = null;
      display.textContent = 'No file selected';
      syncIdleActions();
      return;
    }

    selectedFile = file;
    display.textContent = file.name;
    display.title = file.name;
    // Enable analyze button only when both file and JD text are present
    syncIdleActions();
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
      if (expanded) {
        requestAnimationFrame(() => {
          expandArea.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
      }
    };
    toggleBtn.addEventListener('click', clickHandler);
    if (row) {
      row.addEventListener('click', (e) => {
        if (!toggleBtn.contains(e.target)) clickHandler();
      });
    }
  }
  // Enable analyze only when both JD text and a resume file are present
  if (jdInput) {
    jdInput.addEventListener('input', () => {
      // Once the user edits detected text, it is their draft and must survive
      // tab changes or removal/expiry of the stored auto-detection.
      jdIsDetected = false;
      syncIdleActions();
    });
  }
}

// ─── Poll for login while login state is visible ──────────────────────────────
// Backs off from 2s up to 30s, and stops entirely after ~10 minutes so an
// abandoned login-state popup doesn't hammer the backend forever.
let _loginPollTimer  = null;
let _loginPollDelay  = 2000;
const LOGIN_POLL_MAX_DELAY = 30000;
const LOGIN_POLL_MAX_TOTAL = 10 * 60 * 1000;
let _loginPollStartedAt = 0;

function startLoginPoll() {
  if (_loginPollTimer) return;
  _loginPollDelay = 2000;
  _loginPollStartedAt = Date.now();
  scheduleNextLoginPoll();
}

function scheduleNextLoginPoll() {
  _loginPollTimer = setTimeout(async () => {
    // Stop polling if login state is no longer visible
    if (states.login?.classList.contains('hidden')) {
      stopLoginPoll();
      return;
    }
    if (Date.now() - _loginPollStartedAt > LOGIN_POLL_MAX_TOTAL) {
      stopLoginPoll();
      return;
    }
    try {
      const user = await verifyExtensionUser();
      stopLoginPoll();
      updateProfileCard(user);
      unlockRail(true);
      setupIdleState();
      await applyStoredJD(user);
      return;
    } catch { /* still not signed in */ }
    _loginPollDelay = Math.min(_loginPollDelay * 1.5, LOGIN_POLL_MAX_DELAY);
    scheduleNextLoginPoll();
  }, _loginPollDelay);
}

function stopLoginPoll() {
  if (_loginPollTimer) { clearTimeout(_loginPollTimer); _loginPollTimer = null; }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  showState('loading');

  let user;
  try {
    user = await verifyExtensionUser();
  } catch {
    updateProfileCard(null);
    showState('login');
    startLoginPoll();
    return;
  }

  updateProfileCard(user);
  unlockRail(true);

  // Set up idle state once (event listeners attached once here)
  setupIdleState();

  // Check for auto-detected JD and show correct state
  await applyStoredJD(user);

  // Live update: scraper fires AFTER popup opens. This can also fire for a
  // background tab's scraper (e.g. a delayed re-scrape on another open job
  // tab) while the panel is showing a different, currently-active tab — so
  // it needs the same active-tab check applyStoredJD() uses, or it silently
  // overwrites the panel with an unrelated job's JD.
  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== 'local') return;
    if (changes.detectedJD?.newValue) {
      if (await isDetectedJDForActiveTab(changes.detectedJD.newValue)) {
        applyJDContent(changes.detectedJD.newValue);
      }
    } else if (changes.detectedJD && !changes.detectedJD.newValue) {
      clearIdleDetectedJob();
      // JD was cleared — go back to idle
      showState('idle');
    }
  });

  // Re-check when popup regains focus. If the user signed in on the web while
  // the side panel stayed open, detect the new web auth cookie and unlock.
  window.addEventListener('focus', async () => {
    if (!states.login?.classList.contains('hidden')) {
      try {
        user = await verifyExtensionUser();
        stopLoginPoll();
        updateProfileCard(user);
        unlockRail(true);
        setupIdleState();
      } catch {
        return;
      }
    }
    applyStoredJD(user);
  });
}

// Re-sync when the active tab changes. The side panel is a single persistent
// instance per window — it does NOT reload on tab switches — so without this,
// switching away (e.g. to sign in on a new tab, opened by either the initial
// `init()` login-screen path or the separate login-poll success path) and back
// leaves it stuck on whatever state it last computed instead of re-showing the
// detected JD. Registered at top level (not inside init()) so it's active no
// matter which auth path the user takes.
chrome.tabs.onActivated.addListener(() => {
  if (!states.login?.classList.contains('hidden')) return; // still signing in
  const activeStateName = Object.keys(states).find(
    (name) => !states[name]?.classList.contains('hidden')
  );
  // Don't yank the user out of an in-progress flow just because they alt-tabbed —
  // unless 'processing' has been showing far longer than the WHOLE flow can
  // legitimately take. That only happens when a flow got stuck without ever
  // reaching 'idle'/'results' (e.g. window.close() is a no-op in a side panel,
  // so a completed flow can otherwise be left parked here forever) — in which
  // case this is the only thing left that can bring the panel back.
  //
  // Budget the longest flow, not one call: doTailor issues four sequential
  // fetchWithTimeout calls and analyzeScore three. One of them (the resume
  // upload) is allowed RESUME_UPLOAD_TIMEOUT_MS, the rest API_TIMEOUT_MS —
  // using a single call's timeout here reset a genuinely running analysis
  // (large upload + cold parse) the moment the user switched tabs, discarding
  // the in-flight results.
  const isStaleProcessing =
    activeStateName === 'processing' &&
    Date.now() - processingSince > RESUME_UPLOAD_TIMEOUT_MS + (MAX_FLOW_CALLS - 1) * API_TIMEOUT_MS + 5000;
  // 'loading' bails out too: init() shows it while verifyExtensionUser() is in
  // flight, and it hides state-login — so the sign-in guard above passes. A tab
  // switch inside that round-trip would otherwise fall through to the full idle
  // UI for a user who isn't authenticated yet (unlockRail(true) never having
  // run), then snap back to the login state when the request rejects.
  if (['loading', 'processing', 'results', 'coverLetter'].includes(activeStateName) && !isStaleProcessing) return;
  applyStoredJD();
});

// ─── Get the currently active browser tab (not popup/extension pages) ────────
async function getActiveBrowserTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
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

// Only true if this detection belongs to the currently active browser tab.
// Prevents showing Naukri JD when user switches to (or is looking at) a
// Glassdoor tab — or any other tab, including an unsupported site like Dice
// that has no scraper of its own but still shares this one global storage key.
async function isDetectedJDForActiveTab(detectedJD) {
  const activeTab = await getActiveBrowserTab();
  return !(activeTab && detectedJD.tabId && detectedJD.tabId !== activeTab.id);
}

// Storage is a single shared slot written by whichever tab's content script
// last fired — including background tabs, whose detection can be delayed by
// Chrome's timer throttling and land after the user has switched away. Every
// read of 'detectedJD' must go through this so a stale write from a
// different tab can't resurface in the panel (nav clicks, error recovery,
// "try again"/back buttons, etc.), not just the initial load.
async function getActiveDetectedJD() {
  const { detectedJD } = await chrome.storage.local.get('detectedJD').catch(() => ({}));
  if (!detectedJD) return null;
  return (await isDetectedJDForActiveTab(detectedJD)) ? detectedJD : null;
}

// ─── Read storage and apply the right state ────────────────────────────────────
async function applyStoredJD(_user) {
  const { detectedJD } = await chrome.storage.local.get('detectedJD');
  if (detectedJD) {
    // Discard JDs older than 10 minutes
    const age = Date.now() - (detectedJD.timestamp || 0);
    if (age > 10 * 60 * 1000) {
      await chrome.storage.local.remove('detectedJD');
      clearIdleDetectedJob();
      showState('idle');
      return false;
    }

    if (!(await isDetectedJDForActiveTab(detectedJD))) {
      clearIdleDetectedJob();
      showState('idle');
      return false;
    }

    applyJDContent(detectedJD);
    return true;
  }
  clearIdleDetectedJob();
  showState('idle');
  return false;
}

// ─── Fill JD into the detected state (safe to call multiple times) ────────────
function applyJDContent(detectedJD) {
  setupIdleState();
  showState('idle');

  const jdTextarea = document.getElementById('manual-jd-input');
  // A stored detection may be re-applied on focus/tab activation. Never let it
  // overwrite a non-empty draft that the user pasted or edited in the panel.
  if (jdTextarea?.value?.trim() && !jdIsDetected) {
    syncIdleActions();
    return;
  }
  if (jdTextarea) {
    jdTextarea.value = detectedJD.jd || '';
    jdIsDetected = true;
  }

  const bannerEl  = document.getElementById('idle-detected-job');
  const titleEl   = document.getElementById('idle-detected-title');
  const companyEl = document.getElementById('idle-detected-company');
  const actionEl  = document.getElementById('idle-jd-action-label');
  bannerEl?.classList.remove('hidden');
  if (titleEl) titleEl.textContent = detectedJD.meta?.title || 'Detected job';
  if (companyEl) companyEl.textContent = detectedJD.meta?.company || '';
  if (actionEl) actionEl.textContent = 'Edit';

  syncIdleActions();
  updateDetectPill(true, detectedJD.meta?.company, detectedJD.meta?.title);
}

function clearIdleDetectedJob() {
  document.getElementById('idle-detected-job')?.classList.add('hidden');
  const jdTextarea = document.getElementById('manual-jd-input');
  const actionEl = document.getElementById('idle-jd-action-label');
  if (jdTextarea && jdIsDetected) jdTextarea.value = '';
  jdIsDetected = false;
  if (actionEl) actionEl.textContent = jdTextarea?.value?.trim() ? 'Edit' : 'Paste';
  syncIdleActions();
}

// ─── Idle state — set up once ─────────────────────────────────────────────────
let _idleSetup = false;
function setupIdleState() {
  if (_idleSetup) return;
  _idleSetup = true;

  bindFileInput('resume-file-input', 'idle-resume-name');
  setupJDToggles();

  document.getElementById('btn-manual-tailor').addEventListener('click', async () => {
    closeIdleActionMenu();
    const jdText = document.getElementById('manual-jd-input')?.value?.trim();
    if (!jdText) { alert('Please paste a job description.'); return; }
    const detectedJD = await getActiveDetectedJD();
    // Only attach the stored detection's metadata when this JD text actually
    // IS that detection. A stored JD survives a tab switch (applyStoredJD
    // clears the banner and textarea but deliberately keeps storage, so
    // switching back restores it) — without this gate a JD pasted by hand on
    // another tab would be persisted server-side under the previous job's
    // title/company/url.
    await analyzeScore(jdText, jdIsDetected ? (detectedJD?.meta ?? null) : null, selectedFile, null);
  });

  document.getElementById('btn-cover-letter-idle')?.addEventListener('click', () => {
    closeIdleActionMenu();
    generateCoverLetter();
  });

  document.getElementById('btn-idle-get-started')?.addEventListener('click', openIdleActionMenu);
  document.getElementById('btn-idle-action-modal-close')?.addEventListener('click', closeIdleActionMenu);
  document.getElementById('idle-action-modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'idle-action-modal-backdrop') closeIdleActionMenu();
  });
  document.getElementById('idle-paste-action')?.addEventListener('click', () => {
    const expandArea = document.getElementById('jd-expand-area');
    if (expandArea?.classList.contains('hidden')) {
      document.getElementById('jd-toggle-btn')?.click();
    }
    requestAnimationFrame(() => document.getElementById('manual-jd-input')?.focus());
  });

  document.getElementById('idle-detected-dismiss')?.addEventListener('click', async () => {
    await chrome.storage.local.remove('detectedJD');
    chrome.action.setBadgeText({ text: '' });
    clearIdleDetectedJob();
  });

  document.getElementById('njn-try-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://www.linkedin.com/jobs/' });
  });
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
  jdText = clampJdText(jdText);
  showState('processing');
  const stepEl = document.getElementById('processing-step');

  const setStep = (text) => {
    if (stepEl) stepEl.textContent = text;
  };

  try {
    setStep('Creating session…');

    const payload = {
      job_description: jdText,
      // Keep null on the wire when genuinely absent — 'Untitled Position'/
      // 'Not specified' are display-only placeholders, not real values, and
      // persisting them server-side would make them indistinguishable from
      // an actual job title/company in match history and analytics.
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

    setStep('Opening portal…');

    const portalUrl = `${PORTAL_URL}/jobmatch/app?session=${session.session_id}`;
    await openPortalUrl(portalUrl);

    setStep('Done!');
    await chrome.storage.local.remove('detectedJD');
    chrome.action.setBadgeText({ text: '' });
    // window.close() is a no-op for Chrome side panels (unlike a classic popup,
    // nothing closes it here) — so this flow must hand the UI back to idle
    // itself, or the panel is left parked on "Done!" indefinitely.
    setTimeout(() => { clearIdleDetectedJob(); showState('idle'); }, 600);

  } catch (err) {
    showState('idle');
    alert(`Failed: ${err.message}`);
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
  if (!states.login?.classList.contains('hidden')) return;
  setNavActive('sb-analyze');
  const detectedJD = await getActiveDetectedJD();
  if (detectedJD) applyJDContent(detectedJD);
  else showState('idle');
});

document.getElementById('sb-dashboard')?.addEventListener('click', () => {
  if (!states.login?.classList.contains('hidden')) return;
  setNavActive('sb-dashboard');
  openPortalUrl(`${PORTAL_URL}/dashboard`);
});

document.getElementById('sb-profile')?.addEventListener('click', () => {
  openPortalUrl(`${PORTAL_URL}/dashboard/profile`);
});

// ─── Profile popover: update based on auth state ──────────────────────────────
function applySidebarProfile(displayName, email) {
  const srpName  = document.getElementById('srp-name');
  const srpEmail = document.getElementById('srp-email');
  const srAvatar = document.getElementById('sr-avatar-initials');
  if (srpName)  srpName.textContent  = displayName;
  if (srpEmail) srpEmail.textContent = email;
  if (srAvatar) srAvatar.textContent = (displayName[0] || 'U').toUpperCase();
}

function applySignOutButton(btnEl) {
  if (!btnEl) return;
  btnEl.textContent = 'Sign Out';
  btnEl.className   = 'rpc-btn danger';
  btnEl.onclick = async () => {
    try {
      await fetchWithTimeout(`${PORTAL_URL}/api/backend/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch { /* silent */ }
    await clearAuthCookies();
    updateProfileCard(null);
    unlockRail(false);
    showState('login');
    startLoginPoll();
  };
}

// Avatar image if available — only allow http(s) URLs from the API response.
function applyProfileAvatar(avatarEl, user) {
  if (!avatarEl || !user.avatar || !isSafeHttpUrl(user.avatar)) return;
  const img = document.createElement('img');
  img.src = user.avatar;
  img.alt = '';
  img.referrerPolicy = 'no-referrer';
  avatarEl.replaceChildren(img);
}

function applyLoggedInProfile(user, nameEl, subEl, btnEl, avatarEl) {
  const displayName = user.name || user.full_name || user.email || 'My Account';
  const email       = user.email || '';
  if (nameEl) nameEl.textContent = displayName;
  if (subEl)  subEl.textContent  = email;

  // Populate sidebar profile popover and header avatar
  applySidebarProfile(displayName, email);
  applySignOutButton(btnEl);
  applyProfileAvatar(avatarEl, user);
}

function applyLoggedOutProfile(nameEl, subEl, btnEl) {
  if (nameEl) nameEl.textContent = 'Profile';
  if (subEl)  subEl.textContent  = 'Sign in to access your profile';
  if (btnEl) {
    btnEl.textContent = 'Sign In';
    btnEl.className   = 'rpc-btn';
    btnEl.onclick = () => openPortalUrl(`${PORTAL_URL}/?showLogin=true`);
  }
  const srpName  = document.getElementById('srp-name');
  const srpEmail = document.getElementById('srp-email');
  const srAvatar = document.getElementById('sr-avatar-initials');
  if (srpName)  srpName.textContent  = 'My Account';
  if (srpEmail) srpEmail.textContent = '';
  if (srAvatar) srAvatar.textContent = '';
}

function updateProfileCard(user) {
  const nameEl   = document.getElementById('rpc-name');
  const subEl    = document.getElementById('rpc-sub');
  const btnEl    = document.getElementById('rpc-action-btn');
  const avatarEl = document.getElementById('rpc-avatar-wrap');

  if (user) {
    applyLoggedInProfile(user, nameEl, subEl, btnEl, avatarEl);
  } else {
    applyLoggedOutProfile(nameEl, subEl, btnEl);
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
  openPortalUrl(`${PORTAL_URL}/dashboard`);
});

document.getElementById('srp-signout')?.addEventListener('click', async () => {
  profilePopover?.classList.remove('open');
  try {
    await fetchWithTimeout(`${PORTAL_URL}/api/backend/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch { /* silent */ }
  await clearAuthCookies();
  await chrome.storage.local.remove('detectedJD');
  chrome.action.setBadgeText({ text: '' });
  updateProfileCard(null);
  unlockRail(false);
  showState('login');
  startLoginPoll();
});

document.getElementById('sb-feedback')?.addEventListener('click', () => {
  setNavActive('sb-feedback');
  openPortalUrl(`${PORTAL_URL}/feedback`);
});

document.getElementById('sb-settings')?.addEventListener('click', () => {
  openPortalUrl(`${PORTAL_URL}/dashboard/profile`);
});


// ─── Auth buttons ─────────────────────────────────────────────────────────────
function openLoginTab() {
  openPortalUrl(`${PORTAL_URL}/?showLogin=true`);
}

document.getElementById('btn-login')?.addEventListener('click', openLoginTab);
document.getElementById('btn-login-simple')?.addEventListener('click', openLoginTab);
document.getElementById('btn-login-new')?.addEventListener('click', openLoginTab);
document.getElementById('btn-login-link')?.addEventListener('click', openLoginTab);
document.getElementById('btn-signup')?.addEventListener('click', () => {
  openPortalUrl(`${PORTAL_URL}/signup`);
});
document.getElementById('btn-signup-new')?.addEventListener('click', () => {
  openPortalUrl(`${PORTAL_URL}/signup`);
});
document.getElementById('footer-logout')?.addEventListener('click', async () => {
  try {
    await fetchWithTimeout(`${PORTAL_URL}/api/backend/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch { /* silent */ }
  await clearAuthCookies();
  updateProfileCard(null);
  unlockRail(false);
  showState('login');
  startLoginPoll();
});
document.getElementById('footer-settings')?.addEventListener('click', () => {
  openPortalUrl(`${PORTAL_URL}/dashboard/profile`);
});

// ─── Cover Letter ─────────────────────────────────────────────────────────────
function resolveJdTextAndMeta(typedJd, detectedJD) {
  const jdText = clampJdText(typedJd || detectedJD?.jd || '');
  // Same gate as the Analyze path: the stored metadata only describes the
  // stored JD. It applies when the text came from storage (empty textarea) or
  // when the textarea still holds that untouched detection — never to a JD
  // the user pasted themselves.
  const jobMeta = (!typedJd || jdIsDetected) ? (detectedJD?.meta || {}) : {};
  return { jdText, jobMeta };
}

function setCoverLetterHeaderLabel(jobMeta) {
  const label = [jobMeta.title, jobMeta.company].filter(Boolean).join(' · ');
  const labelEl = document.getElementById('cl-job-label');
  if (labelEl) labelEl.textContent = label || 'Cover Letter';
}

// Step 1: resolve parsed_resume_id.
// Priority: cachedResumeId (set after Analyze) → upload selectedFile
async function resolveParsedResumeId() {
  let parsedResumeId = cachedResumeId || null;
  if (!parsedResumeId && selectedFile) {
    parsedResumeId = await uploadResume(selectedFile);
  }
  if (!parsedResumeId) throw new Error('No resume found. Please upload a resume first.');
  return parsedResumeId;
}

function showCoverLetterError(err, errorEl) {
  const errMsgEl = document.getElementById('cl-error-msg');
  if (errMsgEl) errMsgEl.textContent = err?.message || 'Failed to generate. Please try again.';
  errorEl.classList.remove('hidden');
}

// Hands off to the web app's own Cover Letter form (pre-filled with the
// scraped JD + resume) instead of calling /cover-letter/generate directly
// from here. This used to be a second, independently-maintained request
// builder — and it kept drifting from the web form's request (missing
// candidate name, tone, company location, ...), producing worse letters
// than the exact same resume+JD generated through the web app. Reusing the
// web form as the single generation code path makes that class of drift
// impossible instead of chasing each missing field one at a time.
//
// Uses the same /extension/prefill → session_id handoff that "Improve
// Resume" already uses to open JobMatch (see doTailor above) — a server-
// side session avoids URL-length limits (a JD can be up to 50k chars) and
// the web page already knows how to resolve one.
async function generateCoverLetter() {
  const detectedJD = await getActiveDetectedJD();
  const typedJd = document.getElementById('manual-jd-input')?.value?.trim();
  const { jdText, jobMeta } = resolveJdTextAndMeta(typedJd, detectedJD);

  if (!jdText) {
    alert('No job description found. Please paste a job description first.');
    return;
  }

  showState('coverLetter');
  setCoverLetterHeaderLabel(jobMeta);

  const genEl   = document.getElementById('cl-generating');
  const errorEl = document.getElementById('cl-error');
  genEl.classList.remove('hidden');
  errorEl.classList.add('hidden');

  try {
    // A resume isn't required to open the form — if none is cached/uploaded
    // yet, the web form's own upload/picker UI handles it, same as a user
    // landing on that page directly.
    let parsedResumeId = null;
    try {
      parsedResumeId = await resolveParsedResumeId();
    } catch {
      parsedResumeId = null;
    }

    const session = await apiFetch('/extension/prefill', {
      method: 'POST',
      body: JSON.stringify({
        job_description: jdText,
        job_title:       jobMeta?.title    || null,
        company:         jobMeta?.company  || null,
        job_location:    jobMeta?.location || null,
        job_url:         jobMeta?.url      || null,
        resume_id:       parsedResumeId,
      }),
    });

    // Must finish BEFORE closing the panel — window.close() is not reliably
    // a no-op here, and closing while the tab query/update is still in
    // flight can kill that pending navigation.
    await openPortalUrl(`${PORTAL_URL}/cover-letter/new?session=${session.session_id}`);
    window.close();
  } catch (err) {
    genEl.classList.add('hidden');
    showCoverLetterError(err, errorEl);
  }
}

document.getElementById('btn-cl-regenerate')?.addEventListener('click', generateCoverLetter);

document.getElementById('btn-cl-back')?.addEventListener('click', async () => {
  const detectedJD = await getActiveDetectedJD();
  if (detectedJD) applyJDContent(detectedJD);
  else showState('idle');
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
  }).catch(() => {
    alert('Could not copy to clipboard. Please select and copy the text manually.');
  });
});

document.getElementById('btn-cl-open-web')?.addEventListener('click', () => {
  openPortalUrl(`${PORTAL_URL}/cover-letter`);
});

// ─── Start ────────────────────────────────────────────────────────────────────
init().catch(console.error);
