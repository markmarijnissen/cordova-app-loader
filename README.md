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

Based on [cordova-promise-fs](https://github.com/markmarijnissen/cordova-promise-fs) and [cordova-file-cache](https://github.com/markmarijnissen/cordova-file-cache).

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

### Get javascript:

You can download the files (see "Quickstart" or "Usage") or use NPM or bower:

```bash
  bower install cordova-app-loader cordova-promise-fs bluebird
  npm install cordova-app-loader cordova-promise-fs bluebird
```

### Setup Cordova:

```bash
  cordova platform add ios@3.7.0
  cordova plugin add org.apache.cordova.file
  cordova plugin add org.apache.cordova.file-transfer
```

**IMPORTANT:** For iOS, use Cordova 3.7.0 or higher (due to a [bug](https://github.com/AppGyver/steroids/issues/534) that affects requestFileSystem).

## Quickstart: A simple example

Download [index.html](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/www/autoupdate.html) and [autoupdate.js](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/www/autoupdate.js).

1. Write a **manifest.json** (see "step 1" below)
2. Copy **index.html** and **autoupdate.js** to your `www` folder.
3. Launch your app.
4. Upload a new **manifest.json** (+ files) to your server.
5. Reopen your app to download and apply the update.

Make sure you set the correct options in `index.html`:
```html
<script 
    type="text/javascript" 
    server="http://data.madebymark.nl/cordova-app-loader/" 
    manifest="manifest.json" 
    src="autoupdate.js"></script>
```

**autoupdate.js** is a very simple usage of the `CordovaAppLoader` ([see code](https://github.com/markmarijnissen/cordova-app-loader/blob/master/autoupdate.js)). It includes all nessecary files (see "Usage") and implementes very simple update logic.

* Whenever you launch or resume the app,
* `check()` for a new manifest
* `download()` files in the background
* `update()` app (reloads page)

This approach is **not** recommended because:

* Downloading files in the background can slow down performance (sluggish UI).
* The update (reload) can interrupt an important user action.

## Usage

Download and include:

* [bootstrap.js](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/www/bootstrap.js) to launch your app.
* A [Promise](https://github.com/petkaantonov/bluebird) library.
* [CordovaPromiseFS.js](https://raw.githubusercontent.com/markmarijnissen/cordova-promise-fs/master/dist/CordovaPromiseFS.js) to handle the filesystem.
* [CordovaAppLoader.js](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/www/lib/CordovaAppLoader.js) to handle check/download/update logic.

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
var fs = new CordovaPromiseFS({});
var loader = window.loader = new CordovaAppLoader({
  fs: fs,
  serverRoot: 'http://data.madebymark.nl/cordova-app-loader/',
  localRoot: 'app',
  mode: 'mirror',   // use same directories and filenames as in manifest (instead of using a hash)
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