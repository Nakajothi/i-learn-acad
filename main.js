// ============================================================
//  MAIN.JS — I LEARN ACADEMY
//  dashboard-auth.js loads first and exposes:
//    window.ensureParentExtraWidgets()
//    window.injectParentTabData(rawApiResponse, student)
//    window.setElementText / setElementWidth / setUpdatedLabel
// ============================================================

// ── HELPERS ───────────────────────────────────────────────────────────────────
function showLoginError(msg) {
  const el = document.getElementById('loginErrorMessage');
  if (!el) return;
  el.textContent = msg || 'Login failed.';
  el.style.display = 'block';
}
function clearLoginError() {
  const el = document.getElementById('loginErrorMessage');
  if (!el) return;
  el.textContent = '';
  el.style.display = 'none';
}

// Thin wrappers — real implementations are in dashboard-auth.js
function _setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = (val === null || val === undefined) ? '' : String(val);
}
function _setWidth(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = pct;
}
function _stampUpdated(id) {
  const el = document.getElementById(id);
  if (el) el.textContent = 'Last updated: ' + new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

// ── AUTH HELPERS ──────────────────────────────────────────────────────────────
function hasActiveStudentSession() { return !!localStorage.getItem('ilearn_token'); }
function hasActiveParentSession()  { return !!localStorage.getItem('ilearn_parent_token'); }
function hasActiveTeacherSession() { return !!localStorage.getItem('ilearn_teacher_token'); }

function getCurrentRole() {
  if (hasActiveTeacherSession()) return 'teacher';
  if (hasActiveStudentSession()) return 'student';
  if (hasActiveParentSession())  return 'parent';
  return null;
}

function getStored(key) {
  try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch (_) { return {}; }
}

// ── SCROLL ANIMATIONS ─────────────────────────────────────────────────────────
const _ioObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.animate-in').forEach(el => _ioObserver.observe(el));

// ── STICKY NAV ────────────────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.style.background = window.scrollY > 50
    ? 'rgba(13,13,26,0.98)' : 'rgba(13,13,26,0.88)';
});

// ── MOBILE MENU ───────────────────────────────────────────────────────────────
function toggleMenu() {
  const links = document.querySelector('.nav-links');
  if (!links) return;
  if (links.style.display === 'flex') {
    links.style.display = 'none';
  } else {
    Object.assign(links.style, {
      display: 'flex', flexDirection: 'column', position: 'absolute',
      top: '65px', left: '0', right: '0',
      background: 'rgba(13,13,26,0.98)',
      padding: '20px 24px',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      zIndex: '999'
    });
  }
}

// ── PROFILE PANEL ─────────────────────────────────────────────────────────────
function toggleProfileMenu() {
  document.getElementById('profilePanel')?.classList.toggle('open');
}
document.addEventListener('click', e => {
  const menu  = document.getElementById('profileMenu');
  const panel = document.getElementById('profilePanel');
  if (menu && panel && !menu.contains(e.target)) panel.classList.remove('open');
});

function renderNavProfile() {
  const menu      = document.getElementById('profileMenu');
  const panel     = document.getElementById('profilePanel');
  const loginBtn  = document.getElementById('navLoginBtn');
  const regBtn    = document.getElementById('navRegisterBtn');
  if (!menu || !panel) return;
  const role = getCurrentRole();
  if (!role) {
    menu.style.display = 'none';
    if (loginBtn) loginBtn.style.display = '';
    if (regBtn)   regBtn.style.display   = '';
    panel.classList.remove('open');
    return;
  }
  if (loginBtn) loginBtn.style.display = 'none';
  if (regBtn)   regBtn.style.display   = 'none';
  menu.style.display = 'block';

  let title, subtitle, items, logoutFn;
  if (role === 'student') {
    const sp = getStored('ilearn_student_profile');
    const s  = sp.student || getStored('ilearn_student');
    const pr = Number(sp.attendance?.present || 0);
    const to = Number(sp.totalAttendance?.total || 0);
    const pc = to ? Math.round((pr / to) * 100) : 0;
    title = s.name || 'Student'; subtitle = 'Student';
    items = [
      { label: 'Class',      value: s.class  ? 'Class ' + s.class : 'N/A' },
      { label: 'Email',      value: s.email  || 'N/A' },
      { label: 'Attendance', value: to ? pc + '% (' + pr + '/' + to + ')' : 'No data' }
    ];
    logoutFn = 'API.logoutStudent()';
  } else if (role === 'parent') {
    // Use the cached raw API response stored by refreshParentDashboard
    const pp = getStored('ilearn_parent_profile');
    const ps = pp.student || getStored('ilearn_parent_student');
    const monthAtt = pp.attendanceSummary?.month || pp.attendance || {};
    const pr = Number(monthAtt.present || 0);
    const to = Number(monthAtt.total   || 0);
    const pc = to ? Math.round((pr / to) * 100) : 0;
    title = 'Parent'; subtitle = ps.name ? 'Parent of ' + ps.name : 'Parent';
    items = [
      { label: 'Student',    value: ps.name  || 'Linked student' },
      { label: 'Class',      value: ps.class ? 'Class ' + ps.class : 'N/A' },
      { label: 'Attendance', value: to ? pc + '% (' + pr + '/' + to + ')' : 'No data' }
    ];
    logoutFn = 'API.logoutParent()';
  } else {
    const t = getStored('ilearn_teacher');
    title = t.name || 'Teacher'; subtitle = 'Teacher';
    items = [
      { label: 'Name',  value: t.name  || 'I LEARN Staff' },
      { label: 'Email', value: t.email || 'N/A' }
    ];
    logoutFn = 'API.logoutTeacher()';
  }
  panel.innerHTML = `<h4>${title}</h4><p>${subtitle}</p>` +
    items.map(i => `<div class="profile-row"><div class="profile-label">${i.label}</div><div class="profile-value">${i.value}</div></div>`).join('') +
    `<button class="profile-logout" onclick="${logoutFn}">Logout</button>`;
}

// ── PARENT DASHBOARD — THE SINGLE SOURCE OF TRUTH ─────────────────────────────
/**
 * Fetches live parent data from the API and immediately injects it into
 * every parent-tab widget.  Never re-reads localStorage for widget values.
 */
async function refreshParentDashboard() {
  if (!hasActiveParentSession()) return;
  try {
    // Single API call — server returns everything at top level
    const raw = await API.getParentReport();
    // raw = { student, feeSummary, weeklyTests, attendanceSummary,
    //         dailyMcqSet, questionPapers, weakTopics, strongTopics,
    //         latestAssessment, assessmentHistory, ..., report: same }

    // Cache for nav profile and offline use ONLY
    // Store the raw response directly (not nested) so reads are simple
    localStorage.setItem('ilearn_parent_profile', JSON.stringify(raw));
    localStorage.setItem('ilearn_parent_student', JSON.stringify(raw.student || {}));

    const student = raw.student || {};

    // injectParentTabData is defined in dashboard-auth.js and handles
    // ALL widget updates including attendance, fees, tests, MCQ, topics
    if (typeof window.injectParentTabData === 'function') {
      window.injectParentTabData(raw, student);
    }

    renderNavProfile();
  } catch (err) {
    console.warn('[refreshParentDashboard] failed:', err.message || err);
  }
}

