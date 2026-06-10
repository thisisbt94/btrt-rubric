const STORAGE_KEY = 'btrtAwardsMockV2';
const PASSCODES = { hr: 'HR2026', judge: 'JUDGE2026', admin: 'ADMIN2026' };
const WEIGHTS = { values: 40, impact: 30, scale: 10, difficulty: 10, story: 10 };

const state = loadState();
let session = JSON.parse(sessionStorage.getItem('btrtSession') || '{"role":"employee","displayName":"Employee"}');

function uid(prefix='id'){ return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`; }
function $(sel, root=document){ return root.querySelector(sel); }
function $all(sel, root=document){ return [...root.querySelectorAll(sel)]; }
function esc(str=''){ return String(str).replace(/[&<>'"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s])); }
function today(){ return new Date().toISOString().slice(0,10); }

function loadState(){
  const fallback = { peerNominations: [], companyPackages: [], judgeScores: [], settings: { webhookUrl: '' } };
  try { return Object.assign(fallback, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')); } catch { return fallback; }
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); renderAll(); }
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 3200); }
function formData(form){
  const data = {};
  const fd = new FormData(form);
  for (const [k,v] of fd.entries()){
    if (data[k]) data[k] = Array.isArray(data[k]) ? [...data[k], v] : [data[k], v];
    else data[k] = v;
  }
  for (const group of ['values','coreValues1','coreValues2','supporting']) data[group] = fd.getAll(group);
  return data;
}
function calcScore(obj, prefix='rate'){
  const values = Number(obj[`${prefix}Values`] || obj[`${prefix.toLowerCase()}Values`] || 0);
  const impact = Number(obj[`${prefix}Impact`] || obj[`${prefix.toLowerCase()}Impact`] || 0);
  const scale = Number(obj[`${prefix}Scale`] || obj[`${prefix.toLowerCase()}Scale`] || 0);
  const difficulty = Number(obj[`${prefix}Difficulty`] || obj[`${prefix.toLowerCase()}Difficulty`] || 0);
  const story = Number(obj[`${prefix}Story`] || obj[`${prefix.toLowerCase()}Story`] || 0);
  return Math.round(((values/5)*WEIGHTS.values)+((impact/5)*WEIGHTS.impact)+((scale/5)*WEIGHTS.scale)+((difficulty/5)*WEIGHTS.difficulty)+((story/5)*WEIGHTS.story));
}
function getPackage(id){ return state.companyPackages.find(p => p.id === id); }
function getFinalists(){ return state.companyPackages.filter(p => p.hrStatus === 'Finalist' && p.directorApproval !== 'No'); }
async function postWebhook(type, payload){
  const url = state.settings.webhookUrl;
  if (!url) return;
  try { await fetch(url, { method:'POST', mode:'no-cors', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type, payload, submittedAt:new Date().toISOString() }) }); }
  catch(e){ console.warn('Webhook failed', e); }
}

function updateRoleUI(){
  const label = session.role === 'employee' ? 'Employee View' : `${session.displayName || session.role} · ${session.role.toUpperCase()}`;
  $('#activeRoleLabel').textContent = label;
  $('#judgeBadge').textContent = session.role === 'judge' ? `Logged in as ${session.displayName || 'Judge'}` : 'Not logged in as judge';
  $all('[data-requires]').forEach(btn => {
    const req = btn.dataset.requires;
    const allowed = session.role === req || session.role === 'admin';
    btn.classList.toggle('locked', !allowed);
  });
}
function canAccess(tab){
  const el = $(`.tab[data-tab="${tab}"]`);
  const req = el?.dataset.requires;
  return !req || session.role === req || session.role === 'admin';
}
function showTab(name){
  if (!canAccess(name)){ $('#loginDialog').showModal(); toast('Please log in for this area.'); return; }
  $all('.tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===name));
  $all('.panel').forEach(p=>p.classList.toggle('active', p.id===name));
  window.scrollTo({top:0, behavior:'smooth'});
}

function renderAll(){
  $('#peerCount').textContent = state.peerNominations.length;
  renderHrTable(); renderFinalistSelect(); renderRanking(); updateRoleUI();
  $('#webhookUrl').value = state.settings.webhookUrl || '';
}
function valuesHtml(values=[]){ return (Array.isArray(values)?values:[values]).filter(Boolean).map(v=>`<span class="pill">${esc(v)}</span>`).join('') || '<span class="pill warn">Not set</span>'; }
function statusClass(status){ return status === 'Finalist' || status === 'Validated' ? 'good' : status === 'Needs Detail' || status === 'Shortlisted' ? 'warn' : status === 'Not Selected' ? 'bad' : ''; }

function renderHrTable(){
  const tbody = $('#hrTable tbody');
  const search = ($('#hrSearch')?.value || '').toLowerCase();
  const filter = $('#hrStatusFilter')?.value || '';
  const rows = state.companyPackages.filter(p => {
    const hay = `${p.fullName} ${p.companyUnit} ${p.department} ${p.nomineeEmail}`.toLowerCase();
    return (!search || hay.includes(search)) && (!filter || p.hrStatus === filter);
  });
  tbody.innerHTML = rows.map(p => `
    <tr>
      <td><strong>${esc(p.fullName)}</strong><br><span class="tiny">${esc(p.nomineeEmail || '')}</span></td>
      <td>${esc(p.companyUnit || '')}<br><span class="tiny">${esc(p.department || '')}</span></td>
      <td>${valuesHtml(p.coreValues1)}</td>
      <td><strong>${p.companyScore || 0}</strong>/100</td>
      <td><span class="pill ${statusClass(p.hrStatus)}">${esc(p.hrStatus || 'Submitted')}</span><select class="status-select" data-status-id="${p.id}"><option>Submitted</option><option>Needs Detail</option><option>Validated</option><option>Shortlisted</option><option>Finalist</option><option>Not Selected</option></select></td>
      <td>${esc(p.directorApproval || 'Pending')}<br><span class="tiny">${esc(p.directorName || '')}</span></td>
      <td><input class="notes-input" data-notes-id="${p.id}" value="${esc(p.hrNotes || '')}" placeholder="Add HR/HOD note" /></td>
      <td><button class="btn ghost" type="button" data-view-package="${p.id}">View</button></td>
    </tr>`).join('');
  $('#hrEmpty').style.display = rows.length ? 'none' : 'block';
  $all('[data-status-id]').forEach(sel => { const p=getPackage(sel.dataset.statusId); sel.value=p.hrStatus || 'Submitted'; sel.onchange=()=>{ p.hrStatus=sel.value; saveState(); toast('Status updated.'); }; });
  $all('[data-notes-id]').forEach(inp => { inp.onchange=()=>{ const p=getPackage(inp.dataset.notesId); p.hrNotes=inp.value; saveState(); toast('HR note saved.'); }; });
  $all('[data-view-package]').forEach(btn => btn.onclick=()=>showPackage(btn.dataset.viewPackage));
}
function showPackage(id){
  const p=getPackage(id); if(!p) return;
  alert(`Nominee: ${p.fullName}\nCompany: ${p.companyUnit}\nValues: ${(p.coreValues1||[]).join(', ')}\n\nS: ${p.situation1}\n\nT: ${p.task1}\n\nA: ${p.action1}\n\nR: ${p.result1}\n\nCompany Score: ${p.companyScore}/100\nStatus: ${p.hrStatus}`);
}
function renderFinalistSelect(){
  const select = $('#finalistSelect'); const finalists = getFinalists();
  select.innerHTML = finalists.length ? `<option value="">Select finalist</option>` + finalists.map(p=>`<option value="${p.id}">${esc(p.fullName)} · ${esc(p.companyUnit)}</option>`).join('') : '<option value="">No finalists yet</option>';
  renderDossier(select.value);
}
function renderDossier(id){
  const d=$('#dossier'); const p=getPackage(id);
  $('#judgeScoreForm [name="packageId"]').value = id || '';
  if(!p){ d.classList.add('empty'); d.innerHTML='No finalist selected.'; return; }
  d.classList.remove('empty');
  d.innerHTML = `<h4>${esc(p.fullName)}</h4>
    <dl><dt>Company</dt><dd>${esc(p.companyUnit)}</dd><dt>Role</dt><dd>${esc(p.jobTitle || '')}</dd><dt>Department</dt><dd>${esc(p.department || '')}</dd><dt>Values</dt><dd>${valuesHtml(p.coreValues1)}</dd><dt>HR Score</dt><dd>${p.companyScore}/100</dd><dt>Director</dt><dd>${esc(p.directorName || '')} (${esc(p.directorApproval || 'Pending')})</dd></dl>
    <h4>Evidence 1</h4><p><strong>S:</strong> ${esc(p.situation1)}</p><p><strong>T:</strong> ${esc(p.task1)}</p><p><strong>A:</strong> ${esc(p.action1)}</p><p><strong>R:</strong> ${esc(p.result1)}</p>
    ${p.situation2 ? `<h4>Evidence 2</h4><p><strong>S:</strong> ${esc(p.situation2)}</p><p><strong>T:</strong> ${esc(p.task2)}</p><p><strong>A:</strong> ${esc(p.action2)}</p><p><strong>R:</strong> ${esc(p.result2)}</p>` : ''}`;
}
function renderRanking(){
  const tbody=$('#rankingTable tbody');
  const finalists=getFinalists().map(p=>{
    const scores=state.judgeScores.filter(s=>s.packageId===p.id);
    const avg=scores.length ? Math.round(scores.reduce((a,s)=>a+s.total,0)/scores.length) : 0;
    return {p,scores,avg};
  }).sort((a,b)=>b.avg-a.avg || (b.p.companyScore||0)-(a.p.companyScore||0));
  tbody.innerHTML = finalists.map((r,i)=>`<tr><td>${i+1}</td><td><strong>${esc(r.p.fullName)}</strong></td><td>${esc(r.p.companyUnit)}</td><td>${valuesHtml(r.p.coreValues1)}</td><td>${r.p.companyScore}/100</td><td><strong>${r.avg || 'Pending'}</strong>${r.avg?'/100':''}</td><td>${r.scores.length}</td></tr>`).join('') || '<tr><td colspan="7">No finalists yet.</td></tr>';
}

function exportFile(name, text, type='application/json'){
  const blob = new Blob([text], {type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); URL.revokeObjectURL(a.href);
}
function csvEscape(v){ return `"${String(v ?? '').replace(/"/g,'""')}"`; }
function packagesCsv(){
  const headers=['Nominee','Email','Company','Department','Values','CompanyScore','Status','DirectorApproval','HRNotes'];
  const rows=state.companyPackages.map(p=>[p.fullName,p.nomineeEmail,p.companyUnit,p.department,(p.coreValues1||[]).join('; '),p.companyScore,p.hrStatus,p.directorApproval,p.hrNotes]);
  return [headers,...rows].map(r=>r.map(csvEscape).join(',')).join('\n');
}

