
var fs = new CordovaPromiseFS({ persistent: typeof cordova !== 'undefined' });
var SERVER = 'http://data.madebymark.nl/cordova-app-loader/';
if(location.host === 'localhost:8080'){
  SERVER = 'http://localhost:8080/';
}

var loader = window.loader = new CordovaAppLoader({
  fs: fs,
  localRoot: 'app',
  serverRoot: SERVER,
  mode: 'mirror',
  cacheBuster: true
});


var tapEvent = typeof cordova !== 'undefined'?'touchstart':'click';

$.get(Manifest.root + 'template.html', function(template) {
  $('body').html(template);
  $('#msg').text('Original');
  setStatus('ready');

  fs.fs.then(undefined,function(){
    setStatus('ERROR: Only Chrome and Cordova-iOS/Android are supported!');
  });
});

function setStatus(msg){
  $('#status').text(JSON.stringify(msg,null,2));
}

function onProgress(ev){
  $('.progress-bar').css('width',(ev.percentage * 100) + '%');
  $('.target').text(ev.path);
}

$('body').on(tapEvent,'.check',function(ev){
  var url = $(ev.target).attr('manifest');
  $('#manifest').val(SERVER+url);
  return ev.preventDefault();
});

$('body').on(tapEvent,'.doCheck',function(ev){
  var url = $('#manifest').val();
  setStatus('checking...');
  var cacheBuster = "?"+Math.random();
  loader.check(url+cacheBuster).then(setStatus,setStatus);
});

$('body').on(tapEvent,'.update',function(){
  setStatus('updating...');
  setStatus(loader.update());
});

$('body').on(tapEvent,'.download',function(){
  setStatus('downloading...');
  loader.download(onProgress).then(setStatus,setStatus);
});

$('body').on(tapEvent,'.factory',function(){
  setStatus('resetting...');
  loader.reset().then(setStatus,setStatus);
});

$('body').on(tapEvent,'.reload',function(){
  setStatus('reloading...');
  location.reload();
});

window.ok = function(ok){console.log('ok',ok);};
window.err = function(err){console.log('err',err);};
window.BOOTSTRAP_OK = true;
