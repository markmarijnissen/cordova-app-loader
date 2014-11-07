$('body').html('<div id="msg">...</div><div id="buttons"></div><div id="status"></div>');

var fs = new CordovaPromiseFS({});

var loader = window.loader = new CordovaAppLoader({
  fs: fs,
  localRoot: 'app',
  serverRoot: 'http://localhost:8000/ios/www/',
  mode: 'mirror'
});

function setStatus(msg){
  $('#status').text(JSON.stringify(msg));
}

['1','2','3'].forEach(function(i){
  $('<button>').text('check: update'+i+'/manifest.json').click(function(){
    loader.check('update'+i+'/manifest.json').then(setStatus,setStatus);
  }).appendTo($('#buttons'));
});

$('<button>').text('download').click(function(){
  loader.download().then(setStatus,setStatus);
}).appendTo($('#buttons'));

$('<button>').text('update').click(function(){
  loader.update();
}).appendTo($('#buttons'));


window.ok = function(ok){console.log('ok',ok);};
window.err = function(err){console.log('err',err);};
console.log('loaded app!');