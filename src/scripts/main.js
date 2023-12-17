const Mustache = require("mustache");
const moment = require("moment");

let visitedUrls = [];

const listItemTemplate = `{{#visitedUrls}}
<li class="border-l-secondary border-l-4 justify-between gap-x-1 p-2 mb-3 shadow-md">
<div class="min-w-0 gap-x-4">
	<div class="min-w-0 flex-auto w-full">
		<p class="text-sm font-semibold leading-5 truncate">
			<a class="text-primary" href="{{url}}" target="_blank" title="{{title}}">{{title}}</a>
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

chrome.storage.local.get(["pages.visited"]).then((result) => {
	let pagesVisited = result["pages.visited"];
	chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
		const url = new URL(tabs[0].url);
		document.getElementById("title").innerHTML = url.host;
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
				datetime: moment.unix(urlData.dt).format("MMMM Do YYYY, h:mm:ss a"),
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
		"input[name=delete-checkbox]:checked"
	);

	return Array.from(selectedCheckboxes).map((cb) => cb.value);
}

function populateList(urls) {
	document.getElementById(
		"item-count"
	).innerHTML = `${urls.length} item(s) found`;
	document.getElementById("visited-urls").innerHTML = Mustache.render(
		listItemTemplate,
		{ visitedUrls: urls }
	);
}

function toggleDeleteConfirmationSection(choice) {
	const deleteConfBtns = document.getElementById("delete-confirmation-btns");
	deleteConfBtns.classList.remove("hidden");
	deleteConfBtns.classList.remove("grid");
	if (choice === "show") {
		deleteConfBtns.classList.add("grid");
	} else {
		deleteConfBtns.classList.add("hidden");
	}
}

function toggleAllDeleteCheckboxes(choice) {
	document.querySelectorAll("input[name=delete-checkbox]").forEach((cb) => {
		cb.checked = choice === "check";
	});
}

document
	.getElementById("search-text-input")
	.addEventListener("keyup", function (el, event) {
		populateList(
			visitedUrls.filter((visitedUrl) => {
				return visitedUrl.title
					.toLowerCase()
					.includes(this.value.toLowerCase());
			})
		);
	});

document
	.getElementById("delete-all-btn")
	.addEventListener("click", function (el, event) {
		toggleAllDeleteCheckboxes("check");
		toggleDeleteConfirmationSection("show");
	});

document
	.getElementById("delete-selected-btn")
	.addEventListener("click", function (el, event) {
		if (getSelectedUrlsToDelete().length > 0) {
			toggleDeleteConfirmationSection("show");
		}
	});

document
	.getElementById("cancel-delete-btn")
	.addEventListener("click", function (el, event) {
		toggleAllDeleteCheckboxes();
		toggleDeleteConfirmationSection();
	});

document
	.getElementById("confirm-delete-btn")
	.addEventListener("click", function (el, event) {
		const urlsToDelete = getSelectedUrlsToDelete();
		chrome.storage.local.get(["pages.visited"]).then((result) => {
			let pagesVisited = result["pages.visited"];
			chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
				let url = new URL(tabs[0].url);
				urlsToDelete.forEach((u) => {
					delete pagesVisited[url.host][u];
				});
				chrome.storage.local.set({ "pages.visited": pagesVisited }).then(() => {
					generateVisitedUrls(pagesVisited, url.host);
					populateList(visitedUrls);
					toggleDeleteConfirmationSection();
				});
			});
		});
	});
