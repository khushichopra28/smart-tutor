const SIGNIN_STORAGE_KEY = 'neurolearnUser';
const LOCAL_PROFILE_PREFIX = 'neurolearnProfile:';
const signOutBtn = document.getElementById('signOutBtn');
const welcomeMsg = document.getElementById('welcomeMsg');
const profileLabel = document.getElementById('profileLabel');
const progressLabel = document.getElementById('progressLabel');
const accuracyLabel = document.getElementById('accuracyLabel');
const xpLabel = document.getElementById('xpLabel');
const streakValue = document.getElementById('streakValue');
const accuracyValue = document.getElementById('accuracyValue');
const xpValue = document.getElementById('xpValue');
const streakDelta = document.getElementById('streakDelta');
const accuracyDelta = document.getElementById('accuracyDelta');
const xpDelta = document.getElementById('xpDelta');
const progressChart = document.getElementById('progressChart');
const courseForm = document.getElementById('courseForm');
const courseList = document.getElementById('courseList');
const reminderBanner = document.getElementById('reminderBanner');

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(SIGNIN_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function getLocalProfile(email) {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_PROFILE_PREFIX + email) || 'null');
  } catch {
    return null;
  }
}

function saveLocalProfile(profile) {
  localStorage.setItem(LOCAL_PROFILE_PREFIX + profile.email, JSON.stringify(profile));
}

function normalizeDate(date = new Date()) {
  return new Date(date).toISOString().slice(0, 10);
}

function buildLocalProgress(profile) {
  const courses = profile.courses || [];
  const sessions = courses.flatMap((course) =>
    (course.sessions || []).map((session) => ({
      ...session,
      course: course.name,
    }))
  );

  const totalXp = sessions.reduce((sum, session) => sum + (session.xp || 0), 0);
  const accuracy = sessions.length
    ? Math.round(
        sessions.reduce((sum, session) => sum + (session.total > 0 ? (session.correct / session.total) * 100 : 0), 0) /
          sessions.length
      )
    : 0;

  const sessionDates = Array.from(new Set(sessions.map((session) => normalizeDate(session.date)))).sort();
  let streakDays = 0;
  if (sessionDates.length) {
    streakDays = 1;
    let current = new Date(sessionDates[sessionDates.length - 1]);
    for (let i = sessionDates.length - 2; i >= 0; i -= 1) {
      const previous = new Date(sessionDates[i]);
      const diff = (current - previous) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streakDays += 1;
        current = previous;
      } else if (diff === 0) {
        continue;
      } else {
        break;
      }
    }
  }

  const today = new Date();
  const historyMap = new Map();
  sessions.forEach((session) => {
    const day = normalizeDate(session.date);
    historyMap.set(day, (historyMap.get(day) || 0) + (session.xp || 0));
  });

  const history = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = normalizeDate(new Date(today.getTime() - i * 24 * 60 * 60 * 1000));
    history.push({ label: day.slice(5), xp: historyMap.get(day) || 0 });
  }

  return {
    ...profile,
    xp: totalXp,
    accuracy,
    streakDays,
    history,
    courseCount: courses.length,
  };
}

function signOut() {
  localStorage.removeItem(SIGNIN_STORAGE_KEY);
  window.location.href = 'signin.html';
}

async function fetchProgress(email) {
  const response = await fetch(`/api/progress?email=${encodeURIComponent(email)}`);
  if (!response.ok) {
    throw new Error('Unable to load progress data from server.');
  }

  const type = response.headers.get('content-type') || '';
  if (!type.includes('application/json')) {
    throw new Error('Server returned invalid progress response.');
  }

  return response.json();
}

async function addCourse(email, name, goal) {
  try {
    const response = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, goal }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Could not add course.');
    }
    return response.json();
  } catch (error) {
    const profile = getLocalProfile(email);
    if (!profile) throw error;
    if ((profile.courses || []).some((course) => course.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('Course already exists.');
    }
    const courseId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    profile.courses = profile.courses || [];
    profile.courses.push({
      id: courseId,
      name,
      goal,
      sessions: [],
      createdAt: new Date().toISOString(),
    });
    const updated = buildLocalProgress(profile);
    saveLocalProfile(updated);
    return { profile: updated };
  }
}

