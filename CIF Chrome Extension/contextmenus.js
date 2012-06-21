// Copyright (c) 2010 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// A generic onclick callback function.
function queryClick(info, tab) {
	query = { 'query':info['selectionText'],
				  'type':'contextmenuquery'
				 };
	localStorage['query']=JSON.stringify(query);
	var views = chrome.extension.getViews({'type':'tab'});
	for (i in views) {
		if (views[i].location.href == chrome.extension.getURL('query.html')) {
		  views[i].runQuerySet();
		  return;
		} 
	}
	chrome.tabs.create({url: "query.html"}); 
}
function addClick(info, tab){
	query = { 'data':info['selectionText'],
				  'type':'contextmenuadd'
				 };
	localStorage['datatoadd']=JSON.stringify(query);
	chrome.tabs.create({url: "adddata.html"});
}

var id = chrome.contextMenus.create({"title": "Query CIF Server for '%s'",
									 "contexts":['selection'],
									 "onclick": queryClick});
var id2 = chrome.contextMenus.create({"title": "Add '%s' to CIF",
									 "contexts":['selection'],
									 "onclick": addClick});



