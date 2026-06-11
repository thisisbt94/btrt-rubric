const STORE_KEY = 'btrtAwardsRealMockV6BlindFiles';
const LOGIN_CODE = 'BTRT2026';
const MAX_FILE_BYTES = 1.5 * 1024 * 1024;
const MAX_FILE_COUNT = 5;

const criteria = [
  { key: 'values', label: 'Values Demonstration', weight: 40 },
  { key: 'impact', label: 'Impact (Business + People)', weight: 30 },
  { key: 'scale', label: 'Scale & Influence', weight: 10 },
  { key: 'difficulty', label: 'Difficulty & Context', weight: 10 },
  { key: 'story', label: 'Story & Evidence Strength', weight: 10 }
];

let reviewerMode = sessionStorage.getItem('btrtReviewerMode') === 'true';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function emptyState() {
  return { nominations: [], scores: {}, webhookUrl: '' };
}

function getState() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || emptyState();
  } catch (error) {
    return emptyState();
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    renderAll();
  } catch (error) {
    console.error(error);
    toast('Could not save. Files may be too large for browser storage. Try smaller attachments.');
  }
}

function makeId() {
  return `BTRT-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttribute(value = '') {
  return escapeHtml(value).replaceAll('`', '&#096;');
}

function formToObject(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  data.values = new FormData(form).getAll('values');
  return data;
}

function statusClass(status = '') {
  return status.toLowerCase().replaceAll(' / ', '-').replaceAll(' ', '-');
}

function weightedTotal(ratings = {}) {
  return criteria.reduce((sum, item) => sum + ((Number(ratings[item.key]) || 0) * item.weight / 5), 0);
}

function toast(message) {
  const node = $('#toast');
  node.textContent = message;
  node.classList.add('show');
  setTimeout(() => node.classList.remove('show'), 2600);
}

function requireReviewer(tabId) {
  if (tabId === 'nominate' || reviewerMode) return true;
  $('#loginDialog').showModal();
  toast('Please enter the single demo passcode first.');
  return false;
}

