const Mustache = require("mustache");
const moment = require("moment");

const listItemTemplate = `{{#visitedUrls}}<li class="flex justify-between gap-x-6 p-5 shadow-md">
<div class="flex min-w-0 gap-x-4">
    <div class="min-w-0 flex-auto">
        <p class="text-sm font-semibold leading-5 truncate">
            <a class="text-primary" href="{{url}}" target="_blank" title="{{title}}">{{title}}</a>
        </p>
        <p class="text-xs font-light leading-5 truncate">
            {{urlPath}}
        </p>
        <p class="text-xs font-light leading-5 truncate" title="{{description}}">
            {{description}}
        </p>
        <p class="mt-1 truncate text-xs leading-5" title="{{datetime}}">{{datetimeDisplay}}</p>
    </div>
</div>
</li>{{/visitedUrls}}`;

chrome.storage.local.get(["pages.visited"]).then((result) => {
	let pagesVisited = result["pages.visited"];
	chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
		let url = new URL(tabs[0].url);
		let visitedUrls = [];
		if (pagesVisited && pagesVisited[url.host]) {
			visitedUrls = Object.keys(pagesVisited[url.host]).map((u) => {
				const urlData = pagesVisited[url.host][u];
				return {
					url: u,
					datetimeDisplay: moment.unix(urlData.dt).fromNow(),
					datetime: moment.unix(urlData.dt).format('MMMM Do YYYY, h:mm:ss a'),
					title: urlData.t,
					description: urlData.d,
					urlPath: urlData.p,
				};
			});
		}
		document.getElementById("title").innerHTML = url.host;
		document.getElementById("visited-urls").innerHTML = Mustache.render(
			listItemTemplate,
			{ visitedUrls }
		);
	});
});
