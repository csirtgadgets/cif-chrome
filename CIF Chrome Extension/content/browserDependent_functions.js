if(!CIF_CLIENT){
    var CIF_CLIENT = {};
}
try {//see if we are in firefox
	var appInfo = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);
} catch(err){}
if (typeof appInfo != 'undefined'){ //if this is defined, we are in firefox
    /*
	 * All of the functions specific to Firefox
	 */
	CIF_CLIENT.BrowserOverlay = {
	  openDataPage : function(aEvent) {
		gBrowser.selectedTab = gBrowser.addTab('chrome://cifclient/content/adddata.html');
	  },
	  CopenDataPage : function(aEvent){
		query = { 'data':CIF_CLIENT.BrowserOverlay.getselectedtext(),
				  'type':'contextmenuadd'
				};
		CIF_CLIENT.storeItem('datatoadd',JSON.stringify(query));
		CIF_CLIENT.makeNewPage('content/adddata.html');
	  },

      openQueryPage : function(aEvent) {
		gBrowser.selectedTab = gBrowser.addTab('chrome://cifclient/content/popup.html');
	  },
	  CopenQueryPage : function(aEvent){
		query = { 'query':CIF_CLIENT.BrowserOverlay.getselectedtext(),
				  'type':'contextmenuquery'
				};
		CIF_CLIENT.storeItem('query',JSON.stringify(query));
		CIF_CLIENT.switchToQueryPageAndRun();
	  },
	  
	
	  openSettings : function(aEvent) {
		gBrowser.selectedTab = gBrowser.addTab('chrome://cifclient/content/settings.html');
	  },
	  checkForSelection : function(aEvent) {
		var seltext=CIF_CLIENT.BrowserOverlay.getselectedtext();
		if (seltext==''){
			document.getElementById("searchcifforselection").hidden = true;
			document.getElementById("addselectiontocif").hidden = true;
		} else {
			document.getElementById("searchcifforselection").setAttribute('label',"Search CIF for '"+seltext+"'");
			document.getElementById("addselectiontocif").setAttribute('label',"Add '"+seltext+"' to CIF");
			document.getElementById("searchcifforselection").hidden = false;
			document.getElementById("addselectiontocif").hidden = false;
			
		}
	  },
	  getselectedtext: function() {

		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			 .getService(Components.interfaces.nsIWindowMediator);
		var mainWindow = wm.getMostRecentWindow("navigator:browser");
		var tabBrowser = mainWindow.getBrowser();

		var selectedText = tabBrowser.contentWindow.getSelection();
		return selectedText.toString();
	  }
	};
	window.addEventListener("load", function load(event){  
		window.removeEventListener("load", load, false); //remove listener, no longer needed  
		var contextMenu = document.getElementById("contentAreaContextMenu");
		if (contextMenu) {
			contextMenu.addEventListener("popupshowing", CIF_CLIENT.BrowserOverlay.checkForSelection, false);
		}
	},false);

	
	CIF_CLIENT.makeMeVisible=function(){
		this.switchToPage(window.location.pathname.toString());
	}

	CIF_CLIENT.switchToPage=function(pageName){
		if (pageName.indexOf('/')==0) pageName=pageName.replace('/','');
		var url='chrome://cifclient/'+pageName;
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
				if (url == currentBrowser.currentURI.spec) {
					tabbrowser.selectedTab = tabbrowser.tabContainer.childNodes[index];
					browserWin.focus();
					found = true;
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
	CIF_CLIENT.getmainwindow=function(){
		var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                       .getInterface(Components.interfaces.nsIWebNavigation)
                       .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                       .rootTreeItem
                       .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                       .getInterface(Components.interfaces.nsIDOMWindow);
		return mainWindow;
	}
	CIF_CLIENT.makeNewPage=function(pageName){
		var mainWindow=CIF_CLIENT.getmainwindow();
		mainWindow.gBrowser.selectedTab = mainWindow.gBrowser.addTab('chrome://cifclient/'+pageName);
		return;
	}
	CIF_CLIENT.switchToQueryPageAndRun=function(){
		existing=CIF_CLIENT.switchToPage("content/query.html");
		if (existing){
		   var mainWindow=CIF_CLIENT.getmainwindow();
		   mainWindow.gBrowser.selectedBrowser.contentWindow.wrappedJSObject.CIF_CLIENT.runQuerySet();
		}
		return;
	}
} else {
    /*
	 * All of the functions specific to Chrome
	 */
	CIF_CLIENT.makeMeVisible=function(){
		chrome.tabs.getCurrent(function(tab){
			chrome.tabs.update(tab.id, {selected: true});
		});
		return;
	}

	CIF_CLIENT.switchToPage=function(pageName){
		var views = chrome.extension.getViews({'type':'tab'});
		for (i in views) {
			if (views[i].location.href == chrome.extension.getURL(pageName)) {
			  views[i].CIF_CLIENT.makeMeVisible();
			  window.close();
			  return;
			} 
		}
		chrome.tabs.create({url: pageName},function(tab){
			if (pageName=="content/query.html"){
				window.cifquerytabid=tab.id;
			}
			else if (pageName=="content/settings.html"){
				window.cifsettingstabid=tab.id;
			}
		});
		window.close();
		return;
	}

	CIF_CLIENT.makeNewPage=function(pageName){
		chrome.tabs.create({url: pageName});
		return;
	}
	CIF_CLIENT.switchToQueryPageAndRun=function(){
		var views = chrome.extension.getViews({'type':'tab'});
		for (var i = 0; i < views.length; i++) {
			var view = views[i];
			if (view.location.href == chrome.extension.getURL('content/query.html')) {
			  view.CIF_CLIENT.runQuerySet();
			  return;
			} 
		}
		chrome.tabs.create({url: "content/query.html"});
		return;
	}
}