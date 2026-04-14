function formatAttendanceLabel(present, total) {
  const safePresent = Number(present) || 0;
  const safeTotal = Number(total) || 0;
  const percentage = safeTotal ? Math.round((safePresent / safeTotal) * 100) : 0;
  return `${safePresent}/${safeTotal} (${percentage}%)`;
}

function _setElementText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}
function _setElementWidth(id, value) {
  const node = document.getElementById(id);
  if (node) node.style.width = value;
}
function _formatUpdatedLabel(dateObj) {
  const date = dateObj || new Date();
  return 'Last updated: ' + date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function _setUpdatedLabel(id, dateObj) {
  const node = document.getElementById(id);
  if (!node) return;
  node.textContent = _formatUpdatedLabel(dateObj);
}

// ── Helper: flatten nested report shapes from the API ─────────────────────────
// The API returns { ...fullData, report: fullData } so we must unwrap carefully
function _flattenReport(apiResponse) {
  if (!apiResponse) return {};
  // If top-level has attendanceSummary, use as-is (already flat)
  if (apiResponse.attendanceSummary) return apiResponse;
  // Otherwise try nested report key
  if (apiResponse.report && apiResponse.report.attendanceSummary) return apiResponse.report;
  // Merge: prefer top-level keys, fall back to report keys
  const base = apiResponse.report || {};
  return Object.assign({}, base, apiResponse);
}

function dashboardProfileMarkup(title, subtitle, details, logoutLabel, logoutFn) {
  const items = details.map((item) => `
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:14px 16px;min-width:160px;">
      <div style="font-size:0.72rem;color:#8888AA;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">${item.label}</div>
      <div style="font-size:0.95rem;font-weight:600;color:#E8E8F5;">${item.value}</div>
    </div>
  `).join('');

  return `
    <section id="roleDashboardProfile" style="max-width:1100px;margin:22px auto 0;padding:0 24px;">
      <div style="background:linear-gradient(135deg,rgba(77,158,255,0.12),rgba(255,45,120,0.12));border:1px solid rgba(255,255,255,0.1);border-radius:22px;padding:22px;display:flex;justify-content:space-between;gap:18px;align-items:flex-start;flex-wrap:wrap;">
        <div>
          <div style="font-size:0.76rem;color:#4D9EFF;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;">${title}</div>
          <h2 style="font-family:'Syne',sans-serif;font-size:1.45rem;font-weight:800;margin-bottom:6px;">${subtitle}</h2>
          <p style="color:#B6B6D6;font-size:0.92rem;line-height:1.6;">Your dashboard is ready.</p>
        </div>
        <button onclick="${logoutFn}()" style="background:#FF2D78;color:#fff;border:none;border-radius:999px;padding:11px 18px;font-weight:700;cursor:pointer;">${logoutLabel}</button>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:14px;">${items}</div>
    </section>
  `;
}

async function refreshStudentLearningHub() {
  const hub = document.getElementById('studentLearningHub');
  if (!hub) return;
  const data = await API.getStudentProfile();
  hub.outerHTML = studentHubMarkup(data);
}

async function submitStudentProfileMcq(mcqId) {
  const selected = document.querySelector(`input[name="profile-mcq-${mcqId}"]:checked`);
  if (!selected) {
    alert('Please select an option before submitting.');
    return;
  }
  try {
    await API.submitStudentDailyMcq(mcqId, Number(selected.value));
    await refreshStudentLearningHub();
  } catch (error) {
    alert(error.message || 'Could not submit MCQ.');
  }
}

function studentHubMarkup(data) {
  const dailyMcqSet = data.dailyMcqSet || { questions: [] };
  const questionPapers = data.questionPapers || [];
  const weeklyTests = data.weeklyTests || [];
  const feeSummary = data.feeSummary || null;

  const mcqSection = dailyMcqSet.questions.length
    ? `
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:22px;">
        <div style="font-size:0.78rem;color:#4D9EFF;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Daily MCQ</div>
        <h3 style="font-family:'Syne',sans-serif;margin-top:6px;">${dailyMcqSet.batchTitle || 'Current 24-hour MCQ batch'}</h3>
        <p style="color:#B6B6D6;font-size:0.88rem;margin-top:6px;">Complete before ${dailyMcqSet.availableUntil || 'the expiry time'}.</p>
        <div style="margin-top:16px;display:grid;gap:14px;">
          ${dailyMcqSet.questions.map((mcq) => {
            const answered = mcq.selected_index !== null && mcq.selected_index !== undefined;
            const status = answered ? (mcq.is_correct ? 'Completed correctly' : 'Completed - needs review') : 'Pending';
            const statusColor = answered ? (mcq.is_correct ? '#00E5A0' : '#FF2D78') : '#FFD166';
            const options = Array.isArray(mcq.options) ? mcq.options : [];
            return `
              <div style="padding:16px;border-radius:16px;background:rgba(13,13,26,0.55);border:1px solid rgba(255,255,255,0.06);display:grid;gap:14px;">
                <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;">
                  <div>
                    <div style="font-size:0.78rem;color:#4D9EFF;font-weight:700;">Question ${mcq.question_no}</div>
                    ${mcq.question ? `<div style="margin-top:6px;font-size:0.92rem;line-height:1.6;">${mcq.question}</div>` : ''}
                    ${mcq.question_image ? `<img src="${mcq.question_image}" alt="MCQ question ${mcq.question_no}" style="margin-top:10px;max-width:280px;width:100%;border-radius:14px;border:1px solid rgba(255,255,255,0.08);display:block;" />` : ''}
                  </div>
                  <div style="color:${statusColor};font-weight:700;font-size:0.84rem;">${status}</div>
                </div>
                <div style="display:grid;gap:10px;">
                  ${options.map((option, optionIndex) => {
                    const optionText = typeof option === 'string' ? option : (option?.text || '');
                    const optionImage = typeof option === 'string' ? '' : (option?.imageUrl || '');
                    return `
                    <label style="display:flex;gap:10px;align-items:flex-start;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);padding:10px 12px;border-radius:12px;cursor:${answered ? 'default' : 'pointer'};">
                      <input type="radio" name="profile-mcq-${mcq.id}" value="${optionIndex}" ${Number(mcq.selected_index) === optionIndex ? 'checked' : ''} ${answered ? 'disabled' : ''} />
                      <span style="display:grid;gap:8px;font-size:0.88rem;color:#E8E8F5;line-height:1.5;">${optionText ? `<span>${optionText}</span>` : `<span>${String.fromCharCode(65+optionIndex)}.</span>`}${optionImage ? `<img src="${optionImage}" alt="Option ${optionIndex + 1}" style="max-width:180px;width:100%;border-radius:12px;border:1px solid rgba(255,255,255,0.08);display:block;" />` : ''}</span>
                    </label>
                  `; }).join('')}
                </div>
                ${answered
                  ? `<div style="color:#B6B6D6;font-size:0.82rem;">Submitted on ${mcq.submitted_at || 'today'}.</div>`
                  : `<button onclick="submitStudentProfileMcq(${mcq.id})" style="background:#00E5A0;color:#081019;border:none;border-radius:999px;padding:10px 16px;font-weight:800;cursor:pointer;justify-self:flex-start;">Submit Answer</button>`}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `
    : `
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:22px;">
        <div style="font-size:0.78rem;color:#4D9EFF;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Daily MCQ</div>
        <h3 style="font-family:'Syne',sans-serif;margin-top:6px;">No active MCQ batch right now</h3>
        <p style="color:#B6B6D6;font-size:0.88rem;margin-top:8px;">Your teacher's 24-hour batch will appear here.</p>
      </div>
    `;

  const papersSection = `
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:22px;">
      <div style="font-size:0.78rem;color:#4D9EFF;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Weekly Question Papers</div>
      <h3 style="font-family:'Syne',sans-serif;margin-top:6px;">Teacher-posted question papers</h3>
      <div style="margin-top:14px;display:grid;gap:12px;">
        ${questionPapers.length ? questionPapers.map((paper) => `
          <a href="${paper.resource_url}" target="_blank" rel="noreferrer" style="display:flex;justify-content:space-between;gap:12px;align-items:center;padding:14px 16px;border-radius:16px;background:rgba(13,13,26,0.55);border:1px solid rgba(255,255,255,0.06);color:#E8E8F5;text-decoration:none;">
            <span>${paper.title}</span>
            <span style="color:#B6B6D6;font-size:0.84rem;">${paper.resource_type || 'document'} · ${paper.posted_at || ''}</span>
          </a>
        `).join('') : '<div style="color:#B6B6D6;font-size:0.88rem;">No question papers posted yet.</div>'}
      </div>
    </div>
  `;

  const testsSection = `
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:22px;">
      <div style="font-size:0.78rem;color:#4D9EFF;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Weekly Tests</div>
      <h3 style="font-family:'Syne',sans-serif;margin-top:6px;">Latest test entries from your teacher</h3>
      <div style="margin-top:14px;display:grid;gap:12px;">
        ${weeklyTests.length ? weeklyTests.slice(0, 5).map((test) => `
          <div style="padding:14px 16px;border-radius:16px;background:rgba(13,13,26,0.55);border:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
            <div>
              <div style="font-weight:700;">${test.title}</div>
              <div style="color:#B6B6D6;font-size:0.84rem;margin-top:4px;">${test.test_date || ''}</div>
            </div>
            <div style="font-weight:700;color:#00E5A0;">${test.marks_obtained}/${test.total_marks}</div>
          </div>
        `).join('') : '<div style="color:#B6B6D6;font-size:0.88rem;">No weekly test marks entered yet.</div>'}
      </div>
    </div>
  `;

  const feesSection = `
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:22px;">
      <div style="font-size:0.78rem;color:#4D9EFF;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Fees</div>
      <h3 style="font-family:'Syne',sans-serif;margin-top:6px;">Current fee summary</h3>
      ${feeSummary ? `
        <div style="margin-top:14px;display:grid;gap:12px;">
          <div style="padding:14px 16px;border-radius:16px;background:rgba(13,13,26,0.55);border:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;"><span>Total Fee</span><strong>Rs ${feeSummary.totalDue || 0}</strong></div>
          <div style="padding:14px 16px;border-radius:16px;background:rgba(13,13,26,0.55);border:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;"><span>Paid</span><strong>Rs ${feeSummary.totalPaid || 0}</strong></div>
          <div style="padding:14px 16px;border-radius:16px;background:rgba(13,13,26,0.55);border:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;"><span>Pending</span><strong style="color:${Number(feeSummary.pending) > 0 ? '#FF2D78' : '#00E5A0'}">Rs ${feeSummary.pending || 0}</strong></div>
          ${(feeSummary.payments || []).slice(0, 3).map(p => `
            <div style="padding:10px 16px;border-radius:12px;background:rgba(0,229,160,0.06);border:1px solid rgba(0,229,160,0.15);display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:0.84rem;">
              <span style="color:#B6B6D6;">Paid on ${p.paid_on}</span>
              <strong style="color:#00E5A0;">Rs ${p.amount_paid}</strong>
            </div>
          `).join('')}
        </div>
      ` : '<div style="margin-top:14px;color:#B6B6D6;font-size:0.88rem;">Fee summary will appear here once entries are added.</div>'}
    </div>
  `;

  return `
    <section id="studentLearningHub" style="max-width:1100px;margin:20px auto 0;padding:0 24px;">
      <div style="display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));">${mcqSection}${papersSection}${testsSection}${feesSection}</div>
    </section>
  `;
}

async function setupStudentDashboard() {
  if (!localStorage.getItem('ilearn_token')) return;
  try {
    const data = await API.getStudentProfile();
    const student = data.student;
    const expected = 'class' + String(student.class).trim() + '.html';
    if (!window.location.pathname.endsWith(expected)) {
      window.location.href = expected;
      return;
    }
    const topbar = document.querySelector('.topbar');
    if (topbar && !document.getElementById('roleDashboardProfile')) {
      topbar.insertAdjacentHTML('afterend', dashboardProfileMarkup(
        'Student Profile',
        student.name,
        [
          { label: 'Role', value: 'Student' },
          { label: 'Class', value: 'Class ' + student.class },
          { label: 'Email', value: student.email || 'Not available' },
          { label: 'Mobile', value: student.mobile || 'Not available' },
          { label: 'Attendance', value: formatAttendanceLabel(data.attendance?.present, data.totalAttendance?.total) }
        ],
        'Logout',
        'API.logoutStudent'
      ));
    }
    if (topbar && !document.getElementById('studentLearningHub')) {
      const profileNode = document.getElementById('roleDashboardProfile');
      if (profileNode) {
        profileNode.insertAdjacentHTML('afterend', studentHubMarkup(data));
      }
    }
  } catch (err) {
    API.logoutStudent();
  }
}

// ── PARENT DASHBOARD (ai-parentreport.html) ─────────────────────────────────

async function setupParentDashboard() {
  if (!localStorage.getItem('ilearn_parent_token')) {
    window.location.href = 'index.html';
    return;
  }
  try {
    const apiResponse = await API.getParentReport();
    // Flatten the nested report shape
    const report = _flattenReport(apiResponse);
    const student = apiResponse.student || report.student || {};

    let aiData;
    try {
      aiData = await API.getParentAIReport();
    } catch (e) {
      aiData = buildFallbackAiReport(student, report);
    }
    if (!aiData || (!aiData.overallSummary && !aiData.aiReport)) {
      aiData = buildFallbackAiReport(student, report);
    }
    if (aiData.aiReport) aiData = aiData.aiReport;

    const topbar = document.querySelector('.topbar');
    if (topbar && student && !document.getElementById('roleDashboardProfile')) {
      const monthAtt = report.attendanceSummary?.month || report.attendance || {};
      const presentVal = Number(monthAtt.present) || 0;
      const totalVal = Number(monthAtt.total) || 0;
      const pct = totalVal ? Math.round((presentVal / totalVal) * 100) : 0;
      topbar.insertAdjacentHTML('afterend', dashboardProfileMarkup(
        'Parent Profile',
        'Parent of ' + (student.name || 'Student'),
        [
          { label: 'Role', value: 'Parent' },
          { label: 'Student', value: student.name || 'Linked student' },
          { label: 'Class', value: student.class ? 'Class ' + student.class : 'Not available' },
          { label: 'Mobile', value: student.mobile || 'Not available' },
          { label: 'Attendance', value: totalVal ? `${pct}% (${presentVal}/${totalVal})` : 'No attendance yet' }
        ],
        'Logout',
        'API.logoutParent'
      ));
    }

    if (typeof renderReport === 'function' && student) {
      const assessments = report.assessmentHistory || [];
      const latest = report.latestAssessment || assessments[0] || null;
      const previous = assessments[1] || null;
      const previousTopics = previous?.topic_scores ? JSON.parse(previous.topic_scores || '{}') : {};
      const topicScores = latest?.topic_scores ? JSON.parse(latest.topic_scores || '{}') : report.topicScores || {};
      const topicEntries = Object.entries(topicScores);
      const monthAtt = report.attendanceSummary?.month || report.attendance || {};

      const demo = {
        attendance: Number(monthAtt.present) || 0,
        totalDays: Number(monthAtt.total) || 24,
        testsCompleted: assessments.length,
        testsTotal: Math.max(assessments.length, 1),
        avgScore: latest?.total ? Math.round((latest.score / latest.total) * 100) : 0,
        prevScore: previous?.total ? Math.round((previous.score / previous.total) * 100) : 0,
        rank: 1,
        batchSize: 1,
        weeklySummary: report.weeklySummary || null,
        weakTopics: report.weakTopics || (latest?.weak_topics ? JSON.parse(latest.weak_topics || '[]') : []),
        strongTopics: report.strongTopics || (latest?.strong_topics ? JSON.parse(latest.strong_topics || '[]') : []),
        recentMcqs: report.recentMcqs || [],
        weeklyTests: report.weeklyTests || [],
        questionPapers: report.questionPapers || [],
        feeSummary: report.feeSummary || null,
        topics: topicEntries.map(([name, score]) => ({
          name,
          score: Number(score) || 0,
          prev: Number(previousTopics[name]) || Number(score) || 0
        }))
      };

      renderReport(student.name, 'Class ' + student.class, 'Latest Update', demo, aiData);
    }
  } catch (err) {
    console.error('Parent dashboard error:', err);
    const main = document.getElementById('mainContent');
    if (main) {
      main.innerHTML = `
        <h1>Parent Dashboard</h1>
        <p style="color:var(--muted);margin-top:12px;">Could not load report: ${err.message || 'Unknown error'}.</p>
        <button class="btn-primary" style="margin-top:20px;" onclick="API.logoutParent()">Logout</button>
      `;
    }
  }
}

function buildFallbackAiReport(student, report) {
  const name = student?.name || 'Student';
  const weakTopics = report.weakTopics || [];
  const strongTopics = report.strongTopics || [];
  const monthAtt = report.attendanceSummary?.month || report.attendance || {};
  const latestScore = report.latestTotal ? Math.round((report.latestScore / report.latestTotal) * 100) : 0;
  return {
    overallSummary: `${name} is progressing steadily. Latest assessment score: ${latestScore}%. Attendance this month: ${monthAtt.present || 0}/${monthAtt.total || 0} days.`,
    highlights: [
      strongTopics.length ? 'Strong topics: ' + strongTopics.join(', ') : 'Keep encouraging regular practice.',
      'Attendance is being tracked and updated by the teacher.'
    ],
    concerns: weakTopics.length ? ['Needs extra attention in: ' + weakTopics.join(', ') + '.'] : ['No major weak topics identified yet.'],
    parentTips: [
      'Ask your child to revise one weak topic for 20–30 minutes daily.',
      'Review attendance and weekly test performance together each week.'
    ],
    nextWeekFocus: weakTopics.length ? `Focus on ${weakTopics[0]} and keep practicing recent test topics.` : 'Maintain consistency with revision and daily practice.'
  };
}

// ── INDEX.HTML PARENT TAB — live data injection ──────────────────────────────

function ensureParentExtraWidgets() {
  const parentTab = document.getElementById('tab-parent');
  if (!parentTab) return;

  // ── Inject student name banner if not already present ──
  if (!document.getElementById('parentStudentBanner')) {
    const banner = document.createElement('div');
    banner.id = 'parentStudentBanner';
    banner.className = 'dash-widget';
    banner.style.cssText = 'grid-column:1 / -1;background:linear-gradient(135deg,rgba(77,158,255,0.12),rgba(155,109,255,0.08));border:1px solid rgba(77,158,255,0.25);';
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
        <div style="font-size:2rem;">👤</div>
        <div>
          <div style="font-size:0.72rem;color:var(--blue);font-weight:800;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px;">Viewing progress for</div>
          <div id="parentStudentNameDisplay" style="font-family:'Syne',sans-serif;font-size:1.2rem;font-weight:800;">Student</div>
          <div id="parentStudentClassDisplay" style="color:var(--muted);font-size:0.88rem;margin-top:2px;">Loading details...</div>
        </div>
        <div style="margin-left:auto;text-align:right;">
          <div id="parentAttendanceBig" style="font-family:'Syne',sans-serif;font-size:2rem;font-weight:800;color:var(--green);">--</div>
          <div style="font-size:0.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;">Attendance this month</div>
        </div>
      </div>
    `;
    // Insert as first child of parent tab
    parentTab.insertBefore(banner, parentTab.firstChild);
  }

  if (!document.getElementById('parentWeeklyTestsWidget')) {
    const weekly = document.createElement('div');
    weekly.className = 'dash-widget';
    weekly.id = 'parentWeeklyTestsWidget';
    weekly.innerHTML = `
      <h4>📋 Weekly Test Marks</h4>
      <div id="parentWeeklyTestsList" style="color:var(--muted);font-size:0.9rem;">Weekly test marks will appear here once teachers enter them.</div>
      <div class="dash-updated" id="parentWeeklyTestsUpdated">Last updated: --</div>
    `;
    parentTab.appendChild(weekly);
  }

  if (!document.getElementById('parentMcqWidget')) {
    const mcq = document.createElement('div');
    mcq.className = 'dash-widget';
    mcq.id = 'parentMcqWidget';
    mcq.innerHTML = `
      <h4>📝 Daily MCQ Performance</h4>
      <div id="parentMcqSummary" style="color:var(--muted);font-size:0.9rem;margin-bottom:12px;">Daily MCQ summary will appear here.</div>
      <div id="parentMcqList"></div>
      <div class="dash-updated" id="parentMcqUpdated">Last updated: --</div>
    `;
    parentTab.appendChild(mcq);
  }

  if (!document.getElementById('parentTopicWidget')) {
    const topics = document.createElement('div');
    topics.className = 'dash-widget';
    topics.id = 'parentTopicWidget';
    topics.innerHTML = `
      <h4>📈 Topic Performance</h4>
      <div id="parentTopicProgress" style="color:var(--muted);font-size:0.9rem;">Topic performance will appear here after an assessment.</div>
    `;
    parentTab.appendChild(topics);
  }

  if (!document.getElementById('parentPapersWidget')) {
    const papers = document.createElement('div');
    papers.className = 'dash-widget';
    papers.id = 'parentPapersWidget';
    papers.innerHTML = `
      <h4>📄 Question Papers</h4>
      <div id="parentQuestionPapersList" style="color:var(--muted);font-size:0.9rem;">No question papers posted yet.</div>
    `;
    parentTab.appendChild(papers);
  }

  if (!document.getElementById('parentTopicsWidget')) {
    const topicTags = document.createElement('div');
    topicTags.className = 'dash-widget';
    topicTags.id = 'parentTopicsWidget';
    topicTags.innerHTML = `
      <h4>🎯 Weak &amp; Strong Topics</h4>
      <div style="margin-bottom:12px;">
        <div style="font-size:0.78rem;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.06em;">Needs Focus</div>
        <div id="parentWeakTopics" style="color:var(--muted);font-size:0.88rem;">No data yet.</div>
      </div>
      <div>
        <div style="font-size:0.78rem;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.06em;">Strong Areas</div>
        <div id="parentStrongTopics" style="color:var(--muted);font-size:0.88rem;">No data yet.</div>
      </div>
    `;
    parentTab.appendChild(topicTags);
  }

  if (!document.getElementById('parentSummaryWidget')) {
    const summary = document.createElement('div');
    summary.className = 'dash-widget';
    summary.id = 'parentSummaryWidget';
    summary.innerHTML = `
      <h4>📊 Quick Summary</h4>
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
      <div class="dash-updated" id="parentSummaryUpdated">Last updated: --</div>
    `;
    parentTab.appendChild(summary);
  }
}

