// ============================================================
//  DASHBOARD-AUTH.JS — I LEARN ACADEMY
//  Self-contained: defines own helpers, exports to window for main.js
// ============================================================

// ── HELPERS (self-contained, also exported for main.js) ───────
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
function _setUpdated(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = 'Last updated: ' + new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}
function _pct(a, b) {
  const n = Number(a) || 0, d = Number(b) || 0;
  return d ? Math.round((n / d) * 10) / 10 : 0;
}
function formatAttendanceLabel(present, total) {
  const p = Number(present) || 0, t = Number(total) || 0;
  const pct = t ? Math.round((p / t) * 100) : 0;
  return p + '/' + t + ' (' + pct + '%)';
}

// Export for main.js (which loads after this file)
window.setElementText  = _setText;
window.setElementWidth = _setWidth;
window.setUpdatedLabel = function(id) { _setUpdated(id); };
window.formatUpdatedLabel = function() {
  return 'Last updated: ' + new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

// ── PROFILE BANNER ─────────────────────────────────────────────
function dashboardProfileMarkup(title, subtitle, details, logoutLabel, logoutFn) {
  var items = details.map(function(item) {
    return '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);'
         + 'border-radius:14px;padding:14px 16px;min-width:160px;">'
         + '<div style="font-size:0.72rem;color:#8888AA;text-transform:uppercase;'
         + 'letter-spacing:0.08em;margin-bottom:6px;">' + item.label + '</div>'
         + '<div style="font-size:0.95rem;font-weight:600;color:#E8E8F5;">' + item.value + '</div>'
         + '</div>';
  }).join('');
  return '<section id="roleDashboardProfile" style="max-width:1100px;margin:22px auto 0;padding:0 24px;">'
       + '<div style="background:linear-gradient(135deg,rgba(77,158,255,0.12),rgba(255,45,120,0.12));'
       + 'border:1px solid rgba(255,255,255,0.1);border-radius:22px;padding:22px;'
       + 'display:flex;justify-content:space-between;gap:18px;align-items:flex-start;flex-wrap:wrap;">'
       + '<div><div style="font-size:0.76rem;color:#4D9EFF;font-weight:800;letter-spacing:0.1em;'
       + 'text-transform:uppercase;margin-bottom:8px;">' + title + '</div>'
       + '<h2 style="font-family:\'Syne\',sans-serif;font-size:1.45rem;font-weight:800;margin-bottom:6px;">'
       + subtitle + '</h2>'
       + '<p style="color:#B6B6D6;font-size:0.92rem;line-height:1.6;">Your dashboard is ready.</p></div>'
       + '<button onclick="' + logoutFn + '()" style="background:#FF2D78;color:#fff;border:none;'
       + 'border-radius:999px;padding:11px 18px;font-weight:700;cursor:pointer;">' + logoutLabel + '</button>'
       + '</div>'
       + '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:14px;">' + items + '</div>'
       + '</section>';
}

// ── STUDENT LEARNING HUB (class pages) ────────────────────────
async function refreshStudentLearningHub() {
  var hub = document.getElementById('studentLearningHub');
  if (!hub) return;
  var data = await API.getStudentProfile();
  hub.outerHTML = studentHubMarkup(data);
}
async function submitStudentProfileMcq(mcqId) {
  var sel = document.querySelector('input[name="profile-mcq-' + mcqId + '"]:checked');
  if (!sel) { alert('Please select an option before submitting.'); return; }
  try {
    await API.submitStudentDailyMcq(mcqId, Number(sel.value));
    await refreshStudentLearningHub();
  } catch(e) { alert(e.message || 'Could not submit MCQ.'); }
}

function _mcqOptionHtml(opt, i, mcqId, done) {
  var txt = typeof opt === 'string' ? opt : (opt && opt.text ? opt.text : '');
  var img = typeof opt === 'string' ? '' : (opt && opt.imageUrl ? opt.imageUrl : '');
  return '<label style="display:flex;gap:10px;align-items:flex-start;background:rgba(255,255,255,0.03);'
       + 'border:1px solid rgba(255,255,255,0.06);padding:10px 12px;border-radius:12px;cursor:'
       + (done ? 'default' : 'pointer') + ';">'
       + '<input type="radio" name="profile-mcq-' + mcqId + '" value="' + i + '" />'
       + '<span style="font-size:0.88rem;color:#E8E8F5;">' + txt
       + (img ? '<img src="' + img + '" style="max-width:180px;width:100%;border-radius:12px;display:block;margin-top:6px;" />' : '')
       + '</span></label>';
}

function studentHubMarkup(data) {
  var mcqSet = (data && data.dailyMcqSet)    || { questions: [] };
  var papers = (data && data.questionPapers) || [];
  var tests  = (data && data.weeklyTests)    || [];
  var fee    = (data && data.feeSummary)     || null;
  var qs     = Array.isArray(mcqSet.questions) ? mcqSet.questions : [];

  var mcqHtml;
  if (qs.length) {
    var qCards = qs.map(function(mcq) {
      var done  = mcq.selected_index !== null && mcq.selected_index !== undefined;
      var col   = done ? (mcq.is_correct ? '#00E5A0' : '#FF2D78') : '#FFD166';
      var lbl   = done ? (mcq.is_correct ? 'Correct ✓' : 'Needs review ✗') : 'Pending';
      var opts  = Array.isArray(mcq.options) ? mcq.options : [];
      var opHtml = opts.map(function(opt, i) { return _mcqOptionHtml(opt, i, mcq.id, done); }).join('');
      return '<div style="padding:16px;border-radius:16px;background:rgba(13,13,26,0.55);'
           + 'border:1px solid rgba(255,255,255,0.06);display:grid;gap:14px;">'
           + '<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">'
           + '<div><div style="font-size:0.78rem;color:#4D9EFF;font-weight:700;">Q' + mcq.question_no + '</div>'
           + (mcq.question ? '<div style="margin-top:6px;font-size:0.92rem;">' + mcq.question + '</div>' : '')
           + (mcq.question_image ? '<img src="' + mcq.question_image + '" style="margin-top:10px;max-width:280px;width:100%;border-radius:14px;display:block;" />' : '')
           + '</div><div style="color:' + col + ';font-weight:700;font-size:0.84rem;">' + lbl + '</div></div>'
           + '<div style="display:grid;gap:10px;">' + opHtml + '</div>'
           + (done
              ? '<div style="color:#B6B6D6;font-size:0.82rem;">Submitted ' + (mcq.submitted_at || 'today') + '</div>'
              : '<button onclick="submitStudentProfileMcq(' + mcq.id + ')" style="background:#00E5A0;color:#081019;border:none;border-radius:999px;padding:10px 16px;font-weight:800;cursor:pointer;">Submit Answer</button>')
           + '</div>';
    }).join('');
    mcqHtml = '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:22px;">'
            + '<div style="font-size:0.78rem;color:#4D9EFF;font-weight:800;text-transform:uppercase;">Daily MCQ</div>'
            + '<h3 style="font-family:\'Syne\',sans-serif;margin-top:6px;">' + (mcqSet.batchTitle || 'Current MCQ Batch') + '</h3>'
            + '<div style="margin-top:16px;display:grid;gap:14px;">' + qCards + '</div></div>';
  } else {
    mcqHtml = '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:22px;">'
            + '<div style="font-size:0.78rem;color:#4D9EFF;font-weight:800;text-transform:uppercase;">Daily MCQ</div>'
            + '<h3 style="font-family:\'Syne\',sans-serif;margin-top:6px;">No active MCQ batch</h3>'
            + '<p style="color:#B6B6D6;font-size:0.88rem;margin-top:8px;">Your teacher\'s batch will appear here.</p></div>';
  }

  var papersHtml = '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:22px;">'
    + '<div style="font-size:0.78rem;color:#4D9EFF;font-weight:800;text-transform:uppercase;">Question Papers</div>'
    + '<div style="margin-top:14px;display:grid;gap:12px;">'
    + (papers.length
        ? papers.map(function(p) {
            return '<a href="' + p.resource_url + '" target="_blank" rel="noreferrer" style="display:flex;justify-content:space-between;gap:12px;align-items:center;padding:14px 16px;border-radius:16px;background:rgba(13,13,26,0.55);border:1px solid rgba(255,255,255,0.06);color:#E8E8F5;text-decoration:none;">'
                 + '<span>' + p.title + '</span><span style="color:#B6B6D6;font-size:0.84rem;">' + (p.resource_type || 'doc') + '</span></a>';
          }).join('')
        : '<div style="color:#B6B6D6;font-size:0.88rem;">No papers yet.</div>')
    + '</div></div>';

  var testsHtml = '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:22px;">'
    + '<div style="font-size:0.78rem;color:#4D9EFF;font-weight:800;text-transform:uppercase;">Weekly Tests</div>'
    + '<div style="margin-top:14px;display:grid;gap:12px;">'
    + (tests.length
        ? tests.slice(0,5).map(function(t) {
            return '<div style="padding:14px 16px;border-radius:16px;background:rgba(13,13,26,0.55);border:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">'
                 + '<div><div style="font-weight:700;">' + t.title + '</div><div style="color:#B6B6D6;font-size:0.84rem;">' + (t.test_date || '') + '</div></div>'
                 + '<div style="font-weight:700;color:#00E5A0;">' + t.marks_obtained + '/' + t.total_marks + '</div></div>';
          }).join('')
        : '<div style="color:#B6B6D6;font-size:0.88rem;">No test marks yet.</div>')
    + '</div></div>';

  var feeHtml = '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:22px;">'
    + '<div style="font-size:0.78rem;color:#4D9EFF;font-weight:800;text-transform:uppercase;">Fees</div>';
  if (fee) {
    feeHtml += '<div style="margin-top:14px;display:grid;gap:10px;">'
      + '<div style="display:flex;justify-content:space-between;padding:12px 14px;border-radius:12px;background:rgba(13,13,26,0.55);border:1px solid rgba(255,255,255,0.06);">'
      + '<span>Total Fee</span><strong>Rs ' + (fee.totalDue || 0) + '</strong></div>'
      + '<div style="display:flex;justify-content:space-between;padding:12px 14px;border-radius:12px;background:rgba(13,13,26,0.55);border:1px solid rgba(255,255,255,0.06);">'
      + '<span>Paid</span><strong style="color:#00E5A0;">Rs ' + (fee.totalPaid || 0) + '</strong></div>'
      + '<div style="display:flex;justify-content:space-between;padding:12px 14px;border-radius:12px;background:rgba(13,13,26,0.55);border:1px solid rgba(255,255,255,0.06);">'
      + '<span>Pending</span><strong style="color:' + (Number(fee.pending) > 0 ? '#FF2D78' : '#00E5A0') + ';">Rs ' + (fee.pending || 0) + '</strong></div>'
      + ((fee.payments || []).slice(0,3).map(function(p) {
          return '<div style="display:flex;justify-content:space-between;padding:10px 14px;border-radius:12px;background:rgba(0,229,160,0.06);border:1px solid rgba(0,229,160,0.15);font-size:0.84rem;">'
               + '<span style="color:#B6B6D6;">Paid on ' + p.paid_on + '</span>'
               + '<strong style="color:#00E5A0;">Rs ' + p.amount_paid + '</strong></div>';
        }).join(''))
      + '</div>';
  } else {
    feeHtml += '<div style="margin-top:14px;color:#B6B6D6;font-size:0.88rem;">No fee entries yet.</div>';
  }
  feeHtml += '</div>';

  return '<section id="studentLearningHub" style="max-width:1100px;margin:20px auto 0;padding:0 24px;">'
       + '<div style="display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));">'
       + mcqHtml + papersHtml + testsHtml + feeHtml
       + '</div></section>';
}

async function setupStudentDashboard() {
  if (!localStorage.getItem('ilearn_token')) return;
  try {
    var data = await API.getStudentProfile();
    var student = data.student;
    var expected = 'class' + String(student.class).trim() + '.html';
    if (!window.location.pathname.endsWith(expected)) { window.location.href = expected; return; }
    var topbar = document.querySelector('.topbar');
    if (topbar && !document.getElementById('roleDashboardProfile')) {
      var pres = Number(data.attendance && data.attendance.present) || 0;
      var tot  = Number(data.totalAttendance && data.totalAttendance.total) || 0;
      topbar.insertAdjacentHTML('afterend', dashboardProfileMarkup(
        'Student Profile', student.name,
        [
          { label: 'Role',       value: 'Student' },
          { label: 'Class',      value: 'Class ' + student.class },
          { label: 'Email',      value: student.email  || 'N/A' },
          { label: 'Mobile',     value: student.mobile || 'N/A' },
          { label: 'Attendance', value: formatAttendanceLabel(pres, tot) }
        ], 'Logout', 'API.logoutStudent'));
    }
    if (!document.getElementById('studentLearningHub')) {
      var prof = document.getElementById('roleDashboardProfile');
      if (prof) prof.insertAdjacentHTML('afterend', studentHubMarkup(data));
    }
  } catch(err) { API.logoutStudent(); }
}

// ── PARENT EXTRA WIDGETS ──────────────────────────────────────
function ensureParentExtraWidgets() {
  var tab = document.getElementById('tab-parent');
  if (!tab) return;
  function add(id, html) {
    if (!document.getElementById(id)) {
      var d = document.createElement('div');
      d.className = 'dash-widget';
      d.id = id;
      d.innerHTML = html;
      tab.appendChild(d);
    }
  }
  add('parentWeeklyTestsWidget',
    '<h4>&#128203; Weekly Test Marks</h4>'
    + '<div id="parentWeeklyTestsList" style="color:var(--muted);font-size:0.9rem;">No test marks yet.</div>'
    + '<div class="dash-updated" id="parentWeeklyTestsUpdated">Last updated: --</div>');
  add('parentMcqWidget',
    '<h4>&#128221; Daily MCQ Performance</h4>'
    + '<div id="parentMcqSummaryWidget" style="color:var(--muted);font-size:0.9rem;margin-bottom:10px;">No active MCQ batch yet.</div>'
    + '<div id="parentMcqListWidget"></div>'
    + '<div class="dash-updated" id="parentMcqUpdated">Last updated: --</div>');
  add('parentTopicWidget',
    '<h4>&#128200; Topic Performance</h4>'
    + '<div id="parentTopicProgressWidget" style="color:var(--muted);font-size:0.9rem;">Appears after first assessment.</div>');
  add('parentPapersWidget',
    '<h4>&#128196; Question Papers</h4>'
    + '<div id="parentQuestionPapersWidget" style="color:var(--muted);font-size:0.9rem;">No papers posted yet.</div>');
  add('parentTopicsWidget',
    '<h4>&#127919; Weak &amp; Strong Topics</h4>'
    + '<div style="margin-bottom:10px;">'
    + '<div style="font-size:0.78rem;color:var(--muted);margin-bottom:5px;text-transform:uppercase;letter-spacing:0.06em;">Needs Focus</div>'
    + '<div id="parentWeakTopicsWidget" style="color:var(--muted);font-size:0.88rem;">No data yet.</div></div>'
    + '<div>'
    + '<div style="font-size:0.78rem;color:var(--muted);margin-bottom:5px;text-transform:uppercase;letter-spacing:0.06em;">Strong Areas</div>'
    + '<div id="parentStrongTopicsWidget" style="color:var(--muted);font-size:0.88rem;">No data yet.</div></div>');
  add('parentSummaryWidget',
    '<h4>&#128202; Quick Summary</h4>'
    + '<div class="metric-row"><span class="metric-label">Attendance</span><span class="metric-value up" id="parentSummaryAttendanceWidget">--</span></div>'
    + '<div class="metric-row"><span class="metric-label">MCQ Score</span><span class="metric-value" id="parentSummaryMcqWidget">--</span></div>'
    + '<div class="metric-row"><span class="metric-label">Fee Pending</span><span class="metric-value" id="parentSummaryFeeWidget">--</span></div>'
    + '<div class="dash-updated" id="parentSummaryUpdated">Last updated: --</div>');
}

// ── INJECT ALL PARENT DATA ────────────────────────────────────
function injectParentTabData(rawData, student) {
  ensureParentExtraWidgets();

  // rawData may be the full server response or the nested .report object
  // Server returns: { student, feeSummary, weeklyTests, dailyMcqSet, attendanceSummary, ... report: {same} }
  var d = rawData || {};

  // Attendance
  var monthAtt   = (d.attendanceSummary && d.attendanceSummary.month)   || d.attendance || {};
  var overallAtt = (d.attendanceSummary && d.attendanceSummary.overall)  || monthAtt;
  var pPres  = Number(monthAtt.present  || 0);
  var pTotal = Number(monthAtt.total    || 0);
  var pPct   = Number(overallAtt.percentage || _pct(pPres, pTotal));

  // Fee
  var fee = d.feeSummary || null;

  // Tests
  var tests = d.weeklyTests || [];

  // MCQ
  var mcqSet = d.dailyMcqSet || {};
  var mcqQs  = Array.isArray(mcqSet.questions) ? mcqSet.questions : [];
  var answered  = mcqQs.filter(function(q) { return q.selected_index !== null && q.selected_index !== undefined; });
  var corrCount = answered.filter(function(q) { return q.is_correct === 1 || q.is_correct === true; }).length;

  // Papers
  var papers = d.questionPapers || [];

  // Topics
  var weak   = d.weakTopics   || [];
  var strong = d.strongTopics || [];
  var latestA = d.latestAssessment || null;
  var topicScores = {};
  if (latestA && latestA.topic_scores) {
    try { topicScores = JSON.parse(latestA.topic_scores); } catch(e) {}
  } else if (d.topicScores) {
    topicScores = d.topicScores;
  }

  // ── Existing HTML widgets ──
  _setText('parentAttendanceMonth',         pPres + ' / ' + pTotal + ' days');
  _setText('parentAttendanceOverall',       pPct + '%');
  _setText('parentAttendanceStudent',       (student && student.name) ? student.name : 'Linked student');
  _setText('parentAttendanceProgressLabel', pPct + '%');
  _setWidth('parentAttendanceProgress',     Math.min(100, pPct) + '%');
  _setUpdated('parentAttendanceUpdated');

  _setText('parentFeeBatch',   (student && student.class) ? 'Class ' + student.class : 'Linked batch');
  if (fee) {
    var pending = Number(fee.pending || 0);
    _setText('parentFeeStatus',  pending > 0 ? 'Rs ' + pending + ' pending' : 'Paid up to date');
    _setText('parentFeePaid',    'Rs ' + (fee.totalPaid || 0));
    _setText('parentFeePending', 'Rs ' + (fee.pending   || 0));
  } else {
    _setText('parentFeeStatus',  'No fee entries yet');
    _setText('parentFeePaid',    'Rs 0');
    _setText('parentFeePending', 'Rs 0');
  }
  _setUpdated('parentFeeUpdated');

  // ── Extra widgets ──

  // Weekly tests
  if (tests.length) {
    _setHTML('parentWeeklyTestsList', tests.slice(0, 5).map(function(t) {
      var sc  = Number(t.marks_obtained || 0);
      var tot = Number(t.total_marks    || 100);
      var p   = tot ? Math.round((sc / tot) * 100) : 0;
      var col = p >= 75 ? 'var(--green)' : p >= 50 ? 'var(--yellow)' : 'var(--pink)';
      return '<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);'
           + 'display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">'
           + '<div><strong style="font-size:0.88rem;">' + (t.title || 'Test') + '</strong>'
           + '<div style="font-size:0.76rem;color:var(--muted);">' + (t.test_date || '') + '</div>'
           + (t.notes ? '<div style="font-size:0.75rem;color:var(--muted);">' + t.notes + '</div>' : '')
           + '</div>'
           + '<span style="font-weight:700;color:' + col + ';">' + sc + '/' + tot
           + ' <span style="font-size:0.76rem;opacity:0.8;">(' + p + '%)</span></span></div>';
    }).join(''));
  } else {
    _setText('parentWeeklyTestsList', 'No test marks entered yet.');
  }
  _setUpdated('parentWeeklyTestsUpdated');

  // MCQ
  _setText('parentMcqSummaryWidget', mcqSet.batchTitle
    ? mcqSet.batchTitle + ' — ' + corrCount + '/' + mcqQs.length + ' correct'
    : 'No active MCQ batch right now.');
  _setHTML('parentMcqListWidget', mcqQs.slice(0, 6).map(function(q, i) {
    var att = q.selected_index !== null && q.selected_index !== undefined;
    var ok  = q.is_correct === 1 || q.is_correct === true;
    return '<div style="padding:10px 0;border-top:1px solid rgba(255,255,255,0.06);">'
         + '<div style="font-weight:700;font-size:0.86rem;">Q' + (i+1) + ': ' + (q.question || 'Question') + '</div>'
         + '<div style="font-size:0.8rem;margin-top:5px;color:' + (att ? (ok ? 'var(--green)' : 'var(--yellow)') : 'var(--muted)') + ';">'
         + (att ? (ok ? '&#10003; Correct' : '&#10007; Needs review') : 'Not attempted yet')
         + '</div></div>';
  }).join(''));
  _setUpdated('parentMcqUpdated');

  // Topic progress
  var topicEntries = Object.entries(topicScores);
  if (topicEntries.length) {
    _setHTML('parentTopicProgressWidget', topicEntries.slice(0, 6).map(function(pair) {
      var name = pair[0], score = pair[1];
      var pct = Number(score) || 0;
      var col = pct >= 75 ? '#00E5A0' : pct >= 50 ? '#FFD166' : '#FF2D78';
      return '<div style="margin-bottom:10px;">'
           + '<div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:4px;">'
           + '<span>' + name + '</span><span style="color:' + col + ';font-weight:700;">' + pct + '%</span></div>'
           + '<div style="height:6px;background:rgba(255,255,255,0.07);border-radius:50px;overflow:hidden;">'
           + '<div style="height:100%;width:' + pct + '%;background:' + col + ';border-radius:50px;"></div>'
           + '</div></div>';
    }).join(''));
  } else {
    _setText('parentTopicProgressWidget', 'Topic data appears after first assessment.');
  }

  // Question papers
  if (papers.length) {
    _setHTML('parentQuestionPapersWidget', papers.slice(0, 5).map(function(p) {
      return '<a href="' + p.resource_url + '" target="_blank" rel="noreferrer" style="display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#E8E8F5;text-decoration:none;">'
           + '<span style="font-size:0.88rem;">' + p.title + '</span>'
           + '<span style="color:#4D9EFF;font-size:0.82rem;">Open &#8599;</span></a>';
    }).join(''));
  } else {
    _setText('parentQuestionPapersWidget', 'No papers posted yet.');
  }

  // Weak / strong topics
  if (weak.length) {
    _setHTML('parentWeakTopicsWidget', weak.map(function(t) {
      return '<span style="display:inline-block;margin:3px;padding:4px 12px;border-radius:50px;'
           + 'background:rgba(255,45,120,0.12);color:#FF2D78;font-size:0.78rem;font-weight:700;">' + t + '</span>';
    }).join(''));
  } else {
    _setText('parentWeakTopicsWidget', 'No weak topics yet.');
  }
  if (strong.length) {
    _setHTML('parentStrongTopicsWidget', strong.map(function(t) {
      return '<span style="display:inline-block;margin:3px;padding:4px 12px;border-radius:50px;'
           + 'background:rgba(0,229,160,0.12);color:#00E5A0;font-size:0.78rem;font-weight:700;">' + t + '</span>';
    }).join(''));
  } else {
    _setText('parentStrongTopicsWidget', 'No strong topics yet.');
  }

  // Summary card
  _setText('parentSummaryAttendanceWidget', pPct + '% (' + pPres + '/' + pTotal + ')');
  _setText('parentSummaryMcqWidget',        mcqQs.length ? corrCount + '/' + mcqQs.length + ' correct' : 'No MCQ yet');
  _setText('parentSummaryFeeWidget',        fee ? 'Rs ' + (fee.pending || 0) + ' pending' : 'No data');
  _setUpdated('parentSummaryUpdated');
}

// ── PARENT DASHBOARD (ai-parentreport.html) ────────────────────
function buildFallbackAiReport(student, data) {
  var name   = (student && student.name) ? student.name : 'Student';
  var weak   = (data && data.weakTopics)   || [];
  var strong = (data && data.strongTopics) || [];
  var att    = (data && data.attendanceSummary && data.attendanceSummary.month) || (data && data.attendance) || {};
  var score  = (data && data.latestAssessment && data.latestAssessment.total)
    ? Math.round((data.latestAssessment.score / data.latestAssessment.total) * 100) : 0;
  return {
    overallSummary: name + ' is progressing steadily. Latest score: ' + score + '%. Attendance: ' + (att.present||0) + '/' + (att.total||0) + ' days this month.',
    highlights: [
      strong.length ? 'Strong topics: ' + strong.join(', ') : 'Keep encouraging regular practice.',
      'Attendance is tracked and updated by the teacher.'
    ],
    concerns: weak.length ? ['Needs extra attention in: ' + weak.join(', ')] : ['No major weak topics identified.'],
    parentTips: ['Ask your child to revise one weak topic for 20–30 min daily.', 'Review attendance and test performance together each week.'],
    nextWeekFocus: weak.length ? 'Focus on ' + weak[0] + ' and keep practising recent test topics.' : 'Maintain consistency with revision and daily practice.'
  };
}

async function setupParentDashboard() {
  if (!localStorage.getItem('ilearn_parent_token')) { window.location.href = 'index.html'; return; }
  try {
    var raw     = await API.getParentReport();
    var data    = raw.report || raw;
    var student = raw.student || data.student || {};

    var ai = null;
    try { ai = await API.getParentAIReport(); } catch(e) {}
    if (!ai || (!ai.overallSummary && !ai.aiReport)) ai = buildFallbackAiReport(student, data);
    if (ai.aiReport) ai = ai.aiReport;

    var topbar = document.querySelector('.topbar');
    if (topbar && !document.getElementById('roleDashboardProfile')) {
      var att = (data.attendanceSummary && data.attendanceSummary.month) || data.attendance || {};
      topbar.insertAdjacentHTML('afterend', dashboardProfileMarkup(
        'Parent Profile', 'Parent of ' + (student.name || 'Student'),
        [
          { label: 'Role',       value: 'Parent' },
          { label: 'Student',    value: student.name  || 'Linked student' },
          { label: 'Class',      value: student.class ? 'Class ' + student.class : 'N/A' },
          { label: 'Mobile',     value: student.mobile || 'N/A' },
          { label: 'Attendance', value: formatAttendanceLabel(att.present, att.total) }
        ], 'Logout', 'API.logoutParent'));
    }

    if (typeof renderReport === 'function' && student.name) {
      var assessments = data.assessmentHistory || [];
      var latest      = data.latestAssessment  || assessments[0] || null;
      var previous    = assessments[1] || null;
      var prevTopics  = {};
      if (previous && previous.topic_scores) { try { prevTopics = JSON.parse(previous.topic_scores); } catch(e) {} }
      var topicScores = {};
      if (latest && latest.topic_scores) { try { topicScores = JSON.parse(latest.topic_scores); } catch(e) {} }
      else if (data.topicScores) { topicScores = data.topicScores; }
      var mAtt = (data.attendanceSummary && data.attendanceSummary.month) || data.attendance || {};

      renderReport(student.name, 'Class ' + student.class, 'Latest Update', {
        attendance:     Number(mAtt.present)  || 0,
        totalDays:      Number(mAtt.total)    || 24,
        testsCompleted: assessments.length,
        testsTotal:     Math.max(assessments.length, 1),
        avgScore:       latest  && latest.total   ? Math.round((latest.score   / latest.total)   * 100) : 0,
        prevScore:      previous && previous.total ? Math.round((previous.score / previous.total) * 100) : 0,
        rank: 1, batchSize: 1,
        weeklySummary:  data.weeklySummary  || null,
        weakTopics:     data.weakTopics     || [],
        strongTopics:   data.strongTopics   || [],
        recentMcqs:     data.recentMcqs     || [],
        weeklyTests:    data.weeklyTests    || [],
        questionPapers: data.questionPapers || [],
        feeSummary:     data.feeSummary     || null,
        topics: Object.keys(topicScores).map(function(name) {
          return { name: name, score: Number(topicScores[name]) || 0, prev: Number(prevTopics[name]) || Number(topicScores[name]) || 0 };
        })
      }, ai);
    }
  } catch(err) {
    console.error('[setupParentDashboard]', err);
    var main = document.getElementById('mainContent');
    if (main) main.innerHTML = '<h1>Parent Dashboard</h1>'
      + '<p style="color:var(--muted);margin-top:12px;">Error: ' + (err.message || 'Unknown') + '</p>'
      + '<button class="btn-primary" style="margin-top:20px;" onclick="API.logoutParent()">Logout</button>';
  }
}

// ── PAGE LOAD ──────────────────────────────────────────────────
window.addEventListener('load', function() {
  var p = window.location.pathname;
  if (/class(9|10|11|12)\.html$/.test(p)) setupStudentDashboard();
  else if (p.endsWith('ai-parentreport.html'))  setupParentDashboard();
});





