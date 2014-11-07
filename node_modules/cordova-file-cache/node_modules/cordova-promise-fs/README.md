cordova-promise-fs
==========
> Wraps the Cordova File API in convenient functions (that return a Promise)

Are you entangled in a async callback mess to get even the simplest task done? Wait no longer -- here is **cordova-promise-fs**!

## Getting started

```bash
  # fetch code using bower
  bower install cordova-promise-fs
  # ...or npm...
  npm install cordova-promise-fs
  # or just download and include the javascript
  curl https://raw.githubusercontent.com/markmarijnissen/cordova-file-cache/master/CordovaFileCache.js

  # install Cordova plugins
  cordova plugin add org.apache.cordova.file
  cordova plugin add org.apache.cordova.file-transfer # optional
```

## Usage

### Initialize & configuration
```javascript
var fs = CordovaPromiseFS({
  persistent: true, // or false
  storageSize: 20*1024*1024, // storage size in bytes, default 20MB 
  concurrency: 3 // how many concurrent uploads/downloads?
  Promise: require('promiscuous') // Your favorite Promise/A+ library! 
});
```

**Note on concurrency:** Concurrent uploads/downloads completely trash your mobile application. That's why I've put a concurrency limit on the number of downloads/uploads. Meteor sets this number on 30. In my experimental testing, I found 3 much more reasonable.

### Browsing files
```javascript
fs.exists(filename)       // checks if file exists. returns fileEntry or false.
fs.file(filename)         // returns a fileEntry
fs.dir(path)              // returns a dirEntry
fs.list(path,optionString)// return array with filenames (including path)

optionString = 'r'        // recursive list
optionString = 'd'        // only list directories
optionString = 'f'        // only list files
optionString = 'e'        // return results as FileEntry/DirectoryEntry (instead as path-string)
optionString = 'rfe'      // mix options! return entries of all files, recursively
```

### Reading files
```javascript
fs.read(filename)         // returns text-content of a file
fs.readJSON(filename)     // returns JSON-parsed contents of a file
fs.toUrl(filename)        // returns URL to be used in js/html/css (file://....)
fs.toInternalURL(filename)// returns cordova internal URL (cdvfile://....)
fs.toDataURL(filename)    // returns Base64 encoded Data URI
```

### Writing files
```javascript
fs.write(filename,data)   // writes a Blob, a String, or data (as JSON). Ensures directory exists.
```

### File operations
```javascript
fs.create(filename)       // creates a file
fs.ensure(path)           // ensures directory exists
fs.move(src,dest)         // move from src to dist. Ensures dest directory exists.
fs.copy(src,dest)         // copy from src to dist. Ensures dest directory exists.
fs.remove(src)            // removes file. Resolves even if file was already removed.
fs.remove(src,true)       // removes file. Rejects when file does not exist.
fs.removeDir(path)
```

### Upload and download
```javascript
var promise = fs.upload(source,destination,[options],[onprogress]);
var promise = fs.upload(source,destination,[onprogress]);
var promise = fs.download(source,destination,[options],[onprogress]);
var promise = fs.download(source,destination,[onprogress]);

// upload/download augments the promise with two extra functions:
promise.progress(function(progressEvent){...})
promise.abort();

// Gotcha: progress and abort() are unchainable; 
fs.upload(...).then(...)  // won't return the augmented promise, just an ordinary one!
```

### Utilities
```javascript
fs.fs // returns promise for the FileSystem
fs.filename(path) // converts path to filename (last part after /)
fs.dirname(path) // converts path dirname (everything except part after last /)
```

## Changelog

### 0.4.0 (06/11/2014)

* Various small changes
* Added `CordovaPromiseFS.js` for everybody who does not use Browserify/Webpack

### 0.3.0 (05/11/2014)

* Added `list` options (list `r`ecursively, only `f`iles, only `d`irectories, return result as `e`ntries)

### 0.2.0 (05/11/2014)

* Added `upload` and `download` methods with concurrency limit

## Contribute

Convert CommonJS to a browser-version:
```bash
npm install gluejs -g
npm run-script prepublish
```

Feel free to contribute to this project in any way. The easiest way to support this project is by giving it a star.

## Contact
-   @markmarijnissen
-   http://www.madebymark.nl
-   info@madebymark.nl

© 2014 - Mark Marijnissen