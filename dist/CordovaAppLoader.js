var CordovaAppLoader =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var CordovaFileCache = __webpack_require__(1);
	var CordovaPromiseFS = __webpack_require__(3);
	var Promise = null;

	var BUNDLE_ROOT = location.href.replace(location.hash,'');
	BUNDLE_ROOT = BUNDLE_ROOT.substr(0,BUNDLE_ROOT.lastIndexOf('/')+1);
	if(/ip(hone|ad|od)/i.test(navigator.userAgent)){
	  BUNDLE_ROOT = location.pathname.substr(location.pathname.indexOf('/www/'));
	  BUNDLE_ROOT = BUNDLE_ROOT.substr(0,BUNDLE_ROOT.lastIndexOf('/')+1);
	  BUNDLE_ROOT = 'cdvfile://localhost/bundle' + BUNDLE_ROOT;
	}

	function hash(files){
	  var keys = Object.keys(files);
	  keys.sort();
	  var str = '';
	  keys.forEach(function(key){
	    if(files[key] && files[key].version);
	      str += '@' + files[key].version;
	  });
	  return CordovaFileCache.hash(str) + '';
	}

	function AppLoader(options){
	  if(!options) throw new Error('CordovaAppLoader has no options!');
	  if(!options.fs) throw new Error('CordovaAppLoader has no "fs" option (cordova-promise-fs)');
	  if(!options.serverRoot) throw new Error('CordovaAppLoader has no "serverRoot" option.');
	  if(!window.pegasus || !window.Manifest) throw new Error('CordovaAppLoader bootstrap.js is missing.');
	  this.allowServerRootFromManifest = options.allowServerRootFromManifest === true;
	  Promise = options.fs.Promise;

	  // initialize variables
	  this.manifest = window.Manifest;
	  this.newManifest = null;
	  this.bundledManifest = null;
	  this.preventAutoUpdateLoop = options.preventAutoUpdateLoop === true;
	  this._lastUpdateFiles = localStorage.getItem('last_update_files');

	  // only prevent autoupdateloop if last update was less than 1 minute ago
	  var lastUpdateTime = 1.0 * localStorage.getItem('last_update_time');
	  if(Date.now() - this._lastUpdateTime > 60000){
	    this.preventAutoUpdateLoop = false;
	  }

	  // normalize serverRoot and set remote manifest url
	  options.serverRoot = options.serverRoot || '';
	  if(!!options.serverRoot && options.serverRoot[options.serverRoot.length-1] !== '/') options.serverRoot += '/';
	  this.newManifestUrl = options.manifestUrl || options.serverRoot + (options.manifest || 'manifest.json');

	  // initialize a file cache
	  if(options.mode) options.mode = 'mirror';
	  this.cache = new CordovaFileCache(options);

	  // private stuff
	  this.corruptNewManifest = false;
	  this._toBeCopied = [];
	  this._toBeDeleted = [];
	  this._toBeDownloaded = [];
	  this._updateReady = false;
	  this._checkTimeout = options.checkTimeout || 10000;
	}

	AppLoader.prototype._createFilemap = function(files){
	  var result = {};
	  var normalize = this.cache._fs.normalize;
	  Object.keys(files || []).forEach(function(key){
	    files[key].filename = normalize(files[key].filename);
	    result[files[key].filename] = files[key];
	  });
	  return result;
	};

	AppLoader.prototype.copyFromBundle = function(file){
	  var url = BUNDLE_ROOT + file;
	  return this.cache._fs.download(url,this.cache.localRoot + file);
	};

	AppLoader.prototype.getBundledManifest = function(){
	  var self = this;
	  var bootstrapScript = document.querySelector('script[manifest]');
	  var bundledManifestUrl = (bootstrapScript? bootstrapScript.getAttribute('manifest'): null) || 'manifest.json';

	  return new Promise(function(resolve,reject){
	    if(self.bundledManifest) {
	      resolve(self.bundledManifest);
	    } else {
	      pegasus(bundledManifestUrl).then(function(bundledManifest){
	        self.bundledManifest = bundledManifest;
	        resolve(bundledManifest);
	      },reject);
	      setTimeout(function(){reject(new Error('bundled manifest timeout'));},self._checkTimeout);
	    }
	  });
	};


	AppLoader.prototype.check = function(newManifest){
	  var self = this, manifest = this.manifest;
	  if(typeof newManifest === "string") {
	    self.newManifestUrl = newManifest;
	    newManifest = undefined;
	  }

	  var gotNewManifest = new Promise(function(resolve,reject){
	    if(typeof newManifest === "object") {
	      resolve(newManifest);
	    } else {
	      var url = self.cache._cacheBuster? self.newManifestUrl + '?' + Date.now(): self.newManifestUrl;
	      pegasus(url).then(resolve,reject);
	      setTimeout(function(){reject(new Error('new manifest timeout'));},self._checkTimeout);
	    }
	  });

	  return new Promise(function(resolve,reject){
	    Promise.all([gotNewManifest,self.getBundledManifest(),self.cache.list()])
	      .then(function(values){
	        var newManifest = values[0];
	        var bundledManifest = values[1];
	        var newFiles = hash(newManifest.files);

	        // Prevent end-less update loop, check if new manifest
	        // has been downloaded before (but failes)
	        
	        // Check if the newFiles match the previous files (last_update_files)
	        if(self.preventAutoUpdateLoop === true && newFiles === self._lastUpdateFiles) {
	          // YES! So we're doing the same update again!

	          // Check if our current Manifest has indeed the "last_update_files"
	          var currentFiles = hash(Manifest.files);
	          if(self._lastUpdateFiles !== currentFiles){
	            // No! So we've updated, yet they don't appear in our manifest. This means:
	            console.warn('New manifest available, but an earlier update attempt failed. Will not download.');
	            self.corruptNewManifest = true;
	            resolve(null);
	          }
	          // Yes, we've updated and we've succeeded.
	          resolve(false);
	          return;
	        }

	        // Check if new manifest is valid
	        if(!newManifest.files){
	          reject(new Error('Downloaded Manifest has no "files" attribute.'));
	          return;
	        }

	        // We're good to go check! Get all the files we need
	        var cachedFiles = values[2]; // files in cache
	        var oldFiles = self._createFilemap(manifest.files); // files in current manifest
	        var newFiles = self._createFilemap(newManifest.files); // files in new manifest
	        var bundledFiles = self._createFilemap(bundledManifest.files); // files in app bundle

	        // Create COPY and DOWNLOAD lists
	        self._toBeDownloaded = [];
	        self._toBeCopied = [];
	        self._toBeDeleted= [];
	        var isCordova = self.cache._fs.isCordova;
	        var changes = 0;
	        Object.keys(newFiles)
	          // Find files that have changed version or are missing
	          .filter(function(file){
	                    // if new file, or...
	            return !oldFiles[file] ||
	                    // version has changed, or...
	                    oldFiles[file].version !== newFiles[file].version ||
	                    // not in cache for some reason
	                    !self.cache.isCached(file);
	          })
	          // Add them to the correct list
	          .forEach(function(file){
	            // bundled version matches new version, so we can copy!
	            if(isCordova && bundledFiles[file] && bundledFiles[file].version === newFiles[file].version){
	              self._toBeCopied.push(file);
	            // othwerwise, we must download
	            } else {
	              self._toBeDownloaded.push(file);
	            }
	            if(!bundledFiles[file] || bundledFiles[file].version !== newFiles[file].version){
	              changes++;
	            }
	          });

	        // Delete files
	        self._toBeDeleted = cachedFiles
	          .map(function(file){
	            return file.substr(self.cache.localRoot.length);
	          })
	          .filter(function(file){
	                  // Everything that is not in new manifest, or....
	            return !newFiles[file] ||
	                  // Files that will be downloaded, or...
	                   self._toBeDownloaded.indexOf(file) >= 0 ||
	                  // Files that will be copied
	                   self._toBeCopied.indexOf(file) >= 0;
	          });


	        changes += self._toBeDeleted.length;
	        // Note: if we only need to copy files, we can keep serving from bundle!
	        // So no update is needed!
	        if(changes > 0){
	          // Save the new Manifest
	          self.newManifest = newManifest;
	          self.newManifest.root = self.cache.localUrl;
	          resolve(true);
	        } else {
	          resolve(false);
	        }
	      }, function(err){
	        reject(err);
	      }); // end of .then
	  }); // end of new Promise
	};

	AppLoader.prototype.canDownload = function(){
	  return !!this.newManifest && !this._updateReady;
	};

	AppLoader.prototype.canUpdate = function(){
	  return this._updateReady;
	};

	AppLoader.prototype.download = function(onprogress,includeFileProgressEvents){
	  var self = this;
	  if(!self.canDownload()) {
	    return new Promise(function(resolve){ resolve(null); });
	  }
	  // we will delete files, which will invalidate the current manifest...
	  localStorage.removeItem('manifest');
	  this.manifest.files = Manifest.files = {};
	  return self.cache.remove(self._toBeDeleted,true)
	    .then(function(){
	      return Promise.all(self._toBeCopied.map(function(file){
	        return self.cache._fs.download(BUNDLE_ROOT + file,self.cache.localRoot + file);
	      }));
	    })
	    .then(function(){
	      if(self.allowServerRootFromManifest && self.newManifest.serverRoot){
	        self.cache.serverRoot = self.newManifest.serverRoot;
	      }
	      self.cache.add(self._toBeDownloaded);
	      return self.cache.download(onprogress,includeFileProgressEvents);
	  }).then(function(){
	      self._toBeDeleted = [];
	      self._toBeDownloaded = [];
	      self._updateReady = true;
	      return self.newManifest;
	    });
	};

	AppLoader.prototype.update = function(reload){
	  if(this._updateReady) {
	    // update manifest
	    localStorage.setItem('manifest',JSON.stringify(this.newManifest));
	    // only attempt this once - set 'last_update_files'
	    localStorage.setItem('last_update_files',hash(this.newManifest.files));
	    localStorage.setItem('last_update_time',Date.now());
	    if(reload !== false) location.reload();
	    return true;
	  }
	  return false;
	};

	AppLoader.prototype.clear = function(){
	  localStorage.removeItem('last_update_files');
	  localStorage.removeItem('manifest');
	  return this.cache.clear();
	};

	AppLoader.prototype.reset = function(){
	  return this.clear().then(function(){
	    location.reload();
	  },function(){
	    location.reload();
	  });
	};

	module.exports = AppLoader;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var hash = __webpack_require__(2);
	var Promise = null;

	/* Cordova File Cache x */
	function FileCache(options){
	  var self = this;
	  // cordova-promise-fs
	  this._fs = options.fs;
	  if(!this._fs) { 
	    throw new Error('Missing required option "fs". Add an instance of cordova-promise-fs.');
	  }
	  // Use Promises from fs.
	  Promise = this._fs.Promise;

	  // 'mirror' mirrors files structure from "serverRoot" to "localRoot"
	  // 'hash' creates a 1-deep filestructure, where the filenames are hashed server urls (with extension)
	  this._mirrorMode = options.mode !== 'hash';
	  this._retry = options.retry || [500,1500,8000];
	  this._cacheBuster = !!options.cacheBuster;

	  // normalize path
	  this.localRoot = this._fs.normalize(options.localRoot || 'data');
	  this.serverRoot = this._fs.normalize(options.serverRoot || '');

	  // set internal variables
	  this._downloading = [];    // download promises
	  this._added = [];          // added files
	  this._cached = {};         // cached files

	  // list existing cache contents
	  this.ready = this._fs.ensure(this.localRoot)
	  .then(function(entry){
	    self.localInternalURL = entry.toInternalURL? entry.toInternalURL(): entry.toURL();
	    self.localUrl = entry.toURL();
	    return self.list();
	  });
	}

	FileCache.hash = hash;

	/**
	 * Helper to cache all 'internalURL' and 'URL' for quick synchronous access
	 * to the cached files.
	 */
	FileCache.prototype.list = function list(){
	  var self = this;
	  return new Promise(function(resolve,reject){
	    self._fs.list(self.localRoot,'rfe').then(function(entries){
	      self._cached = {};
	      entries = entries.map(function(entry){
	        var fullPath = self._fs.normalize(entry.fullPath);
	        self._cached[fullPath] = {
	          toInternalURL: entry.toInternalURL? entry.toInternalURL(): entry.toURL(),
	          toURL: entry.toURL(),
	        };
	        return fullPath;
	      });
	      resolve(entries);
	    },function(){
	      resolve([]);
	    });
	  });
	};

	FileCache.prototype.add = function add(urls){
	  if(!urls) urls = [];
	  if(typeof urls === 'string') urls = [urls];
	  var self = this;
	  urls.forEach(function(url){
	    url = self.toServerURL(url);
	    if(self._added.indexOf(url) === -1) {
	      self._added.push(url);
	    }
	  });
	  return self.isDirty();
	};

	FileCache.prototype.remove = function remove(urls,returnPromises){
	  if(!urls) urls = [];
	  var promises = [];
	  if(typeof urls === 'string') urls = [urls];
	  var self = this;
	  urls.forEach(function(url){
	    var index = self._added.indexOf(self.toServerURL(url));
	    if(index >= 0) self._added.splice(index,1);
	    var path = self.toPath(url);
	    promises.push(self._fs.remove(path));
	    delete self._cached[path];
	  });
	  return returnPromises? Promise.all(promises): self.isDirty();
	};

	FileCache.prototype.getDownloadQueue = function(){
	  var self = this;
	  var queue = self._added.filter(function(url){
	    return !self.isCached(url);
	  });
	  return queue;
	};

	FileCache.prototype.getAdded = function() {
	  return this._added;
	};

	FileCache.prototype.isDirty = function isDirty(){
	  return this.getDownloadQueue().length > 0;
	};

	FileCache.prototype.download = function download(onprogress,includeFileProgressEvents){
	  var fs = this._fs;
	  var self = this;
	  includeFileProgressEvents = includeFileProgressEvents || false;
	  self.abort();

	  return new Promise(function(resolve,reject){
	    // make sure cache directory exists and that
	    // we have retrieved the latest cache contents
	    // to avoid downloading files we already have!
	    fs.ensure(self.localRoot).then(function(){
	      return self.list();
	    }).then(function(){
	      // no dowloads needed, resolve
	      if(!self.isDirty()) {
	        resolve(self);
	        return;
	      }

	      // keep track of number of downloads!
	      var queue = self.getDownloadQueue();
	      var done = self._downloading.length;
	      var total = self._downloading.length + queue.length;
	      var percentage = 0;
	      var errors = [];

	      // download every file in the queue (which is the diff from _added with _cached)
	      queue.forEach(function(url){
	        var path = self.toPath(url);
	        // augment progress event with done/total stats
	        var onSingleDownloadProgress;
	        if(typeof onprogress === 'function') {
	          onSingleDownloadProgress = function(ev){
	            ev.queueIndex = done;
	            ev.queueSize = total;
	            ev.url = url;
	            ev.path = path;
	            ev.percentage = done / total;
	            if(ev.loaded > 0 && ev.total > 0 && done !== total){
	               ev.percentage += (ev.loaded / ev.total) / total;
	            }
	            ev.percentage = Math.max(percentage,ev.percentage);
	            percentage = ev.percentage;
	            onprogress(ev);
	          };
	        }

	        // callback
	        var onDone = function(){
	          done++;
						if(onSingleDownloadProgress) onSingleDownloadProgress(new ProgressEvent());

	          // when we're done
	          if(done === total) {
	            // reset downloads
	            self._downloading = [];
	            // check if we got everything
	            self.list().then(function(){
	              // final progress event!
	              if(onSingleDownloadProgress) onSingleDownloadProgress(new ProgressEvent());
	              // Yes, we're not dirty anymore!
	              if(!self.isDirty()) {
	                resolve(self);
	              // Aye, some files got left behind!
	              } else {
	                reject(errors);
	              }
	            },reject);
	          }
	        };
	        var onErr = function(err){
	          if(err && err.target && err.target.error) err = err.target.error;
	          errors.push(err);
	          onDone();
	        };

	        var downloadUrl = url;
	        if(self._cacheBuster) downloadUrl += "?"+Date.now();
	        var download = fs.download(downloadUrl,path,{retry:self._retry},includeFileProgressEvents? onSingleDownloadProgress: undefined);
	        download.then(onDone,onErr);
	        self._downloading.push(download);
	      });
	    },reject);
	  });
	};

	FileCache.prototype.abort = function abort(){
	  this._downloading.forEach(function(download){
	    download.abort();
	  });
	  this._downloading = [];
	};

	FileCache.prototype.isCached = function isCached(url){
	  url = this.toPath(url);
	  return !!this._cached[url];
	};

	FileCache.prototype.clear = function clear(){
	  var self = this;
	  this._cached = {};
	  return this._fs.removeDir(this.localRoot).then(function(){
	    return self._fs.ensure(self.localRoot);
	  });
	};

	/**
	 * Helpers to output to various formats
	 */
	FileCache.prototype.toInternalURL = function toInternalURL(url){
	  var path = this.toPath(url);
	  if(this._cached[path]) return this._cached[path].toInternalURL;
	  return url;
	};

	FileCache.prototype.get = function get(url){
	  var path = this.toPath(url);
	  if(this._cached[path]) return this._cached[path].toURL;
	  return this.toServerURL(url);
	};

	FileCache.prototype.toDataURL = function toDataURL(url){
	  return this._fs.toDataURL(this.toPath(url));
	};

	FileCache.prototype.toURL = function toURL(url){
	  var path = this.toPath(url);
	  return this._cached[path]? this._cached[path].toURL: url;
	};

	FileCache.prototype.toServerURL = function toServerURL(path){
	  var path = this._fs.normalize(path);
	  return path.indexOf('://') < 0? this.serverRoot + path: path;
	};

	/**
	 * Helper to transform remote URL to a local path (for cordova-promise-fs)
	 */
	FileCache.prototype.toPath = function toPath(url){
	  if(this._mirrorMode) {
	    var query = url.indexOf('?');
	    if(query > -1){
	      url = url.substr(0,query);
	    }
	    url = this._fs.normalize(url || '');
	    var len = this.serverRoot.length;
	    if(url.substr(0,len) !== this.serverRoot) {
	      return this.localRoot + url;
	    } else {
	      return this.localRoot + url.substr(len);
	    }
	  } else {
	    var ext = url.substr(url.lastIndexOf('.'));
	    if ((ext.indexOf("?") > 0) || (ext.indexOf("/") > 0)) {
	      ext = ".txt";
	    }
	    return this.localRoot + hash(url) + ext;
	  }
	};

	module.exports = FileCache;


