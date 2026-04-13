const signupSummary = document.getElementById('signupSummary');
const signupList = document.getElementById('signupList');
const refreshButton = document.getElementById('refreshSignups');

async function loadSignups() {
  if (!signupSummary || !signupList) return;

  signupSummary.textContent = 'Loading beta queue...';
  signupList.innerHTML = '';

  try {
    const response = await fetch('/api/beta-signups');
    if (!response.ok) {
      throw new Error('Failed to load beta queue.');
    }

    const data = await response.json();
    const { count, signups } = data;

    signupSummary.textContent = `${count} signup${count === 1 ? '' : 's'} in the queue.`;

    if (!signups || signups.length === 0) {
      signupList.innerHTML = '<div class="testi-card">No beta signups yet.</div>';
      return;
    }

    signupList.innerHTML = signups
      .map((email, index) => `
        <div class="feature-card" style="padding: 16px; display: flex; align-items: center; justify-content: space-between;">
          <span><strong>#${index + 1}</strong> ${email}</span>
          <span style="color: var(--accent);">Queued</span>
        </div>
      `)
      .join('');
  } catch (error) {
    signupSummary.textContent = 'Unable to load the beta queue. Is the API server running?';
    signupList.innerHTML = '<div class="testi-card">Backend is unavailable.</div>';
    console.error(error);
  }
}

if (refreshButton) {
  refreshButton.addEventListener('click', (event) => {
    event.preventDefault();
    loadSignups();
  });
}

loadSignups();
