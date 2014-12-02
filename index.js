var CordovaFileCache = require('cordova-file-cache');
var Promise = null;

function AppLoader(options){
  if(!options) throw new Error('CordovaAppLoader has no options!');
  if(!options.fs) throw new Error('CordovaAppLoader has no "fs" option (cordova-promise-fs)');
  if(!options.serverRoot) throw new Error('CordovaAppLoader has no "serverRoot" option.');
  if(!window.pegasus || !window.Manifest) throw new Error('CordovaAppLoader bootstrap.js is missing.');
  Promise = options.fs.Promise;

  // initialize variables
  this.manifest = window.Manifest;
  this.newManifest = null;
  this._lastUpdateFiles = localStorage.getItem('last_update_files');

  // normalize serverRoot and set remote manifest url
  options.serverRoot = options.serverRoot || '';
  if(!!options.serverRoot && options.serverRoot[options.serverRoot.length-1] !== '/') options.serverRoot += '/';
  this.newManifestUrl = options.serverRoot + (options.manifest || 'manifest.json');

  // initialize a file cache
  if(options.mode) options.mode = 'mirror';
  this.cache = new CordovaFileCache(options);

  // private stuff
  this.corruptNewManifest = false;
  this._toBeDeleted = [];
  this._toBeDownloaded = [];
  this._updateReady = false;
  this._checkTimeout = options.checkTimeout || 10000;
}

AppLoader.prototype._createFilemap = function(files){
  var result = {};
  var normalize = this.cache._fs.normalize;
  Object.keys(files).forEach(function(key){
    files[key].filename = normalize(files[key].filename);
    result[files[key].filename] = files[key];
  });
  return result;
};

AppLoader.prototype.check = function(newManifest){
  var self = this, manifest = this.manifest;

  return new Promise(function(resolve,reject){
    if(typeof newManifest === "string") {
      self.newManifestUrl = newManifest;
      newManifest = undefined;
    }

    function checkManifest(newManifest){
      if(JSON.stringify(newManifest.files) === self._lastUpdateFiles) {
        if(JSON.stringify(newManifest.files) !== JSON.stringify(Manifest.files)){
          console.warn('New manifest available, but an earlier update attempt failed. Will not download.');
          self.corruptNewManifest = true;
          resolve(null);
        }
        resolve(false);
        return;
      }

      // make sure cache is ready for the DIFF operations!
      self.cache.ready.then(function(list){
        if(!newManifest.files){
          reject('Downloaded Manifest has no "files" attribute.');
          return;
        }

        var newFiles = self._createFilemap(newManifest.files);
        var oldFiles = self._createFilemap(manifest.files);

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
              return file.substr(self.cache.localRoot.length);
            })
            .filter(function(file){
              return !newFiles[file];
            })
            .concat(self._toBeDownloaded);

          if(self._toBeDeleted.length > 0 || self._toBeDownloaded.length > 0){
            // Save the new Manifest
            self.newManifest = newManifest;
            self.newManifest.root = self.cache.localInternalURL;
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
      setTimeout(function(){reject(new Error('timeout'));},self._checkTimeout);
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
  // only attempt this once - set 'last_update_files'
  localStorage.setItem('last_update_files',JSON.stringify(this.newManifest.files));
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