(function(){
	QUnit.config.reorder = false;

	/*************************************/
	QUnit.module('CordovaPromiseFS');
	/*************************************/
	window.fs = null;

	QUnit.test('fs = CordovaPromiseFS()',function(assert){
		fs = CordovaPromiseFS({
			Promise:Promise,
			persistent: typeof cordova !== 'undefined'
		});
		assert.ok(!!fs);
	});

	QUnit.asyncTest('fs.deviceready',function(assert){
		fs.deviceready.then(ok(assert,true),err(assert));
	});

	QUnit.test('fs.filename("bla/bla/test.txt") = "test.txt"',function(assert){
		assert.equal(fs.filename('bla/bla/test.txt'),'test.txt');
	});

	QUnit.test('fs.dirname("bla/bla/test.txt") = "bla/bla/"',function(assert){
		assert.equal(fs.dirname('bla/bla/test.txt'),'bla/bla/');
	});

	QUnit.test('fs.normalize: "/dir/dir/file.txt => dir/file.txt; /dir => dir/; ./ => ""',function(assert){
		assert.equal(fs.normalize('./'),		'',			'"./" => ""');
		assert.equal(fs.normalize('test'),		'test/',	'test => test/');
		assert.equal(fs.normalize('test/'),		'test/',	'test/ => test/');
		assert.equal(fs.normalize('/test'),		'test/',	'/test => test/');
		assert.equal(fs.normalize('/test/'),	'test/',	'/test/ => test/');
		assert.equal(fs.normalize('/dir.txt/'),'dir.txt/',	'/dir.txt/ => dir.txt/ (directory with a dot)');
		assert.equal(fs.normalize('file.txt'),	'file.txt',	'file.txt => file.txt');
		assert.equal(fs.normalize('/file.txt'),	'file.txt',	'/file.txt => file.txt');
		assert.equal(fs.normalize('/dir/sub/sub/text.txt'),	'dir/sub/sub/text.txt',	'subdirectories with file');
		assert.equal(fs.normalize('/dir/sub/sub/sub'),	'dir/sub/sub/sub/',	'subdirectories');
	});


	/*************************************/
	//        CREATE
	/*************************************/
	QUnit.asyncTest('fs.create (in root)',function(assert){
		fs.create('create.txt')
			.then(function(){
				return fs.file('create.txt');
			})
			.then(ok(assert,truthy),err(assert));
	});

	QUnit.asyncTest('fs.create (in subdirectory)',function(assert){
		fs.create('sub/sub/create.txt')
			.then(function(){
				return fs.file('sub/sub/create.txt');
			})
			.then(ok(assert,truthy),err(assert));
	});

	QUnit.asyncTest('fs.ensure (in root)',function(assert){
		fs.ensure('testdir')
			.then(function(){
				return fs.dir('testdir');
			})
			.then(ok(assert,truthy),err(assert));
	});

	QUnit.asyncTest('fs.ensure (in subdirectory)',function(assert){
		fs.ensure('testdir2/testdir2')
			.then(function(){
				return fs.dir('testdir2/testdir2');
			})
			.then(ok(assert,truthy),err(assert));
	});

	/*************************************/
	//        ENTRY
	/*************************************/
	QUnit.asyncTest('fs.file (ok - fileEntry)',function(assert){
		fs.file('create.txt').then(ok(assert,truthy),err(assert));
	});

	QUnit.asyncTest('fs.file (error - does not exist)',function(assert){
		fs.file('does-not-exist.txt').then(err(assert),function(err){
			assert.equal(err.code,1);
			QUnit.start();
		});
	});

	QUnit.asyncTest('fs.exists (ok - true)',function(assert){
		fs.exists('create.txt').then(function(fileEntry){
			assert.ok(fileEntry);
			QUnit.start();
		},err(assert));
	});

	QUnit.asyncTest('fs.exists (error - does not exist)',function(assert){
		fs.exists('does-not-exist.txt').then(ok(assert,false),err(assert));
	});

	QUnit.asyncTest('fs.dir (ok - dirEntry)',function(assert){
		fs.dir('testdir').then(ok(assert,truthy),err(assert));
	});

	QUnit.asyncTest('fs.dir (error - does not exist)',function(assert){
		fs.dir('does-not-exist').then(err(assert),function(err){
			assert.equal(err.code,1);
			QUnit.start();
		});
	});

	QUnit.asyncTest('fs.toInternalURL',function(assert){
		var result = fs.toInternalURLSync('create.txt');
		fs.toInternalURL('create.txt').then(ok(assert,result),err(assert));
	});

	QUnit.asyncTest('fs.toURL',function(assert){
		fs.toURL('create.txt').then(function(url){
			assert.equal(url.substr(0,4),'file');
			QUnit.start();
		},err(assert));
	});

	/*************************************/
	//        LIST
	/*************************************/
	QUnit.asyncTest('fs.list (f)',function(assert){
		var files = ['list/1.txt','list/2.txt','list/3.txt',
		  'list/sub/4.txt','list/sub/sub/5.txt'];
		var promises = files.map(function(file){
			return fs.create(file);
		});
		Promise.all(promises)
			.then(function(){
				return fs.list('list','f');
			})
			.then(function(actual){
				assert.deepEqual(actual,[
				  "/list/3.txt",
				  "/list/2.txt",
				  "/list/1.txt"
				]);
				QUnit.start();
			},err(assert));
	});

	QUnit.asyncTest('fs.list (d)',function(assert){
		fs.list('list','d')
		.then(function(actual){
			assert.deepEqual(actual,[
			  "/list/sub"
			]);
			QUnit.start();
		},err(assert));
	});

	QUnit.asyncTest('fs.list (rf)',function(assert){
		fs.list('list','rf')
		.then(function(actual){
			assert.deepEqual(actual,[
				  "/list/3.txt",
				  "/list/2.txt",
				  "/list/1.txt",
				  "/list/sub/4.txt",
				  "/list/sub/sub/5.txt",
			]);
			QUnit.start();
		},err(assert));
	});

	QUnit.asyncTest('fs.list (rd)',function(assert){
		fs.list('list','rd')
		.then(function(actual){
			assert.deepEqual(actual,[
				  "/list/sub",
				  "/list/sub/sub",
			]);
			QUnit.start();
		},err(assert));
	});

	QUnit.asyncTest('fs.list (fe)',function(assert){
		fs.list('list','fe')
		.then(function(actual){
			assert.equal(actual.length,3);
			assert.equal(typeof actual[0],'object');
			QUnit.start();
		},err(assert));
	});

	QUnit.asyncTest('fs.list (error when not exist)',function(assert){
		fs.list('does-not-exist','r')
		.then(err(assert),function(err){
			assert.equal(err.code,1);
			QUnit.start();
		});
	});

	/*************************************/
	//        WRITE
	/*************************************/
	var obj = {hello:'world'};
	var string = JSON.stringify(obj);

	QUnit.asyncTest('fs.write',function(assert){
		fs.write('write.txt',string).then(ok(assert,truthy),err(assert));
	});

	/*************************************/
	//        READ
	/*************************************/
	QUnit.asyncTest('fs.read',function(assert){
		fs.read('write.txt').then(ok(assert,string),err(assert));
	});

	QUnit.asyncTest('fs.readJSON',function(assert){
		fs.readJSON('write.txt').then(function(actual){
			assert.ok(actual);
			assert.equal(actual.hello,obj.hello);
			QUnit.start();
		},err(assert));
	});

	QUnit.asyncTest('fs.toDataURL (plain text)',function(assert){
		fs.toDataURL('write.txt').then(ok(assert,'data:text/plain;base64,eyJoZWxsbyI6IndvcmxkIn0='),err(assert));
	});


	// QUnit.asyncTest('fs.toDataURL (json)',function(assert){
	// 	fs.write('write.json',obj).then(function(){
	// 		return fs.toDataURL('write.json');
	// 	})
	// 	.then(
	// 		ok(assert,'data:application/json;base64,eyJoZWxsbyI6IndvcmxkIn0='),
	// 		err(assert)
	// 	);
	// });

	/*************************************/
	//        REMOVE
	/*************************************/
	QUnit.asyncTest('fs.remove = true (when file exists)',function(assert){
		fs.remove('create.txt').then(ok(assert,true),err(assert));
	});

	QUnit.asyncTest('fs.remove = false (when file does not exists)',function(assert){
		fs.remove('create.txt').then(ok(assert,false),err(assert));
	});

	/*************************************/
	//        MOVE AND COPY
	/*************************************/
	QUnit.asyncTest('fs.move',function(assert){
		fs.move('write.txt','moved.txt')
			.then(function(){
				return fs.exists('write.txt');
			})
			.then(function(val){
				assert.equal(val,false,'old file should not exist');
			})
			.then(function(){
				return fs.exists('moved.txt');
			})
			.then(ok(assert,truthy),err(assert));
	});

	QUnit.asyncTest('fs.copy',function(assert){
		fs.copy('moved.txt','copied.txt')
			.then(function(){
				return fs.exists('moved.txt');
			})
			.then(function(val){
				assert.ok(val,'old file should exist');
			})
			.then(function(){
				return fs.exists('copied.txt');
			})
			.then(ok(assert,truthy),err(assert));
	});

	/*************************************/
	//        DOWNLOAD
	/*************************************/
	QUnit.asyncTest('fs.download (ok)',function(assert){
		fs.download('http://data.madebymark.nl/cordova-promise-fs/download.txt','download.txt')
			.then(function(){
				return fs.read('download.txt');
			})
			.then(function(val){
				assert.equal(val,'hello world');
				QUnit.start();
			},err(assert));
	});

	QUnit.asyncTest('fs.download (404 returns false - should see 3 retry attempts)',function(assert){
		fs.download('http://data.madebymark.nl/cordova-promise-fs/does-not-exist.txt','download-error.txt',{retry:[0,0]})
			.then(err(assert),function(){
				assert.ok(true);
				QUnit.start();
			});
	});

	QUnit.asyncTest('fs.download : progress when starting download',function(assert){
		var called = false;
		fs.download('http://data.madebymark.nl/cordova-promise-fs/download.txt',
				'download-error.txt',
				function(){
					called = true;
				})
			.then(function(){
				assert.ok(called,'should call "onprogress"');
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
			assert.equal(err,'an error');
			QUnit.start();
		};
	}
})();