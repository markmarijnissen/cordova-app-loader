cordova-app-loader
==========

[![Join the chat at https://gitter.im/markmarijnissen/cordova-app-loader](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/markmarijnissen/cordova-app-loader?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
> Remote update your Cordova App

1. Write a **manifest.json** to **bootstrap.js** your app.
2. Build and deploy your app.

A little later...

1. Upload an update to your server (**manifest.json** + files)
2. Use `CordovaAppLoader` to 
   1. `check()` for a new manifest
   2. `download()` files
   3. `update()` your app!


## Demo time!

Check out [Cordova App Loader](http://data.madebymark.nl/cordova-app-loader/index.html) in Chrome for a demo! (**Chrome only!**)

Or run on your own computer:

```bash
git clone git@github.com:markmarijnissen/cordova-app-loader.git
cd cordova-app-loader
cordova platform add ios@3.7.0
cordova plugin add cordova-plugin-file
cordova plugin add cordova-plugin-file-transfer
cordova run ios
```

All code is in the `www` directory. Modify `serverRoot` in `www/app.js` to run your own server.

## Quick Start

Check out [autoupdate.js](https://github.com/markmarijnissen/cordova-app-loader/blob/master/autoupdate.js) - it automatically updates when you open or resume the app.

Automatic updates have a few downsides:

* Downloading files in the background can slow down performance (sluggish UI).
* Automatically updating can interrupt the user.

### Step by step instructions:

1. Setup Cordova (see below)
1. Download to your `www` directory:
    * [index.html](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/www/autoupdate.html) (Cordova entry point)
    * [bootstrap.js](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/dist/bootstrap.js) (Dynamically loads JS/CSS)
    * [cordova-app-loader-complete.js](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/dist/cordova-app-loader-complete.js) (Complete CordovaAppLoader library with dependencies)
    * [autoupdate.js](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/dist/autoupdate.js) (Example implementation)
2. Write a **manifest.json** (see below). Include `autoupdate.js` and `cordova-app-loader-complete.js`.
3. Set the correct server in `index.html`:
    ```html
    <script 
        type="text/javascript" 
        server="http://data.madebymark.nl/cordova-app-loader/" 
        manifest="manifest.json" 
        src="bootstrap.js"></script>
    ```

4. Write `window.BOOTSTRAP_OK = true` in your code when your app succesfully launches.
5. Launch your app. 

Now you can remote update your app:

6. Upload a new **manifest.json** (+ files) to your server.
7. Reopen your app to download and apply the update.

## Installation

### Set up Cordova

```bash
  cordova platform add ios@3.7.0
  cordova plugin add org.apache.cordova.file
  cordova plugin add org.apache.cordova.file-transfer
  cordova plugin add cordova-plugin-whitelist
```

**IMPORTANT:** For iOS, use Cordova 3.7.0 or higher (due to a [bug](https://github.com/AppGyver/steroids/issues/534) that affects requestFileSystem).

For Android, the plugin `cordova-plugin-whitelist` is needed. You must also add the following to your `config.xml` file.

    <access origin="cdvfile://*" />
    <allow-intent href="cdvfile://*" />

### Download and include bootstrap.js

You need **bootstrap.js** ([github](https://github.com/markmarijnissen/cordova-app-loader/), [file](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/bootstrap.js)) to read the **manifest.json** to launch your app. 

Add **bootstrap.js** to your [index.html](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/www/index.html).

### Download and include CordovaAppLoader (and dependencies)

**Option 1: Download all dependencies as a single pre-build file (easy)**

Download cordova-app-loader-complete.js ([github](https://github.com/markmarijnissen/cordova-app-loader/blob/master/dist/cordova-app-loader-complete.js), [download](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/dist/cordova-app-loader-complete.js), [minified](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/dist/cordova-app-loader-complete.min.js)). This build uses promiscuous ([github](https://github.com/RubenVerborgh/promiscuous),[download](https://raw.githubusercontent.com/RubenVerborgh/promiscuous/master/promiscuous.js)) as Promise library.

**Option 2: Download pre-build files for every module (customizable)**

If you want to use your own Promise library, you have to load every module individually:

* **cordova-app-loader** ([github](https://github.com/markmarijnissen/cordova-app-loader/), [download](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/www/lib/CordovaAppLoader.js)) - checks, downloads and updates using **manifest.json**
* **cordova-promise-fs** ([github](https://github.com/markmarijnissen/cordova-promise-fs), [download](https://github.com/markmarijnissen/cordova-app-loader/blob/master/www/lib/CordovaPromiseFS.js)) - deals with the Cordova File API
* a **Promise** libary that follows the [Promise/A+ spec](https://promisesaplus.com/), such as bluebird ([github](https://github.com/petkaantonov/bluebird), [download](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/www/lib/bluebird.js)), promiscuous ([github](https://github.com/RubenVerborgh/promiscuous),[file](https://raw.githubusercontent.com/RubenVerborgh/promiscuous/master/promiscuous.js)) or [Angular's $q](https://docs.angularjs.org/api/ng/service/$q).

**Option 3: Use Bower to fetch pre-build modules:**

```bash
  bower install cordova-app-loader 
  bower install cordova-promise-fs 
  bower install bluebird # or another library that follows the Promise/A+ spec.
```

**Option 4: Use NPM to fetch CommonJS modules:**

```bash
  npm install cordova-app-loader 
  npm install cordova-promise-fs
  npm install bluebird  # or another library that follows the Promise/A+ spec.
```

## The manifest

Before you start, you need to write a **manifest.json** to describe:

* Which files to download, 
* Which JS/CSS to load during bootstrap. 

### Writing manifest.json

```javascript
{
  "files": {  // these files are downloaded 
    "cordova-app-loader-complete": {
      "version": "76f1eecd3887e69d7b08c60be4f14f90069ca8b8",
      "filename": "cordova-app-loader-complete.js"
    },
    "autoupdate": {
      "version": "76f1eecd3887e69d7b08c60be4f14f90069ca8b8",
      "filename": "autoupdate.js"
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
    "cordova-app-loader-complete.js",
    "autoupdate.js",
    "app.js",
    "style.css"
  ]
}
```

### Updating manifest.json
You can update your existing manifest like this:

```bash
node node_modules/cordova-app-loader/bin/update-manifest www www/manifest.json
node node_modules/cordova-app-loader/bin/update-manifest [root-directory] [manifest.json]
```

It will update the version of only changed files (with a hash of the content).

There is also [a Gruntfile](https://gist.github.com/arieljake/19447838b29a3e2da92b) available.

## Usage / API

### Overview

1. Bootstrap your app.
2. Instantiate a `new CordovaAppLoader()`
3. `check()` for updates
4. `download()` new files
5. `update()` to apply update

See [autoupdate.js](https://github.com/markmarijnissen/cordova-app-loader/blob/master/autoupdate.js) for an example of `check()`, `download()` and `update()`.

### Step 1: Bootstrap your app.

Add [bootstrap.js](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/www/bootstrap.js) to your [index.html](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/www/index.html). This retrieves **manifest.json** and dynamically inserts JS/CSS to the current page.

```html
  <script type="text/javascript" timeout="5000" manifest="manifest.json" src="bootstrap.js"></script>
```

On the second run, the manifest.json is retrieved from localStorage.

Set `window.BOOTSTRAP_OK` to `true` when your app has succesfully launched.

If your app is updated and `window.BOOTSTRAP_OK` is **not** true after `timeout` milliseconds, the corrupt manifest in localStorage is destroyed, and the page will reload. This will revert the app back to the original manifest.

You should always bundle a manifest.json (+ files) in your app to make sure your app has a "factory default" to revert back to. (And to make sure your app works offline).

### Step 2: Intialize CordovaAppLoader.

```javascript
// When using NPM, require these first.
// When using bower or when you downloaded the files these are already available as global variables.
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
  cacheBuster: true, // make sure we're not downloading cached files.
  checkTimeout: 10000 // timeout for the "check" function - when you loose internet connection
});
```

### Step 3: Check for updates

```javascript
// download manifest from: serverRoot+'manifest.json'
loader.check().then(function(updateAvailable) { ... })  

// download from custom url
loader.check('http://yourserver.com/manifest.json').then( ... ) 

// or just check an actual Manifest object.
loader.check({ files: { ... } }).then( ... ) 
```

**Implementation Note:** Only file versions are compared! If you, for example, update `manifest.load` then the promise will return `false`!

### Step 4: Download the updates

```javascript
loader.download(onprogress)
   .then(function(manifest){ ... },function(failedDownloadUrlArray){ ... });
```

**Note:** When downloading, invalid files are deleted first. This invalidates the current manifest. Therefore, the current manifest is removed from localStorage. The app is reverted to "factory settings" (the manifest.json that comes bundled with the app).

### Step 5: Apply updates (reload page to bootstrap new files)

This writes the new manifest to localStorage and reloads the page to bootstrap the updated app.

```javascript
// write manifest to localStorage and reload page:
loader.update() // returns `true` when update can be applied

// write manifest to localStorage, but DO NOT reload page:
loader.update(false)
```

**Implementation Note:** CordovaAppLoader changes the `manifest.root` to point to your file cache - otherwise the bootstrap script can't find the downloaded files!

## Testing

With the demo app, you can test:

* Check, with a new manfiest (resolve true)
* Check, with no new manifest (resolve false)
* Check, with no internet (reject timeout)
* Download (resolve with manifest)
* Download with no internet / while interrupting internet (resolve if withing retry attempts, reject with error otherwise)
* Download without checking (null)
* Update (true if update possible, false otherwise)
* Reset to factory
* Slow Download (progress bar)
* Broken Link (reject download with broken link)
* Broken App (resets back to factory)

There are also [unit tests](http://data.madebymark.nl/cordova-app-loader/test/) (*Chrome only!*).

It includes unit tests for [CordovaPromiseFS](https://github.com/markmarijnissen/cordova-promise-fs) and [CordovaFileCache](https://github.com/markmarijnissen/cordova-file-cache).

## Why "Cordova App Loader" is awesome!

I want CordovaAppLoader to be fast, responsive, flexible, reliable and safe. In order to do this, I've thought about everything that could destroy the app loader and fixed it.

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

### Avoid downloading if you can copy files

When updating, copy files that are already bundled with the app. (Of course, only if the file version has not changed)

### Responsive app: avoid never-resolving promises.

`check` and `download` return a promise. These promises should always resolve - i.e. don't wait forever for a "deviceready" or for a "manifest.json" AJAX call to return.

I am assuming the following promises resolve or reject:

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

### Offline - what happens when you lose connection

When using `check`: The XHR will timeout.

When using `download`: I am assuming Cordova will invoke the error callback. The download has a few retry-attempts. If the connetion isn't restored before the last retry-attemt, the download will fail.

### Crashes

The only critical moment is during a download. Old files are removed while new files aren't fully downloaded yet. This makes the current manifest point to missing or corrupt files. Therefore, before downloading, the current manifest is destroyed. 

If the app crashes during a download, it will restart using the original manifest.

### Bugs in the update

* When `BOOTSTRAP_OK` is not set to `true` after a timeout, the app will destroy the current manifest and revert back to the original manifest.

### Avoiding a never-ending update loop

If for some reason the downloaded files cannot be found in the cache on the next `check()`, CordovaAppLoader will indicate `true`, meaning there are still files to be downloaded.

This is correct and intended behavior, as we expect all files to be in the cache when `check()` returns false.

However, depending on how/when you call `check()`, this could result in a never-ending loop in which the app attempts to download files, but for some reason, the never end up in the cache.

To avoid this pitfall, the following safeguard is implemented:

* Whenever you call `update()`, the manifest is written to localStorage twice:
   * `manifest`
   * `update_attempt_manifest`

* When calling `check()`, it compares the new manifest with `update_attempt_manifest`. If they are the same, it means you've attempted this before, so `check()` will return false.


### Normalize paths everywhere

All filenames and paths are normalized. 

* This avoids problems on android (when a path starts with a `/`, Android throws a NullPointerExpception)
* The Manifest.json writer does not have to worry which path convention to use.
* This avoids errors when comparing cache with old manifest with new manifest.

See [CordovaPromiseFS](https://github.com/markmarijnissen/cordova-promise-fs) for more details.


### More to be considered?

Let me know if you find bugs. Report an issue!

## TODO for VERSION 1.0.0

* Write automated tests

## FAQ

#### What happens if update the App in the App Store?

The version on your **remote server** is the **single source of truth**.

Here is a flow chart:

* Did the app detect an **earlier update the remote server**?

    * Yes - Your App downloaded the update and is now running from the FileCache.
          * Did the app detect the **remote update** before the **app store update**?
               * Yes - Your app will download files from remote - the app store update will only act as fallback.
               * No - Your app will run the outdated version until it detects the **remote update**. When updating, it will copy files from bundle (instead of downloading from remote).

    * No - Your App never detected an update and is uses the bundled files.
          * Did the app detect the **remote update** before the **app store update**?
               * Yes - Your app will download files from remote - the app store update will only act as fallback.
               * No - Your app will use the bundled files, as they are up to date with the remote.


## Changelog

### 1.2.0 (12/05/2016)

* Fix issue #99 (cache busting for manifest.json)
* Fix issue #98 (silent error on iOS for _createFilemap when Manifest has no Files attribute)
* Improve Auto Update Loop prevention: 
    * If downloads get interrupted or fails, it will try again. (However, if a download is interrupted, it will launch the bundled app on next launch, not the latest app. See issue #21)
    * If there is more than 1 minute between updates, it will try again.
    * So, in effect, only when the exact same update is attempted within 1 minute, autoupdate loop prevention will kick in. This will include cases where BOOTSTRAP_OK is false, and exclude cases where the download was interrupted or failed.

### 1.1.0 (05/05/2016)

* Fix issues #53 -- apploader.download() will return error when download failes

### 1.0.0 (23/01/2016)

* Version bump for Cordova File Cache + Cordova Promise FS
* Defaults to no progress events for file transfer (performance boost!)
* Fix toInternalURL Sync for different fileSystems.
* Minor bugfixes

### 0.18.0 (23/01/2016)

* Version bump for Cordova File Cache + Pull Requests

### 0.17.0 (20/03/2015)

* Fix: Another fix for update detection bug. (issue #18)

### 0.16.0 (17/03/2015)

* Fix: Endless Update detection bug. (issue #18)

### 0.15.0 (17/03/2015)

* Fix: Missing reject (issue #26) -- thanks very much @pheinicke!
* Fix: Promise.resolve is not in A+ spec. (issue #23).
* Updated cordova-file-cache dependency.
* Fix: Improved Cordova detection (wait for deviceready) in **bootstrap.js** (issue #17)

### 0.14.0 (22/1/2014)

* Fix: Copy files from bundle does not work if your app is not directly in `/www/`. For example when your entry point is `/www/app/index.html`.

### 0.13.0 (9/1/2014)

* Fix [issue 15](https://github.com/markmarijnissen/cordova-app-loader/issues/15): Copied files contain index.html on Android when location.href contains `#/` while updating.

### 0.12.0 (21/12/2014)

* Simplified copy implementation a lot.
* Bugfix: Copy files from bundle on Android
* Bugfix: Update dependencies

### 0.11.0 (21/12/2014)

* You can now set `serverRoot` from Manifest.json (only if you set `allowServerRootFromManifest` to `true`).
* AppLoader will copy files from bundle when possible.

### 0.10.0 (02/12/2014)

* Improved loading time of scripts in bootstrap.js (parallel download instead of one-by-one). Thanks [lylepratt](https://github.com/lylepratt)!

### 0.9.0 (02/12/2014)

* Added cache-buster to bootstrap.js (browser cache...)
* Improved Safe-guard for checking corrupt manifests

### 0.8.0 (28/11/2014)

* Normalized all paths.
* Updated dependencies.
* Added Safe-guard for never-ending update loop.

### 0.7.0 (27/11/2014)

* Fixed a nasty path issue (remove prepending / when getting files to delete to match convention of file-cache - otherwise check will always return true!)
* Added initial [QUnit tests](http://data.madebymark.nl/cordova-app-loader/test/).
* Updated dependencies.

### 0.6.1 (19/11/2014)

* Updated file-cache dependency for android bugfix

### 0.6.0 (19/11/2014)

* Created a `dist` folder to for all build files
* Fixed a few errors
* Updated readme
* Changed the autoupdate.js implementation (it doesn't include bootstrap.js anymore)

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
