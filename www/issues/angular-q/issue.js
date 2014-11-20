function ok(ok){ console.log('ok',ok); }
function err(err){ console.log('err',err); }

angular.module('PromiseIssue',[])
.run(function($q){
    window.Promise = $q;
    var fs = new CordovaPromiseFS({
        Promise: $q,
        persistent: false
    });
    window.fs = fs;

    fs.list('')
    .then(ok)
    .then(function(){
        return fs.write('test.txt','Hello World');
    })
    .then(ok)
    .then(function(){
        return fs.read('test.txt').then(ok,err);
    })
    .then(function(){
        alert('OK');
    },function(err){
        alert('ERROR',err);
    });
});
angular.bootstrap(document,['PromiseIssue']);