import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const userProfiles = new Map();

function createProfile(email, password) {
  const name = email.split('@')[0].replace(/[.\-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    email,
    password,
    name,
    courses: [],
    createdAt: new Date().toISOString(),
  };
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function normalizeDate(date = new Date()) {
  return new Date(date).toISOString().slice(0, 10);
}

function computeStreak(dates) {
  const uniqueDates = Array.from(new Set(dates)).sort((a, b) => a.localeCompare(b));
  if (!uniqueDates.length) return 0;

  let streak = 1;
  let current = new Date(uniqueDates[uniqueDates.length - 1]);

  for (let i = uniqueDates.length - 2; i >= 0; i -= 1) {
    const previous = new Date(uniqueDates[i]);
    const diff = (current - previous) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak += 1;
      current = previous;
    } else if (diff === 0) {
      continue;
    } else {
      break;
    }
  }

  return streak;
}

function buildProgress(profile) {
  const courses = profile.courses || [];
  const sessions = courses.flatMap((course) =>
    (course.sessions || []).map((session) => ({
      ...session,
      course: course.name,
    }))
  );

  const totalXp = sessions.reduce((sum, session) => sum + (session.xp || 0), 0);
  const accuracy = sessions.length
    ? round(
        sessions.reduce((sum, session) => sum + (session.total > 0 ? (session.correct / session.total) * 100 : 0), 0) /
          sessions.length
      )
    : 0;

  const sessionDates = sessions.map((session) => normalizeDate(session.date));
  const streakDays = computeStreak(sessionDates);

  const historyMap = new Map();
  sessions.forEach((session) => {
    const day = normalizeDate(session.date);
    historyMap.set(day, (historyMap.get(day) || 0) + session.xp);
  });

  const today = new Date();
  const history = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = normalizeDate(new Date(today.getTime() - i * 24 * 60 * 60 * 1000));
    history.push({ label: day.slice(5), xp: historyMap.get(day) || 0 });
  }

  return {
    email: profile.email,
    name: profile.name,
    courses,
    xp: totalXp,
    accuracy,
    streakDays,
    courseCount: courses.length,
    history,
  };
}

app.post('/api/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!validEmail.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  if (userProfiles.has(email)) {
    const profile = userProfiles.get(email);
    if (profile.password !== password) {
      return res.status(401).json({ error: 'Invalid password.' });
    }
    return res.json({ email: profile.email, name: profile.name });
  }

  const profile = createProfile(email, password);
  userProfiles.set(email, profile);
  return res.status(201).json({ email: profile.email, name: profile.name });
});

app.get('/api/progress', (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ error: 'Email query is required.' });
  }

  const profile = userProfiles.get(email);
  if (!profile) {
    return res.status(404).json({ error: 'User not found.' });
  }

  return res.json({ profile: buildProgress(profile) });
});

app.post('/api/courses', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const name = String(req.body.name || '').trim();
  const goal = Number(req.body.goal) || 0;

  if (!email || !name || goal <= 0) {
    return res.status(400).json({ error: 'Course name and goal are required.' });
  }

  const profile = userProfiles.get(email);
  if (!profile) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (profile.courses.some((course) => course.name.toLowerCase() === name.toLowerCase())) {
    return res.status(409).json({ error: 'Course already exists.' });
  }

  const courseId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  profile.courses.push({
    id: courseId,
    name,
    goal,
    sessions: [],
    createdAt: new Date().toISOString(),
  });

  return res.status(201).json({ profile: buildProgress(profile) });
});

app.post('/api/courses/:courseId/session', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const courseId = String(req.params.courseId || '');
  const correct = Number(req.body.correct);
  const total = Number(req.body.total);

  if (!email || !courseId || correct < 0 || total <= 0 || correct > total) {
    return res.status(400).json({ error: 'Valid course, correct, and total values are required.' });
  }

  const profile = userProfiles.get(email);
  if (!profile) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const course = profile.courses.find((item) => item.id === courseId);
  if (!course) {
    return res.status(404).json({ error: 'Course not found.' });
  }

  const xp = Math.max(5, Math.round((correct / total) * 20 + 5));
  course.sessions.push({
    date: new Date().toISOString(),
    correct,
    total,
    xp,
  });

  return res.status(201).json({ profile: buildProgress(profile) });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`NeuroLearn API server running on http://localhost:${port}`);
});