async function addSession(email, courseId, correct, total) {
  try {
    const response = await fetch(`/api/courses/${courseId}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, correct, total }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Could not log session.');
    }
    return response.json();
  } catch (error) {
    const profile = getLocalProfile(email);
    if (!profile) throw error;
    const course = (profile.courses || []).find((item) => item.id === courseId);
    if (!course) throw new Error('Course not found locally.');
    const xp = Math.max(5, Math.round((correct / total) * 20 + 5));
    course.sessions = course.sessions || [];
    course.sessions.push({
      date: new Date().toISOString(),
      correct,
      total,
      xp,
    });
    const updated = buildLocalProgress(profile);
    saveLocalProfile(updated);
    return { profile: updated };
  }
}

function renderMetrics(profile) {
  const streak = profile.streakDays ?? 0;
  const accuracy = profile.accuracy ?? 0;
  const xp = profile.xp ?? 0;

  welcomeMsg.textContent = `Welcome back, ${profile.name}. Your dashboard is tracking every session.`;
  profileLabel.textContent = `Hi ${profile.name}`;
  progressLabel.textContent = `${streak} day streak`;
  accuracyLabel.textContent = `${accuracy}% accuracy`;
  xpLabel.textContent = `${xp} XP`;

  streakValue.textContent = `${streak}d`;
  accuracyValue.textContent = `${accuracy}%`;
  xpValue.textContent = xp;
  streakDelta.textContent = profile.streakChange || '+0%';
  accuracyDelta.textContent = profile.accuracyChange || '+0';
  xpDelta.textContent = profile.xpChange || '+0';
}

function getSessionCount(profile) {
  return (profile.courses || []).reduce((count, course) => count + ((course.sessions || []).length || 0), 0);
}

function updateReminderBanner(profile) {
  if (!reminderBanner) return;

  const sessionCount = getSessionCount(profile);
  if (sessionCount === 0) {
    reminderBanner.textContent = 'Add a course and log your first session to start tracking your real performance.';
    reminderBanner.classList.remove('hidden');
  } else if (sessionCount === 1) {
    reminderBanner.textContent = 'Great first session! Log at least one more session so the dashboard can show stronger trends.';
    reminderBanner.classList.remove('hidden');
  } else if (sessionCount < 3) {
    reminderBanner.textContent = 'Nice work — a couple more sessions will help the dashboard recommend the best next focus areas.';
    reminderBanner.classList.remove('hidden');
  } else {
    reminderBanner.classList.add('hidden');
  }
}

function renderCourses(profile) {
  if (!courseList) return;
  const courses = profile.courses || [];
  if (!courses.length) {
    courseList.innerHTML = '<div class="course-card"><p>No courses yet. Add a course above to begin tracking your study progress.</p></div>';
    return;
  }

  courseList.innerHTML = courses
    .map((course) => {
      const completed = (course.sessions || []).length;
      const totalXp = (course.sessions || []).reduce((sum, session) => sum + (session.xp || 0), 0);
      const avgAccuracy = course.sessions && course.sessions.length
        ? Math.round(
            course.sessions.reduce((sum, session) => sum + (session.total > 0 ? (session.correct / session.total) * 100 : 0), 0) /
              course.sessions.length
          )
        : 0;

      return `
        <article class="course-card">
          <header>
            <h4>${course.name}</h4>
            <div class="course-pill">Goal: ${course.goal} sessions/wk</div>
          </header>
          <div class="course-stats">
            <div class="course-pill">Sessions: ${completed}</div>
            <div class="course-pill">XP: ${totalXp}</div>
            <div class="course-pill">Accuracy: ${avgAccuracy}%</div>
            <div class="course-pill">Sessions logged: ${completed}</div>
          </div>
          <form data-course-id="${course.id}" class="session-form">
            <label>Log a session for ${course.name}</label>
            <input type="number" name="correct" min="0" placeholder="Correct answers" required />
            <input type="number" name="total" min="1" placeholder="Total questions" required />
            <div class="course-actions">
              <button class="btn-primary btn-lg" type="submit">Record session</button>
            </div>
          </form>
        </article>
      `;
    })
    .join('');

  courseList.querySelectorAll('.session-form').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const target = event.currentTarget;
      const courseId = target.dataset.courseId;
      const correct = Number(target.querySelector('input[name="correct"]').value);
      const total = Number(target.querySelector('input[name="total"]').value);
      const user = getUser();
      if (!user?.email) return;
      if (Number.isNaN(correct) || Number.isNaN(total) || correct < 0 || total <= 0 || correct > total) {
        alert('Enter valid correct and total values.');
        return;
      }

      try {
        const data = await addSession(user.email, courseId, correct, total);
        if (data.profile) {
          await refreshDashboard(data.profile);
        }
      } catch (error) {
        alert(error.message || 'Unable to record session.');
      }
    });
  });
}

function drawProgressChart(profile) {
  if (!progressChart) return;
  const ctx = progressChart.getContext('2d');
  const parentRect = progressChart.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = parentRect.width;
  const height = 160;
  progressChart.width = width * dpr;
  progressChart.height = height * dpr;
  progressChart.style.width = `${width}px`;
  progressChart.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const history = profile.history || [];
  if (!history.length) return;

  const padding = 34;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 1.5;
  const maxXP = Math.max(...history.map((item) => item.xp)) * 1.08 || 10;

  ctx.font = '12px "DM Sans", sans-serif';
  ctx.fillStyle = '#2D5DA1';
  ctx.textAlign = 'center';

  history.forEach((entry, index) => {
    const x = padding + (chartWidth / (history.length - 1)) * index;
    const y = padding + chartHeight - (entry.xp / maxXP) * chartHeight;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(entry.label, x, height - 8);
  });

  ctx.beginPath();
  history.forEach((entry, index) => {
    const x = padding + (chartWidth / (history.length - 1)) * index;
    const y = padding + chartHeight - (entry.xp / maxXP) * chartHeight;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#6C63FF';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.save();
  ctx.strokeStyle = 'rgba(108,99,255,0.24)';
  ctx.lineWidth = 1;
  history.forEach((entry, index) => {
    const x = padding + (chartWidth / (history.length - 1)) * index;
    const y = padding + chartHeight - (entry.xp / maxXP) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, height - padding + 6);
    ctx.stroke();
  });
  ctx.restore();

  ctx.fillStyle = '#2D5DA1';
  ctx.font = '13px "DM Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Latest XP: ${history[history.length - 1]?.xp ?? 0}`, padding, 20);
}

function applyLocalProfile(profile) {
  const normalized = profile.history ? profile : buildLocalProgress(profile);
  saveLocalProfile(normalized);
  renderMetrics(normalized);
  renderCourses(normalized);
  updateReminderBanner(normalized);
  drawProgressChart(normalized);
}

async function refreshDashboard(profile) {
  if (profile) {
    applyLocalProfile(profile);
    return;
  }

  const user = getUser();
  if (!user?.email) return;

  try {
    const data = await fetchProgress(user.email);
    applyLocalProfile(data.profile);
  } catch (error) {
    const localProfile = getLocalProfile(user.email);
    if (localProfile) {
      applyLocalProfile(localProfile);
      welcomeMsg.textContent = 'Using local progress data because the API is unavailable.';
    } else {
      welcomeMsg.textContent = 'Unable to load your progress. Please try again later.';
      console.error(error);
    }
  }
}

if (courseForm) {
  courseForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('courseName')?.value.trim() || '';
    const goal = Number(document.getElementById('courseGoal')?.value || '0');
    const user = getUser();

    if (!name || goal <= 0 || !user?.email) {
      alert('Enter a course name and a valid weekly goal.');
      return;
    }

    try {
      const data = await addCourse(user.email, name, goal);
      applyLocalProfile(data.profile);
      courseForm.reset();
    } catch (error) {
      alert(error.message || 'Could not add course.');
    }
  });
}

async function init() {
  const user = getUser();
  if (!user?.email) {
    window.location.href = 'signin.html';
    return;
  }

  await refreshDashboard();
}

if (signOutBtn) {
  signOutBtn.addEventListener('click', signOut);
}

init();
