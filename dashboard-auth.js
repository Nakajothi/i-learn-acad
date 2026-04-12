function formatAttendanceLabel(present, total) {
  const safePresent = Number(present) || 0;
  const safeTotal = Number(total) || 0;
  const percentage = safeTotal ? Math.round((safePresent / safeTotal) * 100) : 0;
  return `${safePresent}/${safeTotal} (${percentage}%)`;
}

function dashboardProfileMarkup(title, subtitle, details, logoutLabel, logoutFn) {
  const items = details.map((item) => `
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:14px 16px;min-width:160px;">
      <div style="font-size:0.72rem;color:#8888AA;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">${item.label}</div>
      <div style="font-size:0.95rem;font-weight:600;color:#E8E8F5;">${item.value}</div>
    </div>
  `).join('');

  return `
    <section style="max-width:1100px;margin:22px auto 0;padding:0 24px;">
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
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;">
          <div>
            <div style="font-size:0.78rem;color:#4D9EFF;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Daily MCQ</div>
            <h3 style="font-family:'Syne',sans-serif;margin-top:6px;">${dailyMcqSet.batchTitle || 'Current 24-hour MCQ batch'}</h3>
            <p style="color:#B6B6D6;font-size:0.88rem;margin-top:6px;">Complete the current teacher-posted MCQ batch before ${dailyMcqSet.availableUntil || 'the expiry time'}.</p>
          </div>
          <div style="padding:10px 16px;border-radius:999px;background:#4D9EFF;color:#fff;font-weight:700;">MCQ Section</div>
        </div>
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
                      <span style="display:grid;gap:8px;font-size:0.88rem;color:#E8E8F5;line-height:1.5;">${optionText ? `<span>${optionText}</span>` : ''}${optionImage ? `<img src="${optionImage}" alt="Option ${optionIndex + 1}" style="max-width:180px;width:100%;border-radius:12px;border:1px solid rgba(255,255,255,0.08);display:block;" />` : ''}</span>
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
        <p style="color:#B6B6D6;font-size:0.88rem;margin-top:8px;">Your teacher's 24-hour batch will appear here as a separate section.</p>
      </div>
    `;

  const papersSection = `
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:22px;">
      <div style="font-size:0.78rem;color:#4D9EFF;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Weekly Question Papers</div>
      <h3 style="font-family:'Syne',sans-serif;margin-top:6px;">Teacher-posted question papers for practice</h3>
      <div style="margin-top:14px;display:grid;gap:12px;">
        ${questionPapers.length ? questionPapers.map((paper) => `
          <a href="${paper.resource_url}" target="_blank" rel="noreferrer" style="display:flex;justify-content:space-between;gap:12px;align-items:center;padding:14px 16px;border-radius:16px;background:rgba(13,13,26,0.55);border:1px solid rgba(255,255,255,0.06);color:#E8E8F5;text-decoration:none;">
            <span>${paper.title}</span>
            <span style="color:#B6B6D6;font-size:0.84rem;">${paper.resource_type || 'document'} � ${paper.posted_at || ''}</span>
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
          <div style="padding:14px 16px;border-radius:16px;background:rgba(13,13,26,0.55);border:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;"><span>Pending</span><strong>Rs ${feeSummary.pending || 0}</strong></div>
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
  if (!localStorage.getItem('ilearn_token')) {
    return;
  }

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
      ).replace('<section ', '<section id="roleDashboardProfile" '));
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

async function setupParentDashboard() {
  if (!localStorage.getItem('ilearn_parent_token')) {
    window.location.href = 'index.html';
    return;
  }

  try {
    const data = await API.getParentReport();
    const student = data.student;
    const report = data.report || data || {};
    const aiData = await API.getParentAIReport().catch(() => ({
      overallSummary: (student?.name || 'Student') + ' has a clear progress snapshot ready for review.',
      highlights: ['Attendance and latest assessment data are available.'],
      concerns: report.weakTopics?.length ? ['Needs support in: ' + report.weakTopics.join(', ')] : [],
      parentTips: ['Review the weak topics together for 15 minutes daily.'],
      nextWeekFocus: report.weakTopics?.length ? report.weakTopics.join(', ') : 'Continue consistent practice.'
    }));

    const topbar = document.querySelector('.topbar');
    if (topbar && student && !document.getElementById('roleDashboardProfile')) {
      topbar.insertAdjacentHTML('afterend', dashboardProfileMarkup(
        'Parent Profile',
        'Parent of ' + student.name,
        [
          { label: 'Role', value: 'Parent' },
          { label: 'Student', value: student.name },
          { label: 'Class', value: 'Class ' + student.class },
          { label: 'Mobile', value: student.mobile || 'Not available' },
          { label: 'Attendance', value: formatAttendanceLabel(report.attendance?.present, report.attendance?.total) }
        ],
        'Logout',
        'API.logoutParent'
      ).replace('<section ', '<section id="roleDashboardProfile" '));
    }

    if (typeof renderReport === 'function' && student) {
      const assessments = report.assessmentHistory || [];
      const previous = assessments[1] || null;
      const previousTopics = previous?.topic_scores ? JSON.parse(previous.topic_scores || '{}') : {};
      const topicEntries = Object.entries(report.topicScores || {});
      const demo = {
        attendance: report.attendance?.present || 0,
        totalDays: report.attendance?.total || 24,
        testsCompleted: assessments.length,
        testsTotal: Math.max(assessments.length, 1),
        avgScore: report.latestTotal ? Math.round((report.latestScore / report.latestTotal) * 100) : 0,
        prevScore: previous?.total ? Math.round((previous.score / previous.total) * 100) : 0,
        rank: 1,
        batchSize: 1,
        weeklySummary: report.weeklySummary || null,
        weakTopics: report.weakTopics || [],
        strongTopics: report.strongTopics || [],
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
    API.logoutParent();
  }
}

window.addEventListener('load', () => {
  const path = window.location.pathname;
  if (/class(9|10|11|12)\.html$/.test(path)) {
    setupStudentDashboard();
  } else if (path.endsWith('ai-parentreport.html')) {
    setupParentDashboard();
  }
});






