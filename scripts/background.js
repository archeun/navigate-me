chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const url = new URL(tab.url);
    await chrome.tabs.sendMessage(tabId, { url, host: url.host });
  }
});
