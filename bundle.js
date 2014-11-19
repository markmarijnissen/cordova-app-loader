window.CordovaAppLoader = require('./index');
window.CordovaFileCache = require('cordova-file-cache');
window.CordovaPromiseFS = require('cordova-promise-fs');
window.Promise = require('promiscuous');
window.setImmediate = window.setTimeout; // for promiscuous to work!