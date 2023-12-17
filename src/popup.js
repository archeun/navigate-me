'use strict';

import './popup.css';

(function () {
  const Mustache = require('mustache');
  const moment = require('moment');
  const consts = require('./constants');
  const storageKey = consts.storage.keys.VISITED_URLS;
  const settingsStorageKey = consts.storage.keys.SETTINGS;
  let visitedUrls = [];

  const listItemTemplate = `{{#visitedUrls}}
<li class="bg-white border-l-secondary border-l-4 justify-between gap-x-1 p-2 mb-3 shadow-md">
<div class="min-w-0 gap-x-4">
	<div class="min-w-0 flex-auto w-full">
		<p class="text-sm font-semibold leading-5 truncate">
			<a class="text-primary visited-link" href="{{url}}" title="{{title}}">{{title}}</a>
		</p>
		<p class="text-xs font-light leading-5 truncate">
			{{urlPath}}
		</p>
		<p class="text-xs font-light leading-5 truncate" title="{{description}}">
			{{description}}
		</p>
		<div class="grid grid-cols-2">
			<p class="mt-1 truncate text-xs leading-5" title="{{datetime}}">{{datetimeDisplay}}</p>
			<input type="checkbox" name="delete-checkbox" value="{{url}}" class="justify-self-end"/>
		</div>
	</div>
</div>
</li>
{{/visitedUrls}}`;

  chrome.storage.local.get([storageKey]).then((result) => {
    let pagesVisited = result[storageKey];
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const url = new URL(tabs[0].url);
      document.getElementById('title').innerHTML = url.host;
      generateVisitedUrls(pagesVisited, url.host);
      populateList(visitedUrls);
    });
  });

  function generateVisitedUrls(pagesVisited, host) {
    if (pagesVisited && pagesVisited[host]) {
      visitedUrls = Object.keys(pagesVisited[host]).map((u) => {
        const urlData = pagesVisited[host][u];
        return {
          url: u,
          dt: urlData.dt,
          datetimeDisplay: moment.unix(urlData.dt).fromNow(),
          datetime: moment.unix(urlData.dt).format('MMMM Do YYYY, h:mm:ss a'),
          title: urlData.t,
          description: urlData.d,
          urlPath: urlData.p,
        };
      });
      visitedUrls = visitedUrls.sort((a, b) => b.dt - a.dt);
    }
  }

  function getSelectedUrlsToDelete() {
    const selectedCheckboxes = document.querySelectorAll(
      'input[name=delete-checkbox]:checked'
    );

    return Array.from(selectedCheckboxes).map((cb) => cb.value);
  }

  function populateList(urls) {
    document.getElementById(
      'item-count'
    ).innerHTML = `${urls.length} item(s) found`;
    document.getElementById('visited-urls').innerHTML = Mustache.render(
      listItemTemplate,
      { visitedUrls: urls }
    );

    registerLinkClickEvents();
  }

  function registerLinkClickEvents() {
    Object.values(document.getElementsByClassName('visited-link')).forEach(
      (el) => {
        el.addEventListener('click', (e) => {
          const url = el.getAttribute('href');
          if (!e.ctrlKey) {
            chrome.tabs.update({ active: true, url });
          }
        });
      }
    );
  }

  function toggleDeleteConfirmationSection(choice) {
    const deleteConfBtns = document.getElementById('delete-confirmation-btns');
    deleteConfBtns.classList.remove('hidden');
    deleteConfBtns.classList.remove('grid');
    if (choice === 'show') {
      deleteConfBtns.classList.add('grid');
    } else {
      deleteConfBtns.classList.add('hidden');
    }
  }

  function toggleAllDeleteCheckboxes(choice) {
    document.querySelectorAll('input[name=delete-checkbox]').forEach((cb) => {
      cb.checked = choice === 'check';
    });
  }

  async function getCurrentUrl() {
    const currentTab = (
      await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    )[0];
    return new URL(currentTab.url);
  }

  const settingsTab = {
    form: {
      eventListeners: {
        [settingsStorageKey.RECORD_NAVIGATIONS]: async (event) => {
          await settingsTab.save({
            [settingsStorageKey.RECORD_NAVIGATIONS]: event.target.checked,
          });
        },
      },
      init: async () => {
        const settings = (
          await chrome.storage.local.get([settingsStorageKey.MAIN])
        )[settingsStorageKey.MAIN];
        const url = await getCurrentUrl();
        document.getElementById(settingsStorageKey.RECORD_NAVIGATIONS).checked =
          settings[url.host][settingsStorageKey.RECORD_NAVIGATIONS];
      },
    },
    save: async (updatedSettingsForHost) => {
      const storedSettings = (
        await chrome.storage.local.get([settingsStorageKey.MAIN])
      )[settingsStorageKey.MAIN];

      const url = await getCurrentUrl();
      let currentSettingsForHost = storedSettings[url.host];
      let newSettingsForHost = {
        ...currentSettingsForHost,
        ...updatedSettingsForHost,
      };
      storedSettings[url.host] = newSettingsForHost;
      await chrome.storage.local.set({
        [settingsStorageKey.MAIN]: storedSettings,
      });
    },
  };

  document
    .getElementById('search-text-input')
    .addEventListener('keyup', function (event, el) {
      populateList(
        visitedUrls.filter((visitedUrl) => {
          return visitedUrl.title
            .toLowerCase()
            .includes(this.value.toLowerCase());
        })
      );
    });

  document
    .getElementById('delete-all-btn')
    .addEventListener('click', function (event, el) {
      toggleAllDeleteCheckboxes('check');
      toggleDeleteConfirmationSection('show');
    });

  document
    .getElementById('delete-selected-btn')
    .addEventListener('click', function (event, el) {
      if (getSelectedUrlsToDelete().length > 0) {
        toggleDeleteConfirmationSection('show');
      }
    });

  document
    .getElementById('cancel-delete-btn')
    .addEventListener('click', function (event, el) {
      toggleAllDeleteCheckboxes();
      toggleDeleteConfirmationSection();
    });

  document
    .getElementById('confirm-delete-btn')
    .addEventListener('click', function (event, el) {
      const urlsToDelete = getSelectedUrlsToDelete();
      chrome.storage.local.get([storageKey]).then((result) => {
        let pagesVisited = result[storageKey];
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
          let url = new URL(tabs[0].url);
          urlsToDelete.forEach((u) => {
            delete pagesVisited[url.host][u];
          });
          chrome.storage.local.set({ [storageKey]: pagesVisited }).then(() => {
            generateVisitedUrls(pagesVisited, url.host);
            populateList(visitedUrls);
            toggleDeleteConfirmationSection();
          });
        });
      });
    });

  Object.values(document.getElementsByClassName('tablinks')).forEach((el) => {
    el.addEventListener('click', async (event, element) => {
      const elementName = el.getAttribute('name');
      let i, tabcontent, tablinks;

      tabcontent = document.getElementsByClassName('tabcontent');
      for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = 'none';
      }

      tablinks = document.getElementsByClassName('tablinks');
      for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(
          ' text-primary font-bold',
          ''
        );
      }

      document.getElementById(`${elementName}-tab`).style.display = 'block';
      event.currentTarget.className += ' text-primary font-bold';
      await settingsTab.form.init();
    });
  });

  Object.values(document.getElementsByClassName('settings-input')).forEach(
    (el) => {
      const elementName = el.getAttribute('name');
      let eventName;
      let eventListener = settingsTab.form.eventListeners[elementName];
      switch (elementName) {
        case 'record-navigations-check':
          eventName = 'change';
          break;

        default:
          break;
      }
      el.addEventListener(eventName, eventListener);
    }
  );
})();
