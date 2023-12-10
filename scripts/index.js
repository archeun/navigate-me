chrome.storage.sync.get(["pages.visited"]).then((result) => {
  let pagesVisited = result["pages.visited"];
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    let url = new URL(tabs[0].url);
    const visitedUrls = pagesVisited[url.host];
    const ul = document.getElementById("visited-urls");
    ul.replaceChildren();
    visitedUrls.forEach((url) => {
      const li = document.createElement("li");
      li.appendChild(document.createTextNode(url));
      ul.appendChild(li);
    });
  });
});
