function makeMeVisible(pagetype){
	
	chrome.tabs.getCurrent(function(tab){
		chrome.tabs.update(tab.id, {selected: true});
	});
	return;
	if (pagetype=="settings"){
		chrome.tabs.update(window.cifsettingstabid, {selected: true});
	} 
	else if (pagetype=="query"){
		chrome.tabs.update(window.cifquerytabid, {selected: true});
	}
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
	chrome.tabs.create({url: pageName},function(tab){
		if (pageName=="core/query.html"){
			window.cifquerytabid=tab.id;
		}
		else if (pageName=="core/settings.html"){
			window.cifsettingstabid=tab.id;
		}
	});
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