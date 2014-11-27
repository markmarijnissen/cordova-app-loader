$body = $('body');
$btn = $('<div>Reset app (to exit test)</div>');
$btn.on('click',function(){
	localStorage.removeItem('manifest');
	location.reload();
});
$btn.appendTo($body);
$('<div id="qunit"></div>').appendTo($body);
$('<div id="qunit-fixture"></div>').appendTo($body);