function fillPeerSample(){
  const f=$('#peerForm');
  const sample={nominatorName:'Aisha Rahman',nominatorEmail:'aisha.rahman@ytl.com',nominatorCompany:'YTL Creative Communications',relationship:'Cross-functional Partner',nomineeName:'Sarah Lim',nomineeEmail:'sarah.lim@ytl.com',nomineeCompany:'YTL Power',nomineeDepartment:'Operations',situation:'During a critical reporting migration, several junior team members struggled with the new process while deadlines were approaching.',task:'Sarah was responsible for keeping the reporting workflow on track and ensuring the team could complete submissions without repeated errors.',action:'She stayed back to coach the team, created a simple checklist, clarified ownership, and followed up daily until the process stabilised.',result:'The team avoided repeated mistakes, completed the report on time, and reused the checklist for the next reporting cycle.'};
  Object.entries(sample).forEach(([k,v])=>{ const el=f.elements[k]; if(el) el.value=v; });
  $all('input[name="values"]', f).forEach(c=> c.checked=['Hard Work','Togetherness','Moral Responsibility'].includes(c.value));
  f.elements.impactArea.value='Team / Department'; f.elements.evidenceStrength.value='Has manager validation'; f.elements.truthCheck.checked=true;
}
function fillCompanySample(){
  const f=$('#companyForm');
  const sample={companyUnit:'YTL Power',submissionDate:today(),directorName:'Dato Example Director',directorDesignation:'Executive Director',hrCommsPic:'HR Comms PIC <hrpic@ytl.com>',directorApproval:'Yes',fullName:'Sarah Lim',employeeId:'YTL-00123',jobTitle:'Operations Manager',department:'Operations',yearsWithYtl:'6',reportingManager:'HOD Example',workLocation:'Kuala Lumpur, Malaysia',nomineeEmail:'sarah.lim@ytl.com',nominatedBy:'HOD Example',nominatorDesignation:'Head of Operations',relationshipToNominee:'Direct Manager',internalNominationDate:today(),situation1:'During a critical reporting migration, several junior team members struggled with the new process while deadlines were approaching.',task1:'Sarah was responsible for keeping the reporting workflow on track and ensuring the team could complete submissions without repeated errors.',action1:'She stayed back to coach the team, created a simple checklist, clarified ownership, and followed up daily until the process stabilised.',result1:'The team avoided repeated mistakes, completed the report on time, reduced rework, and reused the checklist for the next reporting cycle.',rateValues:'5',justValues:'Strong demonstration of hard work, togetherness and moral responsibility.',rateImpact:'4',justImpact:'Clear team and process impact with reusable output.',rateScale:'3',justScale:'Department-level influence.',rateDifficulty:'4',justDifficulty:'High-pressure migration period.',rateStory:'5',justStory:'Specific, easy to verify and replicable.'};
  Object.entries(sample).forEach(([k,v])=>{ const el=f.elements[k]; if(el) el.value=v; });
  $all('input[name="coreValues1"]', f).forEach(c=> c.checked=['Hard Work','Togetherness','Moral Responsibility'].includes(c.value));
  $all('input[name="supporting"]', f).forEach(c=> c.checked=['Completed nomination form','Peer nomination letters or endorsements','Project reports or data outputs','Director written endorsement'].includes(c.value));
  updateCompanyScorePreview();
}
function updateCompanyScorePreview(){ $('#companyScorePreview').textContent = calcScore(formData($('#companyForm')), 'rate'); }
function updateJudgePreview(){
  const f=$('#judgeScoreForm'); const data={judgeValues:f.judgeValues.value,judgeImpact:f.judgeImpact.value,judgeScale:f.judgeScale.value,judgeDifficulty:f.judgeDifficulty.value,judgeStory:f.judgeStory.value};
  $('#judgeScorePreview').textContent = calcScore(data, 'judge');
  $all('.rubric-mini input[type="range"]').forEach(inp => inp.nextElementSibling.textContent = inp.value);
}


