// Initialize default settings on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    enabled: true,
    whitelist: [],
    blockedCount: 0
  });
});

// Listen for changes in the enabled state to toggle declarativeNetRequest rules
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.enabled) {
    const isEnabled = changes.enabled.newValue;
    chrome.declarativeNetRequest.updateEnabledRulesets({
      [isEnabled ? "enableRulesetIds" : "disableRulesetIds"]: ["ruleset_1"]
    });
  }
});