var CordovaFileCache = require('cordova-file-cache');
var Promise = null;

function createFilemap(files){
  var result = {};
  Object.keys(files).forEach(function(key){
    result[files[key].filename] = files[key];
  });
  return result;
}

function AppLoader(options){
  if(!options) throw new Error('CordovaAppLoader has no options!');
  if(!options.fs) throw new Error('CordovaAppLoader has no "fs" option (cordova-promise-fs)');
  if(!options.serverRoot) throw new Error('CordovaAppLoader has no "serverRoot" option.');
  if(!window.pegasus || !window.Manifest) throw new Error('CordovaAppLoader bootstrap.js is missing.');
  Promise = options.fs.Promise;
  
  // initialize variables 
  this.manifest = window.Manifest;
  this.newManifest = null;

  // normalize serverRoot and set remote manifest url
  options.serverRoot = options.serverRoot || '';
  if(!!options.serverRoot && options.serverRoot[options.serverRoot.length-1] !== '/') options.serverRoot += '/';
  this.newManifestUrl = options.serverRoot + (options.manifest || 'manifest.json');
 
  // initialize a file cache
  this.cache = new CordovaFileCache(options);

  // private stuff
  this._toBeDeleted = [];
  this._toBeDownloaded = [];
  this._updateReady = false;
}

AppLoader.prototype.check = function(newManifest){
  var self = this, manifest = this.manifest;

  return new Promise(function(resolve,reject){
    if(typeof newManifest === "string") {
      self.newManifestUrl = newManifest;
      newManifest = undefined;
    }

    function checkManifest(newManifest){
      // make sure cache is ready for the DIFF operations!
      self.cache.ready.then(function(){
        if(!newManifest.files){
          reject('Downloaded Manifest has no "files" attribute.');
          return;
        }
        
        var newFiles = createFilemap(newManifest.files);
        var oldFiles = createFilemap(manifest.files);

        // Create the diff
        self._toBeDownloaded = Object.keys(newFiles)
          .filter(function(file){
            return !oldFiles[file]
                   || oldFiles[file].version !== newFiles[file].version
                   || !self.cache.isCached(file);
          });
        
        self.cache.list().then(function(files){
          self._toBeDeleted = files
            .map(function(file){
              return file.substr(self.cache._localRoot.length);
            })
            .filter(function(file){
              return !newFiles[file];
            })
            .concat(self._toBeDownloaded);
            
          if(self._toBeDeleted.length > 0 || self._toBeDownloaded.length > 0){
            // Save the new Manifest
            self.newManifest = newManifest;
            self.newManifest.root = self.cache.toInternalURL('/') + (self.newManifest.root || '');
            resolve(true);
          } else {
            resolve(false);
          }
        },reject);
      },reject);
    }
    if(typeof newManifest === "object") {
      checkManifest(newManifest);
    } else {
      pegasus(self.newManifestUrl).then(checkManifest,reject);
    }
  });
};

AppLoader.prototype.canDownload = function(){
  return !!this.newManifest && !this._updateReady;
};

AppLoader.prototype.canUpdate = function(){
  return this._updateReady;
};

AppLoader.prototype.download = function(onprogress){
  var self = this;
  if(!self.canDownload()) {
    return Promise.resolve(null);
  }
  // we will delete files, which will invalidate the current manifest...
  localStorage.removeItem('manifest');
  this.manifest.files = Manifest.files = {};
  return self.cache.remove(self._toBeDeleted,true)
    .then(function(){
      self.cache.add(self._toBeDownloaded);
      return self.cache.download(onprogress);
    }).then(function(){
      self._toBeDeleted = [];
      self._toBeDownloaded = [];
      self._updateReady = true;
      return self.newManifest;
    },function(files){
      // on download error, remove files...
      if(!!files && files.length){
        self.cache.remove(files);
      }
      return files;
    });
};

AppLoader.prototype.update = function(reload){
  if(this._updateReady) {
    // update manifest
    localStorage.setItem('manifest',JSON.stringify(this.newManifest));
    if(reload !== false) location.reload();
    return true;
  }
  return false;
};

AppLoader.prototype.clear = function(){
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