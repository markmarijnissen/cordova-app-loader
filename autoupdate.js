// Include the bootstrap script.
require('./bootstrap.js');
var CordovaAppLoader = require('./index');
var CordovaPromiseFS = require('cordova-promise-fs');
var Promise = require('promiscuous');
window.setImmediate = window.setTimeout;

// Helper variable: Chrome should use temporary storage.
var isCordova = typeof cordova !== 'undefined',
    fs,
    loader,
    script,
    serverUrl;

// Get SERVER_URL from script tag.
script = document.querySelector('script[manifest]');
if(script){
  serverUrl= script.getAttribute('server');
  if(!serverUrl) {
    throw new Error('Add a "server" attribute to the autoupdate.js script!');
  }
}

// Initialize filesystem and loader
fs = new CordovaPromiseFS({
  persistent: isCordova,
  Promise: Promise
});

loader = new CordovaAppLoader({
  fs: fs,
  localRoot: 'app',
  serverRoot: serverUrl,
  mode: 'mirror',
  cacheBuster: true
});

// Check > Download > Update
function check(){
  loader.check()
  .then(function(){
    return loader.download();
  })
  .then(function(){
    return loader.update();
  },function(err){
    console.error('Auto-update error:',err);
  });
}

// Couple events:

// On launch
check();

// Cordova: On resume
fs.deviceready.then(function(){
  document.addEventListener('resume',check);
});

// Chrome: On page becomes visible again
function handleVisibilityChange() {
  if (!document.webkitHidden) {
    check();
  }
}
document.addEventListener("webkitvisibilitychange", handleVisibilityChange, false);
