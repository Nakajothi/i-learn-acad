const API = {
  BASE: (() => {
    if (typeof window === 'undefined') return 'http://localhost:3000/api';
    if (window.location.protocol === 'file:') return 'http://localhost:3000/api';
    return window.location.origin + '/api';
  })(),

  token() { return localStorage.getItem('ilearn_token'); },
  parentToken() { return localStorage.getItem('ilearn_parent_token'); },
  teacherToken() { return localStorage.getItem('ilearn_teacher_token'); },

  async request(method, path, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const res = await fetch(this.BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  get(path, token) { return this.request('GET', path, null, token); },
  post(path, body, token) { return this.request('POST', path, body, token); },

  async registerStudent(name, cls, mobile, email, password, subject) {
    const data = await this.post('/student/register', { name, class: cls, mobile, email, password, subject });
    localStorage.setItem('ilearn_token', data.token);
    localStorage.setItem('ilearn_student', JSON.stringify(data.student));
    localStorage.removeItem('ilearn_parent_token');
    localStorage.removeItem('ilearn_teacher_token');
    return data;
  },

  async loginStudentWithGoogle(credential) {
    const data = await this.post('/student/google-login', { credential });
    localStorage.setItem('ilearn_token', data.token);
    localStorage.setItem('ilearn_student', JSON.stringify(data.student));
    localStorage.removeItem('ilearn_parent_token');
    localStorage.removeItem('ilearn_teacher_token');
    return data;
  },

  async loginStudent(email, password) {
    const data = await this.post('/student/login', { email, password });
    localStorage.setItem('ilearn_token', data.token);
    localStorage.setItem('ilearn_student', JSON.stringify(data.student));
    localStorage.removeItem('ilearn_parent_token');
    localStorage.removeItem('ilearn_teacher_token');
    return data;
  },

  getStudentProfile() { return this.get('/student/profile', this.token()); },

  logoutStudent() {
    localStorage.removeItem('ilearn_token');
    localStorage.removeItem('ilearn_student');
    window.location.href = 'index.html';
  },

  async sendParentOTP(mobile) {
    return this.post('/parent/send-otp', { mobile });
  },

  async verifyParentOTP(mobile, otp) {
    const data = await this.post('/parent/verify-otp', { mobile, otp });
    localStorage.setItem('ilearn_parent_token', data.token);
    localStorage.setItem('ilearn_parent_student', JSON.stringify(data.student));
    localStorage.removeItem('ilearn_token');
    localStorage.removeItem('ilearn_teacher_token');
    return data;
  },

  async loginParentWithGoogle(credential) {
    const data = await this.post('/parent/google-login', { credential });
    localStorage.setItem('ilearn_parent_token', data.token);
    localStorage.setItem('ilearn_parent_student', JSON.stringify(data.student));
    localStorage.removeItem('ilearn_token');
    localStorage.removeItem('ilearn_student');
    localStorage.removeItem('ilearn_teacher_token');
    localStorage.removeItem('ilearn_teacher');
    return data;
  },

  getParentReport() { return this.get('/parent/report', this.parentToken()); },
  getParentAIReport() { return this.post('/parent/ai-report', {}, this.parentToken()); },

  logoutParent() {
    localStorage.removeItem('ilearn_parent_token');
    localStorage.removeItem('ilearn_parent_student');
    window.location.href = 'index.html';
  },

  async loginTeacher(email, password) {
    const data = await this.post('/teacher/login', { email, password });
    localStorage.setItem('ilearn_teacher_token', data.token);
    localStorage.setItem('ilearn_teacher', JSON.stringify(data.teacher));
    localStorage.removeItem('ilearn_token');
    localStorage.removeItem('ilearn_student');
    localStorage.removeItem('ilearn_parent_token');
    localStorage.removeItem('ilearn_parent_student');
    return data;
  },

  async loginTeacherWithGoogle(credential) {
    const data = await this.post('/teacher/google-login', { credential });
    localStorage.setItem('ilearn_teacher_token', data.token);
    localStorage.setItem('ilearn_teacher', JSON.stringify(data.teacher));
    localStorage.removeItem('ilearn_token');
    localStorage.removeItem('ilearn_student');
    localStorage.removeItem('ilearn_parent_token');
    localStorage.removeItem('ilearn_parent_student');
    return data;
  },

  getTeacherStudents(date) {
    const suffix = date ? '?date=' + encodeURIComponent(date) : '';
    return this.get('/teacher/students' + suffix, this.teacherToken());
  },

  saveTeacherAttendance(date, attendance) {
    return this.post('/teacher/attendance', { date, attendance }, this.teacherToken());
  },

  logoutTeacher() {
    localStorage.removeItem('ilearn_teacher_token');
    localStorage.removeItem('ilearn_teacher');
    window.location.href = 'index.html';
  },

  submitAssessment(answers, questions, cls) {
    return this.post('/assessment/submit', { answers, questions, cls }, this.token());
  },

  getAssessmentHistory() {
    return this.get('/assessment/history', this.token());
  },

  async sendChatMessage(message, sessionKey) {
    const student = JSON.parse(localStorage.getItem('ilearn_student') || '{}');
    return this.post('/chat/message', {
      message,
      sessionKey: sessionKey || localStorage.getItem('ilearn_chat_session'),
      studentId: student.id || null
    });
  },

  getChatHistory(sessionKey) {
    return this.get('/chat/history/' + sessionKey);
  },

  generateTimetable(params) {
    return this.post('/timetable/generate', params, this.token());
  },

  getLatestTimetable() {
    return this.get('/timetable/latest', this.token());
  },

  markTimetableSlotCompletion(payload) {
    return this.post('/timetable/slot-completion', payload, this.token());
  },

  getStudentDailyMcqs() {
    return this.get('/student/daily-mcqs', this.token());
  },

  submitStudentDailyMcq(mcqId, selectedIndex) {
    return this.post('/student/daily-mcqs/' + mcqId + '/submit', { selectedIndex }, this.token());
  },

  getTeacherMcqs() {
    return this.get('/teacher/mcqs', this.teacherToken());
  },

  createTeacherMcq(payload) {
    return this.post('/teacher/mcqs', payload, this.teacherToken());
  },

  getTeacherQuestionPapers() {
    return this.get('/teacher/question-papers', this.teacherToken());
  },

  createTeacherQuestionPaper(payload) {
    return this.post('/teacher/question-papers', payload, this.teacherToken());
  },

  getTeacherWeeklyTests() {
    return this.get('/teacher/weekly-tests', this.teacherToken());
  },

  saveTeacherWeeklyTests(payload) {
    return this.post('/teacher/weekly-tests', payload, this.teacherToken());
  },

  saveTeacherFees(payload) {
    return this.post('/teacher/fees', payload, this.teacherToken());
  },

  getStudentDoubts() {
    return this.get('/student/doubts', this.token());
  },

  submitStudentDoubt(questionText, questionImage) {
    return this.post('/student/doubts', { questionText, questionImage }, this.token());
  },

  getTeacherDoubts() {
    return this.get('/teacher/doubts', this.teacherToken());
  },

  answerTeacherDoubt(id, answerText, answerImage) {
    return this.post('/teacher/doubts/' + id + '/answer', { answerText, answerImage }, this.teacherToken());
  },
  getAttendance(studentId) {
    return this.get('/attendance/' + studentId, this.token());
  },

  healthCheck() { return this.get('/health'); }
};

(async () => {
  try {
    await API.healthCheck();
    console.log('[I LEARN API] Connected to backend');
  } catch {
    console.warn('[I LEARN API] Backend not reachable. Running in demo mode.');
  }
})();



