


function getServerLogSetting(server){
	servers = JSON.parse(localStorage["cifapiprofiles"]);
	return servers[server]['logQueries'];
}
function getServerName(server){
	servers = JSON.parse(localStorage["cifapiprofiles"]);
	return servers[server]['name'];
}
function getDefaultServer(){
	servers = JSON.parse(localStorage["cifapiprofiles"]);
	for (i in servers){
		if (servers[i]['isDefault']) return i;
	}
	return 0;
}
function getServerUrl(server){
	servers = JSON.parse(localStorage["cifapiprofiles"]);
	return servers[server]['url'];
}
function getServerKey(server){
	servers = JSON.parse(localStorage["cifapiprofiles"]);
	return servers[server]['key'];
}

function uri_escape( text, re ) {

    function pad( num ) {
        return num.length < 2 ? "0" + num : num;
    }

    return text.replace( re, function(v){
        return "%"+pad(v.charCodeAt(0).toString(16)).toUpperCase();
    });
}
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
function getRestrictions(){
	try {
		restrictions = JSON.parse(localStorage['restrictions']);
	} catch(err){
		restrictions = defaultRestrictions();
	}
	//return restrictions;
	return defaultRestrictions();
}
function getConfidenceMap(){
  try {
	confidencemap = JSON.parse(localStorage['confidencemap']);
  } catch(err){
	confidencemap = defaultConfidence();
  }
  return confidencemap;
}
function defaultRestrictions(){
	res = new Array();
	res.push('private');
	res.push('need-to-know');
	res.push('public');
	res.push('default');
	return res;
}
function defaultConfidence(){
	confidencemap = new Array();
	confidencemap.push({'numeric':'41','word':'Not Confident'});
	confidencemap.push({'numeric':'75','word':'Somewhat Confident'});
	confidencemap.push({'numeric':'85','word':'Very Confident'});
	confidencemap.push({'numeric':'95','word':'Certain'});
	return confidencemap;
}
function populateProtocolTranslations(){
	$.ajax({
		type: "GET",
		url:'Protocol-Numbers.xml', 
		dataType: "xml",
		success: function(data){
			$(data).find("record").each(function(){
				window.protocoldata.push({'proto':$(this).find('value').text(), 'name':$(this).find('name').text(), 'desc':$(this).find('description').text()});
			});
		}
	});
}