if(!CIF_CLIENT){
    var CIF_CLIENT = {};
}


CIF_CLIENT.getServerLogSetting=function(server){
	servers = JSON.parse(localStorage["cifapiprofiles"]);
	return servers[server]['logQueries'];
}
CIF_CLIENT.getServerName=function(server){
	servers = JSON.parse(localStorage["cifapiprofiles"]);
	return servers[server]['name'];
}
CIF_CLIENT.getDefaultServer=function(){
	servers = JSON.parse(localStorage["cifapiprofiles"]);
	for (i in servers){
		if (servers[i]['isDefault']) return i;
	}
	return 0;
}
CIF_CLIENT.getServerUrl=function(server){
	servers = JSON.parse(localStorage["cifapiprofiles"]);
	return servers[server]['url'];
}
CIF_CLIENT.getServerKey=function(server){
	servers = JSON.parse(localStorage["cifapiprofiles"]);
	return servers[server]['key'];
}

CIF_CLIENT.uri_escape=function( text, re ) {

    function pad( num ) {
        return num.length < 2 ? "0" + num : num;
    }

    return text.replace( re, function(v){
        return "%"+pad(v.charCodeAt(0).toString(16)).toUpperCase();
    });
}
CIF_CLIENT.settingsCheck=function(){
    try{
		options = JSON.parse(localStorage["cifapiprofiles"]);
	} catch(err) {
		options = new Array();
	}
	if (options.length<1 || options == null){
		CIF_CLIENT.switchToPage('core/settings.html');
	}
	return;
}
CIF_CLIENT.getRestrictions=function(){
	try {
		restrictions = JSON.parse(localStorage['restrictions']);
	} catch(err){
		restrictions = CIF_CLIENT.defaultRestrictions();
	}
	//return restrictions;
	return CIF_CLIENT.defaultRestrictions();
}
CIF_CLIENT.getConfidenceMap=function(){
  try {
	confidencemap = JSON.parse(localStorage['confidencemap']);
  } catch(err){
	confidencemap = CIF_CLIENT.defaultConfidence();
  }
  return confidencemap;
}
CIF_CLIENT.defaultRestrictions=function(){
	res = new Array();
	res.push('private');
	res.push('need-to-know');
	res.push('public');
	res.push('default');
	return res;
}
CIF_CLIENT.defaultConfidence=function(){
	confidencemap = new Array();
	confidencemap.push({'numeric':'41','word':'Not Confident'});
	confidencemap.push({'numeric':'75','word':'Somewhat Confident'});
	confidencemap.push({'numeric':'85','word':'Very Confident'});
	confidencemap.push({'numeric':'95','word':'Certain'});
	return confidencemap;
}
CIF_CLIENT.populateProtocolTranslations=function(){
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