function switchTab(tabId) {
  if (!requireReviewer(tabId)) return;
  $$('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === tabId));
  $$('.panel').forEach((panel) => panel.classList.toggle('active', panel.id === tabId));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateRoleUI() {
  $('#roleBadge').textContent = reviewerMode ? 'Reviewer / Judge Mode' : 'Employee View';
  $('#openLogin').classList.toggle('hidden', reviewerMode);
  $('#logoutBtn').classList.toggle('hidden', !reviewerMode);
  $$('.protected').forEach((tab) => tab.classList.toggle('locked', !reviewerMode));
}

function renderStats() {
  const state = getState();
  const nominations = state.nominations;
  const finalistCount = nominations.filter((n) => n.status === 'Finalist').length;
  const directorCount = nominations.filter((n) => ['Director Endorsed', 'Finalist'].includes(n.status)).length;
  const reviewCount = nominations.filter((n) => ['HR / HOD Review', 'More Info Needed', 'Director Endorsed', 'Finalist', 'Not Shortlisted'].includes(n.status)).length;
  const scoredFinalists = nominations.filter((n) => getAverageScore(n.id).count > 0).length;
  const attachmentCount = nominations.reduce((sum, n) => sum + (n.attachments?.length || 0), 0);
  const stats = [
    ['Peer Nominations', nominations.length],
    ['HR/HOD Reviewed', reviewCount],
    ['Director Endorsed', directorCount],
    ['Finalists', finalistCount],
    ['Scored by Judges', scoredFinalists],
    ['Attachments', attachmentCount]
  ];
  $('#statsGrid').innerHTML = stats.map(([label, value]) => `<div class="stat-card"><strong>${value}</strong><span>${label}</span></div>`).join('');
}

function renderReviewList() {
  const state = getState();
  const query = ($('#reviewSearch')?.value || '').toLowerCase();
  const filter = $('#statusFilter')?.value || 'all';
  const nominations = state.nominations.filter((nom) => {
    const haystack = [
      nom.id,
      nom.nomineeName,
      nom.nominatorName,
      nom.nomineeCompany,
      nom.nomineeDepartment,
      nom.awardCategory,
      nom.values?.join(' '),
      nom.status
    ].join(' ').toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesFilter = filter === 'all' || nom.status === filter;
    return matchesQuery && matchesFilter;
  });

  if (!nominations.length) {
    $('#reviewList').innerHTML = `<div class="card"><h3>No nominations found</h3><p class="muted">Submit a nomination or use “Load Demo Data” to test the full workflow.</p></div>`;
    return;
  }

  $('#reviewList').innerHTML = nominations.map(renderReviewCard).join('');
  attachReviewCardEvents();
}

function renderReviewCard(nom) {
  const ratings = nom.review?.ratings || {};
  const total = weightedTotal(ratings);
  return `
    <article class="nom-card" data-id="${escapeAttribute(nom.id)}">
      <div class="nom-head">
        <div>
          <h3>${escapeHtml(nom.nomineeName)}</h3>
          <div class="id-line">${escapeHtml(nom.id)} • Submitted ${escapeHtml(nom.submittedAt)} by ${escapeHtml(nom.nominatorName)} (${escapeHtml(nom.relationship)})</div>
        </div>
        <span class="badge ${statusClass(nom.status)}">${escapeHtml(nom.status)}</span>
      </div>
      <div class="meta-grid">
        <div><span>Company</span><strong>${escapeHtml(nom.nomineeCompany)}</strong></div>
        <div><span>Department</span><strong>${escapeHtml(nom.nomineeDepartment)}</strong></div>
        <div><span>Category</span><strong>${escapeHtml(nom.awardCategory || 'Not selected')}</strong></div>
        <div><span>Values</span><strong>${escapeHtml((nom.values || []).join(', ') || 'Not selected')}</strong></div>
      </div>
      <div class="star-box">
        <p><strong>S:</strong> ${escapeHtml(nom.situation)}</p>
        <p><strong>T:</strong> ${escapeHtml(nom.task)}</p>
        <p><strong>A:</strong> ${escapeHtml(nom.action)}</p>
        <p><strong>R:</strong> ${escapeHtml(nom.result)}</p>
        ${nom.evidenceNotes ? `<p><strong>Additional notes:</strong> ${escapeHtml(nom.evidenceNotes)}</p>` : ''}
        ${nom.supportingLink ? `<p><strong>Supporting link:</strong> <a href="${escapeAttribute(nom.supportingLink)}" target="_blank" rel="noopener">Open link</a></p>` : ''}
      </div>
      <div class="review-attachments">
        <h4>Supporting attachments visible to HR/HOD</h4>
        ${renderAttachmentList(nom.attachments, { blind: false })}
      </div>
      <div class="review-controls">
        <label>Status
          <select data-field="status">
            ${['Peer Submitted', 'HR / HOD Review', 'More Info Needed', 'Director Endorsed', 'Finalist', 'Not Shortlisted'].map((s) => `<option ${nom.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </label>
        <label>Director approval confirmed?
          <select data-field="directorApproval">
            ${['Pending', 'Yes', 'No'].map((s) => `<option ${nom.directorApproval === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="review-grid">
        ${criteria.map((item) => `
          <label>${item.label}<small>${item.weight}% weight</small>
            <select data-rating="${item.key}">
              ${[1, 2, 3, 4, 5].map((score) => `<option value="${score}" ${Number(ratings[item.key] || 3) === score ? 'selected' : ''}>${score}</option>`).join('')}
            </select>
          </label>
        `).join('')}
      </div>
      <span class="total-pill">Company assessment: ${total.toFixed(1)} / 100</span>
      <label class="full" style="margin-top:12px;">Reviewer justification
        <textarea data-field="reviewJustification" placeholder="Brief justification for shortlist / finalist decision.">${escapeHtml(nom.review?.justification || '')}</textarea>
      </label>
      <div class="actions" style="margin-top:12px;">
        <button class="btn primary" data-action="save-review">Save Review</button>
        <button class="btn" data-action="make-finalist">Mark as Finalist</button>
        <button class="btn" data-action="needs-info">Request More Info</button>
      </div>
    </article>`;
}

function renderAttachmentList(attachments = [], options = {}) {
  const { blind = false } = options;
  if (!attachments.length) return `<div class="file-list empty">No attachments uploaded.</div>`;
  return `<div class="file-list">${attachments.map((file, index) => {
    const displayName = blind ? `Attachment ${index + 1}` : file.name;
    const label = `${displayName} • ${formatBytes(file.size)} • ${escapeHtml(file.type || 'file')}`;
    const href = file.dataUrl || '#';
    const downloadName = blind ? `BTRT-${index + 1}-${safeExtension(file.name)}` : file.name;
    return `<div class="file-item">
      <div>
        <strong>${escapeHtml(label)}</strong>
        ${blind ? `<small>Original filename hidden for blind scoring.</small>` : `<small>${escapeHtml(file.lastModified || '')}</small>`}
      </div>
      ${file.dataUrl ? `<a class="btn mini" href="${escapeAttribute(href)}" target="_blank" rel="noopener" download="${escapeAttribute(downloadName)}">Open</a>` : `<span class="muted">Metadata only</span>`}
    </div>`;
  }).join('')}</div>`;
}

function safeExtension(filename = 'file') {
  const match = filename.match(/\.([A-Za-z0-9]+)$/);
  return match ? `file.${match[1]}` : 'file';
}

function formatBytes(bytes = 0) {
  if (!bytes) return '0 KB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function attachReviewCardEvents() {
  $$('#reviewList [data-action="save-review"]').forEach((button) => button.addEventListener('click', () => saveReview(button.closest('.nom-card'))));
  $$('#reviewList [data-action="make-finalist"]').forEach((button) => button.addEventListener('click', () => {
    const card = button.closest('.nom-card');
    card.querySelector('[data-field="status"]').value = 'Finalist';
    card.querySelector('[data-field="directorApproval"]').value = 'Yes';
    saveReview(card);
  }));
  $$('#reviewList [data-action="needs-info"]').forEach((button) => button.addEventListener('click', () => {
    const card = button.closest('.nom-card');
    card.querySelector('[data-field="status"]').value = 'More Info Needed';
    saveReview(card);
  }));
}

function saveReview(card) {
  const id = card.dataset.id;
  const state = getState();
  const nom = state.nominations.find((item) => item.id === id);
  if (!nom) return;
  nom.status = card.querySelector('[data-field="status"]').value;
  nom.directorApproval = card.querySelector('[data-field="directorApproval"]').value;
  nom.review = {
    ratings: Object.fromEntries(criteria.map((item) => [item.key, Number(card.querySelector(`[data-rating="${item.key}"]`).value)])),
    justification: card.querySelector('[data-field="reviewJustification"]').value,
    updatedAt: new Date().toISOString()
  };
  saveState(state);
  toast(nom.status === 'Finalist' ? 'Saved. This finalist now appears in blind judge scoring.' : 'Review saved.');
}

function getFinalists() {
  return getState().nominations.filter((nom) => nom.status === 'Finalist');
}

function getBlindIdFor(nom) {
  const finalists = getFinalists();
  const index = finalists.findIndex((item) => item.id === nom.id);
  return `FINALIST-${String(index + 1).padStart(2, '0')}`;
}

function renderJudgeList() {
  const finalists = getFinalists();
  if (!finalists.length) {
    $('#judgeList').innerHTML = `<div class="card"><h3>No finalists yet</h3><p class="muted">Mark nominations as Finalist in the Review Workspace first, or load demo data.</p></div>`;
    renderRankingTable();
    return;
  }
  $('#judgeList').innerHTML = finalists.map(renderJudgeCard).join('');
  attachJudgeEvents();
  renderRankingTable();
}

function renderJudgeCard(nom, index) {
  const session = ($('#judgeSession')?.value || 'Anonymous Judge A').trim();
  const existing = getState().scores?.[nom.id]?.[session] || { ratings: {} };
  const ratings = existing.ratings || {};
  const blindId = `FINALIST-${String(index + 1).padStart(2, '0')}`;
  return `
    <article class="nom-card judge-card" data-id="${escapeAttribute(nom.id)}" data-step="story">
      <div class="nom-head">
        <div>
          <h3>${blindId}</h3>
          <div class="id-line">Blind scoring pack • Identity hidden from judges • ${escapeHtml(nom.awardCategory || 'No category')}</div>
        </div>
        <span class="badge finalist">Finalist</span>
      </div>

      <div class="judge-progress" aria-label="Judging steps">
        <button class="judge-step-pill active" data-action="judge-stage" data-next="story">1. Nomination Story</button>
        <button class="judge-step-pill" data-action="judge-stage" data-next="attachments">2. Attachments</button>
        <button class="judge-step-pill" data-action="judge-stage" data-next="score">3. Score</button>
      </div>

      <section class="judge-stage active" data-stage="story">
        <div class="blind-card">
          <strong>Blind identity check</strong>
          <p>Names, emails, company, department and nominator details are intentionally hidden here.</p>
        </div>
        <div class="meta-grid">
          <div><span>Category</span><strong>${escapeHtml(nom.awardCategory || 'Not selected')}</strong></div>
          <div><span>Values</span><strong>${escapeHtml((nom.values || []).join(', ') || 'Not selected')}</strong></div>
          <div><span>Impact Scope</span><strong>${escapeHtml(nom.impactScope)}</strong></div>
          <div><span>Evidence Strength</span><strong>${escapeHtml(nom.evidenceStrength || '-')}</strong></div>
        </div>
        <div class="star-box">
          <p><strong>Situation:</strong> ${escapeHtml(nom.situation)}</p>
          <p><strong>Task:</strong> ${escapeHtml(nom.task)}</p>
          <p><strong>Action:</strong> ${escapeHtml(nom.action)}</p>
          <p><strong>Result:</strong> ${escapeHtml(nom.result)}</p>
          ${nom.evidenceNotes ? `<p><strong>Additional context:</strong> ${escapeHtml(nom.evidenceNotes)}</p>` : ''}
          ${nom.supportingLink ? `<p><strong>Supporting link:</strong> <span class="muted">Hidden in mock blind view unless HR provides an anonymised link.</span></p>` : ''}
        </div>
        <div class="actions">
          <button class="btn primary" data-action="judge-next" data-next="attachments">Next: View Attachments</button>
        </div>
      </section>

      <section class="judge-stage" data-stage="attachments">
        <div class="blind-card warning">
          <strong>Attachment review</strong>
          <p>Original filenames are hidden. For a real blind judging process, HR should upload redacted files because the file content itself may still reveal names.</p>
        </div>
        ${renderAttachmentList(nom.attachments, { blind: true })}
        <div class="actions" style="margin-top:12px;">
          <button class="btn" data-action="judge-next" data-next="story">Back to Story</button>
          <button class="btn primary" data-action="judge-next" data-next="score">Next: Score Finalist</button>
        </div>
      </section>

      <section class="judge-stage" data-stage="score">
        <div class="score-grid">
          ${criteria.map((item) => `
            <label>${item.label}<small>${item.weight}% weight</small>
              <select data-score="${item.key}">
                ${[1, 2, 3, 4, 5].map((score) => `<option value="${score}" ${Number(ratings[item.key] || 3) === score ? 'selected' : ''}>${score}</option>`).join('')}
              </select>
            </label>
          `).join('')}
        </div>
        <label style="margin-top:12px;">Anonymous judge comments
          <textarea data-score-comment placeholder="Optional judging notes. Do not include nominee identity.">${escapeHtml(existing.comment || '')}</textarea>
        </label>
        <div class="actions" style="margin-top:12px;">
          <button class="btn" data-action="judge-next" data-next="attachments">Back to Attachments</button>
          <button class="btn primary" data-action="save-score">Save Anonymous Score</button>
        </div>
      </section>
    </article>`;
}

function attachJudgeEvents() {
  $$('#judgeList [data-action="save-score"]').forEach((button) => button.addEventListener('click', () => saveJudgeScore(button.closest('.nom-card'))));
  $$('#judgeList [data-action="judge-next"], #judgeList [data-action="judge-stage"]').forEach((button) => {
    button.addEventListener('click', () => setJudgeStage(button.closest('.judge-card'), button.dataset.next));
  });
}

function setJudgeStage(card, stage) {
  card.dataset.step = stage;
  card.querySelectorAll('.judge-stage').forEach((panel) => panel.classList.toggle('active', panel.dataset.stage === stage));
  card.querySelectorAll('.judge-step-pill').forEach((pill) => pill.classList.toggle('active', pill.dataset.next === stage));
}

function saveJudgeScore(card) {
  const session = ($('#judgeSession').value || 'Anonymous Judge A').trim();
  const state = getState();
  state.scores[card.dataset.id] = state.scores[card.dataset.id] || {};
  const ratings = Object.fromEntries(criteria.map((item) => [item.key, Number(card.querySelector(`[data-score="${item.key}"]`).value)]));
  state.scores[card.dataset.id][session] = {
    ratings,
    total: weightedTotal(ratings),
    comment: card.querySelector('[data-score-comment]').value,
    scoredAt: new Date().toISOString()
  };
  saveState(state);
  toast(`Anonymous score saved for ${session}.`);
}

function getAverageScore(nominationId) {
  const scores = Object.values(getState().scores?.[nominationId] || {});
  if (!scores.length) return { average: 0, count: 0 };
  const average = scores.reduce((sum, score) => sum + Number(score.total || 0), 0) / scores.length;
  return { average, count: scores.length };
}

function renderRankingTable() {
  const finalists = getFinalists()
    .map((nom, index) => ({ ...nom, blindId: `FINALIST-${String(index + 1).padStart(2, '0')}`, score: getAverageScore(nom.id) }))
    .sort((a, b) => b.score.average - a.score.average);
  const tbody = $('#rankingTable tbody');
  tbody.innerHTML = finalists.map((nom, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><strong>${escapeHtml(nom.blindId)}</strong><br><span class="muted">Identity hidden</span></td>
      <td>${escapeHtml(nom.awardCategory || '-')}</td>
      <td><span class="badge finalist">${escapeHtml(nom.status)}</span></td>
      <td>${nom.score.average ? nom.score.average.toFixed(1) : '-'}</td>
      <td>${nom.score.count}</td>
    </tr>`).join('');
}

function renderReports() {
  const state = getState();
  $('#webhookUrl').value = state.webhookUrl || '';
  const finalists = state.nominations.filter((n) => n.status === 'Finalist').map((n, index) => ({
    blindId: `FINALIST-${String(index + 1).padStart(2, '0')}`,
    internalId: n.id,
    nominee: n.nomineeName,
    company: n.nomineeCompany,
    category: n.awardCategory,
    values: n.values,
    attachments: (n.attachments || []).map((file) => ({ name: file.name, type: file.type, size: file.size })),
    companyScore: weightedTotal(n.review?.ratings || {}).toFixed(1),
    judgeAverage: getAverageScore(n.id).average.toFixed(1),
    judgeCount: getAverageScore(n.id).count
  }));
  $('#adminPreview').textContent = JSON.stringify({
    generatedAt: new Date().toISOString(),
    note: 'Static GitHub Pages mock. Data and uploaded mock files are stored in this browser only.',
    totalNominations: state.nominations.length,
    finalists
  }, null, 2);
}

function exportJson() {
  downloadFile('btrt-awards-blind-files-mock-export.json', JSON.stringify(getState(), null, 2), 'application/json');
}

function exportCsv() {
  const rows = [['ID', 'Status', 'Nominee', 'Company', 'Department', 'Category', 'Values', 'Nominator', 'Nominator Email', 'Director Approval', 'Attachment Count', 'Company Score', 'Judge Average', 'Judge Count']];
  getState().nominations.forEach((n) => {
    const avg = getAverageScore(n.id);
    rows.push([
      n.id,
      n.status,
      n.nomineeName,
      n.nomineeCompany,
      n.nomineeDepartment,
      n.awardCategory || '',
      (n.values || []).join('; '),
      n.nominatorName,
      n.nominatorEmail,
      n.directorApproval,
      n.attachments?.length || 0,
      weightedTotal(n.review?.ratings || {}).toFixed(1),
      avg.average ? avg.average.toFixed(1) : '',
      avg.count
    ]);
  });
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
  downloadFile('btrt-awards-blind-files-mock-export.csv', csv, 'text/csv');
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function copyJudgePack() {
  const finalists = getFinalists();
  const text = finalists.map((n, i) => {
    const avg = getAverageScore(n.id);
    return `FINALIST-${String(i + 1).padStart(2, '0')}\nCategory: ${n.awardCategory || '-'}\nValues: ${(n.values || []).join(', ')}\nSituation: ${n.situation}\nTask: ${n.task}\nAction: ${n.action}\nResult: ${n.result}\nAttachments: ${(n.attachments || []).length}\nJudge Average: ${avg.average ? avg.average.toFixed(1) : '-'} (${avg.count} anonymous score records)\n`;
  }).join('\n---\n');
  await navigator.clipboard.writeText(text || 'No finalists yet.');
  toast('Blind Finalist Judge Pack copied.');
}

function makeDemoAttachment(name, content, type = 'text/plain') {
  return {
    id: `file-${Math.random().toString(36).slice(2, 8)}`,
    name,
    type,
    size: new Blob([content], { type }).size,
    lastModified: today(),
    dataUrl: `data:${type};charset=utf-8,${encodeURIComponent(content)}`
  };
}

function makeScore(ratings, comment = '') {
  return { ratings, total: weightedTotal(ratings), comment, scoredAt: new Date().toISOString() };
}

function seedDemoData() {
  const demo = [
    {
      id: 'BTRT-DEMO1', submittedAt: '2026-07-05', status: 'Finalist', directorApproval: 'Yes',
      nominatorName: 'Asha Lee', nominatorEmail: 'asha.lee@example.com', nominatorCompany: 'YTL Creative Communications', relationship: 'Cross-company collaborator',
      nomineeName: 'Nadia Lim', nomineeEmail: 'nadia.lim@example.com', nomineeCompany: 'YTL Hotels', nomineeDepartment: 'Guest Experience', jobTitle: 'Assistant Manager', location: 'Kuala Lumpur, Malaysia', awardCategory: 'Customer / Community Impact',
      values: ['Togetherness', 'Vitality'], situation: 'A multi-property guest recovery issue was affecting several premium guests during a peak campaign period.',
      task: 'The nominee had to coordinate responses across hotel operations, brand, CRM and frontline teams while protecting the guest experience.',
      action: 'They created a same-day escalation tracker, aligned hotel teams on the response script and followed up with affected teams until cases were resolved.',
      result: 'The team closed all priority cases within 48 hours and used the tracker as the template for future peak-period guest recovery.',
      impactScope: 'Company / Business Unit', evidenceStrength: 'Strong measurable impact', evidenceNotes: 'Guest recovery tracker, CRM notes and thank-you note from operations.', supportingLink: '',
      attachments: [makeDemoAttachment('guest-recovery-impact-summary.txt', 'Mock attachment: guest recovery tracker summary. Priority cases closed within 48 hours. Repeatable process adopted for peak periods.')],
      review: { ratings: { values: 5, impact: 4, scale: 4, difficulty: 4, story: 5 }, justification: 'Clear cross-functional leadership and repeatable process.' }
    },
    {
      id: 'BTRT-DEMO2', submittedAt: '2026-07-08', status: 'Finalist', directorApproval: 'Yes',
      nominatorName: 'Daniel Ong', nominatorEmail: 'daniel.ong@example.com', nominatorCompany: 'YTL Cement', relationship: 'Direct manager',
      nomineeName: 'Farah Aziz', nomineeEmail: 'farah.aziz@example.com', nomineeCompany: 'YTL Cement', nomineeDepartment: 'Operations', jobTitle: 'Process Engineer', location: 'Perak, Malaysia', awardCategory: 'Operational Excellence',
      values: ['Hard Work', 'Moral Responsibility'], situation: 'A recurring plant downtime pattern was causing delayed dispatches and additional weekend overtime.',
      task: 'The nominee was asked to investigate the root cause and propose a practical fix without disrupting daily operations.',
      action: 'They analysed shift logs, mapped downtime triggers and trialled a revised maintenance checklist with supervisors over two weeks.',
      result: 'The revised checklist reduced recurring stoppages by 18% during the pilot and improved handover consistency between shifts.',
      impactScope: 'Department', evidenceStrength: 'Exceptional business and people impact', evidenceNotes: 'Pilot downtime report and supervisor feedback.', supportingLink: '',
      attachments: [makeDemoAttachment('downtime-pilot-results.txt', 'Mock attachment: pilot downtime report. Recurring stoppages reduced by 18% during trial period.')],
      review: { ratings: { values: 5, impact: 5, scale: 3, difficulty: 5, story: 4 }, justification: 'Strong operational result backed by data.' }
    },
    {
      id: 'BTRT-DEMO3', submittedAt: '2026-07-12', status: 'Director Endorsed', directorApproval: 'Yes',
      nominatorName: 'Wei Jian', nominatorEmail: 'wei.jian@example.com', nominatorCompany: 'YTL Power', relationship: 'Peer / colleague',
      nomineeName: 'Marcus Tan', nomineeEmail: 'marcus.tan@example.com', nomineeCompany: 'YTL PowerSeraya', nomineeDepartment: 'Digital', jobTitle: 'Senior Analyst', location: 'Singapore', awardCategory: 'Innovation / Process Improvement',
      values: ['Honesty', 'Hard Work'], situation: 'A reporting dashboard had inconsistent figures before a leadership update.',
      task: 'The nominee needed to find the source of the discrepancy and rebuild confidence in the numbers.',
      action: 'They traced the error to duplicate source rows, documented the issue openly and rebuilt the refresh checklist.',
      result: 'The corrected dashboard was ready before the update, and the checklist prevented the same error in later reporting cycles.',
      impactScope: 'Company / Business Unit', evidenceStrength: 'Strong measurable impact', evidenceNotes: 'Dashboard change log.', supportingLink: '',
      attachments: [],
      review: { ratings: { values: 4, impact: 4, scale: 3, difficulty: 4, story: 4 }, justification: 'Good evidence, consider finalist if space allows.' }
    },
    {
      id: 'BTRT-DEMO4', submittedAt: '2026-07-16', status: 'HR / HOD Review', directorApproval: 'Pending',
      nominatorName: 'Mei Ling', nominatorEmail: 'mei.ling@example.com', nominatorCompany: 'Wessex Water', relationship: 'HOD / Functional Head',
      nomineeName: 'Priya Raman', nomineeEmail: 'priya.raman@example.com', nomineeCompany: 'Wessex Water', nomineeDepartment: 'Customer Support', jobTitle: 'Team Lead', location: 'Bath, United Kingdom', awardCategory: 'Outstanding Team Player',
      values: ['Togetherness', 'Honesty'], situation: 'A customer support backlog created pressure on the team and risked slower responses for vulnerable customers.',
      task: 'The nominee had to stabilise service levels and support new joiners at the same time.',
      action: 'They split the backlog by urgency, paired new joiners with experienced agents and introduced a daily triage huddle.',
      result: 'The backlog was cleared within the month and team escalation quality improved according to QA checks.',
      impactScope: 'Team', evidenceStrength: 'Clear outcome, some evidence', evidenceNotes: 'QA checks and backlog report.', supportingLink: '',
      attachments: [makeDemoAttachment('qa-backlog-summary.txt', 'Mock attachment: backlog report and QA summary. Backlog cleared within the month.')],
      review: { ratings: { values: 4, impact: 3, scale: 3, difficulty: 4, story: 4 }, justification: 'Good people impact, needs stronger quantified result.' }
    },
    {
      id: 'BTRT-DEMO5', submittedAt: '2026-07-20', status: 'More Info Needed', directorApproval: 'Pending',
      nominatorName: 'Hannah Yeo', nominatorEmail: 'hannah.yeo@example.com', nominatorCompany: 'YTL Land', relationship: 'Peer / colleague',
      nomineeName: 'Ivan Koh', nomineeEmail: 'ivan.koh@example.com', nomineeCompany: 'YTL Land & Development', nomineeDepartment: 'Sales Gallery', jobTitle: 'Executive', location: 'Kuala Lumpur, Malaysia', awardCategory: 'Outstanding Individual Contribution',
      values: ['Vitality'], situation: 'A weekend launch event had unexpectedly high footfall.',
      task: 'The nominee helped manage visitor flow and support the sales gallery team.',
      action: 'They stayed late, redirected guests and helped compile follow-up leads.',
      result: 'The team completed the event without major delays, but supporting figures are still being collected.',
      impactScope: 'Team', evidenceStrength: 'Needs more detail', evidenceNotes: 'Awaiting lead report.', supportingLink: '',
      attachments: [],
      review: { ratings: { values: 3, impact: 2, scale: 2, difficulty: 3, story: 3 }, justification: 'Need clearer evidence before shortlisting.' }
    },
    {
      id: 'BTRT-DEMO6', submittedAt: '2026-07-22', status: 'Finalist', directorApproval: 'Yes',
      nominatorName: 'Siti Aminah', nominatorEmail: 'siti.aminah@example.com', nominatorCompany: 'YTL Communications', relationship: 'Direct manager',
      nomineeName: 'Arif Rahman', nomineeEmail: 'arif.rahman@example.com', nomineeCompany: 'YTL Communications / YES 5G', nomineeDepartment: 'Network Experience', jobTitle: 'Manager', location: 'Kuala Lumpur, Malaysia', awardCategory: 'Innovation / Process Improvement',
      values: ['Hard Work', 'Togetherness', 'Moral Responsibility'], situation: 'A service improvement sprint required coordination between technical, customer and retail teams.',
      task: 'The nominee had to make customer pain points visible and turn them into prioritised fixes.',
      action: 'They built a simple issue heatmap, coordinated daily stand-ups and closed the loop with customer-facing teams.',
      result: 'The sprint resolved the highest-frequency issues and reduced repeated escalations for the pilot area.',
      impactScope: 'Group-wide', evidenceStrength: 'Exceptional business and people impact', evidenceNotes: 'Issue heatmap, escalation tracker and pilot report.', supportingLink: '',
      attachments: [
        makeDemoAttachment('issue-heatmap-summary.txt', 'Mock attachment: issue heatmap showing priority customer pain points and improvement actions.'),
        makeDemoAttachment('pilot-escalation-results.txt', 'Mock attachment: pilot escalation tracker showing reduced repeated escalations in pilot area.')
      ],
      review: { ratings: { values: 5, impact: 5, scale: 4, difficulty: 4, story: 5 }, justification: 'Strong finalist: business impact, people coordination and repeatable method.' }
    },
    {
      id: 'BTRT-DEMO7', submittedAt: '2026-07-24', status: 'Peer Submitted', directorApproval: 'Pending',
      nominatorName: 'Joanne Chan', nominatorEmail: 'joanne.chan@example.com', nominatorCompany: 'YTL Foundation', relationship: 'Cross-company collaborator',
      nomineeName: 'Liew Kai Ming', nomineeEmail: 'kaiming.liew@example.com', nomineeCompany: 'YTL Foundation', nomineeDepartment: 'Programmes', jobTitle: 'Programme Coordinator', location: 'Kuala Lumpur, Malaysia', awardCategory: 'Customer / Community Impact',
      values: ['Moral Responsibility', 'Togetherness'], situation: 'A community programme needed better coordination with volunteers and school contacts.',
      task: 'The nominee supported partner coordination and attendance tracking.',
      action: 'They consolidated contact lists, clarified responsibilities and prepared reminders for volunteers.',
      result: 'Attendance improved and the programme team reported smoother on-ground coordination.',
      impactScope: 'Customer / Community', evidenceStrength: 'Clear outcome, some evidence', evidenceNotes: 'Volunteer schedule and attendance list.', supportingLink: '',
      attachments: [],
      review: { ratings: { values: 4, impact: 3, scale: 3, difficulty: 3, story: 3 }, justification: '' }
    },
    {
      id: 'BTRT-DEMO8', submittedAt: '2026-07-27', status: 'Not Shortlisted', directorApproval: 'No',
      nominatorName: 'Ben Lim', nominatorEmail: 'ben.lim@example.com', nominatorCompany: 'YTL Data Center', relationship: 'Peer / colleague',
      nomineeName: 'Grace Wong', nomineeEmail: 'grace.wong@example.com', nomineeCompany: 'YTL Data Center', nomineeDepartment: 'Admin', jobTitle: 'Administrator', location: 'Johor, Malaysia', awardCategory: 'Values Champion',
      values: ['Honesty'], situation: 'The nominee helped correct a vendor contact list.',
      task: 'They needed to update the internal contact document.',
      action: 'They checked the latest details and informed the team.',
      result: 'The list was corrected.',
      impactScope: 'Team', evidenceStrength: 'Needs more detail', evidenceNotes: 'Contact list update.', supportingLink: '',
      attachments: [],
      review: { ratings: { values: 3, impact: 1, scale: 1, difficulty: 1, story: 2 }, justification: 'Good work, but impact is too small for Group-level finalist.' }
    }
  ];
  const state = getState();
  state.nominations = demo;
  state.scores = {
    'BTRT-DEMO1': {
      'Anonymous Judge A': makeScore({ values: 5, impact: 4, scale: 4, difficulty: 4, story: 5 }, 'Excellent cross-functional story.'),
      'Anonymous Judge B': makeScore({ values: 5, impact: 4, scale: 3, difficulty: 4, story: 5 }, 'Strong values and process impact.')
    },
    'BTRT-DEMO2': {
      'Anonymous Judge A': makeScore({ values: 5, impact: 5, scale: 3, difficulty: 5, story: 4 }, 'Best measurable operations impact.'),
      'Anonymous Judge B': makeScore({ values: 4, impact: 5, scale: 3, difficulty: 5, story: 4 }, 'Strong result, slightly narrower influence.')
    },
    'BTRT-DEMO6': {
      'Anonymous Judge A': makeScore({ values: 5, impact: 5, scale: 5, difficulty: 4, story: 5 }, 'Strongest group-wide relevance.')
    }
  };
  saveState(state);
  toast('Demo data with attachments loaded.');
}

function fillNominationSample() {
  const form = $('#nominationForm');
  form.nominatorName.value = 'Asha Lee';
  form.nominatorEmail.value = 'asha.lee@example.com';
  form.nominatorCompany.value = 'YTL Creative Communications';
  form.relationship.value = 'Cross-company collaborator';
  form.nomineeName.value = 'Nadia Lim';
  form.nomineeEmail.value = 'nadia.lim@example.com';
  form.nomineeCompany.value = 'YTL Hotels';
  form.nomineeDepartment.value = 'Guest Experience';
  form.jobTitle.value = 'Assistant Manager';
  form.location.value = 'Kuala Lumpur, Malaysia';
  form.awardCategory.value = 'Customer / Community Impact';
  form.querySelectorAll('input[name="values"]').forEach((input) => input.checked = ['Togetherness', 'Vitality'].includes(input.value));
  form.situation.value = 'A multi-property guest recovery issue was affecting several premium guests during a peak campaign period.';
  form.task.value = 'The nominee had to coordinate responses across hotel operations, brand, CRM and frontline teams while protecting the guest experience.';
  form.action.value = 'She created a same-day escalation tracker, aligned hotel teams on the response script and followed up until cases were resolved.';
  form.result.value = 'The team closed all priority cases within 48 hours and used her tracker as the template for future peak-period guest recovery.';
  form.impactScope.value = 'Company / Business Unit';
  form.evidenceStrength.value = 'Strong measurable impact';
  form.evidenceNotes.value = 'Guest recovery tracker, CRM notes, thank-you email from operations.';
  form.supportingLink.value = 'https://example.com/mock-supporting-report';
  form.consent.checked = true;
  toast('Sample nomination filled. Add a file if you want to test attachments.');
}

function validateFiles(fileList) {
  const files = Array.from(fileList || []);
  if (files.length > MAX_FILE_COUNT) {
    throw new Error(`Please upload no more than ${MAX_FILE_COUNT} files for this mock.`);
  }
  files.forEach((file) => {
    if (file.size > MAX_FILE_BYTES) {
      throw new Error(`${file.name} is too large. Keep each file under 1.5 MB for the mock.`);
    }
  });
  return files;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      id: `file-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      lastModified: file.lastModified ? new Date(file.lastModified).toISOString().slice(0, 10) : today(),
      dataUrl: reader.result
    });
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

async function readUploadedFiles(input) {
  const files = validateFiles(input.files);
  return Promise.all(files.map(readFileAsDataUrl));
}

function renderSelectedFiles() {
  const input = $('#supportingFiles');
  const preview = $('#fileListPreview');
  if (!input || !preview) return;
  try {
    const files = validateFiles(input.files);
    if (!files.length) {
      preview.className = 'file-list empty';
      preview.textContent = 'No files selected.';
      return;
    }
    preview.className = 'file-list';
    preview.innerHTML = files.map((file) => `<div class="file-item"><strong>${escapeHtml(file.name)}</strong><span>${formatBytes(file.size)}</span></div>`).join('');
  } catch (error) {
    preview.className = 'file-list empty';
    preview.textContent = error.message;
    toast(error.message);
  }
}

async function submitNomination(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = formToObject(form);
  if (!data.values.length) {
    toast('Please select at least one YTL core value.');
    return;
  }

  let attachments = [];
  try {
    attachments = await readUploadedFiles($('#supportingFiles'));
  } catch (error) {
    toast(error.message);
    return;
  }

  const state = getState();
  const id = makeId();
  state.nominations.unshift({
    id,
    submittedAt: today(),
    status: 'Peer Submitted',
    directorApproval: 'Pending',
    ...data,
    attachments,
    review: { ratings: { values: 3, impact: 3, scale: 3, difficulty: 3, story: 3 }, justification: '' }
  });
  saveState(state);
  form.reset();
  renderSelectedFiles();
  toast(`Nomination submitted. Reference ID: ${id}`);
}

function renderAll() {
  updateRoleUI();
  renderStats();
  renderReviewList();
  renderJudgeList();
  renderReports();
}

function init() {
  $$('.tab').forEach((tab) => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
  $('#openLogin').addEventListener('click', () => $('#loginDialog').showModal());
  $('#logoutBtn').addEventListener('click', () => {
    reviewerMode = false;
    sessionStorage.removeItem('btrtReviewerMode');
    switchTab('nominate');
    renderAll();
    toast('Exited reviewer mode.');
  });
  $('#loginSubmit').addEventListener('click', (event) => {
    event.preventDefault();
    if ($('#loginCode').value.trim() !== LOGIN_CODE) {
      toast('Wrong passcode. Use BTRT2026 for the demo.');
      return;
    }
    reviewerMode = true;
    sessionStorage.setItem('btrtReviewerMode', 'true');
    $('#loginDialog').close();
    $('#loginCode').value = '';
    renderAll();
    switchTab('review');
    toast('Reviewer / Judge mode unlocked.');
  });
  $('#nominationForm').addEventListener('submit', submitNomination);
  $('#supportingFiles').addEventListener('change', renderSelectedFiles);
  $('#fillNominationSample').addEventListener('click', fillNominationSample);
  $('#loadDemoData').addEventListener('click', seedDemoData);
  $('#clearData').addEventListener('click', () => {
    if (!confirm('Clear all mock nominations, attachments and scores in this browser?')) return;
    localStorage.removeItem(STORE_KEY);
    renderAll();
    toast('Mock data cleared.');
  });
  $('#reviewSearch').addEventListener('input', renderReviewList);
  $('#statusFilter').addEventListener('change', renderReviewList);
  $('#judgeSession').addEventListener('change', renderJudgeList);
  $('#exportJson').addEventListener('click', exportJson);
  $('#exportCsv').addEventListener('click', exportCsv);
  $('#copyJudgePack').addEventListener('click', copyJudgePack);
  $('#webhookUrl').addEventListener('change', (event) => {
    const state = getState();
    state.webhookUrl = event.target.value;
    saveState(state);
  });

  renderAll();
}

document.addEventListener('DOMContentLoaded', init);
