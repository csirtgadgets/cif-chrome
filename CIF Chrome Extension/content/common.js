if(!CIF_CLIENT){
    var CIF_CLIENT = {};
}

CIF_CLIENT.populateRestrictions=function(){
	restrictions = CIF_CLIENT.getRestrictions();
	for (i in restrictions){
		$("#restriction").append('<option value="'+restrictions[i]+'">'+restrictions[i]+'</option>');
		$("#altidrestriction").append('<option value="'+restrictions[i]+'">'+restrictions[i]+'</option>');
	}
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
		CIF_CLIENT.switchToPage('content/settings.html');
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
	$.ajax({
		type: "GET",
		url:'../manifest.json', 
		dataType: "json",
		success: function(data){
			if (localStorage['latestversion']!=undefined 
			 && localStorage['latestversion']==localStorage['myversion']){
				$("#version").html("v"+data['version']);
			} else {
				$("#version").html("v"+data['version']+"(latest is v"+localStorage['latestversion']+")");
			}
			localStorage['myversion']=data['version'];
		}
	});
	var lastcheck=localStorage['lastudpatecheck'];
	var ts = Math.round((new Date()).getTime() / 1000);
	if (lastcheck==undefined || lastcheck<(ts-86400)){
		localStorage['lastudpatecheck']=ts;
		$.ajax({
			type: "GET",
			url:'https://raw.github.com/collectiveintel/cif-client-chrome/master/CIF%20Chrome%20Extension/manifest.json', 
			dataType: "json",
			success: function(data){
				localStorage['latestversion']=data['version'];
			}
		});
	}
}
CIF_CLIENT.prepSearchBox=function(){
    options = JSON.parse(localStorage["cifapiprofiles"]);
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
		localStorage['query']=JSON.stringify(query);
		CIF_CLIENT.switchToQueryPageAndRun(); 
		return false;
	});
}