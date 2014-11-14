cordova-app-loader
==========
> Remote update your Cordova App

1. Write a `manifest.json` to describe which files your app uses.
2. Build and deploy your Cordova App.
3. Update your app. Upload the new `manifest.json` together with the files to a server.
4. `CordovaAppLoader` will check this `manifest.json`, download new files, and relaunch!

Based on [cordova-promise-fs](https://github.com/markmarijnissen/cordova-promise-fs) and [cordova-file-cache](https://github.com/markmarijnissen/cordova-file-cache).

## Installation

### Get javascript

Download and include [CordovaPromiseFS.js](https://raw.githubusercontent.com/markmarijnissen/cordova-promise-fs/master/dist/CordovaPromiseFS.js) and [CordovaAppLoader.js](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/www/lib/CordovaAppLoader.js)

With `npm` or `bower`:

```bash
  bower install cordova-app-loader cordova-promise-fs
  npm install cordova-app-loader cordova-promise-fs
```

### Setup Cordova

```bash
  cordova platform add ios@3.7.0
  cordova plugin add org.apache.cordova.file
  cordova plugin add org.apache.cordova.file-transfer
```

**IMPORTANT:** For iOS, use Cordova 3.7.0 or higher (due to a [bug](https://github.com/AppGyver/steroids/issues/534) that affects requestFileSystem).

## Demo Time!

Check out [Cordova App Loader](http://data.madebymark.nl/cordova-app-loader/index.html) in Chrome for a demo! (**Chrome only!**)

```bash
git clone git@github.com:markmarijnissen/cordova-app-loader.git
cd cordova-app-loader
cordova platform add ios@3.7.0
cordova plugin add org.apache.cordova.file
cordova plugin add org.apache.cordova.file-transfer
cordova run ios
```

**Note:** Want to run your own server? Modify `serverRoot` in `www/test/test.js`!

## Usage

### Overview

1. Write `manifest.json` to describe your app files
2. Add `bootstrap.js` script to your `index.html` to dynamically load JS and CSS.
3. Instantiate a `CordovaAppLoader`
4. Check for updates: Download a new `manifest.json`
5. Download (only files that have changed!)
6. Apply update: Store the new manifest and reload page to bootstrap the updated app!

### Step 1: Write a `manifest.json`

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
bin/update-manifest www www/manifest.json
```

It will update file versions (by hashing the content, so only changed files will update).

* `www` is the root directory for the files
* `www/manifest.json` is the manifest to be updated.


### Step 2: Add [bootstrap.js](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/www/bootstrap.js) to your [index.html](https://raw.githubusercontent.com/markmarijnissen/cordova-app-loader/master/www/index.html)

```html
  <script type="text/javascript" timeout="5000" manifest="manifest.json" src="bootstrap.js"></script>
```

* On the first run, the bootstrap script retrieves `manifest.json` and starts loading JS/CSS in `manifest.load`.
* The `manifest.json` is stored in localStorage for the second run.
* If after `timeout` milliseconds `window.BOOTSTRAP_OK` is **not** true, the (corrupt?) manifest in localStorage is destroyed, and the page will reload.

Make sure you set `window.BOOTSTRAP_OK = true` when your app has succesfully loaded!

**Tips:**

* Bundle a `manifest.json` with your app. This way, your app will also launch when not connected to the internet.
* When your app is updated, it will write a new `manifest.json` to localStorage. If this update is corrupt, it can safely revert to the bundled `manifest.json`

### Step 3: Intialize CordovaAppLoader

```javascript
var fs = new CordovaPromiseFS({});
var loader = window.loader = new CordovaAppLoader({
  fs: fs,
  serverRoot: 'http://data.madebymark.nl/cordova-app-loader/',
  localRoot: 'app',
  mode: 'mirror',
  cacheBuster: true // make sure we're not downloading cached files.
});
```

### Step 4: Check for updates

```javascript
// download manifest from: serverRoot+'manifest.json'
loader.check().then( ... )  

// download from custom url
loader.check('http://yourserver.com/manifest.json').then( ... ) 

// or just check an actual Manifest object.
loader.check({ files: { ... } }).then( ... ) 
```

**Note:** Check returns `true` or `false` when a new version is available. **Only file versions are compared ** - if you change other data (like `manifest.load`) then `manifest.check()` will return `false`!

### Step 5: Download update

```javascript
loader.download(onprogress).then(function(manifest){ ... },function(failedDownloadUrlArray){ ... });
```

**Note:** When downloading, invalid files are deleted first. This invalidates the current manifest. Therefore, the current manifest is removed from localStorage! The app is reverted to "factory settings" (the `manifest.json` that comes bundled with the app).

### Step 6: Apply update (reload page to bootstrap new files)

When download is a success, the new manifest can be written to localStorage. 
When the page is reloaded, it will load the app update.

```javascript
// write manifest to localStorage and reload page:
loader.update() // returns `true` when update can be applied

// write manifest to localStorage, but DO NOT reload page:
loader.update(false)
```

**Note:** CordovaAppLoader changes the `manifest.root` to point to the file cache - otherwise the bootstrap script can't find the downloaded files!

## Changelog

### 0.4.0 (13/11/2014)

* Changed `manifest.json` format.

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