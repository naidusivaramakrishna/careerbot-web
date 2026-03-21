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
    showState('login');
    return;
  }

  // Check for auto-detected JD
  const { detectedJD } = await chrome.storage.local.get('detectedJD');

  if (detectedJD) {
    showJDState(detectedJD);
  } else {
    showIdleState(user);
  }
}

// ─── Idle state ───────────────────────────────────────────────────────────────
async function showIdleState(user) {
  showState('idle');
  bindFileInput('resume-file-input', 'file-name-display', 'idle');
  loadResumesIntoSelect(document.getElementById('resume-select'));

  document.getElementById('btn-manual-tailor').addEventListener('click', async () => {
    const jdText = document.getElementById('manual-jd-input')?.value?.trim();
    if (!jdText) { alert('Please paste a job description.'); return; }
    const resumeId = await resolveResumeId(selectedFile, document.getElementById('resume-select')?.value || null);
    await doTailor(jdText, null, resumeId);
  });

  document.getElementById('btn-cover-letter')?.addEventListener('click', async () => {
    const jdText = document.getElementById('manual-jd-input').value.trim();
    if (!jdText) { alert('Please paste a job description.'); return; }
    chrome.tabs.create({ url: `${PORTAL_URL}/dashboard` });
  });

  document.getElementById('card-dashboard')?.addEventListener('click', () => {
    chrome.tabs.create({ url: `${PORTAL_URL}/dashboard` });
  });
}

// ─── JD Detected state ────────────────────────────────────────────────────────
function showJDState(detectedJD) {
  showState('jdDetected');
  bindFileInput('resume-file-input-jd', 'file-name-display-jd', 'jd');
  loadResumesIntoSelect(document.getElementById('jd-resume-select'));

  // Auto-fill JD textarea
  const jdTextarea = document.getElementById('jd-textarea-main');
  if (jdTextarea) jdTextarea.value = detectedJD.jd || '';

  // Hidden compat elements
  const titleEl   = document.getElementById('jd-job-title');
  const companyEl = document.getElementById('jd-company');
  if (titleEl)   titleEl.textContent   = detectedJD.meta?.title   || '';
  if (companyEl) companyEl.textContent = detectedJD.meta?.company || '';

  document.getElementById('btn-tailor').addEventListener('click', async () => {
    const jdText = document.getElementById('jd-textarea-main')?.value?.trim();
    if (!jdText) { alert('Job description is empty.'); return; }
    const resumeId = await resolveResumeId(selectedFileJD, document.getElementById('jd-resume-select')?.value || null);
    await doTailor(jdText, detectedJD.meta, resumeId);
  });

  document.getElementById('btn-cover-letter-jd')?.addEventListener('click', () => {
    chrome.tabs.create({ url: `${PORTAL_URL}/dashboard` });
  });

  document.getElementById('btn-dismiss').addEventListener('click', async () => {
    await chrome.storage.local.remove('detectedJD');
    chrome.action.setBadgeText({ text: '' });
    showState('idle');
    showIdleState({});
  });

  document.getElementById('card-dashboard-jd')?.addEventListener('click', () => {
    chrome.tabs.create({ url: `${PORTAL_URL}/dashboard` });
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
document.getElementById('open-site')?.addEventListener('click', () => {
  chrome.tabs.create({ url: PORTAL_URL });
});

// ─── Start ────────────────────────────────────────────────────────────────────
init().catch(console.error);
