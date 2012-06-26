function makeMeVisible(){
	chrome.tabs.getCurrent(function(tab){
		chrome.tabs.update(tab.id, {selected: true});
	});
}

function switchToPage(pageName){
	var views = chrome.extension.getViews({'type':'tab'});
	for (i in views) {
		if (views[i].location.href == chrome.extension.getURL(pageName)) {
		  views[i].makeMeVisible();
		  window.close();
		  return;
		} 
	}
	chrome.tabs.create({url: pageName});
	window.close();
	return;
}

function makeNewPage(pageName){
	chrome.tabs.create({url: pageName});
	return;
}
function switchToQueryPageAndRun(){
	var views = chrome.extension.getViews({'type':'tab'});
	for (var i = 0; i < views.length; i++) {
		var view = views[i];
		if (view.location.href == chrome.extension.getURL('core/query.html')) {
		  view.runQuerySet();
		  return;
		} 
	}
	chrome.tabs.create({url: "core/query.html"});
	return;
}