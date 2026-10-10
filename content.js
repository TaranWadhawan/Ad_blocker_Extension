const adSelectors = [
  '.adsbygoogle',
  'iframe[src*="doubleclick"]',
  'div[class*="ad-box"]',
  'div[class*="ad-container"]',
  'div[id*="google_ads_frame"]',
  'amp-ad',
  'div[data-google-query-id]',
  '.trc_rbox_container',
  '#player-ads', // YouTube specific non-video ads
  '.ytd-ad-slot-renderer'
];

let localBlockedCount = 0;

function hideAds() {
  let elementsFound = 0;
  adSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      if (el.style.display !== 'none') {
        el.style.display = 'none';
        elementsFound++;
      }
    });
  });

  if (elementsFound > 0) {
    localBlockedCount += elementsFound;
    updateStorageCount(elementsFound);
  }
}

function handleYouTubeAds() {
  if (!window.location.hostname.includes('youtube.com')) return;

  const video = document.querySelector('video');
  const adOverlay = document.querySelector('.ytp-ad-player-overlay');
  const skipButton = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern');

  if (adOverlay || (video && video.classList.contains('ad-showing'))) {
    if (video && !video.muted) {
      video.muted = true;
    }
    if (video && isFinite(video.duration)) {
      video.playbackRate = 16.0;
      video.currentTime = video.duration - 0.1;
    }
    if (skipButton) {
      skipButton.click();
      updateStorageCount(1);
    }
  }
}

// Throttle updates to local storage to minimize performance impact
let updateTimeout;
function updateStorageCount(increment) {
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(() => {
    chrome.storage.local.get(['blockedCount'], (data) => {
      const currentCount = data.blockedCount || 0;
      chrome.storage.local.set({ blockedCount: currentCount + increment });
    });
  }, 500);
}

// Main execution controlled by settings
function init() {
  chrome.storage.local.get(['enabled', 'whitelist'], (data) => {
    const isEnabled = data.enabled !== false;
    const whitelist = data.whitelist || [];
    const currentHost = window.location.hostname;

    const isWhitelisted = whitelist.some(domain => currentHost.includes(domain));

    if (isEnabled && !isWhitelisted) {
      // Run initial check
      hideAds();
      handleYouTubeAds();

      // Monitor DOM changes
      const observer = new MutationObserver(() => {
        hideAds();
        handleYouTubeAds();
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  });
}

init();