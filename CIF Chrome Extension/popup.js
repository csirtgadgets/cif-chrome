$(document).ready(function() {
	settingsCheck();
	for (i in options){
		if (options[i]['isDefault']){
			$('#serverselect').append('<option value="'+i+'" selected>'+options[i]['name']+'</option>');
		} else {
			$('#serverselect').append('<option value="'+i+'">'+options[i]['name']+'</option>');
		}
	}
	$("#theform").submit(function(){ 
		query = { 'query':$("#querystring").val().trim(),
				  'type':'formquery',
				  'server':$("#serverselect option:selected").val(),
				  'logquery':$("#logquery").is(':checked')
				 };
		localStorage['query']=JSON.stringify(query);
		var views = chrome.extension.getViews({'type':'tab'});
		for (var i = 0; i < views.length; i++) {
			var view = views[i];
			if (view.location.href == chrome.extension.getURL('query.html')) {
			  view.runQuerySet();
			  return false;
			} 
		}
		chrome.tabs.create({url: "query.html"}); 
		return false;
	});
});
function settingsCheck(){
    try{
		options = JSON.parse(localStorage["cifapiprofiles"]);
	} catch(err) {
		options = new Array();
	}
	if (options.length<1){
		var views = chrome.extension.getViews({'type':'tab'});
		for (i in views) {
			if (views[i].location.href == chrome.extension.getURL('settings.html')) {
			  views[i].makeMeVisible();
			  window.close();
			  return;
			} 
		}
		chrome.tabs.create({url: "settings.html"});
		window.close();
		return;
	}
}