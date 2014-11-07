cordova-file-cache
==========
> Super Awesome File Cache for Cordova Apps


## Getting started

```bash
  # fetch code using bower
  bower install cordova-file-cache cordova-promise-fs
  # ...or npm...
  npm install cordova-file-cache cordova-promise-fs
  # or just download and include the javascript
  curl https://raw.githubusercontent.com/markmarijnissen/cordova-promise-fs/master/CordovaPromiseFS.js
  curl https://raw.githubusercontent.com/markmarijnissen/cordova-file-cache/master/CordovaFileCache.js

  # install Cordova plugins
  cordova plugin add org.apache.cordova.file
  cordova plugin add org.apache.cordova.file-transfer # optional
```

## Usage

### Initialize & configuration
```javascript
// Initialize a Cache
var cache = CordovaFileCache({
  fs: CordovaPromiseFS(),
  mode: 'hash', // or 'mirror'
  localRoot: 'data',
  serverRoot: 'http://yourserver.com/files/' // optional, required on 'mirror' mode
});

cache.ready.then(function(list){
    // Promise when cache is ready.
    // Returns a list of paths on the FileSystem that are cached.
}) 
```

* **mode: "mirror"**: Mirrors the file structure from `serverRoot` at `localRoot`.
* **mode: "hash"**: Filename is hash of server url (plus extension).
* **CordovaPromiseFS()** is an instance of [cordova-promise-fs](https://github.com/markmarijnissen/cordova-promise-fs).

### Add files to the cache
```javascript

// First, add files
cache.add('http://yourserver.com/folder/photo1.jpg')
cache.add('folder/photo2.jpg')  // automatically prepends the `severRoot`
cache.add(['photo3.jpg','photo4.jpg'])

// Now the cache is dirty: It needs to download.
cache.isDirty() === true
// cache.add also returns if the cache is dirty.
var dirty = cache.add(['photo3.jpg']) 

// Download files. 
cache.download(onprogress).then(function(cache){ ... },function(failedDownloads) { ... }) 
// It is recommended to avoid heavy UI and animation while downloading.
// The optional 'onprogress' event handler is enhanced with information
// about the total download queue:
onprogress = function(ProgressEvent) {
  ProgressEvent.index // current download index
  ProgressEvent.total // total files to download
}
```

### Use the cache
```javascript
// Get the cached internalURL of the file: "cdvfile://localhost/persisent/cache/photo3.jpg" 
cache.get('photo3.jpg');           
cache.toInternalURL('photo3.jpg'); 
cache.toInternalURL('http://yourserver.com/photo3.jpg'); 

// Get the file URL of the file: "file://.../photo3.jpg";
cache.toURL('photo3.jpg');

// When file is not cached, the original input is returned as a fallback.
cache.get('http://yoursever.com/never-cached-this.jpg') === 'http://yoursever.com/never-cached-this.jpg'

// Get Base64 encoded data URL.
cache.toDataURL('photo3.jpg').then(function(base64){},function(err){});
```

### Other functions
```javascript
// Abort all downloads
cache.abort()

// Clear cache (removes localRoot directory)
cache.clear().then( ... )

// Or remove a single file
cache.remove('photo3.jpg').then( ... )

// Returns path on Cordova Filesystem, i.e. "/cache/photo3.jpg"
cache.toPath('photo3.jpg');      

// Returns server URL to download, i.e. "http://yourserver.com/photo3.jpg";
cache.toServerURL('photo3.jpg'); 

// Needs a download?
cache.isDirty(); 

// Returns a list of server URLs that need to be downloaded.
cache.getDownloadQueue();        

 // Return a list of paths that are cached (i.e. ["/cache/photo3.jpg"])
cache.list().then(function(list){...},function(err){...}) 

```

## Changelog

### 0.1.0 (06/11/2014)

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