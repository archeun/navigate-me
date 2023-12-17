'use strict';

(async function () {
  const moment = require('moment');
  const consts = require('./constants');

  function getUrlPathWithoutOrigin(url) {
    return url.href.split(url.origin)[1];
  }

  function getDocumentData() {
    let descrption = document.querySelector(
      'meta[name="description"]'
    )?.content;
    if (!descrption) {
      descrption = document.querySelector('meta[name="Description"]')?.content;
    }
    if (!descrption) {
      descrption = document.querySelector(
        'meta[property="og:description"]'
      )?.content;
    }
    return {
      descrption,
    };
  }

  async function addVisitedUrl() {
    const url = new URL(window.location.href);
    await updateStorage(
      url.host,
      url.href,
      getUrlPathWithoutOrigin(url),
      document.title
    );
  }

  chrome.runtime.onMessage.addListener(
    async (message, sender, sendResponse) => {
      await updateStorage(
        message.host,
        message.href,
        getUrlPathWithoutOrigin(message),
        message.title
      );
    }
  );

  async function updateStorage(host, url, urlPath, title) {
    const storageVisitedUrlsKey = consts.storage.keys.VISITED_URLS;
    const storageSettings = consts.storage.keys.SETTINGS;

    const storageData = await chrome.storage.local.get([
      storageVisitedUrlsKey,
      storageSettings.MAIN,
    ]);

    let pagesVisited = storageData[storageVisitedUrlsKey];
    if (!pagesVisited[host]) {
      pagesVisited[host] = {};
    }

    const settingsData = storageData[storageSettings.MAIN];
    if (!settingsData[host]) {
      settingsData[host] = {
        [storageSettings.RECORD_NAVIGATIONS]: true,
      };
      await chrome.storage.local.set({ [storageSettings.MAIN]: settingsData });
    }

    if (!settingsData[host][storageSettings.RECORD_NAVIGATIONS]) {
      return;
    }

    const documentData = getDocumentData();

    pagesVisited[host][url] = {
      dt: moment().unix(),
      t: title,
      d: documentData.descrption,
      p: urlPath,
    };

    await chrome.storage.local.set({ [storageVisitedUrlsKey]: pagesVisited });
  }

  async function initStorage() {
    const storageVisitedUrlsKey = consts.storage.keys.VISITED_URLS;
    const storageSettings = consts.storage.keys.SETTINGS;

    const storageData = await chrome.storage.local.get([
      storageVisitedUrlsKey,
      storageSettings.MAIN,
    ]);
    if (!storageData || !storageData[storageVisitedUrlsKey]) {
      await chrome.storage.local.set({
        [storageVisitedUrlsKey]: {
          [window.location.host]: {
            [window.location.href]: {},
          },
        },
      });
    }

    if (!storageData || !storageData[storageSettings.MAIN]) {
      await chrome.storage.local.set({
        [storageSettings.MAIN]: {
          [window.location.host]: {
            [storageSettings.RECORD_NAVIGATIONS]: true,
          },
        },
      });
    }
  }

  async function init() {
    await initStorage();
    await addVisitedUrl();
  }

  await init();
})();
