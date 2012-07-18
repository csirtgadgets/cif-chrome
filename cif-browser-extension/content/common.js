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
		var url = "http://cifclientff.ren-isac.net.local"; //need a context for localstorage in firefox
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
		$("#restriction").append('<option value="'+restrictions[i]+'">'+restrictions[i]+'</option>');
		$("#altidrestriction").append('<option value="'+restrictions[i]+'">'+restrictions[i]+'</option>');
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
CIF_CLIENT.getRestrictions=function(){
	try {
		restrictions = JSON.parse(CIF_CLIENT.getItem('restrictions'));
		if (restrictions===null) restrictions = CIF_CLIENT.defaultRestrictions();
	} catch(err){
		restrictions = CIF_CLIENT.defaultRestrictions();
	}
	//return restrictions;
	return CIF_CLIENT.defaultRestrictions();
}
CIF_CLIENT.getConfidenceMap=function(){
  try {
	confidencemap = JSON.parse(CIF_CLIENT.getItem('confidencemap'));
	if (confidencemap===null) confidencemap = CIF_CLIENT.defaultConfidence();
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
	CIF_CLIENT.protodata=new Array();
	$.ajax({
		type: "GET",
		url:'Protocol-Numbers.xml', 
		dataType: "xml",
		success: function(data){
			CIF_CLIENT.protodata=new Array();
			$(data).find("record").each(function(){
				CIF_CLIENT.protodata.push({'proto':$(this).find('value').text(), 'name':$(this).find('name').text(), 'desc':$(this).find('description').text()});
			});
			CIF_CLIENT.storeItem('protocoldata',JSON.stringify(CIF_CLIENT.protodata));
		},
		error: function (e){
			this.success($.parseXML(e['responseText']));
		}
	});
}
CIF_CLIENT.prepSearchFilters=function(){
	CIF_CLIENT.populateRestrictions();
	$("#useseverity").click(function(){
		if ($(this).is(":checked")){
			$("#severity").removeAttr('disabled');
		} else {
			$("#severity").attr('disabled',true);
		}
	});
	$("#useconfidence").click(function(){
		if ($(this).is(":checked")){
			$("#confidence").removeAttr('disabled');
		} else {
			$("#confidence").attr('disabled',true);
		}
	});
	$("#userestriction").click(function(){
		if ($(this).is(":checked")){
			$("#restriction").removeAttr('disabled');
		} else {
			$("#restriction").attr('disabled',true);
		}
	});
	$("#uselimit").click(function(){
		if ($(this).is(":checked")){
			$("#limit").removeAttr('disabled');
		} else {
			$("#limit").attr('disabled',true);
		}
	});
	$("#showfilters").attr('title',"Show additional search filters.");
	$("#showfilters").attr('alt',$(this).attr('title'));
	$("#hidefilters").attr('title',"Hide additional search filters.");
	$("#hidefilters").attr('alt',$(this).attr('title'));
	$("#showfilters").click(function(){
		$(this).hide();
		$("#hidefilters").show();
		$("#additionalfilters").slideDown();
		return false;
	});
	$("#hidefilters").click(function(){
		$(this).hide();
		$("#showfilters").show();
		$("#additionalfilters").slideUp();
		return false;
	});
}
CIF_CLIENT.getFilters=function(){
	var filters = {};
	if ($("#uselimit").is(":checked") && $('#limit').val().trim()!=''){
		filters['limit']=$('#limit').val().trim();
	}
	if ($("#useseverity").is(":checked") && $('#severity').val().trim()!=''){
		filters['severity']=$('#severity').val().trim();
	}
	if ($("#useconfidence").is(":checked") && $('#confidence').val().trim()!=''){
		filters['confidence']=$('#confidence').val().trim();
	}
	if ($("#userestriction").is(":checked") && $('#restriction').val().trim()!=''){
		filters['restriction']=$('#restriction').val().trim();
	}
	return filters;
}	
CIF_CLIENT.showVersion=function(){
	try {
		// Firefox 4 and later; Mozilla 2 and later
		Components.utils.import("resource://gre/modules/AddonManager.jsm");
		AddonManager.getAddonByID("cifclient@ren-isac.net", function(addon) {
				CIF_CLIENT.storeItem('myversion',addon.version);
				if (CIF_CLIENT.getItem('latestversion')!=undefined && CIF_CLIENT.getItem('latestversion')!=null
				 && CIF_CLIENT.getItem('latestversion')!='null'
				 && parseFloat(CIF_CLIENT.getItem('latestversion'))<=parseFloat(CIF_CLIENT.getItem('myversion'))){
					$("#version").html("v"+CIF_CLIENT.getItem('myversion'));
				} else {
					$("#version").html("v"+CIF_CLIENT.getItem('myversion')+"(latest is v"+CIF_CLIENT.getItem('latestversion')+")");
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
					$("#version").html("v"+data['version']+"(latest is v"+CIF_CLIENT.getItem('latestversion')+")");
				}
			}
		});
	}
	var lastcheck=CIF_CLIENT.getItem('lastudpatecheck');
	var ts = Math.round((new Date()).getTime() / 1000);
	if (lastcheck==undefined || lastcheck<(ts-86400)){
		CIF_CLIENT.storeItem('lastudpatecheck',ts);
		$.ajax({
			type: "GET",
			url:'https://raw.github.com/collectiveintel/cif-client-chrome/master/CIF%20Chrome%20Extension/manifest.json', 
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
			$('#serverselect').append('<option value="'+i+'" selected>'+options[i]['name']+'</option>');
		} else {
			$('#serverselect').append('<option value="'+i+'">'+options[i]['name']+'</option>');
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
		CIF_CLIENT.switchToQueryPageAndRun();
		return false;
	});
}