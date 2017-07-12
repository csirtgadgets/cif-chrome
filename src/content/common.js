if(!CIF_CLIENT){
    var CIF_CLIENT = {};
}

//need to determine how local storage will work depending on the browser
CIF_CLIENT.getStorageContext=function(){
	var storage;
	try {//see if we are in firefox
		var appInfo = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);
	} catch(err){}
	if (typeof appInfo != 'undefined'){ //if this is defined, we are in firefox
		var url = "http://cif-client-chrome.csirtgadgets.org.local"; //need a context for localstorage in firefox
		var ios = Components.classes["@mozilla.org/network/io-service;1"]
				  .getService(Components.interfaces.nsIIOService);
		var ssm = Components.classes["@mozilla.org/scriptsecuritymanager;1"]
				  .getService(Components.interfaces.nsIScriptSecurityManager);
		var dsm = Components.classes["@mozilla.org/dom/storagemanager;1"]
				  .getService(Components.interfaces.nsIDOMStorageManager);

		var uri = ios.newURI(url, "", null);
		var principal = ssm.getCodebasePrincipal(uri);
		storage = dsm.getLocalStorageForPrincipal(principal, "");
	} else {
		storage = localStorage;
	}
	return storage;
}
CIF_CLIENT.storeItem=function(key,value){
    var storage=CIF_CLIENT.getStorageContext();
    return storage.setItem(key, value);
}
CIF_CLIENT.getItem=function(key){
	var storage=CIF_CLIENT.getStorageContext();
	return storage.getItem(key);
}
CIF_CLIENT.populateRestrictions=function(){
	restrictions = CIF_CLIENT.getRestrictions();
	for (i in restrictions){
        selected = '';
        if(restrictions[i] == 'default'){
            selected = ' selected';
        }
		$("#restriction").append('<option value="'+restrictions[i]+'"'+selected+'>'+restrictions[i]+'</option>');
		$("#altidrestriction").append('<option value="'+restrictions[i]+'"'+selected+'>'+restrictions[i]+'</option>');
	}
}
CIF_CLIENT.getServerLogSetting=function(server){
	servers = JSON.parse(CIF_CLIENT.getItem("cifapiprofiles"));
	return servers[server]['logQueries'];
}
CIF_CLIENT.getServerName=function(server){
	servers = JSON.parse(CIF_CLIENT.getItem("cifapiprofiles"));
	return servers[server]['name'];
}
CIF_CLIENT.getDefaultServer=function(){
	servers = JSON.parse(CIF_CLIENT.getItem("cifapiprofiles"));
	for (i in servers){
		if (servers[i]['isDefault']) return i;
	}
	return 0;
}

CIF_CLIENT.getServerGroups=function(server){
	servers = JSON.parse(CIF_CLIENT.getItem('cifapiprofiles'));
	return servers[server]['groups']
}

CIF_CLIENT.getServerProvider=function(server){
	servers = JSON.parse(CIF_CLIENT.getItem('cifapiprofiles'));
	return servers[server]['provider']
}

CIF_CLIENT.getServerUrl=function(server){
	servers = JSON.parse(CIF_CLIENT.getItem("cifapiprofiles"));
	return servers[server]['url'];
}
CIF_CLIENT.getServerKey=function(server){
	servers = JSON.parse(CIF_CLIENT.getItem("cifapiprofiles"));
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
		options = JSON.parse(CIF_CLIENT.getItem("cifapiprofiles"));
		if (options===null) options=new Array();
	} catch(err) {
		options = new Array();
	}
	if (options.length<1 || options == null){
		CIF_CLIENT.switchToPage('content/settings.html');
		window.close();
		return false;
	}
	return true;
}

CIF_CLIENT.showVersion=function(){
	try {
		// Firefox 4 and later; Mozilla 2 and later
		Components.utils.import("resource://gre/modules/AddonManager.jsm");
		AddonManager.getAddonByID("contact@csirtgadgets.org", function(addon) {
				CIF_CLIENT.storeItem('myversion',addon.version);
				if (CIF_CLIENT.getItem('latestversion')!=undefined && CIF_CLIENT.getItem('latestversion')!=null
				 && CIF_CLIENT.getItem('latestversion')!='null'
				 && parseFloat(CIF_CLIENT.getItem('latestversion'))<=parseFloat(CIF_CLIENT.getItem('myversion'))){
					$("#version").html("v"+CIF_CLIENT.getItem('myversion'));
				} else {
					//$("#version").html("v"+CIF_CLIENT.getItem('myversion')+"(latest is v"+CIF_CLIENT.getItem('latestversion')+")");//don't need version checking
					$("#version").html("v"+CIF_CLIENT.getItem('myversion'));
				}
		});
	}
	catch (ex) { //above throws an error if not firefox.
		$.ajax({
			type: "GET",
			url:'../manifest.json',
			dataType: "json",
			success: function(data){
				CIF_CLIENT.storeItem('myversion',data['version']);
				if (CIF_CLIENT.getItem('latestversion')!=undefined && CIF_CLIENT.getItem('latestversion')!=null
				 && parseFloat(CIF_CLIENT.getItem('latestversion'))<=parseFloat(CIF_CLIENT.getItem('myversion'))){
					$("#version").html("v"+data['version']);
				} else {
					//$("#version").html("v"+data['version']+"(latest is v"+CIF_CLIENT.getItem('latestversion')+")"); //don't need version checking
					$("#version").html("v"+data['version']);
				}
			}
		});
	}
	return;//don't need version checking
	var lastcheck=CIF_CLIENT.getItem('lastudpatecheck');
	var ts = Math.round((new Date()).getTime() / 1000);
	if (lastcheck==undefined || lastcheck<(ts-86400)){
		CIF_CLIENT.storeItem('lastudpatecheck',ts);
		$.ajax({
			type: "GET",
			url:'https://raw.githubusercontent.com/csirtgadgets/cif-browsers/master/cif-browser-extension/manifest.json',
			dataType: "json",
			success: function(data){
				CIF_CLIENT.storeItem('latestversion',data['version']);
			}
		});
	}
}

CIF_CLIENT.prepSearchBox=function(){
    options = JSON.parse(CIF_CLIENT.getItem("cifapiprofiles"));
	for (i in options){
		if (options[i]['isDefault']){
			$('#serverselect').append('<option value="'+ i +'" selected>'+ options[i]['name'].toString() +'</option>');
		} else {
			$('#serverselect').append('<option value="'+ i +'">'+ options[i]['name'].toString() +'</option>');
		}
	}
	$('#serverselect').change(function(){
		if (CIF_CLIENT.getServerLogSetting($(this).val())){
			$("#logquery").attr('checked',true);
		} else {
			$("#logquery").removeAttr('checked');
		}
	}).change();
	$("#theform").submit(function(){
		query = { 'query':$("#querystring").val().trim(),
				  'type':'formquery',
				  'filters': CIF_CLIENT.getFilters(),
				  'server':$("#serverselect option:selected").val(),
				  'logquery':$("#logquery").is(':checked')
				 };
		CIF_CLIENT.closePanel();
		CIF_CLIENT.storeItem('query',JSON.stringify(query));
		if ($(this).hasClass('inwindow')){
			CIF_CLIENT.switchToQueryPageAndRun('ignoreNewWindow');
		} else {
			CIF_CLIENT.switchToQueryPageAndRun();
		}
		return false;
	});
}
