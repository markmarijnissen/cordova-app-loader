(function(){
	QUnit.config.reorder = false;
	var SERVER = 'http://data.madebymark.nl/cordova-file-cache/';

	/*************************************/
	QUnit.module('CordovaFileCache');
	/*************************************/
	var cache = window.cache = null;
	var fs;

	QUnit.asyncTest('cache = new CordovaFileCache(...)',function(assert){
		fs = new CordovaPromiseFS({
			persistent: typeof cordova !== 'undefined',
			Promise:Promise
		});

		cache = new CordovaFileCache({
			fs:fs,
			localRoot: '/cache-test',
			serverRoot: SERVER,
			retry: [0,0]
		});

		cache.ready.then(ok(assert,truthy),err(assert));
	});

	QUnit.test('normalize "localRoot" to "cache-test/"',function(assert){
		assert.equal(cache.localRoot,'cache-test/');
	});

	QUnit.test('normalize "serverRoot" to end with "/"',function(assert){
		assert.equal(cache.serverRoot[cache.serverRoot.length-1],'/');
	});

	QUnit.asyncTest('"localRoot" exists',function(assert){
		fs.list(cache.localRoot,'rfd').then(ok(assert,truthy),err(assert));
	});

	/*************************************/
	// Methods that actually do stuff
	/*************************************/

	//clear
	QUnit.asyncTest('clear: leaves an empty but existing directory',function(assert){
		cache.ready.then(function(){
				return cache.clear();
			})
			.then(function(){
				return fs.list(cache.localRoot,'rfd');
			})
			.then(function(list){
				assert.equal(list.length,0);
				QUnit.start();
			},err(assert));
	});

	//list
	QUnit.asyncTest('list: should be empty after clear',function(assert){
		cache.list()
			.then(function(list){
				assert.equal(list.length,0);
				QUnit.start();
			},err(assert));
	});

	//add
	var file1 = 'file1.txt';
	var file2 = 'file2.txt';
	var file3 = 'file3.txt';
	var server_file1 = SERVER + file1;
	var server_file2 = SERVER + file2;
	var server_file3 = SERVER + file3;


	QUnit.test('add single file (with server url)',function(assert){
		var dirty = cache.add(server_file1);
		assert.ok(dirty,'should be dirty');
		assert.deepEqual(cache.getAdded(),[server_file1]);
	});

	QUnit.test('add single file (without server url)',function(assert){
		var dirty = cache.add(file1);
		assert.ok(dirty,'should be dirty');
		assert.deepEqual(cache.getAdded(),[server_file1]);
	});

	QUnit.test("don't add duplicates",function(assert){
		var dirty = cache.add([server_file1,server_file1]);
		assert.ok(dirty,'should be dirty');
		assert.deepEqual(cache.getAdded(),[server_file1]);
	});

	QUnit.test('add array of files (with server url)',function(assert){
		var dirty = cache.add([server_file2,server_file3]);
		assert.ok(dirty,'should be dirty');
		assert.deepEqual(cache.getAdded(),[server_file1,server_file2,server_file3]);
	});

	//remove
	QUnit.test('remove single file',function(assert){
		cache.remove(file1);
		assert.deepEqual(cache.getAdded(),[server_file2,server_file3]);
	});

	QUnit.test('remove array of files',function(assert){
		cache.remove([file2]);
		assert.deepEqual(cache.getAdded(),[server_file3]);
	});

	//download
	QUnit.asyncTest('download queue is correct',function(assert){
		cache.add([file1,file2,file3]);
		fs.write('cache-test/file1.txt','stuff')
			.then(function(){
				return cache.list();
			})
			.then(function(){
				assert.equal(cache.isCached(file1),true,'file1 is cached (without server url)');
				assert.equal(cache.isCached(server_file1),true,'file1 is cached (with server url)');
				assert.deepEqual(cache.getDownloadQueue(),[server_file3,server_file2],'downloadQueue has now 2 and 3');
				QUnit.start();
			},err(assert));
	});

	QUnit.asyncTest('download',function(assert){
		cache.download()
			.then(function(x){
				assert.deepEqual(x,cache,'download returns cache');
				assert.equal(cache.isCached(file2),true,'file2 is cached');
				assert.equal(cache.isCached(file3),true,'file3 is cached');
				return fs.list(cache.localRoot,'rf');
			})
			.then(function(list){
				assert.deepEqual(list,['/cache-test/file3.txt','/cache-test/file2.txt','/cache-test/file1.txt'],'files are really there!');
				QUnit.start();
			},err(assert));
		// assert.equal(cache._downloading.length,2);
	});

	QUnit.asyncTest('download with invalid files (rejects with failed files)',function(assert){
		var url = SERVER+'does-not-exist.txt';
		cache.add(url);
		cache.clear()
			.then(function(){
				return cache.download();
			})
			.then(err(assert),function(errors){
				assert.deepEqual(cache.getDownloadQueue(),[url],'downloadQueue has failed url');
				assert.deepEqual(errors,[url],'returns failed urls');
				QUnit.start();
			});
	});

	QUnit.test('isDirty() returns if downloadQueue has downloads',function(assert){
		assert.equal(cache.isDirty(),true);
		cache.remove(SERVER+'does-not-exist.txt');
		assert.equal(cache.isDirty(),false);
	});

	//abort


	/*************************************/
	// Getters
	/*************************************/
	//toInternalURL
	QUnit.test('toInternalURL',function(assert){
		var expected = fs.toInternalURLSync('cache-test/'+file1);
		assert.equal(cache.toInternalURL(file1),expected,'handles urls without server');
		assert.equal(cache.toInternalURL(server_file1),expected,'handles path without server');
		assert.equal(cache.toInternalURL('nonsense'),'nonsense','returns input if not cached');
	});

	//get
	QUnit.test('get (cached file) returns internal url',function(assert){
		var expected = fs.toInternalURLSync('cache-test/'+file1);
		assert.equal(cache.get(file1),expected);
		assert.equal(cache.get(server_file1),expected);
	});

	QUnit.test('get (uncached file) return server url',function(assert){
		var expected = SERVER + 'does-not-exist.txt';
		assert.equal(cache.get('does-not-exist.txt'),expected);
		assert.equal(cache.get(expected),expected);
	});

	//toDataURL
	QUnit.asyncTest('toDataURL',function(assert){
		cache.toDataURL(file1)
			.then(ok(assert,'data:text/plain;base64,aGVsbG8gd29ybGQ='),err(assert));
	});

	//toURL
	QUnit.test('toURL',function(assert){
		var expected = 'file';
		assert.equal(cache.toURL(file1).substr(0,4),expected);
		assert.equal(cache.toURL(server_file1).substr(0,4),expected);
		assert.equal(cache.toURL('nonsense'),'nonsense','returns input if not cached');
	});

	//toServerURL
	QUnit.test('toServerURL',function(assert){
		var expected = SERVER + 'test.txt';
		assert.equal(cache.toServerURL('test.txt'),expected);
		assert.equal(cache.toServerURL(expected),expected);
	});

	//toPath
	QUnit.test('toPath',function(assert){
		var expected = 'cache-test/ok.txt';
		assert.equal(cache.toPath('ok.txt'),expected);
		assert.equal(cache.toPath('/ok.txt'),expected);
		assert.equal(cache.toPath(SERVER+'ok.txt'),expected);
	});


	/*************************************/
	// Helpers
	/*************************************/
	//getDownloadQueue
	//getAdded
	//isDirty
	//isCached

	//clear
	QUnit.asyncTest('clear: leaves an empty but existing directory',function(assert){
		cache.ready.then(function(){
				return cache.clear();
			})
			.then(function(){
				return fs.list(cache.localRoot,'rfd');
			})
			.then(function(list){
				assert.equal(list.length,0);
				QUnit.start();
			},err(assert));
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