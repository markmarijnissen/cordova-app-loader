cordova-app-loader
==========
> Remote update your Cordova App

## How it works:

2. Write a **manifest.json** to **bootstrap.js** your app.
3. Build and deploy your app.

A little later...

1. Upload an update to your server (**manifest.json** + files)
2. Use `CordovaAppLoader` to 
   1. `check()` for a new manifest
   2. `download()` files
   3. `update()` your app!


## Demo Time!

Check out [Cordova App Loader](http://data.madebymark.nl/cordova-app-loader/index.html) in Chrome for a demo! (**Chrome only!**)

Or run on your own computer:

```bash
git clone git@github.com:markmarijnissen/cordova-app-loader.git
cd cordova-app-loader
cordova platform add ios@3.7.0
cordova plugin add org.apache.cordova.file
cordova plugin add org.apache.cordova.file-transfer
cordova run ios
```

**Note:** Want to run your own server? Modify `serverRoot` in `www/app.js`!

## Installation

### Setup Cordova:

```bash
  cordova platform add ios@3.7.0
  cordova plugin add org.apache.cordova.file
  cordova plugin add org.apache.cordova.file-transfer
```

**IMPORTANT:** For iOS, use Cordova 3.7.0 or higher (due to a [bug](https://github.com/AppGyver/steroids/issues/534) that affects requestFileSystem).

### Get javascript:

You need:

 * bootstrap.js ([github](https://github.com/markmarijnissen/cordova-app-loader/), [file](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/bootstrap.js)): reads the manifest.json to start your app.
 * cordova-app-loader ([github](https://github.com/markmarijnissen/cordova-app-loader/), [file]((https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/www/lib/CordovaAppLoader.js))): to check,download and update a **manifest.json**
 * cordova-promise-fs ([github](https://github.com/markmarijnissen/cordova-promise-fs), [file](https://github.com/markmarijnissen/cordova-app-loader/blob/master/www/lib/CordovaPromiseFS.js)): to deal with the FileSystem
 * Promise libary such as bluebird ([github](https://github.com/petkaantonov/bluebird), [file](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/www/lib/bluebird.js)) or promiscuous ([github](https://github.com/RubenVerborgh/promiscuous),[file](https://raw.githubusercontent.com/RubenVerborgh/promiscuous/master/promiscuous.js))

 CordovaAppLoader uses [cordova-file-cache](https://github.com/markmarijnissen/cordova-file-cache) to download and cache the files.

```bash
  bower install cordova-app-loader cordova-promise-fs bluebird
  npm install cordova-app-loader cordova-promise-fs bluebird
```

### Getting started 

1. Write a **manifest.json** (see below)
2. The included **bootstrap.js** script will load your CSS and JS.
3. Use **CordovaAppLoader** to `check()`, `download()` and `apply()` updates:

```javascript
  // When using NPM, require these first.
  // When using the ready-made files, these are available as global variables.
  var CordovaPromiseFS = require('cordova-promise-fs');
  var CordovaAppLoader = require('cordova-app-loader');
  var Promise = require('bluebird');

  // Initialize a FileSystem
  var fs = new CordovaPromiseFS({
    Promise: Promise
  });

  // Initialize a CordovaAppLoader
  var loader = new CordovaAppLoader({
    fs: fs,
    serverRoot: 'http://data.madebymark.nl/cordova-app-loader/'
  });

  // Write your own "check", "download" and "update" logic:
  loader.check()
  .then(function(){
    return loader.download();
  }).then(function(){
    return loader.update();
  })
```

See [an example](https://github.com/markmarijnissen/cordova-app-loader/blob/master/autoupdate.js).

### Quickstart

If you don't need full control, you can use a drop-in solution: [autoupdate.js](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/www/autoupdate.js)

[autoupdate.js](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/www/autoupdate.js) includes all four files ([bootstrap.js](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/bootstrap.js), [a Promise library](https://raw.githubusercontent.com/RubenVerborgh/promiscuous/master/promiscuous.js),[CordovaPromiseFS.js](https://github.com/markmarijnissen/cordova-app-loader/blob/master/www/lib/CordovaPromiseFS.js) and [CordovaAppLoader.js](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/www/lib/CordovaAppLoader.js)), initializes everything, and then implements very simple update logic:

1. When you open or resume the app (or when you switch tabs in Chrome)
2. Check for updates
3. Download files in the background
3. Update automatically when download is ready.

Here is how to get started:

1. Download [index.html](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/www/autoupdate.html) to your `www` directory.
2. Download [autoupdate.js](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/www/autoupdate.js) to your `www` directory.
3. Make sure you set the correct options in `index.html`:
    ```html
    <script 
        type="text/javascript" 
        server="http://data.madebymark.nl/cordova-app-loader/" 
        manifest="manifest.json" 
        src="autoupdate.js"></script>
    ```

4. Launch your app.
5. Upload a new **manifest.json** (+ files) to your server.
6. Reopen your app to download and apply the update.

This implementation is **not** recommended because:

* Downloading files in the background can slow down performance (sluggish UI).
* The update (reload) can interrupt an important user action.

## Usage

### Overview

1. Write a **manifest.json**
2. Add **bootstrap.js** script to your **index.html**
3. Instantiate a `new CordovaAppLoader()`
4. `check()` for updates
5. `download()` new files
6. `update()` to apply update

### Step 1: Write a manifest.json

Describe which files to download and which files to load during bootstrap.

```javascript
{
  "files": {  // these files are downloaded (only when "version" is different from current version!)
    "jquery": {
      "version": "afb90752e0a90c24b7f724faca86c5f3d15d1178",
      "filename": "lib/jquery.min.js"
    },
    "bluebird": {
      "version": "f37ff9832449594d1cefe98260cae9fdc13e0749",
      "filename": "lib/bluebird.js"
    },
    "CordovaPromiseFS": {
      "version": "635bd29385fe6664b1cf86dc16fb3d801aa9461a",
      "filename": "lib/CordovaPromiseFS.js"
    },
    "CordovaAppLoader": {
      "version": "76f1eecd3887e69d7b08c60be4f14f90069ca8b8",
      "filename": "lib/CordovaAppLoader.js"
    },
    "template": {
      "version": "3e70f2873de3d9c91e31271c1a59b32e8002ac23",
      "filename": "template.html"
    },
    "app": {
      "version": "8c99369a825644e68e21433d78ed8b396351cc7d",
      "filename": "app.js"
    },
    "style": {
      "version": "6e76f36f27bf29402a70c8adfee0f84b8a595973",
      "filename": "style.css"
    }
  },
  "load": [ // these files are loaded in your index.html
    "lib/jquery.min.js",
    "lib/bluebird.js",
    "lib/CordovaPromiseFS.js",
    "lib/CordovaAppLoader.js",
    "app.js",
    "style.css"
  ],
  "root":"./", // root location of files to be loaded. Defaults to current location: `./`
}
```

**Workflow tip:**
You can update your existing manifest like this:

```bash
node bin/update-manifest www www/manifest.json
node bin/update-manifest [root-directory] [manifest.json]
```

It will update the version of only changed files (with a hash of the content).

### Step 2: Add [bootstrap.js](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/www/bootstrap.js) to your [index.html](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/www/index.html)

Retrieves manifest.json and dynamically inserts JS/CSS to the current page.

```html
  <script type="text/javascript" timeout="5000" manifest="manifest.json" src="bootstrap.js"></script>
```

On the second run, the manifest.json is retrieved from localStorage.

If after `timeout` milliseconds `window.BOOTSTRAP_OK` is **not** true, the (corrupt?) manifest in localStorage is destroyed, and the page will reload. So make sure you set `window.BOOTSTRAP_OK = true` when your app has succesfully loaded!

**Tip:**

Bundle a manifest.json with your app. This way, your app will also launch when not connected to the internet. When your app is updated, it will write a new manifest.json to localStorage. If this update is corrupt, it can safely revert to the bundled manifest.json

### Step 3: Intialize CordovaAppLoader

```javascript
// When using NPM, require these first.
// Otherwise these are available as global variables.
var CordovaPromiseFS = require('cordova-promise-fs');
var CordovaAppLoader = require('cordova-app-loader');
var Promise = require('bluebird');

// Initialize a FileSystem
var fs = new CordovaPromiseFS({
  Promise: Promise
});

// Initialize a CordovaAppLoader
var loader = new CordovaAppLoader({
  fs: fs,
  serverRoot: 'http://data.madebymark.nl/cordova-app-loader/',
  localRoot: 'app',
  cacheBuster: true // make sure we're not downloading cached files.
  checkTimeout: 10000 // timeout for the "check" function - when you loose internet connection
});
```

### Step 4: Check for updates

```javascript
// download manifest from: serverRoot+'manifest.json'
loader.check().then(function(updateAvailable) { ... })  

// download from custom url
loader.check('http://yourserver.com/manifest.json').then( ... ) 

// or just check an actual Manifest object.
loader.check({ files: { ... } }).then( ... ) 
```

**Implementation Note:** Only file versions are compared! If you, for example, update `manifest.load` then the promise will return `false`!

### Step 5: Download update

```javascript
loader.download(onprogress)
   .then(function(manifest){ ... },function(failedDownloadUrlArray){ ... });
```

**Note:** When downloading, invalid files are deleted first. This invalidates the current manifest. Therefore, the current manifest is removed from localStorage. The app is reverted to "factory settings" (the manifest.json that comes bundled with the app).

### Step 6: Apply update (reload page to bootstrap new files)

This writes the new manifest to localStorage and reloads the page to bootstrap the updated app.

```javascript
// write manifest to localStorage and reload page:
loader.update() // returns `true` when update can be applied

// write manifest to localStorage, but DO NOT reload page:
loader.update(false)
```

**Implementation Note:** CordovaAppLoader changes the `manifest.root` to point to your file cache - otherwise the bootstrap script can't find the downloaded files!

## Design Decisions

I want CordovaAppLoader to be fast, responsive, reliable and safe. In order to do this, I've made the following decisions:

### Loading JS/CSS dynamically using bootstrap.js

First, I wanted to download 'index.html' to storage, then redirect the app to this new index.html.

This has a few problems:

* `cordova.js` and plugin javascript cannot be found. 
* It is hard to include `cordova.js` in the manifest because it is platform specific.
* It is hard to find all plugin javascript - it is buried in Cordova internals. 
* Reloading a page costs more time, CPU and memory because cordova plugins are reset.

Dynamically inserting CSS and JS allows you for almost the same freedom in updates, without all these problems.

### Fast, reliable and performant downloads:

* To save bandwidth and time, only files that have changed are downloaded.
* CordovaPromiseFS limits concurrency (3) to avoid trashing your app.
* CordovaFileCache will retry the download up to 3 times - each with an increasing timeout.
* When executing `loader.download()` for the second time, old downloads are aborted.
* "onprogress" event is called explicitly on every download. 

### Responsive app: Avoid never-resolving promises

`check` and `download` return a promise. These promises should always resolve - i.e. don't wait forever for a "deviceready" or for a "manifest.json" AJAX call to return.

I am assuming the following promises resolve or reject sometime:

* requestFileSystem
* CordovaPromiseFS methods:
    * fs.deviceready (Rejected after timeout of 5 seconds).
    * fs.file() (Relies on `fs.root.getFile`)
    * fs.dir() (Relies on `fs.root.getDirectory`)
    * fs.ensure() (Recursively relies on `getDirectory`)
    * fs.list() (Relies on fs.dir() and `dirReader.readEntries`)
    * fs.remove() (Relies on `fileEntry.remove`)
    * fs.download() (Implemented as a concurrency-limited queue, in which failed downloads can re-add themselves to the queue before rejecting the promise, this promise ultimately relies on Cordova's `filetransfer.download()` to resolve the promise)

* XHR-request to fetch manifest.json (Rejected after timeout)

As you see, most methods rely on the succes/error callbacks of native/Cordova methods.

Only for `deviceready` and the XHR-request I've added timeouts to ensure a timely response.

### Offline - when you loose connection.

When using `check`: The XHR will timeout.

When using `download`: I am assuming Cordova will invoke the error callback. The download has a few retry-attempts. If the connetion isn't restored before the last retry-attemt, the download will fail.

### Crashes

The only critical moment is during a download. Old files are removed while new files aren't fully downloaded yet. This makes the current manifest point to missing or corrupt files. Therefore, before downloading, the current manifest is destroyed. 

If the app crashes during a download, it will restart using the original manifest.

### Bugs in the update

* When `BOOTSTRAP_OK` is not set to `true` after a timeout, the app will destroy the current manifest and revert back to the original manifest.

### More to be considered?

Let me know if you find bugs. Report an issue!


## Changelog

### 0.5.0 (15/11/2014)

* Reject XHR-request when checking.

### 0.4.0 (13/11/2014)

* Changed manifest.json format.

### 0.3.0 (13/11/2014)

* Chrome support!

### 0.2.0 (09/11/2014)

* Improved app layout
* Added test-cases to the app (slow, broken app, broken download)
* Several bugfixes

### 0.1.0 (07/11/2014)

* First release

## Contribute

Convert CommonJS to a browser-version:
```bash
npm install webpack -g
npm run-script prepublish
```

Feel free to contribute to this project in any way. The easiest way to support this project is by giving it a star.

## Contact
-   @markmarijnissen
-   http://www.madebymark.nl
-   info@madebymark.nl

© 2014 - Mark Marijnissen