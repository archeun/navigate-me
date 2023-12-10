updateStorage(window.location.host, window.location.href);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  updateStorage(message.host, message.url);
});

function updateStorage(host, url) {
  chrome.storage.sync.get(["pages.visited"]).then((result) => {
    let pagesVisited = result["pages.visited"];
    if (!pagesVisited) {
      pagesVisited = {
        [host]: [],
      };
    } else if (!pagesVisited[host]) {
      pagesVisited[host] = [];
    } else if (pagesVisited[host].includes(url)) {
      return;
    }
    pagesVisited[host].push(url);
    chrome.storage.sync.set({ "pages.visited": pagesVisited }).then(() => {
      console.log(pagesVisited);
    });
  });
}
