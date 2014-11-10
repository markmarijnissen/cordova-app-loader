$.get(Manifest.root + 'update/time.php').then(function(time){
  time = time * 1000.0;
  time = new Date(time);
  $('#msg').text(time);
});