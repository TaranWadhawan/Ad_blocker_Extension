document.addEventListener('DOMContentLoaded', () => {
  const toggleBlocker = document.getElementById('toggle-blocker');
  const blockedCountEl = document.getElementById('blocked-count');
  const whitelistBtn = document.getElementById('whitelist-btn');
  const whitelistStatus = document.getElementById('whitelist-status');

  let currentHost = '';

  // 1. Load current states
  chrome.storage.local.get(['enabled', 'blockedCount', 'whitelist'], (data) => {
    toggleBlocker.checked = data.enabled !== false;
    blockedCountEl.textContent = data.blockedCount || 0;
    const whitelist = data.whitelist || [];

    // Get active tab domain to check if it's already whitelisted
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        try {
          const url = new URL(tabs[0].url);
          currentHost = url.hostname;

          if (whitelist.includes(currentHost)) {
            whitelistBtn.textContent = 'Remove from Whitelist';
            whitelistBtn.classList.add('active');
            whitelistStatus.textContent = 'Ad blocking disabled on this site.';
          } else {
            whitelistBtn.textContent = 'Whitelist This Site';
            whitelistBtn.classList.remove('active');
          }
        } catch (e) {
          // Handle internal chrome:// pages where URL parsing fails
          whitelistBtn.style.display = 'none';
        }
      }
    });
  });

  // 2. Toggle global enable/disable
  toggleBlocker.addEventListener('change', () => {
    chrome.storage.local.set({ enabled: toggleBlocker.checked });
  });

  // 3. Whitelist button click
  whitelistBtn.addEventListener('click', () => {
    if (!currentHost) return;

    chrome.storage.local.get(['whitelist'], (data) => {
      let whitelist = data.whitelist || [];

      if (whitelist.includes(currentHost)) {
        // Remove from whitelist
        whitelist = whitelist.filter(item => item !== currentHost);
        whitelistBtn.textContent = 'Whitelist This Site';
        whitelistBtn.classList.remove('active');
        whitelistStatus.textContent = '';
      } else {
        // Add to whitelist
        whitelist.push(currentHost);
        whitelistBtn.textContent = 'Remove from Whitelist';
        whitelistBtn.classList.add('active');
        whitelistStatus.textContent = 'Ad blocking disabled on this site.';
      }

      chrome.storage.local.set({ whitelist: whitelist }, () => {
        // Reload tab to apply/remove ad blocking instantly
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.reload(tabs[0].id);
          }
        });
      });
    });
  });
});