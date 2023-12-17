'use strict';

(function () {
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tab.url) {
      const url = new URL(tab.url);
      try {
        await chrome.tabs.sendMessage(tabId, {
          href: url.href,
          host: url.host,
          origin: url.origin,
          title: tab.title,
        });
      } catch (error) {}
    }
  });
})();
