const moment = require("moment");

function getUrlPathWithoutOrigin(url) {
	return url.href.split(url.origin)[1];
}

function getDocumentData() {
	let descrption = document.querySelector('meta[name="description"]')?.content;
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

function addVisitedUrl() {
	const url = new URL(window.location.href);
	updateStorage(url.host, url.href, getUrlPathWithoutOrigin(url), document.title);
}

addVisitedUrl();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	updateStorage(
		message.host,
		message.href,
		getUrlPathWithoutOrigin(message),
		message.title
	);
});

function updateStorage(host, url, urlPath, title) {
	chrome.storage.local.get(["pages.visited"]).then((result) => {
		let pagesVisited = result["pages.visited"];
		if (!pagesVisited) {
			pagesVisited = {
				[host]: { [url]: {} },
			};
		} else if (!pagesVisited[host]) {
			pagesVisited[host] = { [url]: {} };
		}
		const documentData = getDocumentData();
		pagesVisited[host][url] = {
			dt: moment().unix(),
			t: title,
			d: documentData.descrption,
			p: urlPath,
		};

		chrome.storage.local.set({ "pages.visited": pagesVisited }).then();
	});
}