function injectParentTabData(rawReport, student) {
  // Always ensure widgets exist before injecting data
  ensureParentExtraWidgets();

  // Flatten nested API shape so we always get a clean flat object
  const report = _flattenReport(rawReport);
  const now = new Date();

  // ── Pull all data from report ──
  const monthAtt = report.attendanceSummary?.month
    || report.attendance
    || {};
  const overallAtt = report.attendanceSummary?.overall
    || report.attendanceSummary?.month
    || report.attendance
    || {};
  const feeSummary = report.feeSummary || null;
  const weeklyTests = report.weeklyTests || [];
  const dailyMcqSet = report.dailyMcqSet || {};
  const mcqQuestions = Array.isArray(dailyMcqSet.questions) ? dailyMcqSet.questions : [];
  const questionPapers = report.questionPapers || [];
  const weakTopics = report.weakTopics || [];
  const strongTopics = report.strongTopics || [];
  const latestAssessment = report.latestAssessment || null;

  // ── Student name & class banner ──
  const studentName = student?.name || 'Student';
  const studentClass = student?.class || '';
  _setElementText('parentStudentNameDisplay', studentName);
  _setElementText('parentStudentClassDisplay', studentClass ? `Class ${studentClass}` : 'Details loading...');

  // ── Attendance values ──
  const presentVal = Number(monthAtt.present) || 0;
  const totalVal = Number(monthAtt.total) || 0;
  const overallPct = Number(overallAtt.percentage)
    || (totalVal ? Math.round((presentVal / totalVal) * 100) : 0);

  // Big attendance display in banner
  _setElementText('parentAttendanceBig',
    totalVal ? `${presentVal}/${totalVal}` : 'No data');

  // ── 1. Attendance card (already in HTML) ──
  _setElementText('parentAttendanceMonth', `${presentVal} / ${totalVal} days`);
  _setElementText('parentAttendanceOverall', `${overallPct}%`);
  // parentAttendanceStudent may not exist in index.html — use optional setter
  const attStudentEl = document.getElementById('parentAttendanceStudent');
  if (attStudentEl) attStudentEl.textContent = studentName;
  _setElementText('parentAttendanceProgressLabel', `${overallPct}%`);
  _setElementWidth('parentAttendanceProgress', `${Math.max(0, Math.min(100, overallPct))}%`);
  _setUpdatedLabel('parentAttendanceUpdated', now);

  // ── 2. Fee card (already in HTML) ──
  _setElementText('parentFeeBatch', studentClass ? `Class ${studentClass}` : 'Linked batch');
  if (feeSummary) {
    const pendingAmt = Number(feeSummary.pending || 0);
    _setElementText('parentFeeStatus', pendingAmt > 0 ? `Rs ${pendingAmt} pending` : 'Paid up to date');
    _setElementText('parentFeePaid', `Rs ${Number(feeSummary.totalPaid || 0).toFixed(0)}`);
    _setElementText('parentFeePending', `Rs ${Number(feeSummary.pending || 0).toFixed(0)}`);
  } else {
    _setElementText('parentFeeStatus', 'No fee entries yet');
    _setElementText('parentFeePaid', 'Rs 0');
    _setElementText('parentFeePending', 'Rs 0');
  }
  _setUpdatedLabel('parentFeeUpdated', now);

  // ── 3. Weekly Test Marks widget ──
  const weeklyListEl = document.getElementById('parentWeeklyTestsList');
  if (weeklyListEl) {
    if (!weeklyTests.length) {
      weeklyListEl.innerHTML = '<span style="color:var(--muted);font-size:0.88rem;">No weekly test marks entered yet. The teacher will add them after each test.</span>';
    } else {
      weeklyListEl.innerHTML = weeklyTests.slice(0, 8).map(test => {
        const scored = Number(test.marks_obtained || 0);
        const total = Number(test.total_marks || 100);
        const pct = total ? Math.round((scored / total) * 100) : 0;
        const col = pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--pink)';
        return `
          <div class="metric-row" style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);flex-wrap:wrap;gap:8px;">
            <span class="metric-label" style="flex:1;min-width:120px;">
              <strong style="color:var(--text);font-size:0.88rem;">${test.title || 'Test'}</strong>
              <br/><span style="font-size:0.76rem;">${test.test_date || ''}</span>
              ${test.notes ? `<br/><span style="font-size:0.75rem;color:var(--muted);">${test.notes}</span>` : ''}
            </span>
            <span class="metric-value" style="color:${col};">${scored}/${total} <span style="font-size:0.78rem;opacity:0.8;">(${pct}%)</span></span>
          </div>
        `;
      }).join('');
    }
    _setUpdatedLabel('parentWeeklyTestsUpdated', now);
  }

  // ── 4. Daily MCQ Performance widget ──
  const answeredMcqs = mcqQuestions.filter(q => q.selected_index !== null && q.selected_index !== undefined);
  const correctMcqs = answeredMcqs.filter(q => q.is_correct === 1 || q.is_correct === true).length;
  const totalMcqs = mcqQuestions.length;

  const mcqSummaryEl = document.getElementById('parentMcqSummary');
  if (mcqSummaryEl) {
    if (!totalMcqs) {
      mcqSummaryEl.textContent = 'No active MCQ batch right now. Check back after the teacher posts one.';
    } else if (dailyMcqSet.batchTitle) {
      mcqSummaryEl.textContent = `${dailyMcqSet.batchTitle} — ${answeredMcqs.length}/${totalMcqs} attempted, ${correctMcqs} correct`;
    } else {
      mcqSummaryEl.textContent = `${totalMcqs} question(s) — ${answeredMcqs.length} attempted, ${correctMcqs} correct`;
    }
  }

  const mcqListEl = document.getElementById('parentMcqList');
  if (mcqListEl) {
    if (!totalMcqs) {
      mcqListEl.innerHTML = '';
    } else {
      mcqListEl.innerHTML = mcqQuestions.map((item, idx) => {
        const attempted = item.selected_index !== null && item.selected_index !== undefined;
        const isCorrect = item.is_correct === 1 || item.is_correct === true;
        const statusColor = attempted ? (isCorrect ? 'var(--green)' : 'var(--pink)') : 'var(--muted)';
        const statusText = attempted ? (isCorrect ? '✓ Correct' : '✗ Needs review') : 'Not attempted';
        return `
          <div style="padding:10px 0;border-top:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;">
            <div style="flex:1;min-width:160px;">
              <div style="font-size:0.8rem;color:var(--blue);font-weight:700;margin-bottom:3px;">Q${item.question_no || (idx + 1)}</div>
              ${item.question ? `<div style="font-size:0.85rem;line-height:1.5;color:var(--text);">${item.question}</div>` : ''}
            </div>
            <div style="color:${statusColor};font-weight:700;font-size:0.82rem;white-space:nowrap;">${statusText}</div>
          </div>
        `;
      }).join('');
    }
    _setUpdatedLabel('parentMcqUpdated', now);
  }

  // ── 5. Topic Performance widget ──
  const topicScores = latestAssessment?.topic_scores
    ? JSON.parse(latestAssessment.topic_scores || '{}')
    : report.topicScores || {};
  const topicWrap = document.getElementById('parentTopicProgress');
  if (topicWrap) {
    const entries = Object.entries(topicScores);
    if (entries.length) {
      topicWrap.innerHTML = entries.map(([topic, score]) => {
        const pct = Number(score) || 0;
        const col = pct >= 75 ? '#00E5A0' : pct >= 50 ? '#FFD166' : '#FF2D78';
        return `
          <div style="margin-bottom:11px;">
            <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:4px;">
              <span>${topic}</span><span style="color:${col};font-weight:700;">${pct}%</span>
            </div>
            <div style="height:6px;background:rgba(255,255,255,0.07);border-radius:50px;overflow:hidden;">
              <div style="height:100%;width:${pct}%;background:${col};border-radius:50px;transition:width 0.5s;"></div>
            </div>
          </div>
        `;
      }).join('');
    } else {
      topicWrap.innerHTML = '<span style="color:var(--muted);font-size:0.88rem;">Topic data will appear here after the first assessment.</span>';
    }
  }

  // ── 6. Question Papers widget ──
  const paperWrap = document.getElementById('parentQuestionPapersList');
  if (paperWrap) {
    if (!questionPapers.length) {
      paperWrap.innerHTML = '<span style="color:var(--muted);font-size:0.88rem;">No question papers posted yet.</span>';
    } else {
      paperWrap.innerHTML = questionPapers.map(paper => `
        <div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;">
          <div>
            <div style="font-size:0.88rem;font-weight:600;">${paper.title}</div>
            <div style="font-size:0.76rem;color:var(--muted);">Class ${paper.class_scope || 'all'} · ${paper.resource_type || 'doc'} · ${paper.posted_at || ''}</div>
          </div>
          <a href="${paper.resource_url}" target="_blank" rel="noreferrer" style="color:var(--blue);font-weight:700;font-size:0.82rem;white-space:nowrap;">Open ↗</a>
        </div>
      `).join('');
    }
  }

  // ── 7. Weak / Strong Topics widget ──
  const weakWrap = document.getElementById('parentWeakTopics');
  if (weakWrap) {
    weakWrap.innerHTML = weakTopics.length
      ? weakTopics.map(t => `<span style="display:inline-block;margin:3px;padding:4px 12px;border-radius:50px;background:rgba(255,45,120,0.12);color:#FF2D78;font-size:0.78rem;font-weight:700;">${t}</span>`).join('')
      : '<span style="color:var(--muted);font-size:0.88rem;">No weak topics identified yet.</span>';
  }

  const strongWrap = document.getElementById('parentStrongTopics');
  if (strongWrap) {
    strongWrap.innerHTML = strongTopics.length
      ? strongTopics.map(t => `<span style="display:inline-block;margin:3px;padding:4px 12px;border-radius:50px;background:rgba(0,229,160,0.12);color:#00E5A0;font-size:0.78rem;font-weight:700;">${t}</span>`).join('')
      : '<span style="color:var(--muted);font-size:0.88rem;">No strong topics identified yet.</span>';
  }

  // ── 8. Quick Summary widget ──
  _setElementText('parentSummaryAttendance', `${overallPct}% (${presentVal}/${totalVal})`);
  _setElementText('parentSummaryMcq', totalMcqs ? `${correctMcqs}/${totalMcqs} correct` : 'No MCQ yet');
  _setElementText('parentSummaryFee', feeSummary ? `Rs ${Number(feeSummary.pending || 0).toFixed(0)} pending` : 'No data');
  _setUpdatedLabel('parentSummaryUpdated', now);
}

window.addEventListener('load', () => {
  const path = window.location.pathname;
  if (/class(9|10|11|12)\.html$/.test(path)) {
    setupStudentDashboard();
  } else if (path.endsWith('ai-parentreport.html')) {
    setupParentDashboard();
  }
});

// Export helpers with stable names so main.js can also call them if needed
if (typeof setElementText === 'undefined') {
  var setElementText = _setElementText;
}
if (typeof setElementWidth === 'undefined') {
  var setElementWidth = _setElementWidth;
}
if (typeof setUpdatedLabel === 'undefined') {
  var setUpdatedLabel = _setUpdatedLabel;
}
if (typeof formatUpdatedLabel === 'undefined') {
  var formatUpdatedLabel = _formatUpdatedLabel;
}





