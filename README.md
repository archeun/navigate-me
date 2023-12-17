# Navigate Me
A chrome extension to access your recently visited web pages within a website.

## Features

- Records the web pages you visit within a website
- Lists down the web pages (most recent on top)
- Search and pick previously visited pages
- Remove selected pages from the list
- Setting to enable/disable tracking
- No data usage. The extension stores its data locally. Not synced with any cloud applications - privacy first

## Development

Follow the steps below to set up the extension codebase for development.

1. Clone (or fork and clone) the repository.
1. Navigate inside the root directory of the codebase.
1. Run `npm install && npm run watch`. This will build the extension for development. Build files can be found at `<root-dir>/build` directory.
1. Then follow the below instructions to install the extension locally for testing. 
    1. Open `chrome://extensions`
    1. Switch on the `Developer mode` checkbox (top right corner of the page)
    1. Click on the `Load unpacked` button
    1. Select the `<root-dir>/build` folder and click `Open`.