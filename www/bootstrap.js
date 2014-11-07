(function(){
// Retrieved and slightly modified from: https://github.com/typicode/pegasus
// --------------------------------------------------------------------------
//
// a   url (naming it a, beacause it will be reused to store callbacks)
// xhr placeholder to avoid using var, not to be used
window.pegasus = function pegasus(a, xhr) {
  xhr = new XMLHttpRequest();

  // Open url
  xhr.open('GET', a);

  // Reuse a to store callbacks
  a = [];

  // onSuccess handler
  // onError   handler
  // cb        placeholder to avoid using var, should not be used
  xhr.onreadystatechange = xhr.then = function(onSuccess, onError, cb) {

    // Test if onSuccess is a function or a load event
    if (onSuccess.call) a = [,onSuccess, onError];

    // Test if request is complete
    if (xhr.readyState == 4) {

      // index will be:
      // 0 if undefined
      // 1 if status is between 200 and 399
      // 2 if status is over
      cb = a[0|xhr.status / 200];

      // Safari doesn't support xhr.responseType = 'json'
      // so the response is parsed
      if (cb) cb(xhr.status === 200?JSON.parse(xhr.responseText):xhr);
    }
  };

  // Send
  xhr.send();

  // Return request
  return xhr;
};
//------------------------------------------------------------------
// Load manifest from localStorage
var manifest = JSON.parse(localStorage.getItem('manifest'));

// If not in localStorage, fetch it
if(!manifest){
  // grab manifest.json location from <script manifest="..."></script>
  var url = (s = document.querySelector('script[manifest]')? s.getAttribute('manifest'): null) || 'manifest.json';
  pegasus(url).then(loadManifest,function(xhr){
    console.error('Could not download '+url+': '+xhr.status);
  });
} else {
  loadManifest(manifest,true);
}
// After fetching manifest (localStorage or XHR), load it
function loadManifest(manifest,fromLocalStorage){
  // Check if there is anything to load
  if(!manifest.load) {
    console.error('Manifest has nothing to load (manifest.load is empty).',manifest);
    return;
  }
  // Init variables
  var el,
      head = document.getElementsByTagName('head')[0],
      root = manifest.root || './';

  // Ensure the 'root' end with a '/'
  if(root.length > 0 && root[root.length-1] !== '/')
    root += '/';
  // Save manifest for next time
  if(!fromLocalStorage)
    localStorage.setItem('manifest',JSON.stringify(manifest));
  // Save to global scope
  window.Manifest = manifest;

  // Script loader
  function loadScripts(){
    manifest.load.forEach(function(src){
      // Ensure the 'src' has no '/' (it's in the root already)
      if(src[0] === '/') src = src.substr(1);
      src = root + src;
      // Load javascript
      if(src.substr(-3) === ".js"){
        el= document.createElement('script');
        el.type= 'text/javascript';
        el.src= src;
      // Load CSS
      } else {
        el= document.createElement('link');
        el.rel = "stylesheet";
        el.href = src;
        el.type = "text/css";
      }
      head.appendChild(el);
    });
  }

  // If we're loading Cordova files, make sure Cordova is ready first!
  if(root.substr(0,7) === 'cdvfile'){
    document.addEventListener("deviceready", loadScripts, false);
  } else {
    loadScripts();
  }
}
})();