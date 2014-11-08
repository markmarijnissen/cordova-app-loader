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
    if(self.newManifest && !newManifest) {
      console.warn('CordovaAppLoader: Already checked for new manifest.');
      resolve(self.newManifest);
      return;
    }
    if(typeof newManifest === "string") {
      self.newManifestUrl = newManifest;
      newManifest = undefined;
    }

    function checkManifest(newManifest){
      // make sure cache is ready for the DIFF operations!
      self.cache.ready.then(function(){
        if(!newManifest.files){
          reject('Downloaded Manifest is has no "files" attribute.');
          return;
        }
        // Save the new Manifest
        self.newManifest = newManifest;
        self.newManifest.root = self.cache.toInternalURL('/') + (self.newManifest.root || '');

        // Create the diff
        self._toBeDownloaded = Object.keys(newManifest.files)
          .filter(function(file){
            return !manifest.files[file]
                   || manifest.files[file].version !== newManifest.files[file].version
                   || !self.cache.isCached(file);
          });
        
        self._toBeDeleted = Object.keys(manifest.files)
          .filter(function(file){
            return !newManifest.files[file] && self.cache.isCached(file);
          })
          .concat(self._toBeDownloaded);

        resolve(self.canDownload() || self.canUpdate());
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
  return this._toBeDeleted.length > 0 || this.cache.isDirty();
};

AppLoader.prototype.canUpdate = function(){
  return this._updateReady;
};

AppLoader.prototype.download = function(onprogress){
  var self = this;
  return self.cache.remove(self._toBeDeleted,true)
    .then(function(){
      self.cache.add(self._toBeDownloaded);
      return self.cache.download(onprogress);
    }).then(function(){
      self._toBeDeleted = [];
      // We deleted stuff, so we MUST load new manifest on next load!
      localStorage.setItem('manifest',JSON.stringify(self.newManifest));
      self._updateReady = true;
      return self;
    });
};

AppLoader.prototype.update = function(){
  if(this._updateReady) {
    // update manifest
    localStorage.setItem('manifest',JSON.stringify(this.newManifest));
    location.reload();
    return true;
  }
  return false;
};

module.exports = AppLoader;