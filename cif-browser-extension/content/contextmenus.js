/*
 *  This file adds the right-click menus in Chrome and binds functions to the clicks. 
 *  It's included directly from the manifest.json file, which is only read by Chrome.
 */

//define CIF_CLIENT object if it isn't already
if(!CIF_CLIENT){
    var CIF_CLIENT = {};
}

/*
 * Called from context menu click to query high-lighted text.
 * Creates query object from selected text and puts it in local storage for the query page to get
 * Finds the query page or opens a new one and launches the query
 */
CIF_CLIENT.queryClick=function(info, tab) {
	var query = { 'query':info['selectionText'],
				  'type':'contextmenuquery'
				 };
	localStorage['query']=JSON.stringify(query); //store the query for the query page to access
	
	/* check for existing query page 
	 * if it exists, have it run the query
	 */
	var views = chrome.extension.getViews({'type':'tab'});
	for (i in views) {
		if (views[i].location.href.indexOf(chrome.extension.getURL('content/query.html')) == 0) {
		  views[i].CIF_CLIENT.runQuerySet();
		  return;
		} 
	}
	
	/* query page isn't open, open it and run the query */
	localStorage['runquery']='true'; //tells the new query page to run the query in storage when launched
	chrome.tabs.create({url: "content/query.html"}); 
}

/*
 *	Called from context menu when user clicks to add data to CIF
 *	Stores an object with the selected text for the data submission page to use
 * 	Launches a new data submission page
 */
CIF_CLIENT.addClick=function(info, tab){
	query = { 'data':info['selectionText'],
				  'type':'contextmenuadd'
				 };
	localStorage['datatoadd']=JSON.stringify(query);
	chrome.tabs.create({url: "content/adddata.html"});
}

/* creates entry in the context menu for to query CIF server */
var id = chrome.contextMenus.create({"title": "Query CIF Server for '%s'",
									 "contexts":['selection'],
									 "onclick": CIF_CLIENT.queryClick});

/* creates entry in the context menu for to add data to the CIF server */
var id2 = chrome.contextMenus.create({"title": "Add '%s' to CIF",
									 "contexts":['selection'],
									 "onclick": CIF_CLIENT.addClick});


/* changes the CIF icon every ten seconds 
 * disabled by default, call once to start 
 */
CIF_CLIENT.iconindex = 1;
CIF_CLIENT.iconParty=function(){
	if (iconindex>4) iconindex=1;
	chrome.browserAction.setIcon({'path':"images/favicon_"+CIF_CLIENT.iconindex+".ico"});
	CIF_CLIENT.iconindex++;
	window.setTimeout(CIF_CLIENT.iconParty, 10000, true);
}									 