function loadDemoData(){
  const companies = [
    {
      companyUnit:'YTL Creative Communications', directorName:'Dato Example Director', fullName:'Alicia Tan', employeeId:'YTLCC-0048', jobTitle:'Senior Executive, Brand Systems', department:'Brand', nomineeEmail:'alicia.tan@ytl.com', nominatedBy:'Bradley Tan', nominatorDesignation:'Senior Brand Executive', relationshipToNominee:'Cross-functional Partner', values:['Hard Work','Togetherness'], score:[5,4,4,4,5], status:'Finalist',
      s:'The team had multiple internal campaigns running at the same time and task updates were scattered across Teams chats, email and manual trackers.',
      t:'Alicia had to keep the campaign team aligned, reduce missed updates and make sure approvers had a clear view of what needed their decision.',
      a:'She built a simple weekly tracker, followed up politely with stakeholders, converted scattered updates into clear action items and trained new team members to use the structure.',
      r:'Approval delays reduced, stakeholders had better visibility and the tracker was reused for subsequent internal campaigns.'
    },
    {
      companyUnit:'YTL Cement', directorName:'Dato Example Director', fullName:'Faizal Rahman', employeeId:'YTL-CEM-0192', jobTitle:'Plant Maintenance Supervisor', department:'Operations', nomineeEmail:'faizal.rahman@ytl.com', nominatedBy:'Nora Lee', nominatorDesignation:'HOD, Operations', relationshipToNominee:'Functional Head', values:['Hard Work','Moral Responsibility','Vitality'], score:[5,5,4,5,4], status:'Finalist',
      s:'A planned maintenance window became more complex when an unexpected equipment issue appeared close to restart time.',
      t:'Faizal needed to protect safety standards, coordinate technicians and minimise disruption without rushing the restart.',
      a:'He stopped the restart, escalated the risk clearly, reorganised manpower and personally checked the critical safety steps before sign-off.',
      r:'The plant restarted safely, downtime was contained and the team adopted a stronger pre-restart checklist.'
    },
    {
      companyUnit:'Wessex Water', directorName:'Dato Example Director', fullName:'Priya Nair', employeeId:'WW-0841', jobTitle:'Customer Experience Lead', department:'Customer Service', nomineeEmail:'priya.nair@wessexwater.co.uk', nominatedBy:'Daniel Hughes', nominatorDesignation:'Manager, Customer Experience', relationshipToNominee:'Direct Manager', values:['Honesty','Togetherness'], score:[4,5,4,3,5], status:'Shortlisted',
      s:'A customer service backlog increased after a system change and customers were frustrated by repeated follow-ups.',
      t:'Priya was asked to stabilise the response process and improve communication between customer service and technical teams.',
      a:'She mapped the repeated issues, created a daily escalation huddle and introduced clearer customer update templates.',
      r:'The backlog reduced, customer updates became more consistent and internal handovers improved across teams.'
    },
    {
      companyUnit:'YTL Hotels', directorName:'Dato Example Director', fullName:'Marcus Wong', employeeId:'YTLH-0337', jobTitle:'Guest Relations Manager', department:'Hospitality', nomineeEmail:'marcus.wong@ytlhotels.com', nominatedBy:'Emily Chan', nominatorDesignation:'Hotel Manager', relationshipToNominee:'Direct Manager', values:['Vitality','Togetherness','Honesty'], score:[4,4,3,4,4], status:'Validated',
      s:'A large group booking faced repeated last-minute changes which placed pressure on front office, housekeeping and banquet teams.',
      t:'Marcus had to keep the guest experience smooth while coordinating changes across departments.',
      a:'He created a simple live change log, briefed department leads twice daily and personally handled the key guest touchpoints.',
      r:'The group event ran smoothly, guest feedback was positive and the live change log became a template for future large bookings.'
    },
    {
      companyUnit:'YTL PowerSeraya', directorName:'Dato Example Director', fullName:'Cheryl Koh', employeeId:'PS-0520', jobTitle:'Finance Analyst', department:'Finance', nomineeEmail:'cheryl.koh@ytl.com.sg', nominatedBy:'Ken Tan', nominatorDesignation:'Finance Manager', relationshipToNominee:'Direct Manager', values:['Hard Work','Honesty'], score:[4,4,3,3,3], status:'Needs Detail',
      s:'Month-end reporting required additional checks after a change in reporting format.',
      t:'Cheryl needed to support the team in completing the checks accurately and on time.',
      a:'She reviewed the numbers, flagged inconsistencies and helped prepare a cleaner working file for the manager.',
      r:'The report was submitted on time, but the nomination needs more measurable impact and clearer evidence before judging.'
    },
    {
      companyUnit:'YTL Construction', directorName:'Dato Example Director', fullName:'Hafiz Ismail', employeeId:'YTLCON-0114', jobTitle:'Site Safety Coordinator', department:'Project Delivery', nomineeEmail:'hafiz.ismail@ytl.com', nominatedBy:'Mei Lin', nominatorDesignation:'Project Manager', relationshipToNominee:'Project Lead', values:['Moral Responsibility','Hard Work','Togetherness'], score:[5,4,4,5,5], status:'Finalist',
      s:'A site team was under pressure to accelerate work after weather delays, increasing the risk of shortcuts in daily safety routines.',
      t:'Hafiz had to keep the team on schedule while ensuring safety practices were not compromised.',
      a:'He introduced short safety stand-ups, reminded subcontractors of non-negotiables and escalated repeated issues with evidence instead of blame.',
      r:'The team recovered part of the delay without reportable incidents and site supervisors adopted the stand-up format for other work zones.'
    }
  ];
  const now = new Date().toISOString();
  state.peerNominations = companies.slice(0,4).map((c,i)=>({
    id:uid('peer'), createdAt:now, source:'Peer Nomination', nominatorName:['Aisha Rahman','Nora Lee','Daniel Hughes','Emily Chan'][i], nominatorEmail:['aisha.rahman@ytl.com','nora.lee@ytl.com','daniel.hughes@example.com','emily.chan@ytlhotels.com'][i], nominatorCompany:c.companyUnit, relationship:c.relationshipToNominee, nomineeName:c.fullName, nomineeEmail:c.nomineeEmail, nomineeCompany:c.companyUnit, nomineeDepartment:c.department, values:c.values, impactArea:i===0?'Team / Department':'Company / Business Unit', evidenceStrength:i<2?'Has measurable result':'Has manager validation', situation:c.s, task:c.t, action:c.a, result:c.r, truthCheck:'on'
  }));
  state.companyPackages = companies.map(c=>({
    id:uid('pkg'), createdAt:now, source:'Company Submission', companyUnit:c.companyUnit, submissionDate:today(), directorName:c.directorName, directorDesignation:'Director', hrCommsPic:'Demo HR/Comms PIC', directorApproval:'Yes', fullName:c.fullName, employeeId:c.employeeId, jobTitle:c.jobTitle, department:c.department, yearsWithYtl:String(2 + Math.floor(Math.random()*8)), reportingManager:c.nominatedBy, workLocation:'Malaysia / Regional Office', nomineeEmail:c.nomineeEmail, nominatedBy:c.nominatedBy, nominatorDesignation:c.nominatorDesignation, relationshipToNominee:c.relationshipToNominee, internalNominationDate:today(), coreValues1:c.values, situation1:c.s, task1:c.t, action1:c.a, result1:c.r, coreValues2:[], situation2:'', task2:'', action2:'', result2:'', rateValues:String(c.score[0]), rateImpact:String(c.score[1]), rateScale:String(c.score[2]), rateDifficulty:String(c.score[3]), rateStory:String(c.score[4]), justValues:'Demonstrates the selected YTL values through specific behaviour.', justImpact:'Impact is visible to the team, process or business unit.', justScale:'Scale based on reach and repeatability of the example.', justDifficulty:'Context required initiative under pressure.', justStory:'Evidence is sufficiently clear for mock judging.', companyScore:calcScore({rateValues:c.score[0],rateImpact:c.score[1],rateScale:c.score[2],rateDifficulty:c.score[3],rateStory:c.score[4]},'rate'), hrStatus:c.status, hrNotes:c.status==='Needs Detail'?'Ask company for stronger measurable result before forwarding.':'Suitable for mock review.', supporting:['Completed nomination form','Peer nomination letters or endorsements','Project reports or data outputs','Director written endorsement']
  }));
  state.judgeScores = [];
  const finalists = state.companyPackages.filter(p=>p.hrStatus==='Finalist');
  finalists.forEach((p,idx)=>{
    [['Judge 01',[5,4,4,4,5]],['Judge 02',[idx===1?5:4,4,4,idx===2?5:4,4]]].forEach(([judge,arr])=>{
      state.judgeScores.push({id:uid('score'),packageId:p.id,judgeName:judge,judgeValues:String(arr[0]),judgeImpact:String(arr[1]),judgeScale:String(arr[2]),judgeDifficulty:String(arr[3]),judgeStory:String(arr[4]),judgeNotes:'Demo judge score for mock testing.',total:calcScore({judgeValues:arr[0],judgeImpact:arr[1],judgeScale:arr[2],judgeDifficulty:arr[3],judgeStory:arr[4]},'judge'),createdAt:now});
    });
  });
  saveState();
  toast('Loaded 6 demo nominations, 3 finalists and sample judge scores.');
}

