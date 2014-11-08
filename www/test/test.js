
var fs = new CordovaPromiseFS({});

var loader = window.loader = new CordovaAppLoader({
  fs: fs,
  localRoot: 'app',
  serverRoot: 'http://localhost:8000/ios/www/',
  mode: 'mirror'
});

$.get(Manifest.root + 'test/template.html', function(template) {
  $('body').html(template);
});

function setStatus(msg){
  $('#status').text(JSON.stringify(msg));
}

$('body').on('click','.customCheck',function(ev){
  var url = $('#manifest').val();
  loader.check(url).then(setStatus,setStatus);
});

$('body').on('click','.check',function(ev){
  var url = $(ev.target).attr('manifest');
  loader.check(url).then(setStatus,setStatus);
});

$('body').on('click','.update',function(){
  setStatus(loader.update());
});

$('body').on('click','.download',function(){
  loader.download(setStatus).then(setStatus,setStatus);
});

$('body').on('click','.factory',function(){
  localStorage.removeItem('manifest');
});

$('body').on('click','.reload',function(){
  location.reload();
});

window.ok = function(ok){console.log('ok',ok);};
window.err = function(err){console.log('err',err);};
window.BOOTSTRAP_OK = true;
