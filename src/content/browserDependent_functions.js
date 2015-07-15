/*
 *  This contains the functions that need to be different depending on whether the browser is Chrome or Firefox
 *  
 */


if(!CIF_CLIENT){
    var CIF_CLIENT = {};
}

//see if we are in firefox. appinfo will be undefined if we aren't
try {
	var appInfo = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);
} catch(err){}
if (typeof appInfo != 'undefined'){ //if this is not undefined, we are in firefox
    /*
	 * All of the functions specific to Firefox
	 */
	 
	/* 
	 * since thunderbird doesn't have a gBrowser object, this is supposed to return something compatible
	 * DOESN'T CURRENTLY WORK
	 */ 
	function getgBrowser(){
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].
		getService(Components.interfaces.nsIWindowMediator);
		gBrowser = wm.getMostRecentWindow("mail:3pane");
		gBrowser.addTab=function(url){
			try {
				var browser = window.opener.getBrowser();
				browser.selectedTab = browser.addTab(url);
				window.opener.focus();
			} catch (err) {
				var eps = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"].
				getService(Components.interfaces.nsIExternalProtocolService);
				var ios = Components.classes["@mozilla.org/network/io-service;1"].
				getService(Components.interfaces.nsIIOService);
				eps.loadURI(ios.newURI(url, null, null));
			}
		}
		return gBrowser;
	}
	
	/* 
	 * this BrowserOverlay object contains all of the functions called from the main browserOverlay.xul drop-down menus, right-click menus, etc
	 */
	CIF_CLIENT.BrowserOverlay = {
		
		/* opens a new data submission page from a drop-down menu or right-click on icon */
		openDataPage : function(aEvent) {
			if (typeof gBrowser=='undefined') gBrowser=getgBrowser();
			gBrowser.selectedTab = gBrowser.addTab('chrome://cifclient/content/submit.html');
		},
		
		/* opens a new data submission page from a context menu on high-lighted text, which gets passed to the page */
		CopenDataPage : function(aEvent){
			query = { 'data':CIF_CLIENT.BrowserOverlay.getselectedtext(),
					  'type':'contextmenuadd'
					};
			CIF_CLIENT.storeItem('datatoadd',JSON.stringify(query)); //store the high-lighted text for the data page to use
			CIF_CLIENT.makeNewPage('content/submit.html');
		},

		/* opens the query page from a drop-down menu or right-click on icon */
		openQueryPage : function(aEvent) {
			CIF_CLIENT.switchToPage("content/search.html");
		},

		/* opens the query page from a context menu on high-lighted text, which gets passed to the page */
		CopenQueryPage : function(aEvent){
			query = { 'query':CIF_CLIENT.BrowserOverlay.getselectedtext(),
					  'type':'contextmenuquery'
					};
			CIF_CLIENT.storeItem('query',JSON.stringify(query)); //store the high-lighted text for the data page to use
			CIF_CLIENT.switchToQueryPageAndRun(); //switches to existing query page or makes a new one and runs the query
		},

		/* opens the settings page from a drop-down menu or right-click */
		openSettings : function(aEvent) {
			if (typeof gBrowser=='undefined') gBrowser=getgBrowser();
			gBrowser.selectedTab = gBrowser.addTab('chrome://cifclient/content/settings.html');
		},

		/* 
		 * this function is called whenever a user right-clicks to generate a context-menu
		 * if selected text is detected, we add our entries to the menu and have them reflect the selected text
		 * otherwise, hide them
		 */
		checkForSelection : function(aEvent) {
			var seltext=CIF_CLIENT.BrowserOverlay.getselectedtext();
			if (seltext==''){
				document.getElementById("searchcifforselection").hidden = true;
				document.getElementById("addselectiontocif").hidden = true;
			} else {
				document.getElementById("searchcifforselection").setAttribute('label',"Search CIF for '"+seltext+"'");
				document.getElementById("addselectiontocif").setAttribute('label',"Submit '"+seltext+"' to CIF");
				document.getElementById("searchcifforselection").hidden = false;
				document.getElementById("addselectiontocif").hidden = false;
				
			}
		},

		/*
		 *	Checks for and returns selected text in various scopes
		 *  returns null on no selected text
		 *  DOESN'T WORK with INPUT type=text elements
		 */
		getselectedtext: function() {
			var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
				 .getService(Components.interfaces.nsIWindowMediator);
			var mainWindow = wm.getMostRecentWindow("navigator:browser");
			var tabBrowser = mainWindow.getBrowser();
			var selectedtext;
			if (tabBrowser.contentWindow.getSelection){
				selectedText = tabBrowser.contentWindow.getSelection().toString();
			} else if (tabBrowser.contentWindow.document.getSelection){
				selectedText = tabBrowser.contentWindow.document.getSelection().toString();
			} else if (tabBrowser.contentWindow.document.selection){
				selectedText = tabBrowser.contentWindow.document.selection.createRange().text;
			} else {
				return null;
			}
			selectedText=selectedText.replace(/(\r\n|\n|\r| )/gm,' ');
			return selectedText;
		}
	};
	
	
	/*
	 * when the browser loads, bind our function that adds context menu entries to 'popupshowing' in the contextmenu scope
	 * 'popupshowing' is called whenever someone right-clicks on something that generates a context-menu in this case
	 */
	window.addEventListener("load", function load(event){  
		window.removeEventListener("load", load, false); //remove listener, no longer needed  
		var contextMenu = document.getElementById("contentAreaContextMenu");
		if (contextMenu) {
			contextMenu.addEventListener("popupshowing", CIF_CLIENT.BrowserOverlay.checkForSelection, false);
		}
	},false);

	
	/* Causes the browser to switch to the tab containing the page that calls this function */
	CIF_CLIENT.makeMeVisible=function(){
		this.switchToPage(window.location.pathname.toString());
	}

	
	/* 
	 * looks for a page with the pathname provided and switches to it. If it's not open, a new tab is opened to that path.
	 * pageName is relative to the base path of the plugin. 
	 */
	CIF_CLIENT.switchToPage=function(pageName){
		if (pageName.indexOf('/')==0) pageName=pageName.replace('/',''); //remove leading slash because the next line includes it
		var url='chrome://cifclient/'+pageName; //build the full URL
		
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
						 .getService(Components.interfaces.nsIWindowMediator);
		var browserEnumerator = wm.getEnumerator("navigator:browser");
    	
		// Check each browser instance for our URL
		var found = false;
		while (!found && browserEnumerator.hasMoreElements()) {
			var browserWin = browserEnumerator.getNext();
			var tabbrowser = browserWin.gBrowser;

			// Check each tab of this browser instance
			var numTabs = tabbrowser.browsers.length;
			for (var index = 0; index < numTabs; index++) {
				var currentBrowser = tabbrowser.getBrowserAtIndex(index);
				if (currentBrowser.currentURI.spec.indexOf(url) == 0) {
					tabbrowser.selectedTab = tabbrowser.tabContainer.childNodes[index]; //switches to the tab
					browserWin.focus(); //gives the window focus if another has it
					found = true; //mark that it was found so a new one isn't launched below
					break;
				}
			}
		}

		// Our URL isn't open. Open it now.
		if (!found) {
			CIF_CLIENT.makeNewPage(pageName);
		}
		return found;
	}
	
	/* 
	 * Returns the mainWindow that has access to the gBrowser object required to control tabs
	 * Required because gBrowser isn't directly available in the scope provided to the html pages in the plugin
	 */
	CIF_CLIENT.getmainwindow=function(){
		var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                       .getInterface(Components.interfaces.nsIWebNavigation)
                       .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                       .rootTreeItem
                       .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                       .getInterface(Components.interfaces.nsIDOMWindow);
		if (typeof mainWindow.gBrowser=='undefined') mainWindow.gBrowser=getgBrowser();
		return mainWindow;
	}
	
	/* opens a page in a new tab and switches to it */
	CIF_CLIENT.makeNewPage=function(pageName){
		var mainWindow=CIF_CLIENT.getmainwindow();
		mainWindow.gBrowser.selectedTab = mainWindow.gBrowser.addTab('chrome://cifclient/'+pageName);
		return;
	}
	
	/* switches to the query page or makes a new one if it doesn't exist and runs the query */
	CIF_CLIENT.switchToQueryPageAndRun=function(newWinPref){
		CIF_CLIENT.storeItem('runquery','true');
		var alwaysNewPages=false;
		try {
			miscOptions=JSON.parse(CIF_CLIENT.getItem("miscOptions"));
			alwaysNewPages=miscOptions.newTabOnquery
		} catch(err) {
			console.log(err);
		}
		if (newWinPref=='ignoreNewWindow'){
			alwaysNewPages=false;
		}
		alwaysNewPages=false;
		if (alwaysNewPages){
			CIF_CLIENT.makeNewPage("content/search.html");
		} else {
			existing=CIF_CLIENT.switchToPage("content/search.html");
			if (existing){
				var mainWindow=CIF_CLIENT.getmainwindow();
				mainWindow.gBrowser.selectedBrowser.contentWindow.wrappedJSObject.CIF_CLIENT.runQuerySet();
			}
		}
		return;
	}

	/* 
     * closes the popup panel, called when query page is opened, etc.
     */
	CIF_CLIENT.closePanel=function(){
		try{
			var mainWindow=CIF_CLIENT.getmainwindow();
			var panel = mainWindow.document.getElementById ("cifclient_popup");
			panel.hidePopup ();
		} catch (err) {}
	}
	
	/* popuplate the query box in popup.html with the current page's url */
	CIF_CLIENT.populateQueryStringWithCurrentURL=function(){
		var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                   .getInterface(Components.interfaces.nsIWebNavigation)
                   .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                   .rootTreeItem
                   .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                   .getInterface(Components.interfaces.nsIDOMWindow);
			$("#querystring").val(mainWindow.getBrowser().selectedBrowser.contentWindow.location.href);
		
	}
	
} else {
    /*
	 * All of the functions specific to Chrome
	 */
	 
	/* Causes the browser to switch to the tab containing the page that calls this function */
	CIF_CLIENT.makeMeVisible=function(){
		chrome.tabs.getCurrent(function(tab){
			chrome.tabs.update(tab.id, {selected: true});
		});
		return;
	}

	/* 
	 * looks for a page with the pathname provided and switches to it. If it's not open, a new tab is opened to that path.
	 * pageName is relative to the base path of the plugin. Closes the page that calls this function.
	 */
	CIF_CLIENT.switchToPage=function(pageName){
		var views = chrome.extension.getViews({'type':'tab'});
		/* Check each tab's url to find the page we are looking for */
		for (i in views) {
			if (views[i].location.href.indexOf(chrome.extension.getURL(pageName)) == 0) {
			  views[i].CIF_CLIENT.makeMeVisible();
			  window.close();
			  return;
			} 
		}
		
		/* if not found, open a new tab */
		chrome.tabs.create({url: pageName});
		window.close();
		return;
	}

	/* opens a page in a new tab and switches to it */
	CIF_CLIENT.makeNewPage=function(pageName){
		chrome.tabs.create({url: pageName});
		return;
	}
	
	/* switches to the query page or makes a new one if it doesn't exist and runs the query */
	CIF_CLIENT.switchToQueryPageAndRun=function(newWinPref){
		var views = chrome.extension.getViews({'type':'tab'});
		
		var alwaysNewPages=false;
		try {
			miscOptions=JSON.parse(CIF_CLIENT.getItem("miscOptions"));
			alwaysNewPages=miscOptions.newTabOnquery
		} catch(err) {
			console.log(err);
		}
		if (newWinPref=='ignoreNewWindow'){
			alwaysNewPages=false;
		}
		if (!alwaysNewPages){
			/* loop through existing tabs to look for query page */
			for (var i = 0; i < views.length; i++) {
				var view = views[i];
				if (view.location.href.indexOf(chrome.extension.getURL('content/search.html'))==0) {
				  view.CIF_CLIENT.runQuerySet(); //trigger the query run on the existing query page
				  return;
				} 
			}
		}
		/* make a new page if one doesn't exist and leave flag for it to run the query */
		CIF_CLIENT.storeItem('runquery','true');
		chrome.tabs.create({url: "content/search.html"});
		return;
	}
	
	/* chrome implicitly closes the panel on new tab creations so the function doesn't do anything */
	CIF_CLIENT.closePanel=function(){
		return;//doesn't need to do anything in chrome
	}
	
	/* popuplate the query box in popup.html with the current page's url */
	CIF_CLIENT.populateQueryStringWithCurrentURL=function(){
		chrome.tabs.getSelected(null, function(tab) {
			$("#querystring").val(tab.url);
		});
	}
	
}