// Events
$all('.tab').forEach(btn => btn.addEventListener('click',()=>showTab(btn.dataset.tab)));
$all('[data-open-login]').forEach(b=>b.addEventListener('click',()=>$('#loginDialog').showModal()));
$('#loginForm').addEventListener('submit', e => {
  e.preventDefault(); const data=formData(e.target); const role=data.role;
  if(role !== 'employee' && data.passcode !== PASSCODES[role]){ toast('Wrong passcode for that role.'); return; }
  session = { role, displayName: data.displayName || (role === 'employee' ? 'Employee' : role.toUpperCase()) };
  sessionStorage.setItem('btrtSession', JSON.stringify(session));
  $('#loginDialog').close(); updateRoleUI(); toast(`Entered as ${session.displayName}.`);
});
$('#peerForm').addEventListener('submit', async e => {
  e.preventDefault(); const data=formData(e.target); if(!data.values.length){ toast('Select at least one YTL value.'); return; }
  const record={id:uid('peer'),...data,createdAt:new Date().toISOString(),source:'Peer Nomination'}; state.peerNominations.push(record); saveState(); await postWebhook('peer_nomination', record); e.target.reset(); toast('Peer nomination submitted.');
});
$('#companyForm').addEventListener('submit', async e => {
  e.preventDefault(); const data=formData(e.target); if(!data.coreValues1.length){ toast('Select at least one Evidence 1 value.'); return; }
  const record={id:uid('pkg'),...data,companyScore:calcScore(data,'rate'),hrStatus:'Submitted',hrNotes:'',createdAt:new Date().toISOString(),source:'Company Submission'}; state.companyPackages.push(record); saveState(); await postWebhook('company_package', record); e.target.reset(); updateCompanyScorePreview(); toast('Company package submitted for HR/HOD review.'); showTab('hr');
});
$('#fillPeerExample').onclick=fillPeerSample; $('#fillCompanyExample').onclick=fillCompanySample;
$('#loadFromPeer').onclick=()=>{
  const p=state.peerNominations.at(-1); if(!p){ toast('No peer nomination to load yet.'); return; }
  fillCompanySample(); const f=$('#companyForm'); f.fullName.value=p.nomineeName; f.nomineeEmail.value=p.nomineeEmail; f.companyUnit.value=p.nomineeCompany; f.department.value=p.nomineeDepartment; f.nominatedBy.value=p.nominatorName; f.relationshipToNominee.value=p.relationship; f.situation1.value=p.situation; f.task1.value=p.task; f.action1.value=p.action; f.result1.value=p.result; $all('input[name="coreValues1"]', f).forEach(c=> c.checked=(p.values||[]).includes(c.value)); updateCompanyScorePreview(); toast('Loaded latest peer nomination into company package.');
};
$all('#companyForm input, #companyForm select').forEach(el=>el.addEventListener('input', updateCompanyScorePreview));
$('#hrSearch').addEventListener('input', renderHrTable); $('#hrStatusFilter').addEventListener('change', renderHrTable);
$('#finalistSelect').addEventListener('change', e=>renderDossier(e.target.value));
$all('.rubric-mini input[type="range"]').forEach(inp=>inp.addEventListener('input', updateJudgePreview));
$('#judgeScoreForm').addEventListener('submit', async e => {
  e.preventDefault(); if(session.role !== 'judge' && session.role !== 'admin'){ $('#loginDialog').showModal(); toast('Judge login required.'); return; }
  const data=formData(e.target); if(!data.packageId){ toast('Select a finalist first.'); return; }
  const judgeName=session.displayName || 'Judge';
  const existing=state.judgeScores.findIndex(s=>s.packageId===data.packageId && s.judgeName===judgeName);
  const record={id:uid('score'),packageId:data.packageId,judgeName,total:calcScore(data,'judge'),...data,createdAt:new Date().toISOString()};
  if(existing >= 0) state.judgeScores[existing]=record; else state.judgeScores.push(record);
  saveState(); await postWebhook('judge_score', record); toast('Judge score saved.');
});
$('#loadDemoData').onclick=loadDemoData;
$('#exportJson').onclick=()=>exportFile(`btrt-awards-mock-${today()}.json`, JSON.stringify(state,null,2));
$('#exportCsv').onclick=()=>exportFile(`btrt-company-packages-${today()}.csv`, packagesCsv(), 'text/csv');
$('#resetData').onclick=()=>{ if(confirm('Reset all mock data in this browser?')){ localStorage.removeItem(STORAGE_KEY); location.reload(); } };
$('#saveWebhook').onclick=()=>{ state.settings.webhookUrl=$('#webhookUrl').value.trim(); saveState(); toast('Webhook setting saved.'); };
$('#importJson').onclick=()=>{ try{ const imported=JSON.parse($('#importBox').value); Object.assign(state, imported); saveState(); toast('Imported JSON.'); } catch{ toast('Invalid JSON.'); } };

// Set default date. Use the Admin button to load multiple demo records.
$('#companyForm').submissionDate.value = today(); $('#companyForm').internalNominationDate.value = today();
updateCompanyScorePreview(); updateJudgePreview(); renderAll();