// ── STUDENT DATA ──────────────────────────────────────────────────────────────
async function refreshStudentData() {
  if (!hasActiveStudentSession()) return;
  try {
    const profile = await API.getStudentProfile();
    localStorage.setItem('ilearn_student_profile', JSON.stringify(profile));
    // Attendance (existing HTML widgets)
    const monthAtt   = profile.attendanceSummary?.month   || {};
    const overallAtt = profile.attendanceSummary?.overall  || monthAtt;
    const pres = Number(monthAtt.present || 0);
    const tot  = Number(monthAtt.total   || 0);
    const pct  = Number(overallAtt.percentage || (tot ? Math.round((pres / tot) * 100) : 0));
    _setText('studentAttendanceMonth',         `${pres} / ${tot} days`);
    _setText('studentAttendanceOverall',       `${pct}%`);
    _setText('studentAttendanceProgressLabel', `${pct}%`);
    _setWidth('studentAttendanceProgress',     Math.min(100, pct) + '%');
    _setText('studentAttendanceHint', tot
      ? `Overall attendance: ${overallAtt.present}/${overallAtt.total} classes marked.`
      : 'Attendance will appear once your teacher starts marking it.');
    _stampUpdated('studentAttendanceUpdated');
    const streak = Number(profile.mcqStreak || 0);
    _setText('studentStreakValue', streak + ' day' + (streak === 1 ? '' : 's'));
    _stampUpdated('studentStreakUpdated');
  } catch (err) {
    console.warn('[refreshStudentData] failed:', err.message || err);
  }
  // Timetable (fire-and-forget)
  try {
    const tt = await API.getLatestTimetable();
    localStorage.setItem('ilearn_student_timetable', JSON.stringify(tt));
    renderTodayTimetable();
  } catch (_) {}
}

function renderTodayTimetable() {
  const wrap = document.getElementById('studentTodayTimetable');
  if (!wrap) return;
  const state = getStored('ilearn_student_timetable');
  const schedule = state.timetable?.schedule || state.schedule || {};
  const plan = schedule.weeklyPlan || schedule.week || {};
  const dayKey = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()];
  const slots  = Array.isArray(plan[dayKey]) ? plan[dayKey] : [];
  const colMap = { study:'var(--pink)', practice:'var(--blue)', revision:'var(--green)', doubt:'var(--purple)', test:'#FFD166' };
  if (!slots.length) {
    wrap.innerHTML = `<div class="tt-slot"><div class="tt-dot" style="background:var(--blue)"></div><div class="tt-time">${dayKey}</div><div>No slots planned yet.</div></div>`;
    return;
  }
  wrap.innerHTML = slots.slice(0, 4).map(s =>
    `<div class="tt-slot"><div class="tt-dot" style="background:${colMap[s.type] || 'var(--blue)'}"></div><div class="tt-time">${s.time || ''}</div><div>${s.topic || 'Study'}${s.type ? ' — ' + s.type.charAt(0).toUpperCase() + s.type.slice(1) : ''}</div></div>`
  ).join('');
}

// ── GENERIC REFRESH (dispatches by role) ──────────────────────────────────────
async function refreshRoleData() {
  const role = getCurrentRole();
  if (role === 'student') {
    await refreshStudentData();
  } else if (role === 'parent') {
    await refreshParentDashboard();
    return; // refreshParentDashboard already calls renderNavProfile
  }
  renderNavProfile();
}

// ── HOME PAGE — SHOW/HIDE SECTIONS BY ROLE ───────────────────────────────────
function updateHomeForSession() {
  const role = getCurrentRole();

  document.querySelectorAll('.role-student-only').forEach(el =>
    el.style.display = (!role || role === 'student') ? '' : 'none');
  document.querySelectorAll('.role-parent-only').forEach(el =>
    el.style.display = (!role || role === 'parent') ? '' : 'none');
  document.querySelectorAll('.role-teacher-only').forEach(el =>
    el.style.display = role === 'teacher' ? '' : 'none');
  ['assessment', 'ai-features'].forEach(id => {
    const sec = document.getElementById(id);
    if (sec) sec.style.display = role === 'teacher' ? 'none' : '';
  });

  const tabs = {
    student: document.getElementById('studentDashTab'),
    parent:  document.getElementById('parentDashTab'),
    teacher: document.getElementById('teacherDashTab')
  };
  const contents = {
    student: document.getElementById('tab-student'),
    parent:  document.getElementById('tab-parent'),
    teacher: document.getElementById('tab-teacher')
  };

  Object.keys(tabs).forEach(r => {
    tabs[r]?.classList.remove('active');
    if (contents[r]) { contents[r].classList.remove('active'); contents[r].style.display = ''; }
  });

  if (role === 'student') {
    tabs.student?.classList.add('active');
    contents.student?.classList.add('active');
  } else if (role === 'parent') {
    tabs.parent?.classList.add('active');
    contents.parent?.classList.add('active');
    // Create widget shells now so they exist before data arrives
    if (typeof window.ensureParentExtraWidgets === 'function') {
      window.ensureParentExtraWidgets();
    }
  } else if (role === 'teacher') {
    tabs.teacher?.classList.add('active');
    if (contents.teacher) { contents.teacher.classList.add('active'); contents.teacher.style.display = 'block'; }
  }

  // Update welcome text
  let welcomeName = 'Learner';
  if (role === 'student') {
    const sp = getStored('ilearn_student_profile');
    welcomeName = sp.student?.name || getStored('ilearn_student').name || 'Student';
  } else if (role === 'parent') {
    const pp = getStored('ilearn_parent_profile');
    welcomeName = pp.student?.name || getStored('ilearn_parent_student').name || 'Parent';
  } else if (role === 'teacher') {
    welcomeName = getStored('ilearn_teacher').name || 'Teacher';
  }
  _setText('dashboardWelcomeName', welcomeName);
  _setText('dashboardWelcomeRole', role ? 'Signed in as ' + role : 'Sign in to view your dashboard');
  _stampUpdated('dashboardWelcomeUpdated');

  renderNavProfile();
}

// ── DASHBOARD TABS ────────────────────────────────────────────────────────────
function switchTab(tab, el) {
  document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.dash-content').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  const content = document.getElementById('tab-' + tab);
  if (content) { content.classList.add('active'); if (tab === 'teacher') content.style.display = 'block'; }

  if (tab === 'teacher' && hasActiveTeacherSession()) {
    loadTeacherAttendance(); loadTeacherMcqs(); loadTeacherDoubts();
  } else if (tab === 'student' && hasActiveStudentSession()) {
    refreshStudentData().then(() => { loadStudentResources(); loadStudentDoubts(); });
  } else if (tab === 'parent' && hasActiveParentSession()) {
    // Always ensure widget shells exist, then fetch fresh data
    if (typeof window.ensureParentExtraWidgets === 'function') window.ensureParentExtraWidgets();
    refreshParentDashboard();
  }
}

