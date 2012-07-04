if(!CIF_CLIENT){
    var CIF_CLIENT = {};
}

CIF_CLIENT.queryClick=function(info, tab) {
	query = { 'query':info['selectionText'],
				  'type':'contextmenuquery'
				 };
	localStorage['query']=JSON.stringify(query);
	var views = chrome.extension.getViews({'type':'tab'});
	for (i in views) {
		if (views[i].location.href == chrome.extension.getURL('content/query.html')) {
		  views[i].CIF_CLIENT.runQuerySet();
		  return;
		} 
	}
	localStorage['runquery']='true';
	chrome.tabs.create({url: "content/query.html"},function(tab){
		window.cifquerytabid=tab.id;
	}); 
}
CIF_CLIENT.addClick=function(info, tab){
	query = { 'data':info['selectionText'],
				  'type':'contextmenuadd'
				 };
	localStorage['datatoadd']=JSON.stringify(query);
	chrome.tabs.create({url: "content/adddata.html"});
}

var id = chrome.contextMenus.create({"title": "Query CIF Server for '%s'",
									 "contexts":['selection'],
									 "onclick": CIF_CLIENT.queryClick});

var id2 = chrome.contextMenus.create({"title": "Add '%s' to CIF",
									 "contexts":['selection'],
									 "onclick": CIF_CLIENT.addClick});
iconindex = 1;
CIF_CLIENT.iconParty=function(){
	if (iconindex>4) iconindex=1;
	chrome.browserAction.setIcon({'path':"favicon_"+iconindex+".ico"});
	iconindex++;
	window.setTimeout(iconParty, 10000, true);
}									 