/***/ },
/* 2 */
/***/ function(module, exports) {

	/**
	 * JS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
	 * 
	 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
	 * @see http://github.com/garycourt/murmurhash-js
	 * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
	 * @see http://sites.google.com/site/murmurhash/
	 * 
	 * @param {string} key ASCII only
	 * @param {number} seed Positive integer only
	 * @return {number} 32-bit positive integer hash 
	 */

	function murmurhash3_32_gc(key, seed) {
	  var remainder, bytes, h1, h1b, c1, c1b, c2, c2b, k1, i;
	  
	  remainder = key.length & 3; // key.length % 4
	  bytes = key.length - remainder;
	  h1 = seed;
	  c1 = 0xcc9e2d51;
	  c2 = 0x1b873593;
	  i = 0;
	  
	  while (i < bytes) {
	      k1 = 
	        ((key.charCodeAt(i) & 0xff)) |
	        ((key.charCodeAt(++i) & 0xff) << 8) |
	        ((key.charCodeAt(++i) & 0xff) << 16) |
	        ((key.charCodeAt(++i) & 0xff) << 24);
	    ++i;
	    
	    k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
	    k1 = (k1 << 15) | (k1 >>> 17);
	    k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

	    h1 ^= k1;
	        h1 = (h1 << 13) | (h1 >>> 19);
	    h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
	    h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
	  }
	  
	  k1 = 0;
	  
	  switch (remainder) {
	    case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
	    case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
	    case 1: k1 ^= (key.charCodeAt(i) & 0xff);
	    
	    k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
	    k1 = (k1 << 15) | (k1 >>> 17);
	    k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
	    h1 ^= k1;
	  }
	  
	  h1 ^= key.length;

	  h1 ^= h1 >>> 16;
	  h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
	  h1 ^= h1 >>> 13;
	  h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
	  h1 ^= h1 >>> 16;

	  return h1 >>> 0;
	}

	module.exports = murmurhash3_32_gc;

/***/ },
/* 3 */
/***/ function(module, exports) {

	/**
	 * Static Private functions
	 */

	/* createDir, recursively */
	function __createDir(rootDirEntry, folders, success,error) {
	  rootDirEntry.getDirectory(folders[0], {create: true}, function(dirEntry) {
	    // Recursively add the new subfolder (if we still have another to create).
	    if (folders.length > 1) {
	      __createDir(dirEntry, folders.slice(1),success,error);
	    } else {
	      success(dirEntry);
	    }
	  }, error);
	}

	function dirname(str) {
	  str = str.substr(0,str.lastIndexOf('/')+1);
	  if(str[0] === '/') str = str.substr(1);
	  return str;
	}

	function filename(str) {
	  return str.substr(str.lastIndexOf('/')+1);
	}

	function normalize(str){
	  str = str || '';
	  if(str[0] === '/') str = str.substr(1);

	  var tokens = str.split('/'), last = tokens[0];

	  // check tokens for instances of .. and .
	  for(var i=1;i < tokens.length;i++) {
	    last = tokens[i];
	    if (tokens[i] === '..') {
	      // remove the .. and the previous token
	      tokens.splice(i-1,2);
	      // rewind 'cursor' 2 tokens
	      i = i - 2;
	    } else if (tokens[i] === '.') {
	      // remove the .. and the previous token
	      tokens.splice(i,1);
	      // rewind 'cursor' 1 token
	      i--;
	    }
	  }

	  str = tokens.join('/');
	  if(str === './') {
	    str = '';
	  } else if(last && last.indexOf('.') < 0 && str[str.length - 1] != '/'){
	    str += '/';
	  }
	  return str;
	}

	var transferQueue = [], // queued fileTransfers
	    inprogress = 0;     // currently active filetransfers

	/**
	 * Factory function: Create a single instance (based on single FileSystem)
	 */
	module.exports = function(options){
	  /* Promise implementation */
	  var Promise = options.Promise || window.Promise;
	  if(!Promise) { throw new Error("No Promise library given in options.Promise"); }

	  /* default options */
	  options = options || {};
	  options.persistent = options.persistent !== undefined? options.persistent: true;
	  options.storageSize = options.storageSize || 20*1024*1024;
	  options.concurrency = options.concurrency || 3;
	  options.retry = options.retry || [];
	  options.debug = !!options.debug;

	  /* Cordova deviceready promise */
	  var deviceready, isCordova = typeof cordova !== 'undefined';
	  if(isCordova){
	    deviceready = new Promise(function(resolve,reject){
	      document.addEventListener("deviceready", resolve, false);
	      setTimeout(function(){ reject(new Error('deviceready has not fired after 5 seconds.')); },5100);
	    });
	  } else {
	    /* FileTransfer implementation for Chrome */
	    deviceready = ResolvedPromise(true);
	    if(typeof webkitRequestFileSystem !== 'undefined'){
	      window.requestFileSystem = webkitRequestFileSystem;
	      window.FileTransfer = function FileTransfer(){};
	      FileTransfer.prototype.download = function download(url,file,win,fail) {
	        var xhr = new XMLHttpRequest();
	        xhr.open('GET', url);
	        xhr.responseType = "blob";
	        xhr.onreadystatechange = function(onSuccess, onError, cb) {
	          if (xhr.readyState == 4) {
	            if(xhr.status === 200 && !this._aborted){
	              write(file,xhr.response).then(win,fail);
	            } else {
	              fail(xhr.status);
	            }
	          }
	        };
	        xhr.send();
	        return xhr;
	      };
	      FileTransfer.prototype.abort = function(){
	        this._aborted = true;
	      };
	      window.ProgressEvent = function ProgressEvent(){};
	      window.FileEntry = function FileEntry(){};
	    } else {
	      window.requestFileSystem = function(x,y,z,fail){
	        fail(new Error('requestFileSystem not supported!'));
	      };
	    }
	  }

	  /* Promise resolve helper */
	  function ResolvedPromise(value){
	    return new Promise(function(resolve){
	      return resolve(value);
	    });
	  }

	  /* the filesystem! */
	  var fs = new Promise(function(resolve,reject){
	    deviceready.then(function(){
	      var type = options.persistent? 1: 0;
	      if(options.fileSystem && isCordova){
	        type = options.fileSystem;
	      }
	      // On chrome, request quota to store persistent files
	      if (!isCordova && type === 1 && navigator.webkitPersistentStorage) {
	        navigator.webkitPersistentStorage.requestQuota(options.storageSize, function(grantedBytes) {
	          window.requestFileSystem(type, grantedBytes, resolve, reject);
	        }, reject);
	      } else {
	        // Exotic Cordova Directories (options.fileSystem = string)
	        if(isNaN(type)) {
	            window.resolveLocalFileSystemURL(type,function(directory){
	                resolve(directory.filesystem);
	            },reject);
	        // Normal browser usage
	        } else {
	            window.requestFileSystem(type, options.storageSize, resolve, reject);
	        }
	      }

	      setTimeout(function(){ reject(new Error('Could not retrieve FileSystem after 5 seconds.')); },5100);
	    },reject);
	  });

	  /* debug */
	  fs.then(function(fs){
	    CDV_URL_ROOT = fs.root.toURL();
	    CDV_INTERNAL_URL_ROOT = isCordova? fs.root.toInternalURL(): CDV_URL_ROOT;
	    window.__fs = fs;
	  },function(err){
	    console.error('Could not get Cordova FileSystem:',err);
	  });

	  /* ensure directory exists */
	  function ensure(folders) {
	    return new Promise(function(resolve,reject){
	      return fs.then(function(fs){
	          if(!folders) {
	            resolve(fs.root);
	          } else {
	            folders = folders.split('/').filter(function(folder) {
	              return folder && folder.length > 0 && folder !== '.' && folder !== '..';
	            });
	            __createDir(fs.root,folders,resolve,reject);
	          }
	        },reject);
	    });
	  }

	    /* get file file */
	  function file(path,options){
	    return new Promise(function(resolve,reject){
	      if(typeof path === 'object') {
	        return resolve(path);
	      }
	      path = normalize(path);
	      options = options || {};
	      return fs.then(function(fs){
	        fs.root.getFile(path,options,resolve,reject);
	      },reject);
	    });
	  }

	  /* get directory entry */
	  function dir(path,options){
	    path = normalize(path);
	    options = options || {};
	    return new Promise(function(resolve,reject){
	      return fs.then(function(fs){
	        if(!path || path === '/') {
	          resolve(fs.root);
	        } else {
	          fs.root.getDirectory(path,options,resolve,reject);
	        }
	      },reject);
	    });
	  }

	  /* list contents of a directory */
	  function list(path,mode) {
	    mode = mode || '';
	    var recursive = mode.indexOf('r') > -1;
	    var getAsEntries = mode.indexOf('e') > -1;
	    var onlyFiles = mode.indexOf('f') > -1;
	    var onlyDirs = mode.indexOf('d') > -1;
	    if(onlyFiles && onlyDirs) {
	      onlyFiles = false;
	      onlyDirs = false;
	    }

	    return new Promise(function(resolve,reject){
	      return dir(path).then(function(dirEntry){
	        var dirReader = dirEntry.createReader();
	        dirReader.readEntries(function(entries) {
	          var promises = [ResolvedPromise(entries)];
	          if(recursive) {
	            entries
	              .filter(function(entry){return entry.isDirectory; })
	              .forEach(function(entry){
	                promises.push(list(entry.fullPath,'re'));
	              });
	          }
	          Promise.all(promises).then(function(values){
	              var entries = [];
	              entries = entries.concat.apply(entries,values);
	              if(onlyFiles) entries = entries.filter(function(entry) { return entry.isFile; });
	              if(onlyDirs) entries = entries.filter(function(entry) { return entry.isDirectory; });
	              if(!getAsEntries) entries = entries.map(function(entry) { return entry.fullPath; });
	              resolve(entries);
	            },reject);
	        }, reject);
	      },reject);
	    });
	  }

	  /* does file exist? If so, resolve with fileEntry, if not, resolve with false. */
	  function exists(path){
	    return new Promise(function(resolve,reject){
	      file(path).then(
	        function(fileEntry){
	          resolve(fileEntry);
	        },
	        function(err){
	          if(err.code === 1) {
	            resolve(false);
	          } else {
	            reject(err);
	          }
	        }
	      );
	    });
	  }

	  /* does dir exist? If so, resolve with fileEntry, if not, resolve with false. */
	  function existsDir(path){
	    return new Promise(function(resolve,reject){
	      dir(path).then(
	        function(dirEntry){
	          resolve(dirEntry);
	        },
	        function(err){
	          if(err.code === 1) {
	            resolve(false);
	          } else {
	            reject(err);
	          }
	        }
	      );
	    });
	  }

	  function create(path){
	    return ensure(dirname(path)).then(function(){
	      return file(path,{create:true});
	    });
	  }

	  /* convert path to URL to be used in JS/CSS/HTML */
	  function toURL(path) {
	    return file(path).then(function(fileEntry) {
	      return fileEntry.toURL();
	    });
	  }

	  /* convert path to URL to be used in JS/CSS/HTML */
	  var toInternalURL,toInternalURLSync,toURLSync;
	  CDV_INTERNAL_URL_ROOT = 'cdvfile://localhost/'+(options.persistent? 'persistent/':'temporary/');
	  CDV_URL_ROOT = '';
	  if(isCordova) {
	    /* synchronous helper to get internal URL. */
	    toInternalURLSync = function(path){
	      path = normalize(path);
	      return path.indexOf('://') < 0? CDV_INTERNAL_URL_ROOT + path: path;
	    };
	    /* synchronous helper to get native URL. */
	    toURLSync = function(path){
	      path = normalize(path);
	      return path.indexOf('://') < 0? CDV_URL_ROOT + path: path;
	    };

	    toInternalURL = function(path) {
	      return file(path).then(function(fileEntry) {
	        return fileEntry.toInternalURL();
	      });
	    };
	  } else {
	    /* synchronous helper to get internal URL. */
	    toInternalURLSync = function(path){
	      path = normalize(path);
	      return 'filesystem:'+location.origin+(options.persistent? '/persistent/':'/temporary/') + path;
	    };

	    toInternalURL = function(path) {
	      return file(path).then(function(fileEntry) {
	        return fileEntry.toURL();
	      });
	    };
	    toURLSync = toInternalURLSync;
	  }

	  /* return contents of a file */
	  function read(path,method) {
	    method = method || 'readAsText';
	    return file(path).then(function(fileEntry) {
	      return new Promise(function(resolve,reject){
	        fileEntry.file(function(file){
	          var reader = new FileReader();
	          reader.onloadend = function(){
	            resolve(this.result);
	          };
	          reader[method](file);
	        },reject);
	      });
	    });
	  }

	  /* convert path to base64 date URI */
	  function toDataURL(path) {
	    return read(path,'readAsDataURL');
	  }


	  function readJSON(path){
	    return read(path).then(JSON.parse);
	  }

	  /* write contents to a file */
	  function write(path,blob,mimeType) {
	    return ensure(dirname(path))
	      .then(function() { return file(path,{create:true}); })
	      .then(function(fileEntry) {
	        return new Promise(function(resolve,reject){
	          fileEntry.createWriter(function(writer){
	            writer.onwriteend = resolve;
	            writer.onerror = reject;
	            if(typeof blob === 'string') {
	              blob = createBlob([blob], mimeType || 'text/plain');
	            } else if(blob instanceof Blob !== true){
	              blob = createBlob([JSON.stringify(blob,null,4)], mimeType || 'application/json');
	            }
	            writer.write(blob);
	          },reject);
	        });
	      });
	    }

	  function createBlob(parts, type) {
	    var BlobBuilder,
	        bb;
	    try {
	      return new Blob(parts, {type: type});
	    } catch(e) {
	      BlobBuilder = window.BlobBuilder ||
	        window.WebKitBlobBuilder ||
	        window.MozBlobBuilder ||
	        window.MSBlobBuilder;
	      if(BlobBuilder) {
	        bb = new BlobBuilder();
	        bb.append(parts);
	        return bb.getBlob(type);
	      } else {
	        throw new Error("Unable to create blob");
	      }
	    }
	  }

	  /* move a file */
	  function move(src,dest) {
	    return ensure(dirname(dest))
	      .then(function(dir) {
	        return file(src).then(function(fileEntry){
	          return new Promise(function(resolve,reject){
	            fileEntry.moveTo(dir,filename(dest),resolve,reject);
	          });
	        });
	      });
	  }

	  /* move a dir */
	  function moveDir(src,dest) {
	    src = src.replace(/\/$/, '');
	    dest = dest.replace(/\/$/, '');
	    return ensure(dirname(dest))
	      .then(function(destDir) {
	        return dir(src).then(function(dirEntry){
	          return new Promise(function(resolve,reject){
	            dirEntry.moveTo(destDir,filename(dest),resolve,reject);
	          });
	        });
	      });
	  }

	  /* copy a file */
	  function copy(src,dest) {
	    return ensure(dirname(dest))
	      .then(function(dir) {
	        return file(src).then(function(fileEntry){
	          return new Promise(function(resolve,reject){
	            fileEntry.copyTo(dir,filename(dest),resolve,reject);
	          });
	        });
	      });
	  }

	  /* delete a file */
	  function remove(path,mustExist) {
	    var method = mustExist? file:exists;
	    return new Promise(function(resolve,reject){
	        method(path).then(function(fileEntry){
	        if(fileEntry !== false) {
	          fileEntry.remove(resolve,reject);
	        } else {
	          resolve(1);
	        }
	      },reject);
	    }).then(function(val){
	      return val === 1? false: true;
	    });
	  }

	  /* delete a directory */
	  function removeDir(path) {
	    return dir(path).then(function(dirEntry){
	      return new Promise(function(resolve,reject) {
	        dirEntry.removeRecursively(resolve,reject);
	      });
	    });
	  }

	  // Whenever we want to start a transfer, we call popTransferQueue
	  function popTransferQueue(){
	    // while we are not at max concurrency
	    while(transferQueue.length > 0 && inprogress < options.concurrency){
	      // increment activity counter
	      inprogress++;

	      // fetch filetranfer, method-type (isDownload) and arguments
	      var args = transferQueue.pop();
		  var ft = args.fileTransfer,
		      isDownload = args.isDownload,
		      serverUrl = args.serverUrl,
		      localPath = args.localPath,
		      trustAllHosts = args.trustAllHosts,
		      transferOptions = args.transferOptions,
		      win = args.win,
		      fail = args.fail;

	      if(ft._aborted) {
	        inprogress--;
	      } else if(isDownload){
	        ft.download.call(ft,serverUrl,localPath,win,fail,trustAllHosts,transferOptions);
	        if(ft.onprogress) ft.onprogress(new ProgressEvent());
	      } else {
	        ft.upload.call(ft,localPath,serverUrl,win,fail,transferOptions,trustAllHosts);
	      }
	    }
	    // if we are at max concurrency, popTransferQueue() will be called whenever
	    // the transfer is ready and there is space avaialable.
	  }

	  // Promise callback to check if there are any more queued transfers
	  function nextTransfer(result){
	    inprogress--; // decrement counter to free up one space to start transfers again!
	    popTransferQueue(); // check if there are any queued transfers
	    return result;
	  }

	  function filetransfer(isDownload,serverUrl,localPath,transferOptions,onprogress){
	    if(typeof transferOptions === 'function') {
	      onprogress = transferOptions;
	      transferOptions = {};
	    }
	    if(isCordova && localPath.indexOf('://') < 0) localPath = toURLSync(localPath);

	    transferOptions = transferOptions || {};
	    if(!transferOptions.retry || !transferOptions.retry.length) {
	      transferOptions.retry = options.retry;
	    }
	    transferOptions.retry = transferOptions.retry.concat();
	    if(!transferOptions.file && !isDownload){
	      transferOptions.fileName = filename(localPath);
	    }

	    var ft = new FileTransfer();
	    onprogress = onprogress || transferOptions.onprogress;
	    if(typeof onprogress === 'function') ft.onprogress = onprogress;
	    var promise = new Promise(function(resolve,reject){
	      var attempt = function(err){
	        if(transferOptions.retry.length === 0) {
	          if(options.debug) console.log('FileTransfer Error: '+serverUrl,err);
	          reject(err);
	        } else {

	    		  var transferJob = {
	    		    fileTransfer:ft,
	    		    isDownload:isDownload,
	    		    serverUrl:serverUrl,
	    		    localPath:localPath,
	    		    trustAllHosts:transferOptions.trustAllHosts || false,
	    		    transferOptions:transferOptions,
	    		    win:resolve,
	    		    fail:attempt
	    		  };
	          transferQueue.unshift(transferJob);
	          var timeout = transferOptions.retry.shift();
	          if(timeout > 0) {
	            setTimeout(nextTransfer,timeout);
	          } else {
	            nextTransfer();
	          }
	        }
	      };
	      transferOptions.retry.unshift(0);
	      inprogress++;
	      attempt();
	    });
	    promise.then(nextTransfer,nextTransfer);
	    promise.progress = function(onprogress){
	      ft.onprogress = onprogress;
	      return promise;
	    };
	    promise.abort = function(){
	      ft._aborted = true;
	      ft.abort();
	      return promise;
	    };
	    return promise;
	  }

	  function download(url,dest,options,onprogress){
	    return filetransfer(true,url,dest,options,onprogress);
	  }

	  function upload(source,dest,options,onprogress){
	    return filetransfer(false,dest,source,options,onprogress);
	  }

	  return {
	    fs: fs,
	    normalize: normalize,
	    file: file,
	    filename: filename,
	    dir: dir,
	    dirname: dirname,
	    create:create,
	    read: read,
	    readJSON: readJSON,
	    write: write,
	    move: move,
	    moveDir: moveDir,
	    copy: copy,
	    remove: remove,
	    removeDir: removeDir,
	    list: list,
	    ensure: ensure,
	    exists: exists,
	    existsDir: existsDir,
	    download: download,
	    upload: upload,
	    toURL:toURL,
	    isCordova:isCordova,
	    toInternalURLSync: toInternalURLSync,
	    toInternalURL:toInternalURL,
	    toDataURL:toDataURL,
	    deviceready: deviceready,
	    options: options,
	    Promise: Promise
	  };
	};


/***/ }
/******/ ]);