// ── MODALS ────────────────────────────────────────────────────────────────────
function openLoginModal() {
  document.getElementById('loginModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  setLoginType('student');
}
function closeLoginModal() {
  document.getElementById('loginModal').classList.remove('open');
  document.body.style.overflow = '';
}
function openRegisterModal() {
  document.getElementById('registerModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  showRegStep(1); assessAnswers = {}; currentQ = 0; syncRegisterSubjectVisibility();
}
function closeRegisterModal() {
  document.getElementById('registerModal').classList.remove('open');
  document.body.style.overflow = '';
}
function openDoubtModal() {
  const modal = document.getElementById('doubtModal');
  const msg   = document.getElementById('doubtSubmitMessage');
  if (msg) { msg.textContent = ''; msg.style.display = 'none'; }
  if (modal) modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeDoubtModal() {
  const modal = document.getElementById('doubtModal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
  const q = document.getElementById('doubtQuestionText');
  const i = document.getElementById('doubtQuestionImage');
  if (q) q.value = ''; if (i) i.value = '';
}

// ── LOGIN TYPE TABS ───────────────────────────────────────────────────────────
let currentLoginType = 'student';
function setLoginType(type) {
  currentLoginType = type;
  ['student','parent','teacher'].forEach(k => {
    const fields = document.getElementById('login' + k.charAt(0).toUpperCase() + k.slice(1) + 'Fields');
    const tab    = document.getElementById('ltab-' + k);
    if (fields) { fields.style.display = k === type ? 'flex' : 'none'; if (k === type) fields.style.flexDirection = 'column'; }
    if (tab)    tab.classList.toggle('active', k === type);
  });
}

// ── STUDENT LOGIN ─────────────────────────────────────────────────────────────
async function loginStudentWithPassword() {
  const email    = (document.getElementById('ls-email')?.value    || '').trim();
  const password = (document.getElementById('ls-password')?.value || '').trim();
  clearLoginError();
  if (!email || !password) { showLoginError('Please enter your email and password.'); return; }
  try {
    const data = await API.loginStudent(email, password);
    closeLoginModal();
    _redirectStudent(data.student);
  } catch (err) { showLoginError(err.message || 'Student login failed'); }
}

function _redirectStudent(student) {
  const isHome = ['/index.html','/',''].includes(window.location.pathname);
  if (isHome) {
    updateHomeForSession();
    refreshStudentData().then(() => { loadStudentResources(); loadStudentDoubts(); });
    const tab = document.getElementById('studentDashTab');
    if (tab) switchTab('student', tab);
    document.getElementById('dashboards')?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  window.location.href = 'index.html#dashboards';
}
function _redirectParent() {
  const isHome = ['/index.html','/',''].includes(window.location.pathname);
  if (isHome) {
    updateHomeForSession();
    refreshParentDashboard();
    const tab = document.getElementById('parentDashTab');
    if (tab) switchTab('parent', tab);
    document.getElementById('dashboards')?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  window.location.href = 'index.html#dashboards';
}
function _redirectTeacher() {
  const isHome = ['/index.html','/',''].includes(window.location.pathname);
  if (isHome) {
    updateHomeForSession();
    loadTeacherAttendance(); loadTeacherMcqs(); loadTeacherDoubts();
    const tab = document.getElementById('teacherDashTab');
    if (tab) switchTab('teacher', tab);
    document.getElementById('dashboards')?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  window.location.href = 'index.html#dashboards';
}

// ── GOOGLE SIGN-IN ────────────────────────────────────────────────────────────
async function handleCredentialResponse(response) {
  clearLoginError();
  if (!response?.credential) { showLoginError('Google login failed.'); return; }
  try {
    if (currentLoginType === 'teacher') {
      const d = await API.loginTeacherWithGoogle(response.credential);
      localStorage.setItem('ilearn_teacher', JSON.stringify(d.teacher || {}));
      closeLoginModal(); _redirectTeacher();
    } else if (currentLoginType === 'parent') {
      await API.loginParentWithGoogle(response.credential);
      closeLoginModal(); _redirectParent();
    } else {
      const d = await API.loginStudentWithGoogle(response.credential);
      closeLoginModal(); _redirectStudent(d.student);
    }
  } catch (err) { showLoginError(err.message || 'Google login failed'); }
}

// ── TEACHER LOGIN ─────────────────────────────────────────────────────────────
async function loginTeacher() {
  const email    = (document.getElementById('lt-email')?.value    || '').trim();
  const password = (document.getElementById('lt-password')?.value || '').trim();
  clearLoginError();
  if (!email || !password) { showLoginError('Please enter teacher email and password.'); return; }
  try {
    const data = await API.loginTeacher(email, password);
    localStorage.setItem('ilearn_teacher', JSON.stringify(data.teacher || {}));
    closeLoginModal(); _redirectTeacher();
  } catch (err) { showLoginError(err.message || 'Teacher login failed'); }
}

// ── REGISTER + ASSESSMENT ─────────────────────────────────────────────────────
function showRegStep(n) {
  ['regStep1','regStep2','regStep3'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) { el.style.display = i === n - 1 ? 'flex' : 'none'; if (i === n-1) el.style.flexDirection = 'column'; }
  });
}
function syncRegisterSubjectVisibility() {
  const cls = document.getElementById('regClass');
  const row = document.getElementById('regSubjectRow');
  const sub = document.getElementById('regSubject');
  if (!cls || !row || !sub) return;
  const needs = cls.value === '11' || cls.value === '12';
  row.style.display = needs ? 'flex' : 'none';
  if (!needs) sub.value = '';
}
const _regClsEl = document.getElementById('regClass');
if (_regClsEl) _regClsEl.addEventListener('change', syncRegisterSubjectVisibility);

function flashField(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.style.borderColor = '#FF2D78'; el.focus(); setTimeout(() => el.style.borderColor = '', 3000); }
  alert(msg);
}

const classQuestions = {
  '9': [
    {q:'Which is irrational?',opts:['√4','√9','√2','√16'],ans:2,topic:'Real Numbers'},
    {q:'Solve: 2x+5=13. x=?',opts:['3','4','5','6'],ans:1,topic:'Algebra'},
    {q:'A={1,2,3} B={2,3,4}. A∩B=?',opts:['{1}','{4}','{2,3}','{1,2,3,4}'],ans:2,topic:'Set Language'},
    {q:'Two angles 60° 70°, third=?',opts:['40°','50°','60°','70°'],ans:1,topic:'Geometry'},
    {q:'sin(30°)=?',opts:['1','√3/2','1/2','1/√2'],ans:2,topic:'Trigonometry'},
    {q:'Area of circle r=7cm (π=22/7):',opts:['44cm²','154cm²','49cm²','22cm²'],ans:1,topic:'Mensuration'},
    {q:'Distance (0,0) to (3,4):',opts:['5','7','12','25'],ans:0,topic:'Coordinate Geometry'},
    {q:'Mean of 5,10,15,20,25:',opts:['10','15','20','25'],ans:1,topic:'Statistics'},
    {q:'Bag 3 red 2 blue. P(red)=?',opts:['2/5','3/5','1/5','3/2'],ans:1,topic:'Probability'},
    {q:'Volume cube side 4cm:',opts:['16cm³','24cm³','48cm³','64cm³'],ans:3,topic:'Mensuration'}
  ],
  '10': [
    {q:'HCF of 12 and 18:',opts:['2','3','6','9'],ans:2,topic:'Real Numbers'},
    {q:'Roots of x²−5x+6=0:',opts:['2,3','1,6','−2,−3','2,−3'],ans:0,topic:'Algebra'},
    {q:'f(x)=2x+1, f(3)=?',opts:['5','6','7','8'],ans:2,topic:'Relations & Functions'},
    {q:'tan(45°)=?',opts:['0','1/√3','1','√3'],ans:2,topic:'Trigonometry'},
    {q:'Slope (1,2)→(3,6):',opts:['1','2','3','4'],ans:1,topic:'Coordinate Geometry'},
    {q:'3-4-5 right triangle hypotenuse:',opts:['3','4','5','6'],ans:2,topic:'Geometry'},
    {q:'Tangents from external point:',opts:['0','1','2','3'],ans:2,topic:'Geometry'},
    {q:'Volume sphere r=3:',opts:['28π','36π','48π','54π'],ans:1,topic:'Mensuration'},
    {q:'Standard deviation measures:',opts:['Average','Spread','Frequency','Range'],ans:1,topic:'Statistics'},
    {q:'P(A)=0.4 P(B)=0.5 P(A∩B)=0.2 → P(A∪B)=?',opts:['0.5','0.6','0.7','0.9'],ans:2,topic:'Probability'}
  ],
  '11': [
    {q:'A has 5 elements, subsets=?',opts:['16','25','32','64'],ans:2,topic:'Sets'},
    {q:'i²=?',opts:['1','−1','i','−i'],ans:1,topic:'Complex Numbers'},
    {q:'lim(x→0) sin(x)/x=?',opts:['0','∞','1','−1'],ans:2,topic:'Limits'},
    {q:'d/dx(x⁴)=?',opts:['x³','4x³','4x','3x³'],ans:1,topic:'Differentiation'},
    {q:'⁵P₂=?',opts:['10','15','20','25'],ans:2,topic:'Permutations'},
    {q:'⁵C₂=?',opts:['5','10','15','20'],ans:1,topic:'Combinations'},
    {q:'sin²θ+cos²θ=?',opts:['0','1','2','tan²θ'],ans:1,topic:'Trigonometry'},
    {q:'Slope of 3x−4y+5=0:',opts:['3/4','−3/4','4/3','−4/3'],ans:0,topic:'Lines'},
    {q:'[[1,0],[0,1]] is called:',opts:['Zero','Identity','Scalar','Diagonal'],ans:1,topic:'Matrices'},
    {q:'Mean of first 10 natural numbers:',opts:['4.5','5','5.5','6'],ans:2,topic:'Statistics'}
  ],
  '12': [
    {q:'∫x²dx=?',opts:['x³','x³/3+C','2x','3x²'],ans:1,topic:'Integration'},
    {q:'d/dx(eˣ)=?',opts:['xeˣ⁻¹','eˣ','eˣ⁻¹','0'],ans:1,topic:'Differentiation'},
    {q:'|A| for [[2,1],[4,3]]:',opts:['2','6','8','10'],ans:0,topic:'Matrices'},
    {q:'Order of y″+y′=x:',opts:['1','2','3','0'],ans:1,topic:'Diff. Equations'},
    {q:'P(A|B) P(A∩B)=0.2 P(B)=0.4:',opts:['0.2','0.4','0.5','0.8'],ans:2,topic:'Probability'},
    {q:'a×b=0, vectors are:',opts:['Perpendicular','Parallel','Equal','Opposite'],ans:1,topic:'Vectors'},
    {q:'∫₀¹x dx=?',opts:['0','1/2','1','2'],ans:1,topic:'Definite Integrals'},
    {q:'Inverse of f(x)=2x+3:',opts:['(x−3)/2','(x+3)/2','2x−3','(3−x)/2'],ans:0,topic:'Functions'},
    {q:'Linear programming finds:',opts:['Average','Optimal','Exact','Random'],ans:1,topic:'Linear Programming'},
    {q:'Binomial n=10 p=0.4 mean=?',opts:['2','4','6','8'],ans:1,topic:'Probability Distributions'}
  ]
};

let assessAnswers = {}, currentQ = 0, activeQuestions = [], studentData = {};

async function startAssessment() {
  const name    = (document.getElementById('regName')?.value    || '').trim();
  const cls     = (document.getElementById('regClass')?.value   || '').trim();
  const subject = (document.getElementById('regSubject')?.value || '').trim();
  const mobile  = (document.getElementById('regMobile')?.value  || '').trim();
  const email   = (document.getElementById('regEmail')?.value   || '').trim();
  const pass    = (document.getElementById('regPassword')?.value|| '').trim();
  if (!name)                                 { flashField('regName',    'Please enter student name.'); return; }
  if (!cls)                                  { flashField('regClass',   'Please select your class.'); return; }
  if ((cls==='11'||cls==='12') && !subject)  { flashField('regSubject', 'Please choose Maths or Business Maths.'); return; }
  if (mobile.replace(/\D/g,'').length < 10)  { flashField('regMobile',  'Enter valid 10-digit mobile.'); return; }
  if (!email || !email.includes('@'))        { flashField('regEmail',   'Enter valid email address.'); return; }
  if (pass.length < 6)                       { flashField('regPassword','Password must be at least 6 characters.'); return; }
  try {
    await API.registerStudent(name, cls, mobile, email, pass, subject || 'maths');
  } catch (err) { alert(err.message || 'Registration failed. Please try again.'); return; }
  studentData = { name, cls, class: cls, subject: subject || 'maths', mobile, email };
  localStorage.setItem('ilearn_student', JSON.stringify(studentData));
  activeQuestions = classQuestions[cls] || classQuestions['9'];
  assessAnswers = {}; currentQ = 0;
  document.getElementById('testTitle').textContent    = 'Class ' + cls + ' Diagnostic Test';
  document.getElementById('testSubtitle').textContent = 'Answer all 10 questions — ' + name;
  showRegStep(2); renderQuestion();
}

function renderQuestion() {
  const q = activeQuestions[currentQ], total = activeQuestions.length;
  const pct = Math.round(currentQ / total * 100);
  document.getElementById('qProgress').textContent = 'Question ' + (currentQ+1) + ' of ' + total;
  document.getElementById('qPct').textContent      = pct + '%';
  document.getElementById('qProgFill').style.width = pct + '%';
  document.getElementById('prevBtn').style.display  = currentQ > 0 ? 'inline-block' : 'none';
  document.getElementById('nextBtn').textContent    = currentQ === total-1 ? 'Submit' : 'Next →';
  const sel = assessAnswers[currentQ];
  document.getElementById('questionArea').innerHTML =
    `<div style="background:var(--dark3);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:20px;">
      <div style="font-size:.7rem;color:var(--pink);font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">${q.topic}</div>
      <div style="font-size:.94rem;line-height:1.6;margin-bottom:16px;">${currentQ+1}. ${q.q}</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${q.opts.map((opt,i) => `
          <div onclick="selectQ(${i})" style="display:flex;align-items:center;gap:12px;padding:10px 14px;
            background:${sel===i?'rgba(255,45,120,.12)':'rgba(255,255,255,.02)'};
            border:1px solid ${sel===i?'var(--pink)':'rgba(255,255,255,.08)'};
            border-radius:10px;cursor:pointer;font-size:.88rem;transition:all .2s;">
            <div style="width:16px;height:16px;border-radius:50%;
              border:2px solid ${sel===i?'var(--pink)':'rgba(255,255,255,.25)'};
              background:${sel===i?'var(--pink)':'transparent'};flex-shrink:0;"></div>${opt}
          </div>`).join('')}
      </div></div>`;
}
function selectQ(idx) { assessAnswers[currentQ] = idx; renderQuestion(); }
function nextQ() {
  if (assessAnswers[currentQ] === undefined) { alert('Please select an answer.'); return; }
  if (currentQ === activeQuestions.length - 1) showResult(); else { currentQ++; renderQuestion(); }
}
function prevQ() { if (currentQ > 0) { currentQ--; renderQuestion(); } }

function showResult() {
  const total   = activeQuestions.length;
  const correct = activeQuestions.filter((q,i) => assessAnswers[i] === q.ans).length;
  const pct     = Math.round(correct / total * 100);
  const topicScores = {};
  activeQuestions.forEach((q,i) => {
    if (!topicScores[q.topic]) topicScores[q.topic] = {c:0,t:0};
    topicScores[q.topic].t++;
    if (assessAnswers[i] === q.ans) topicScores[q.topic].c++;
  });
  const weak   = Object.entries(topicScores).filter(([,s]) => s.c/s.t<0.6).map(([t])=>t);
  const strong = Object.entries(topicScores).filter(([,s]) => s.c/s.t>=0.8).map(([t])=>t);
  const col    = pct>=70?'#00E5A0':pct>=50?'#FFD166':'#FF2D78';
  const grade  = pct>=80?'Excellent 🏆':pct>=60?'Good 👍':pct>=40?'Average 💪':'Needs Work 📚';
  document.getElementById('resultScore').innerHTML = '<span style="color:'+col+'">'+pct+'%</span>';
  document.getElementById('resultGrade').textContent = grade;
  document.getElementById('resultNote').textContent  = correct+' of '+total+' correct';
  document.getElementById('resultGrid').innerHTML    =
    '<div class="rbox good"><div class="rbox-title good">✓ Strong Topics</div>'+
    (strong.length?strong.map(t=>'<div class="rbox-item">• '+t+'</div>').join(''):'<div class="rbox-item">Keep practising!</div>')+
    '</div><div class="rbox weak"><div class="rbox-title weak">⚠ Needs Focus</div>'+
    (weak.length?weak.map(t=>'<div class="rbox-item">• '+t+'</div>').join(''):'<div class="rbox-item">Great work!</div>')+
    '</div>';
  document.getElementById('topicBars').innerHTML = Object.entries(topicScores).map(([topic,s])=>{
    const p=Math.round(s.c/s.t*100),c=p>=70?'#00E5A0':p>=50?'#FFD166':'#FF2D78';
    return '<div class="t-bar-wrap"><div class="t-bar-top"><span>'+topic+'</span><span style="color:'+c+'">'+p+'%</span></div><div class="t-bar"><div class="t-bar-fill" style="width:'+p+'%;background:'+c+'"></div></div></div>';
  }).join('');
  document.getElementById('aiTip').innerHTML = '🤖 <strong>AI Tip:</strong> Focus on <strong>'+(weak.length?weak.slice(0,2).join(' and '):'all topics equally')+'</strong>.';
  showRegStep(3);
}

// ── CHATBOT ───────────────────────────────────────────────────────────────────
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function fmt(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>');}
async function sendChat() {
  const input=document.getElementById('chatInput'),chatBody=document.getElementById('chatBody');
  if(!input||!chatBody) return;
  const q=input.value.trim(); if(!q) return;
  input.value='';
  chatBody.innerHTML+=`<div class="msg user"><div class="msg-ava">👤</div><div class="msg-bubble">${esc(q)}</div></div>`;
  const tid='typing_'+Date.now();
  chatBody.innerHTML+=`<div class="msg bot" id="${tid}"><div class="msg-ava">🤖</div><div class="typing"><span></span><span></span><span></span></div></div>`;
  chatBody.scrollTop=chatBody.scrollHeight;
  try {
    const data=await API.sendChatMessage(q);
    const reply=data.reply||'Sorry, please try again!';
    if(data.sessionKey) localStorage.setItem('ilearn_chat_session',data.sessionKey);
    document.getElementById(tid)?.remove();
    chatBody.innerHTML+=`<div class="msg bot"><div class="msg-ava">🤖</div><div class="msg-bubble">${fmt(reply)}</div></div>`;
  } catch(e) {
    document.getElementById(tid)?.remove();
    chatBody.innerHTML+=`<div class="msg bot"><div class="msg-ava">🤖</div><div class="msg-bubble">${fmt(e.message||'Connection error.')}</div></div>`;
  }
  chatBody.scrollTop=chatBody.scrollHeight;
}

// ── DOUBTS ────────────────────────────────────────────────────────────────────
async function submitStudentDoubt() {
  const text  = (document.getElementById('doubtQuestionText')?.value  || '').trim();
  const image = (document.getElementById('doubtQuestionImage')?.value || '').trim();
  const msg   = document.getElementById('doubtSubmitMessage');
  if (!text) { if (msg) { msg.textContent='Please enter your question.'; msg.style.display='block'; } return; }
  try {
    await API.submitStudentDoubt(text, image || null);
    closeDoubtModal(); await loadStudentDoubts();
  } catch (err) { if (msg) { msg.textContent=err.message||'Could not submit.'; msg.style.display='block'; } }
}

async function loadStudentDoubts() {
  if (!hasActiveStudentSession()) return;
  const wrap  = document.getElementById('studentDoubtList');
  const stack = document.getElementById('doubtPopupStack');
  if (!wrap) return;
  try {
    const data   = await API.getStudentDoubts();
    const doubts = data.doubts || [];
    if (!doubts.length) { wrap.innerHTML=''; if(stack) stack.innerHTML=''; return; }
    const answered = doubts.filter(d => d.status==='answered' && (d.answer_text||d.answer_image));
    wrap.innerHTML = doubts.map((d,i) => {
      const st  = d.status==='answered'?'answered':'open';
      const ans = (d.answer_text||d.answer_image)
        ? `<div class="doubt-reply-block"><div class="doubt-reply-tag">Reply ${i+1}</div>
           ${d.answer_text?`<div class="doubt-reply-text">${d.answer_text}</div>`:''}
           ${d.answer_image?`<div class="doubt-answer"><img src="${d.answer_image}" /></div>`:''}</div>` : '';
      return `<div class="doubt-item">
        <div class="doubt-question-title">Q${i+1}: ${d.question_text}</div>
        ${d.question_image?`<div class="doubt-answer"><img src="${d.question_image}" /></div>`:''}
        <div class="doubt-meta"><span>${d.created_at||'Recently'}</span>
        <span class="doubt-status ${st}">${st}</span></div>${ans}</div>`;
    }).join('');
    if (stack) {
      stack.innerHTML = answered.slice(0,2).map((d,i)=>
        `<div class="doubt-popup show"><div class="doubt-popup-label">${i+1}</div>
         <div class="doubt-popup-text">${d.answer_text||'Teacher sent an image.'}</div></div>`
      ).join('');
    }
  } catch (_) { wrap.innerHTML=''; if(stack) stack.innerHTML=''; }
}

async function loadTeacherDoubts() {
  if (!hasActiveTeacherSession()) return;
  const wrap = document.getElementById('teacherDoubtList');
  if (!wrap) return;
  try {
    const data   = await API.getTeacherDoubts();
    const doubts = data.doubts || [];
    if (!doubts.length) { wrap.innerHTML='<div style="color:var(--muted);">No doubts yet.</div>'; return; }
    wrap.innerHTML = doubts.map(d => {
      const done = d.status==='answered';
      return `<div class="doubt-item teacher-doubt-card">
        <div class="teacher-doubt-head">
          <div class="teacher-doubt-student">${d.student_name||'Student'} — Class ${d.student_class||'?'}</div>
          <span class="doubt-status ${done?'answered':'open'}">${done?'Answered':'Open'}</span>
        </div>
        <div class="doubt-question-title">${d.question_text}</div>
        ${d.question_image?`<div class="doubt-answer"><img src="${d.question_image}" /></div>`:''}
        ${done
          ? `<div class="doubt-reply-block"><div class="doubt-reply-tag">Your Reply</div>
             ${d.answer_text?`<div class="doubt-reply-text">${d.answer_text}</div>`:''}
             ${d.answer_image?`<div class="doubt-answer"><img src="${d.answer_image}" /></div>`:''}</div>`
          : `<div class="doubt-input" style="margin-top:12px;">
             <textarea id="doubt-answer-${d.id}" rows="3" placeholder="Type reply..."></textarea>
             <input type="text" id="doubt-answer-img-${d.id}" placeholder="Image URL (optional)" />
             <button class="btn-secondary" onclick="answerTeacherDoubt(${d.id})">Send Reply</button></div>`}
        <div class="doubt-meta"><span>${d.created_at||''}</span></div></div>`;
    }).join('');
  } catch (err) { wrap.innerHTML=`<div style="color:var(--muted);">${err.message||'Could not load.'}</div>`; }
}

async function answerTeacherDoubt(id) {
  const text  = (document.getElementById('doubt-answer-'+id)?.value     || '').trim();
  const image = (document.getElementById('doubt-answer-img-'+id)?.value || '').trim();
  if (!text) { alert('Please enter a reply.'); return; }
  try { await API.answerTeacherDoubt(id, text, image||null); await loadTeacherDoubts(); await loadStudentDoubts(); }
  catch (err) { alert(err.message||'Could not send reply.'); }
}

// ── TEACHER FUNCTIONS ─────────────────────────────────────────────────────────
let teacherStudentCache = [];

function setDefaultTeacherDate() {
  const input = document.getElementById('teacherAttendanceDate');
  if (!input || input.value) return;
  const today = new Date();
  input.value = new Date(today.getTime() - today.getTimezoneOffset()*60000).toISOString().slice(0,10);
}
function showTeacherMsg(id, msg, isErr) {
  const box = document.getElementById(id); if (!box) return;
  box.style.display='block';
  box.style.background   = isErr?'rgba(255,45,120,.12)':'rgba(77,158,255,.12)';
  box.style.borderColor  = isErr?'rgba(255,45,120,.25)':'rgba(77,158,255,.25)';
  box.textContent = msg;
}
function renderTeacherMcqCards(count) {
  const wrap = document.getElementById('teacherMcqCards'); if (!wrap) return;
  const n = Math.max(1, Math.min(20, Number(count)||10));
  const c = document.getElementById('teacherMcqCount'); if (c) c.value=n;
  wrap.innerHTML = Array.from({length:n},(_,idx)=>{
    const i=idx+1;
    return `<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:16px;">
      <div style="font-size:.78rem;color:var(--blue);font-weight:800;margin-bottom:10px;">Question ${i}</div>
      <div class="form-group" style="margin:0 0 10px;"><label>Question Text</label>
        <textarea id="teacherMcqQuestion${i}" rows="3" placeholder="Enter question ${i}"></textarea></div>
      <div class="form-group" style="margin:0 0 10px;"><label>Question Image URL</label>
        <input type="text" id="teacherMcqQuestionImage${i}" placeholder="Optional image URL" /></div>
      ${[1,2,3,4].map(o=>`<div style="margin-bottom:8px;">
        <div class="form-group" style="margin:0 0 5px;"><label>Option ${o} Text</label>
          <input type="text" id="teacherMcq${i}Option${o}" placeholder="Option ${o}" /></div>
        <div class="form-group" style="margin:0;"><label>Option ${o} Image</label>
          <input type="text" id="teacherMcq${i}Option${o}Image" placeholder="Optional" /></div></div>`).join('')}
      <div class="form-group" style="margin:0;"><label>Correct Option</label>
        <select id="teacherMcq${i}Correct">
          <option value="0">Option 1</option><option value="1">Option 2</option>
          <option value="2">Option 3</option><option value="3">Option 4</option>
        </select></div></div>`;
  }).join('');
}
function regenerateTeacherMcqCards() { renderTeacherMcqCards(document.getElementById('teacherMcqCount')?.value||10); }

function renderTeacherMcqList(mcqs) {
  const body = document.getElementById('teacherMcqList'); if (!body) return;
  if (!mcqs.length) { body.innerHTML='<div style="color:var(--muted);">No MCQ batches posted yet.</div>'; return; }
  body.innerHTML = mcqs.map((mcq,idx)=>{
    const reports   = Array.isArray(mcq.student_reports)?mcq.student_reports:[];
    const attempted = reports.filter(s=>s.attemptedCount>0);
    const notAtt    = reports.filter(s=>s.attemptedCount===0);
    const accuracy  = Number(mcq.submission_count)?Math.round(Number(mcq.correct_count)/Number(mcq.submission_count)*100):0;
    return `<div style="${idx?'padding-top:16px;margin-top:16px;border-top:1px solid rgba(255,255,255,.06);':''}">
      <div style="display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;">
        <div><div style="font-size:.78rem;color:var(--blue);font-weight:700;margin-bottom:4px;">
          ${mcq.batch_title||mcq.title} — Class ${mcq.class_scope||'all'}</div>
          <div style="font-weight:700;">${mcq.question_count||0} questions</div></div>
        <div><div style="font-weight:700;color:var(--green);">${accuracy}% accuracy</div>
          <div style="color:var(--muted);font-size:.82rem;">Attempted: ${mcq.attempted_students||0} | Not: ${mcq.not_attempted_students||0}</div></div>
      </div>
      <div style="margin-top:14px;padding:14px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);">
        <div style="font-size:.76rem;color:var(--blue);font-weight:800;margin-bottom:8px;">Student Scores</div>
        ${attempted.length?attempted.map(s=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid rgba(255,255,255,.06);">
          <div><strong>${s.name}</strong><div style="font-size:.8rem;color:var(--muted);">Class ${s.class}</div></div>
          <div style="color:var(--green);font-weight:700;">${s.score}</div></div>`).join('')
          :'<div style="color:var(--muted);font-size:.84rem;">No attempts yet.</div>'}
        ${notAtt.length?`<div style="margin-top:10px;font-size:.82rem;color:var(--muted);">Not attempted: ${notAtt.map(s=>s.name+' (Cl.'+s.class+')').join(', ')}</div>`:''}
      </div></div>`;
  }).join('');
}

async function loadTeacherMcqs() {
  if (!hasActiveTeacherSession()) return;
  try { const data=await API.getTeacherMcqs(); renderTeacherMcqList(data.mcqs||[]); }
  catch (err) { showTeacherMsg('teacherMcqMessage',err.message||'Could not load MCQs.',true); }
}

async function createTeacherMcq() {
  if (!hasActiveTeacherSession()) { alert('Please login as teacher.'); return; }
  const title      = (document.getElementById('teacherMcqTitle')?.value||'').trim()||'Daily MCQ Batch';
  const classScope = (document.getElementById('teacherMcqClass')?.value||'all').trim();
  const qCount     = Math.max(1,Math.min(20,Number(document.getElementById('teacherMcqCount')?.value||10)));
  const questions  = Array.from({length:qCount},(_,idx)=>{
    const i=idx+1;
    const question=(document.getElementById('teacherMcqQuestion'+i)?.value||'').trim();
    const imageUrl=(document.getElementById('teacherMcqQuestionImage'+i)?.value||'').trim();
    const options=[1,2,3,4].map(o=>(document.getElementById('teacherMcq'+i+'Option'+o)?.value||'').trim());
    const correctIndex=Number(document.getElementById('teacherMcq'+i+'Correct')?.value||0);
    return {question,imageUrl,options,correctIndex};
  }).filter(item=>item.question||item.imageUrl||item.options.some(o=>o));
  if (!questions.length) { showTeacherMsg('teacherMcqMessage','Add at least one MCQ.',true); return; }
  if (questions.some(item=>(!item.question&&!item.imageUrl)||item.options.some(o=>!o))) {
    showTeacherMsg('teacherMcqMessage','Each MCQ needs text/image and 4 options.',true); return;
  }
  try {
    await API.createTeacherMcq({title,classScope,questions});
    const t=document.getElementById('teacherMcqTitle'); if(t) t.value='';
    showTeacherMsg('teacherMcqMessage',questions.length+' MCQ(s) posted.',false);
    renderTeacherMcqCards(qCount); await loadTeacherMcqs();
  } catch (err) { showTeacherMsg('teacherMcqMessage',err.message||'Could not post.',true); }
}

function renderTeacherPaperList(papers) {
  const wrap=document.getElementById('teacherPaperList'); if(!wrap) return;
  if(!papers.length){wrap.innerHTML='<div style="color:var(--muted);">No papers yet.</div>';return;}
  wrap.innerHTML=papers.map((p,i)=>
    `<div style="${i?'padding-top:14px;margin-top:14px;border-top:1px solid rgba(255,255,255,.06);':''}display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div><div style="font-weight:700;">${p.title}</div>
        <div style="color:var(--muted);font-size:.84rem;">Class ${p.class_scope||'all'} — ${p.resource_type||'doc'}</div></div>
      <a href="${p.resource_url}" target="_blank" rel="noreferrer" style="color:var(--blue);font-weight:700;">Open ↗</a></div>`
  ).join('');
}

async function loadTeacherQuestionPapers() {
  if(!hasActiveTeacherSession()) return;
  try{const d=await API.getTeacherQuestionPapers();renderTeacherPaperList(d.papers||[]);}
  catch(err){showTeacherMsg('teacherPaperMessage',err.message||'Could not load papers.',true);}
}

async function createTeacherQuestionPaper() {
  const title=(document.getElementById('teacherPaperTitle')?.value||'').trim();
  const classScope=(document.getElementById('teacherPaperClass')?.value||'all').trim();
  const resourceType=(document.getElementById('teacherPaperType')?.value||'pdf').trim();
  const resourceUrl=(document.getElementById('teacherPaperUrl')?.value||'').trim();
  if(!title||!resourceUrl){showTeacherMsg('teacherPaperMessage','Enter title and URL.',true);return;}
  try{
    await API.createTeacherQuestionPaper({title,classScope,resourceType,resourceUrl});
    ['teacherPaperTitle','teacherPaperUrl'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
    showTeacherMsg('teacherPaperMessage','Paper added.',false);
    await loadTeacherQuestionPapers();
  }catch(err){showTeacherMsg('teacherPaperMessage',err.message||'Could not add.',true);}
}

function renderTeacherWeeklyTestTable(students) {
  const body=document.getElementById('teacherWeeklyTestBody');if(!body)return;
  if(!students.length){body.innerHTML='<tr><td colspan="5" style="padding:18px;color:var(--muted);">No students.</td></tr>';return;}
  body.innerHTML=students.map(s=>
    `<tr data-student-id="${s.id}">
      <td style="padding:14px 12px;border-top:1px solid rgba(255,255,255,.06);">${s.name}</td>
      <td style="padding:14px 12px;border-top:1px solid rgba(255,255,255,.06);">Class ${s.class}</td>
      <td style="padding:14px 12px;border-top:1px solid rgba(255,255,255,.06);">
        <input type="number" min="0" id="weekly-marks-${s.id}" placeholder="Marks" style="width:120px;" /></td>
      <td style="padding:14px 12px;border-top:1px solid rgba(255,255,255,.06);">
        <input type="text" id="weekly-note-${s.id}" placeholder="Note" style="width:100%;" /></td>
      <td style="padding:14px 12px;border-top:1px solid rgba(255,255,255,.06);">
        ${s.latestWeeklyTest?s.latestWeeklyTest.title+' — '+s.latestWeeklyTest.marks_obtained+'/'+s.latestWeeklyTest.total_marks:'No entry'}</td>
    </tr>`
  ).join('');
}

async function saveTeacherWeeklyTests() {
  const title=(document.getElementById('teacherWeeklyTestTitle')?.value||'').trim();
  const testDate=document.getElementById('teacherWeeklyTestDate')?.value||'';
  const total=Number(document.getElementById('teacherWeeklyTestTotal')?.value||100);
  if(!title||!testDate){showTeacherMsg('teacherWeeklyTestMessage','Enter title and date.',true);return;}
  const entries=teacherStudentCache.map(s=>({studentId:s.id,marksObtained:document.getElementById('weekly-marks-'+s.id)?.value||'',notes:document.getElementById('weekly-note-'+s.id)?.value||''}));
  try{await API.saveTeacherWeeklyTests({title,testDate,totalMarks:total,entries});showTeacherMsg('teacherWeeklyTestMessage','Marks saved.',false);await loadTeacherAttendance();}
  catch(err){showTeacherMsg('teacherWeeklyTestMessage',err.message||'Could not save.',true);}
}

function renderTeacherFeeTable(students) {
  const body=document.getElementById('teacherFeeBody');if(!body)return;
  if(!students.length){body.innerHTML='<tr><td colspan="6" style="padding:18px;color:var(--muted);">No students.</td></tr>';return;}
  body.innerHTML=students.map(s=>{
    const fee=s.feeSummary||{};
    return `<tr data-student-id="${s.id}">
      <td style="padding:14px 12px;border-top:1px solid rgba(255,255,255,.06);">${s.name}</td>
      <td style="padding:14px 12px;border-top:1px solid rgba(255,255,255,.06);">Class ${s.class}</td>
      <td style="padding:14px 12px;border-top:1px solid rgba(255,255,255,.06);">Rs ${fee.totalDue||0}</td>
      <td style="padding:14px 12px;border-top:1px solid rgba(255,255,255,.06);">Rs ${fee.totalPaid||0}</td>
      <td style="padding:14px 12px;border-top:1px solid rgba(255,255,255,.06);color:${Number(fee.pending||0)>0?'var(--pink)':'var(--green)'};">Rs ${fee.pending||0}</td>
      <td style="padding:14px 12px;border-top:1px solid rgba(255,255,255,.06);">
        <input type="number" min="0" id="fee-paid-${s.id}" placeholder="Amount paid" style="width:140px;" /></td>
    </tr>`;
  }).join('');
}

async function saveTeacherFees() {
  const paidOn=document.getElementById('teacherFeeDate')?.value||'';
  if(!paidOn){showTeacherMsg('teacherFeeMessage','Choose payment date.',true);return;}
  const entries=teacherStudentCache.map(s=>({studentId:s.id,amountPaid:document.getElementById('fee-paid-'+s.id)?.value||0}));
  try{await API.saveTeacherFees({paidOn,entries});showTeacherMsg('teacherFeeMessage','Fees saved.',false);await loadTeacherAttendance();}
  catch(err){showTeacherMsg('teacherFeeMessage',err.message||'Could not save.',true);}
}

function renderTeacherAttendanceTable(students) {
  const body=document.getElementById('teacherAttendanceBody');if(!body)return;
  if(!students.length){body.innerHTML='<tr><td colspan="6" style="padding:18px;color:var(--muted);">No students registered.</td></tr>';return;}
  body.innerHTML=students.map(s=>{
    const att=s.attendance||{};
    const cur=s.currentStatus==='absent'?'absent':'present';
    const app=s.approvalStatus==='rejected'?'rejected':'accepted';
    return `<tr data-student-id="${s.id}">
      <td style="padding:14px 12px;border-top:1px solid rgba(255,255,255,.06);">
        <div style="font-weight:700;">${s.name}</div>
        <div style="color:var(--muted);font-size:.85rem;">${s.email||''}</div></td>
      <td style="padding:14px 12px;border-top:1px solid rgba(255,255,255,.06);">Class ${s.class}</td>
      <td style="padding:14px 12px;border-top:1px solid rgba(255,255,255,.06);">${s.mobile||'N/A'}</td>
      <td style="padding:14px 12px;border-top:1px solid rgba(255,255,255,.06);">
        ${att.percentage||0}% <span style="color:var(--muted);">(${att.present||0}/${att.total||0})</span></td>
      <td style="padding:14px 12px;border-top:1px solid rgba(255,255,255,.06);">
        <label style="margin-right:12px;cursor:pointer;">
          <input type="radio" name="attendance-${s.id}" value="present" ${cur==='present'?'checked':''}> Present</label>
        <label style="cursor:pointer;">
          <input type="radio" name="attendance-${s.id}" value="absent" ${cur==='absent'?'checked':''}> Absent</label></td>
      <td style="padding:14px 12px;border-top:1px solid rgba(255,255,255,.06);">
        <select id="approval-${s.id}" style="min-width:140px;">
          <option value="accepted" ${app==='accepted'?'selected':''}>Accept</option>
          <option value="rejected" ${app==='rejected'?'selected':''}>Reject</option>
        </select></td>
    </tr>`;
  }).join('');
}

async function loadTeacherAttendance() {
  if(!hasActiveTeacherSession()) return;
  setDefaultTeacherDate();
  const dt=document.getElementById('teacherAttendanceDate')?.value||'';
  const wd=document.getElementById('teacherWeeklyTestDate');
  const fd=document.getElementById('teacherFeeDate');
  if(wd&&!wd.value) wd.value=dt;
  if(fd&&!fd.value) fd.value=dt;
  try {
    const data=await API.getTeacherStudents(dt);
    teacherStudentCache=data.students||[];
    renderTeacherAttendanceTable(teacherStudentCache);
    renderTeacherWeeklyTestTable(teacherStudentCache);
    renderTeacherFeeTable(teacherStudentCache);
    const info=document.getElementById('teacherSheetInfo');
    if(info) info.textContent=(data.attendanceSheet?.path)?'Sheet: '+data.attendanceSheet.path:'Sheet generated after saving.';
    renderNavProfile();
    await loadTeacherQuestionPapers();
  } catch(err){showTeacherMsg('teacherAttendanceMessage',err.message||'Could not load attendance.',true);}
}

async function saveTeacherAttendance() {
  if(!hasActiveTeacherSession()){alert('Please login as teacher.');return;}
  const date=document.getElementById('teacherAttendanceDate')?.value;
  if(!date){showTeacherMsg('teacherAttendanceMessage','Choose a date.',true);return;}
  const rows=Array.from(document.querySelectorAll('#teacherAttendanceBody tr[data-student-id]')).map(row=>{
    const sid=Number(row.dataset.studentId||0);
    const sel=row.querySelector('input[type="radio"]:checked');
    const app=row.querySelector('select');
    return sid?{studentId:sid,status:sel?sel.value:'present',approvalStatus:app?app.value:'accepted'}:null;
  }).filter(Boolean);
  try {
    const result=await API.saveTeacherAttendance(date,rows);
    const info=document.getElementById('teacherSheetInfo');
    if(info) info.textContent=result.sheetPath?'Sheet: '+result.sheetPath:'Sheet generated.';
    showTeacherMsg('teacherAttendanceMessage','Attendance saved for '+date+'.',false);
    await loadTeacherAttendance();
  } catch(err){showTeacherMsg('teacherAttendanceMessage',err.message||'Could not save.',true);}
}

// ── STUDENT RESOURCES ─────────────────────────────────────────────────────────
async function submitDailyMcqAnswer(mcqId,optionIndex) {
  try{const r=await API.submitStudentDailyMcq(mcqId,optionIndex);alert(r.isCorrect?'Correct! ✓':'Answer saved.');}
  catch(err){alert(err.message||'Could not submit.');}
}
async function renderDailyMcqs(role) {
  const summary=document.getElementById('studentMcqSummary');
  const list=document.getElementById('studentMcqList');
  if(!summary||!list) return;
  try {
    const data=role==='parent'?await API.getParentDailyMcqs():await API.getStudentDailyMcqs();
    const mcqs=data.mcqs||[];
    summary.textContent=data.batchTitle?data.batchTitle+' — '+mcqs.length+' question(s)':'No active MCQ batch.';
    if(!mcqs.length){list.innerHTML='<div style="color:var(--muted);">No MCQs right now.</div>';return;}
    list.innerHTML=mcqs.map((mcq,idx)=>{
      const opts=Array.isArray(mcq.options)?mcq.options:[];
      const opHtml=opts.map((opt,i)=>{
        const txt=typeof opt==='string'?opt:(opt&&opt.text||'');
        const img=typeof opt==='string'?'':(opt&&opt.imageUrl||'');
        return `<button class="btn-outline-sm" style="text-align:left;" onclick="submitDailyMcqAnswer(${mcq.id},${i})">
          ${String.fromCharCode(65+i)}. ${txt}
          ${img?`<img src="${img}" style="max-width:180px;width:100%;border-radius:12px;display:block;margin-top:6px;" />`:''}
        </button>`;
      }).join('');
      return `<div style="padding:14px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.02);display:flex;flex-direction:column;gap:10px;">
        <div style="font-weight:700;">${mcq.question||'Q'+(idx+1)}</div>
        <div style="display:grid;gap:8px;">${opHtml}</div></div>`;
    }).join('');
  } catch(err){summary.textContent=err.message||'Could not load.';list.innerHTML='';}
}
async function renderQuestionPapers(role) {
  const list=document.getElementById('studentPaperList'); if(!list) return;
  try {
    const data=role==='parent'?await API.getParentQuestionPapers():await API.getStudentQuestionPapers();
    const papers=data.papers||[];
    if(!papers.length){list.innerHTML='<div style="color:var(--muted);">No papers yet.</div>';return;}
    list.innerHTML=papers.map(p=>
      `<div style="padding:14px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.02);display:flex;justify-content:space-between;gap:12px;align-items:center;">
        <div><div style="font-weight:700;">${p.title}</div>
          <div style="color:var(--muted);font-size:.82rem;">Class ${p.class_scope||'all'} — ${p.resource_type||'doc'}</div></div>
        <a href="${p.resource_url}" target="_blank" rel="noreferrer" style="color:var(--blue);font-weight:700;">Open ↗</a></div>`
    ).join('');
  } catch(_){list.innerHTML='<div style="color:var(--muted);">Unable to load.</div>';}
}
async function loadStudentResources() {
  const role=getCurrentRole();
  if(role!=='student'&&role!=='parent') return;
  await renderDailyMcqs(role);
  await renderQuestionPapers(role);
}

// ── PAGE LOAD ─────────────────────────────────────────────────────────────────
window.addEventListener('load', async () => {
  renderTeacherMcqCards(10);
  const role = getCurrentRole();

  if (role === 'student') {
    updateHomeForSession();
    await refreshStudentData();
    loadStudentResources();
    loadStudentDoubts();
  } else if (role === 'parent') {
    // 1. Create widget shells immediately so DOM targets exist
    if (typeof window.ensureParentExtraWidgets === 'function') {
      window.ensureParentExtraWidgets();
    }
    // 2. Show correct tab before data arrives
    updateHomeForSession();
    // 3. Fetch live data and inject into every widget
    await refreshParentDashboard();
    // 4. Optionally load the resources section too
    loadStudentResources();
  } else if (role === 'teacher') {
    updateHomeForSession();
    loadTeacherAttendance();
    loadTeacherMcqs();
    loadTeacherDoubts();
    if (window.location.hash === '#teacher-dashboard') {
      const tab = document.getElementById('teacherDashTab');
      if (tab) switchTab('teacher', tab);
    }
  } else {
    updateHomeForSession();
  }
});


























