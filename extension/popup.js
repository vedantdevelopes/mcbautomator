document.getElementById('launch-btn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  status.textContent = 'Injecting assistant...';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) {
    status.textContent = 'No active tab found.';
    return;
  }

  if (!tab.url || !tab.url.includes('myclassboard.com')) {
    status.style.color = '#dc2626';
    status.textContent = 'Please open MyClassboard first!';
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['mcb-automation-runner.js']
  }, () => {
    status.style.color = '#059669';
    status.textContent = 'Launched successfully!';
    setTimeout(() => window.close(), 1200);
  });
});
