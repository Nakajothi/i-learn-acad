// ============================================================
//  DASHBOARD-AUTH.JS — I LEARN ACADEMY
//  Handles: student class pages, ai-parentreport.html
//  Exports global functions used by main.js for index.html parent tab
// ============================================================

// ── DOM HELPERS ──────────────────────────────────────────────────────────────
function formatAttendanceLabel(present, total) {
  const p = Number(present) || 0;
  const t = Number(total) || 0;
  const pct = t ? Math.round((p / t) * 100) : 0;
  return `${p}/${t} (${pct}%)`;
}
function _setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = (val === null || val === undefined) ? '' : String(val);
}
function _setWidth(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = pct;
}
function _setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}
function _stampUpdated(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = 'Last updated: ' + new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// Expose as window globals so main.js can call them
window.setElementText  = _setText;
window.setElementWidth = _setWidth;
window.setUpdatedLabel = _stampUpdated;
window.formatUpdatedLabel = function () {
  return 'Last updated: ' + new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

// ── PROFILE BANNER ────────────────────────────────────────────────────────────
function dashboardProfileMarkup(title, subtitle, details, logoutLabel, logoutFn) {
  const items = details.map(d =>
    `<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
       border-radius:14px;padding:14px 16px;min-width:160px;">
       <div style="font-size:0.72rem;color:#8888AA;text-transform:uppercase;
         letter-spacing:0.08em;margin-bottom:6px;">${d.label}</div>
       <div style="font-size:0.95rem;font-weight:600;color:#E8E8F5;">${d.value}</div>
     </div>`
  ).join('');
  return `
    <section id="roleDashboardProfile"
      style="max-width:1100px;margin:22px auto 0;padding:0 24px;">
      <div style="background:linear-gradient(135deg,rgba(77,158,255,.12),rgba(255,45,120,.12));
        border:1px solid rgba(255,255,255,.1);border-radius:22px;padding:22px;
        display:flex;justify-content:space-between;gap:18px;align-items:flex-start;flex-wrap:wrap;">
        <div>
          <div style="font-size:.76rem;color:#4D9EFF;font-weight:800;letter-spacing:.1em;
            text-transform:uppercase;margin-bottom:8px;">${title}</div>
          <h2 style="font-family:'Syne',sans-serif;font-size:1.45rem;font-weight:800;
            margin-bottom:6px;">${subtitle}</h2>
          <p style="color:#B6B6D6;font-size:.92rem;line-height:1.6;">Your dashboard is ready.</p>
        </div>
        <button onclick="${logoutFn}()"
          style="background:#FF2D78;color:#fff;border:none;border-radius:999px;
            padding:11px 18px;font-weight:700;cursor:pointer;">${logoutLabel}</button>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:14px;">${items}</div>
    </section>`;
}

// ── STUDENT LEARNING HUB (class pages) ───────────────────────────────────────
async function refreshStudentLearningHub() {
  const hub = document.getElementById('studentLearningHub');
  if (!hub) return;
  const data = await API.getStudentProfile();
  hub.outerHTML = _buildStudentHubMarkup(data);
}

window.submitStudentProfileMcq = async function (mcqId) {
  const sel = document.querySelector(`input[name="profile-mcq-${mcqId}"]:checked`);
  if (!sel) { alert('Please select an option before submitting.'); return; }
  try {
    await API.submitStudentDailyMcq(mcqId, Number(sel.value));
    await refreshStudentLearningHub();
  } catch (e) { alert(e.message || 'Could not submit MCQ.'); }
};

function _buildStudentHubMarkup(data) {
  const mcqSet   = data.dailyMcqSet    || { questions: [] };
  const papers   = data.questionPapers || [];
  const tests    = data.weeklyTests    || [];
  const fee      = data.feeSummary     || null;
  const qs       = Array.isArray(mcqSet.questions) ? mcqSet.questions : [];

  // MCQ section
  let mcqHtml;
  if (qs.length) {
    const qCards = qs.map(mcq => {
      const done = mcq.selected_index !== null && mcq.selected_index !== undefined;
      const col  = done ? (mcq.is_correct ? '#00E5A0' : '#FF2D78') : '#FFD166';
      const lbl  = done ? (mcq.is_correct ? 'Correct ✓' : 'Needs review ✗') : 'Pending';
      const opts = Array.isArray(mcq.options) ? mcq.options : [];
      const opHtml = opts.map((opt, i) => {
        const txt = typeof opt === 'string' ? opt : (opt?.text || '');
        const img = typeof opt === 'string' ? '' : (opt?.imageUrl || '');
        return `<label style="display:flex;gap:10px;align-items:flex-start;
          background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);
          padding:10px 12px;border-radius:12px;cursor:${done ? 'default' : 'pointer'};">
          <input type="radio" name="profile-mcq-${mcq.id}" value="${i}"
            ${Number(mcq.selected_index) === i ? 'checked' : ''}
            ${done ? 'disabled' : ''} />
          <span style="font-size:.88rem;color:#E8E8F5;">${txt}
            ${img ? `<img src="${img}" style="max-width:180px;width:100%;
              border-radius:12px;display:block;margin-top:6px;" />` : ''}
          </span></label>`;
      }).join('');
      return `<div style="padding:16px;border-radius:16px;background:rgba(13,13,26,.55);
        border:1px solid rgba(255,255,255,.06);display:grid;gap:14px;">
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div>
            <div style="font-size:.78rem;color:#4D9EFF;font-weight:700;">Q${mcq.question_no}</div>
            ${mcq.question ? `<div style="margin-top:6px;font-size:.92rem;">${mcq.question}</div>` : ''}
            ${mcq.question_image ? `<img src="${mcq.question_image}" style="margin-top:10px;
              max-width:280px;width:100%;border-radius:14px;display:block;" />` : ''}
          </div>
          <div style="color:${col};font-weight:700;font-size:.84rem;">${lbl}</div>
        </div>
        <div style="display:grid;gap:10px;">${opHtml}</div>
        ${done
          ? `<div style="color:#B6B6D6;font-size:.82rem;">Submitted ${mcq.submitted_at || 'today'}</div>`
          : `<button onclick="submitStudentProfileMcq(${mcq.id})"
               style="background:#00E5A0;color:#081019;border:none;border-radius:999px;
                 padding:10px 16px;font-weight:800;cursor:pointer;">Submit Answer</button>`}
      </div>`;
    }).join('');
    mcqHtml = `<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
      border-radius:20px;padding:22px;">
      <div style="font-size:.78rem;color:#4D9EFF;font-weight:800;text-transform:uppercase;">Daily MCQ</div>
      <h3 style="font-family:'Syne',sans-serif;margin-top:6px;">${mcqSet.batchTitle || 'Current MCQ Batch'}</h3>
      <div style="margin-top:16px;display:grid;gap:14px;">${qCards}</div></div>`;
  } else {
    mcqHtml = `<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
      border-radius:20px;padding:22px;">
      <div style="font-size:.78rem;color:#4D9EFF;font-weight:800;text-transform:uppercase;">Daily MCQ</div>
      <h3 style="font-family:'Syne',sans-serif;margin-top:6px;">No active MCQ batch</h3>
      <p style="color:#B6B6D6;font-size:.88rem;margin-top:8px;">Your teacher's batch will appear here.</p></div>`;
  }

  // Papers
  const papersHtml = `<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
    border-radius:20px;padding:22px;">
    <div style="font-size:.78rem;color:#4D9EFF;font-weight:800;text-transform:uppercase;">Question Papers</div>
    <div style="margin-top:14px;display:grid;gap:12px;">${papers.length
      ? papers.map(p => `<a href="${p.resource_url}" target="_blank" rel="noreferrer"
          style="display:flex;justify-content:space-between;gap:12px;align-items:center;
          padding:14px 16px;border-radius:16px;background:rgba(13,13,26,.55);
          border:1px solid rgba(255,255,255,.06);color:#E8E8F5;text-decoration:none;">
          <span>${p.title}</span>
          <span style="color:#B6B6D6;font-size:.84rem;">${p.resource_type || 'doc'}</span></a>`).join('')
      : '<div style="color:#B6B6D6;font-size:.88rem;">No papers posted yet.</div>'}
    </div></div>`;

  // Weekly Tests
  const testsHtml = `<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
    border-radius:20px;padding:22px;">
    <div style="font-size:.78rem;color:#4D9EFF;font-weight:800;text-transform:uppercase;">Weekly Tests</div>
    <div style="margin-top:14px;display:grid;gap:12px;">${tests.length
      ? tests.slice(0, 5).map(t => {
          const pct = t.total_marks ? Math.round((t.marks_obtained / t.total_marks) * 100) : 0;
          const col = pct >= 75 ? '#00E5A0' : pct >= 50 ? '#FFD166' : '#FF2D78';
          return `<div style="padding:14px 16px;border-radius:16px;background:rgba(13,13,26,.55);
            border:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;
            gap:12px;flex-wrap:wrap;">
            <div>
              <div style="font-weight:700;">${t.title}</div>
              <div style="color:#B6B6D6;font-size:.84rem;margin-top:4px;">${t.test_date || ''}</div>
            </div>
            <div style="font-weight:700;color:${col};">${t.marks_obtained}/${t.total_marks}
              <span style="font-size:.78rem;opacity:.8;">(${pct}%)</span></div></div>`;
        }).join('')
      : '<div style="color:#B6B6D6;font-size:.88rem;">No test marks yet.</div>'}
    </div></div>`;

  // Fees
  let feeBody;
  if (fee) {
    const pending = Number(fee.pending || 0);
    feeBody = `<div style="margin-top:14px;display:grid;gap:10px;">
      <div style="padding:14px 16px;border-radius:16px;background:rgba(13,13,26,.55);
        border:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;">
        <span>Total Fee</span><strong>Rs ${fee.totalDue || 0}</strong></div>
      <div style="padding:14px 16px;border-radius:16px;background:rgba(13,13,26,.55);
        border:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;">
        <span>Paid</span><strong style="color:#00E5A0;">Rs ${fee.totalPaid || 0}</strong></div>
      <div style="padding:14px 16px;border-radius:16px;background:rgba(13,13,26,.55);
        border:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;">
        <span>Pending</span><strong style="color:${pending > 0 ? '#FF2D78' : '#00E5A0'};">Rs ${fee.pending || 0}</strong></div>
      ${(fee.payments || []).slice(0, 3).map(p =>
        `<div style="padding:10px 14px;border-radius:12px;background:rgba(0,229,160,.06);
          border:1px solid rgba(0,229,160,.15);display:flex;justify-content:space-between;font-size:.84rem;">
          <span style="color:#B6B6D6;">Paid on ${p.paid_on}</span>
          <strong style="color:#00E5A0;">Rs ${p.amount_paid}</strong></div>`).join('')}
    </div>`;
  } else {
    feeBody = '<div style="margin-top:14px;color:#B6B6D6;font-size:.88rem;">No fee entries yet.</div>';
  }
  const feeHtml = `<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
    border-radius:20px;padding:22px;">
    <div style="font-size:.78rem;color:#4D9EFF;font-weight:800;text-transform:uppercase;">Fees</div>
    ${feeBody}</div>`;

  return `<section id="studentLearningHub"
    style="max-width:1100px;margin:20px auto 0;padding:0 24px;">
    <div style="display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));">
      ${mcqHtml}${papersHtml}${testsHtml}${feeHtml}
    </div></section>`;
}

async function setupStudentDashboard() {
  if (!localStorage.getItem('ilearn_token')) return;
  try {
    const data    = await API.getStudentProfile();
    const student = data.student;
    const expected = 'class' + String(student.class).trim() + '.html';
    if (!window.location.pathname.endsWith(expected)) {
      window.location.href = expected;
      return;
    }
    const topbar = document.querySelector('.topbar');
    if (topbar && !document.getElementById('roleDashboardProfile')) {
      const pres = Number(data.attendance?.present) || 0;
      const tot  = Number(data.totalAttendance?.total) || 0;
      topbar.insertAdjacentHTML('afterend', dashboardProfileMarkup(
        'Student Profile', student.name,
        [
          { label: 'Role',       value: 'Student' },
          { label: 'Class',      value: 'Class ' + student.class },
          { label: 'Email',      value: student.email  || 'N/A' },
          { label: 'Mobile',     value: student.mobile || 'N/A' },
          { label: 'Attendance', value: formatAttendanceLabel(pres, tot) }
        ],
        'Logout', 'API.logoutStudent'
      ));
    }
    if (topbar && !document.getElementById('studentLearningHub')) {
      const prof = document.getElementById('roleDashboardProfile');
      if (prof) prof.insertAdjacentHTML('afterend', _buildStudentHubMarkup(data));
    }
  } catch (err) { API.logoutStudent(); }
}

// ── PARENT DASHBOARD WIDGETS (index.html tab) ─────────────────────────────────

/**
 * Ensure the extra dynamic widgets exist inside #tab-parent.
 * Safe to call multiple times — each widget is only created once.
 */
window.ensureParentExtraWidgets = function () {
  const tab = document.getElementById('tab-parent');
  if (!tab) return;

  function addWidget(id, innerHtml) {
    if (document.getElementById(id)) return;
    const div = document.createElement('div');
    div.className = 'dash-widget';
    div.id = id;
    div.innerHTML = innerHtml;
    tab.appendChild(div);
  }

  addWidget('parentWeeklyTestsWidget', `
    <h4>&#128203; Weekly Test Marks</h4>
    <div id="parentWeeklyTestsList" style="color:var(--muted);font-size:.9rem;">
      Loading weekly test marks…</div>
    <div class="dash-updated" id="parentWeeklyTestsUpdated">Last updated: --</div>`);

  addWidget('parentMcqWidget', `
    <h4>&#128221; Daily MCQ Performance</h4>
    <div id="parentMcqSummary" style="color:var(--muted);font-size:.9rem;margin-bottom:10px;">
      Loading MCQ data…</div>
    <div id="parentMcqList"></div>
    <div class="dash-updated" id="parentMcqUpdated">Last updated: --</div>`);

  addWidget('parentTopicWidget', `
    <h4>&#128200; Topic Performance</h4>
    <div id="parentTopicProgress" style="color:var(--muted);font-size:.9rem;">
      Topic data appears after first assessment.</div>`);

  addWidget('parentPapersWidget', `
    <h4>&#128196; Question Papers</h4>
    <div id="parentQuestionPapersList" style="color:var(--muted);font-size:.9rem;">
      Loading question papers…</div>`);

  addWidget('parentTopicsWidget', `
    <h4>&#127919; Weak &amp; Strong Topics</h4>
    <div style="margin-bottom:10px;">
      <div style="font-size:.78rem;color:var(--muted);margin-bottom:5px;
        text-transform:uppercase;letter-spacing:.06em;">Needs Focus</div>
      <div id="parentWeakTopics" style="color:var(--muted);font-size:.88rem;">Loading…</div>
    </div>
    <div>
      <div style="font-size:.78rem;color:var(--muted);margin-bottom:5px;
        text-transform:uppercase;letter-spacing:.06em;">Strong Areas</div>
      <div id="parentStrongTopics" style="color:var(--muted);font-size:.88rem;">Loading…</div>
    </div>`);

  addWidget('parentSummaryWidget', `
    <h4>&#128202; Quick Summary</h4>
    <div class="metric-row">
      <span class="metric-label">Attendance %</span>
      <span class="metric-value up" id="parentSummaryAttendance">--</span>
    </div>
    <div class="metric-row">
      <span class="metric-label">MCQ Score</span>
      <span class="metric-value" id="parentSummaryMcq">--</span>
    </div>
    <div class="metric-row">
      <span class="metric-label">Fee Pending</span>
      <span class="metric-value" id="parentSummaryFee">--</span>
    </div>
    <div class="dash-updated" id="parentSummaryUpdated">Last updated: --</div>`);
};

/**
 * Inject ALL parent-tab data directly from the raw API response object.
 * Never reads localStorage — always uses the live data passed in.
 *
 * @param {object} raw   — the full object returned by API.getParentReport()
 * @param {object} student — the student sub-object from that same response
 */
window.injectParentTabData = function (raw, student) {
  // Always guarantee widgets exist first
  window.ensureParentExtraWidgets();

  // ── Normalise the data ────────────────────────────────────────────────────
  // The server spreads fullData AND nests it under .report, so we
  // accept either shape transparently.
  const d = raw || {};

  // Attendance — server puts it in attendanceSummary.month
  const monthAtt   = d.attendanceSummary?.month   || d.attendance || {};
  const overallAtt = d.attendanceSummary?.overall  || d.attendanceSummary?.month || d.attendance || {};
  const pres    = Number(monthAtt.present  || 0);
  const tot     = Number(monthAtt.total    || 0);
  const overallPct = Number(overallAtt.percentage ||
    (tot ? Math.round((pres / tot) * 100) : 0));

  // Fee — server builds feeSummary from fee_payments table
  const fee = d.feeSummary || null;

  // Weekly tests — array from weekly_tests table
  const weeklyTests = Array.isArray(d.weeklyTests) ? d.weeklyTests : [];

  // MCQ — dailyMcqSet with questions array
  const mcqSet  = d.dailyMcqSet || {};
  const mcqQs   = Array.isArray(mcqSet.questions) ? mcqSet.questions : [];
  const answered = mcqQs.filter(q =>
    q.selected_index !== null && q.selected_index !== undefined);
  const correct  = answered.filter(q =>
    q.is_correct === 1 || q.is_correct === true).length;

  // Question papers
  const papers = Array.isArray(d.questionPapers) ? d.questionPapers : [];

  // Topics
  const weakTopics   = Array.isArray(d.weakTopics)   ? d.weakTopics   : [];
  const strongTopics = Array.isArray(d.strongTopics)  ? d.strongTopics : [];
  const latestA      = d.latestAssessment || null;
  let topicScores    = {};
  if (latestA?.topic_scores) {
    try { topicScores = JSON.parse(latestA.topic_scores); } catch (_) {}
  } else if (d.topicScores) {
    topicScores = d.topicScores;
  }

  // ── 1. ATTENDANCE (existing HTML widgets) ────────────────────────────────
  _setText('parentAttendanceMonth',         `${pres} / ${tot} days`);
  _setText('parentAttendanceOverall',       `${overallPct}%`);
  _setText('parentAttendanceStudent',       student?.name || 'Linked student');
  _setText('parentAttendanceProgressLabel', `${overallPct}%`);
  _setWidth('parentAttendanceProgress',     Math.min(100, overallPct) + '%');
  _stampUpdated('parentAttendanceUpdated');

  // ── 2. FEES (existing HTML widgets) ──────────────────────────────────────
  _setText('parentFeeBatch', student?.class ? `Class ${student.class}` : 'Linked batch');
  if (fee) {
    const pendingAmt = Number(fee.pending || 0);
    _setText('parentFeeStatus',  pendingAmt > 0 ? `Rs ${pendingAmt} pending` : 'Paid up to date');
    _setText('parentFeePaid',    `Rs ${Number(fee.totalPaid || 0).toFixed(0)}`);
    _setText('parentFeePending', `Rs ${Number(fee.pending   || 0).toFixed(0)}`);
  } else {
    _setText('parentFeeStatus',  'No fee entries yet');
    _setText('parentFeePaid',    'Rs 0');
    _setText('parentFeePending', 'Rs 0');
  }
  _stampUpdated('parentFeeUpdated');

  // ── 3. WEEKLY TESTS (dynamic widget) ─────────────────────────────────────
  if (weeklyTests.length === 0) {
    _setHTML('parentWeeklyTestsList',
      '<span style="color:var(--muted);font-size:.88rem;">No weekly test marks entered yet. ' +
      'They will appear here once your teacher adds them.</span>');
  } else {
    _setHTML('parentWeeklyTestsList', weeklyTests.slice(0, 8).map(t => {
      const sc  = Number(t.marks_obtained || 0);
      const tot = Number(t.total_marks    || 100);
      const pct = tot ? Math.round((sc / tot) * 100) : 0;
      const col = pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--pink)';
      return `
        <div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06);
          display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start;">
          <div>
            <strong style="font-size:.88rem;">${t.title || 'Test'}</strong>
            <div style="font-size:.76rem;color:var(--muted);margin-top:2px;">${t.test_date || ''}</div>
            ${t.notes ? `<div style="font-size:.75rem;color:var(--muted);">${t.notes}</div>` : ''}
          </div>
          <span style="font-weight:700;color:${col};white-space:nowrap;">
            ${sc}/${tot} <span style="font-size:.76rem;opacity:.8;">(${pct}%)</span>
          </span>
        </div>`;
    }).join(''));
  }
  _stampUpdated('parentWeeklyTestsUpdated');

  // ── 4. MCQ PERFORMANCE (dynamic widget) ──────────────────────────────────
  _setText('parentMcqSummary',
    mcqQs.length
      ? `${mcqSet.batchTitle || 'Current batch'} — ${answered.length}/${mcqQs.length} attempted, ${correct} correct`
      : 'No active MCQ batch right now.');
  _setHTML('parentMcqList', mcqQs.slice(0, 6).map((q, i) => {
    const att = q.selected_index !== null && q.selected_index !== undefined;
    const ok  = q.is_correct === 1 || q.is_correct === true;
    const col = att ? (ok ? 'var(--green)' : 'var(--pink)') : 'var(--muted)';
    const lbl = att ? (ok ? '✓ Correct' : '✗ Needs review') : 'Not attempted';
    return `
      <div style="padding:10px 0;border-top:1px solid rgba(255,255,255,.06);
        display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <div>
          <div style="font-size:.8rem;color:var(--blue);font-weight:700;margin-bottom:2px;">
            Q${q.question_no || (i + 1)}</div>
          ${q.question ? `<div style="font-size:.85rem;color:var(--text);line-height:1.5;">${q.question}</div>` : ''}
        </div>
        <div style="color:${col};font-weight:700;font-size:.82rem;white-space:nowrap;">${lbl}</div>
      </div>`;
  }).join(''));
  _stampUpdated('parentMcqUpdated');

  // ── 5. TOPIC PERFORMANCE (dynamic widget) ────────────────────────────────
  const topicEntries = Object.entries(topicScores);
  _setHTML('parentTopicProgress',
    topicEntries.length
      ? topicEntries.map(([name, score]) => {
          const pct = Number(score) || 0;
          const col = pct >= 75 ? '#00E5A0' : pct >= 50 ? '#FFD166' : '#FF2D78';
          return `
            <div style="margin-bottom:11px;">
              <div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:4px;">
                <span>${name}</span>
                <span style="color:${col};font-weight:700;">${pct}%</span>
              </div>
              <div style="height:6px;background:rgba(255,255,255,.07);border-radius:50px;overflow:hidden;">
                <div style="height:100%;width:${pct}%;background:${col};border-radius:50px;
                  transition:width .5s;"></div>
              </div>
            </div>`;
        }).join('')
      : '<span style="color:var(--muted);font-size:.88rem;">Topic data appears after first assessment.</span>');

  // ── 6. QUESTION PAPERS (dynamic widget) ──────────────────────────────────
  _setHTML('parentQuestionPapersList',
    papers.length
      ? papers.slice(0, 5).map(p =>
          `<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06);
            display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;">
            <div>
              <div style="font-size:.88rem;font-weight:600;">${p.title}</div>
              <div style="font-size:.76rem;color:var(--muted);">
                Class ${p.class_scope || 'all'} · ${p.resource_type || 'doc'} · ${p.posted_at || ''}</div>
            </div>
            <a href="${p.resource_url}" target="_blank" rel="noreferrer"
              style="color:var(--blue);font-weight:700;font-size:.82rem;white-space:nowrap;">
              Open ↗</a>
          </div>`).join('')
      : '<span style="color:var(--muted);font-size:.88rem;">No question papers posted yet.</span>');

  // ── 7. WEAK / STRONG TOPICS (dynamic widget) ─────────────────────────────
  _setHTML('parentWeakTopics',
    weakTopics.length
      ? weakTopics.map(t =>
          `<span style="display:inline-block;margin:3px;padding:4px 12px;border-radius:50px;
            background:rgba(255,45,120,.12);color:#FF2D78;font-size:.78rem;font-weight:700;">${t}</span>`
        ).join('')
      : '<span style="color:var(--muted);font-size:.88rem;">No weak topics identified yet.</span>');
  _setHTML('parentStrongTopics',
    strongTopics.length
      ? strongTopics.map(t =>
          `<span style="display:inline-block;margin:3px;padding:4px 12px;border-radius:50px;
            background:rgba(0,229,160,.12);color:#00E5A0;font-size:.78rem;font-weight:700;">${t}</span>`
        ).join('')
      : '<span style="color:var(--muted);font-size:.88rem;">No strong topics identified yet.</span>');

  // ── 8. QUICK SUMMARY (dynamic widget) ────────────────────────────────────
  _setText('parentSummaryAttendance', `${overallPct}% (${pres}/${tot})`);
  _setText('parentSummaryMcq',
    mcqQs.length ? `${correct}/${mcqQs.length} correct` : 'No MCQ yet');
  _setText('parentSummaryFee',
    fee ? `Rs ${Number(fee.pending || 0).toFixed(0)} pending` : 'No data');
  _stampUpdated('parentSummaryUpdated');
};

// ── ai-parentreport.html — standalone parent report page ──────────────────────
async function setupParentDashboard() {
  if (!localStorage.getItem('ilearn_parent_token')) {
    window.location.href = 'index.html';
    return;
  }
  try {
    // Single fetch, use top-level fields (server spreads everything at root)
    const raw     = await API.getParentReport();
    const student = raw.student || {};

    let aiReport = null;
    try {
      const aiRes = await API.getParentAIReport();
      aiReport = aiRes.aiReport || aiRes;
    } catch (_) {}
    if (!aiReport || !aiReport.overallSummary) {
      aiReport = _buildFallbackAiReport(student, raw);
    }

    const topbar = document.querySelector('.topbar');
    if (topbar && !document.getElementById('roleDashboardProfile')) {
      const monthAtt = raw.attendanceSummary?.month || raw.attendance || {};
      topbar.insertAdjacentHTML('afterend', dashboardProfileMarkup(
        'Parent Profile', 'Parent of ' + (student.name || 'Student'),
        [
          { label: 'Role',       value: 'Parent' },
          { label: 'Student',    value: student.name  || 'Linked student' },
          { label: 'Class',      value: student.class ? 'Class ' + student.class : 'N/A' },
          { label: 'Mobile',     value: student.mobile || 'N/A' },
          { label: 'Attendance', value: formatAttendanceLabel(monthAtt.present, monthAtt.total) }
        ],
        'Logout', 'API.logoutParent'
      ));
    }

    if (typeof renderReport === 'function') {
      const assessments  = raw.assessmentHistory || [];
      const latest       = raw.latestAssessment  || assessments[0] || null;
      const previous     = assessments[1] || null;
      const prevTopics   = previous?.topic_scores ? (() => { try { return JSON.parse(previous.topic_scores); } catch (_) { return {}; } })() : {};
      let   topicScores  = {};
      if (latest?.topic_scores) { try { topicScores = JSON.parse(latest.topic_scores); } catch (_) {} }
      else if (raw.topicScores) { topicScores = raw.topicScores; }

      // Build attendance from the server response (same fields as index.html)
      const monthAtt = raw.attendanceSummary?.month || raw.attendance || {};

      renderReport(
        student.name || 'Student',
        'Class ' + (student.class || '?'),
        'Latest Update',
        {
          attendance:     Number(monthAtt.present) || 0,
          totalDays:      Number(monthAtt.total)   || 0,
          testsCompleted: assessments.length,
          testsTotal:     Math.max(assessments.length, 1),
          avgScore:  latest?.total    ? Math.round((latest.score    / latest.total)    * 100) : 0,
          prevScore: previous?.total  ? Math.round((previous.score  / previous.total)  * 100) : 0,
          rank: 1, batchSize: 1,
          weeklySummary:  raw.weeklySummary  || null,
          weakTopics:     raw.weakTopics     || [],
          strongTopics:   raw.strongTopics   || [],
          recentMcqs:     raw.recentMcqs     || [],
          weeklyTests:    raw.weeklyTests    || [],
          questionPapers: raw.questionPapers || [],
          feeSummary:     raw.feeSummary     || null,
          topics: Object.keys(topicScores).map(name => ({
            name,
            score: Number(topicScores[name])  || 0,
            prev:  Number(prevTopics[name])   || Number(topicScores[name]) || 0
          }))
        },
        aiReport
      );
    }
  } catch (err) {
    console.error('[setupParentDashboard]', err);
    const main = document.getElementById('mainContent');
    if (main) {
      main.innerHTML = `<h1>Parent Dashboard</h1>
        <p style="color:var(--muted);margin-top:12px;">
          Could not load report: ${err.message || 'Unknown error'}</p>
        <button class="btn-primary" style="margin-top:20px;"
          onclick="API.logoutParent()">Logout</button>`;
    }
  }
}

function _buildFallbackAiReport(student, raw) {
  const name   = student?.name || 'Student';
  const weak   = raw.weakTopics   || [];
  const strong = raw.strongTopics || [];
  const monthAtt = raw.attendanceSummary?.month || raw.attendance || {};
  const latest   = raw.latestAssessment || null;
  const score    = latest?.total ? Math.round((latest.score / latest.total) * 100) : 0;
  return {
    overallSummary: `${name} is progressing steadily. Latest score: ${score}%. ` +
      `Attendance this month: ${monthAtt.present || 0}/${monthAtt.total || 0} days.`,
    highlights: [
      strong.length ? 'Strong topics: ' + strong.join(', ') : 'Keep encouraging regular practice.',
      latest ? 'Assessment completed on ' + (latest.taken_at?.slice(0, 10) || 'recently') + '.'
             : 'No assessments recorded yet.'
    ],
    concerns: weak.length
      ? ['Needs extra attention in: ' + weak.join(', ') + '.']
      : ['No major weak topics identified yet.'],
    parentTips: [
      'Ask your child to revise one weak topic for 20–30 minutes daily.',
      'Review attendance and weekly test performance together each week.'
    ],
    nextWeekFocus: weak.length
      ? `Focus on ${weak[0]} and keep practicing recent test topics.`
      : 'Maintain consistency with revision and daily practice.'
  };
}

// ── AUTO-INIT for class pages and standalone parent report page ───────────────
window.addEventListener('load', () => {
  const path = window.location.pathname;
  if (/class(9|10|11|12)\.html$/.test(path)) {
    setupStudentDashboard();
  } else if (path.endsWith('ai-parentreport.html')) {
    setupParentDashboard();
  }
});





