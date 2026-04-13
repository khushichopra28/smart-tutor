const SIGNIN_STORAGE_KEY = 'neurolearnUser';
const LOCAL_PROFILE_PREFIX = 'neurolearnProfile:';
const signinForm = document.getElementById('signinForm');

function redirectToProgress() {
  window.location.href = 'progress.html';
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(SIGNIN_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function setStoredUser(user) {
  localStorage.setItem(SIGNIN_STORAGE_KEY, JSON.stringify(user));
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

function makeProfile(email, password) {
  const name = email.split('@')[0].replace(/[.\-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    email,
    password,
    name,
    courses: [],
    createdAt: new Date().toISOString(),
  };
}

const existingUser = getStoredUser();
if (existingUser?.email) {
  redirectToProgress();
}

async function tryApiLogin(email, password) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const type = response.headers.get('content-type') || '';
  if (!type.includes('application/json')) {
    throw new Error('Server returned invalid response.');
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Sign in failed.');
  }

  return data;
}

if (signinForm) {
  signinForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('signinEmail')?.value.trim() || '';
    const password = document.getElementById('signinPassword')?.value || '';
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!validEmail.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 4) {
      alert('Use a password with at least 4 characters.');
      return;
    }

    let userData;
    try {
      const apiData = await tryApiLogin(email, password);
      userData = { email: apiData.email, name: apiData.name };
    } catch (error) {
      const profile = getLocalProfile(email);
      if (profile) {
        if (profile.password !== password) {
          alert('Invalid password for local profile.');
          return;
        }
        userData = { email: profile.email, name: profile.name };
      } else {
        const newProfile = makeProfile(email, password);
        saveLocalProfile(newProfile);
        userData = { email: newProfile.email, name: newProfile.name };
        alert('No backend available. Your profile is saved locally for now.');
      }
    }

    setStoredUser(userData);
    redirectToProgress();
  });
}
