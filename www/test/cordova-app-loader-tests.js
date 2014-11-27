(function(){
	QUnit.config.reorder = false;
	var SERVER = 'http://data.madebymark.nl/cordova-app-loader/';

	/*************************************/
	QUnit.module('CordovaAppLoader');
	/*************************************/
	var loader = null;
	var fs;

	QUnit.test('should have bootstrap.js script',function(assert){
		fs = new CordovaPromiseFS({
			persistent: typeof cordova !== 'undefined',
			Promise:Promise
		});

		// Should have bootstrap.js script!!
		assert.throws(function(){
			loader = new CordovaAppLoader({
				fs:fs,
				localRoot: 'loader-test',
				serverRoot: SERVER,
				retry: [0,0]
			});
		});
	});

	QUnit.asyncTest('loader = new CordovaAppLoader(...)',function(assert){
		// Hack it away
		window.Manifest = {};
		loader = new CordovaAppLoader({
			fs:fs,
			localRoot: 'loader-test',
			serverRoot: SERVER,
			retry: [0,0]
		});

		loader.cache.ready.then(ok(assert,truthy),err(assert));
	});


	/*************************************/
	// Helper methods for promises
	var truthy = 'TRUTHY';
	function print(){
		console.log(arguments);
	}
	function ok(assert,expected){
		return function(actual){
			if(expected === truthy){
				assert.ok(actual);
			} else {
				assert.equal(actual,expected);
			}
			QUnit.start();
		};
	}

	function err(assert){
		return function(err){
			assert.equal(err,'unexpeced promise callback(resolve or reject)');
			QUnit.start();
		};
	}
})();
