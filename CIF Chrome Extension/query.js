// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


var server;
var cifapikey;
var cifurl;
var logQuery;
window.querycount=0;
window.searchhashmap = {};
window.group_map = new Array();
$(document).ready(function() {
	window.protocoldata = new Array();
	settingsCheck();
	populateProtocolTranslations();
	prepSearchBox();
	runQuerySet(); 
});
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
function runQuerySet(){
	var query=JSON.parse(localStorage["query"]);
	chrome.tabs.getCurrent(function(tab){
		chrome.tabs.update(tab.id, {selected: true});
	});
	$("#loadinggif").show();
	var queries=query['query'].replace(/(\r\n|\n|\r| )/gm,',').split(',');
	var cleanedqueries = new Array();
	for (i in queries){
		if ($.trim(queries[i])!=''){
			cleanedqueries.push(queries[i]);
		}
	}
	queries=cleanedqueries;
	window.querycount+=queries.length;
	if (query['type']=='formquery'){
		server=query['server'];
		logQuery=query['logquery'];
	} else {
		server=getDefaultServer();
		logQuery=getServerLogSetting(server);
	}
	cifapikey = getServerKey(server);
	cifurl = getServerUrl(server);
	for (i in queries){
		runQuery($.trim(queries[i]),cifurl,cifapikey,logQuery);
	}
}
function prepSearchBox(){
    options = JSON.parse(localStorage["cifapiprofiles"]);
	for (i in options){
		if (options[i]['isDefault']){
			$('#serverselect').append('<option value="'+i+'" selected>'+options[i]['name']+'</option>');
		} else {
			$('#serverselect').append('<option value="'+i+'">'+options[i]['name']+'</option>');
		}
	}
	$("#theform").submit(function(){ 
		query = { 'query':$("#querystring").val().trim(),
				  'type':'formquery',
				  'server':$("#serverselect option:selected").val(),
				  'logquery':$("#logquery").is(':checked')
				 };
		localStorage['query']=JSON.stringify(query);
		runQuerySet(); 
		return false;
	});
}
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
function runQuery(string,cifurl,cifapikey,logQuery,fieldset){
	var cifquery;
	var origterm=string;
	if (string.substring(0,7)=='http://' || string.substring(0,8)=='https://'){
		
		/* remove trailing slash*/
		if(string.substr(-1) == '/') {
			string=string.substr(0, string.length - 1);
		}
		/* convert control strings to actual control characters */
		//var re = /\\x([a-zA-Z0-9]{2})/g; 
		//string = string.replace( re, function( whole, m1 ) { return String.fromCharCode( parseInt( m1, 16 ) ); });
		
		/* escape control and hi-bit chars */		
		string=uri_escape( string, /[\x00-\x1f\x7f-\xff]/g );
		/* lower case */
		string=string.toLowerCase();
		/* sha1 hex */
		//alert(string);
		string=CryptoJS.SHA1(string);
		window.searchhashmap[string]=origterm;
	} 
	cifquery=string;
	
	var noLog='';
	if (!logQuery){
		noLog='&nolog=1';
	}
	$("#stagingarea").prepend('<fieldset class="resultsfield">\
	  <legend>Results for <b>'+origterm+'</b></legend></fieldset>\
	 ');
	fieldset=$('.resultsfield',$("#stagingarea")).first();
	$.ajax({
		type: "GET",
		url: cifurl+"/"+cifquery+"?apikey="+cifapikey+"&fmt=json"+noLog, 
		dataType: "json",
		context: fieldset,
		success: function(data){
			//alert(data);
			loadingHide();
			$("#searchbox").show();
			if (data['message']=='no records') {
				showError('no results for "'+origterm+'"',$(this));
			}
			else {
				parseDataToBody(data,$(this));
				$(this).prependTo("#queries");
			}
		},
		error: function(e){ 
			var errorstring;
			if (e['status']==404){
				showError('no results for "'+origterm+'"',$(this));
				//window.close();
			} else {
				showError('error retrieving results for "'+origterm+'"',$(this));
			}
			loadingHide();
			$("#searchbox").show();
		}
	});
}
function loadingHide(){
	window.querycount--;
	$("#remainingqueries").html(window.querycount+' queries remaining');
	if (window.querycount<1) {
		$("#loadinggif").hide();
		$("#remainingqueries").html('');
		window.querycount=0;
	}
}
function showError(errorstring,fieldset){
	fieldset.html('<h3>'+errorstring+'</h3>');
	fieldset.prependTo("#queries");
}
function uri_escape( text, re ) {

    function pad( num ) {
        return num.length < 2 ? "0" + num : num;
    }

    return text.replace( re, function(v){
        return "%"+pad(v.charCodeAt(0).toString(16)).toUpperCase();
    });
}
function parseDataToBody(data,fieldset){
	feeddesc=data['data']['feed']['description'];
	if (typeof window.searchhashmap[feeddesc.replace("search ","")] != 'undefined'){
		feeddesc=window.searchhashmap[feeddesc.replace("search ","")];
	} 
	fieldset.append('<legend>Results for <b>'+feeddesc+'</b></legend>');
	fieldset.append('\
	  <span class="servername"></span><br/><span class="restriction"></span><br/><span class="detecttime"></span>\
	  <table class="results">\
	  <tr>\
		  <th>restriction</th>\
		  <th>address</th><th>protocol/ports</th>\
		  <th>detecttime</th><th>impact</th><th>severity</th><th>confidence</th>\
		  <th>description</th>\
		  <th>Incident Meta Data <br/><span class="smallfont">(<a href="#" class="expandall incident">Expand</a>/<a href="#" class="collapseall incident">Collapse</a> all)</span></th>\
		  <th>Additional Data<br/><span class="smallfont">(<a href="#" class="expandall object">Expand</a>/<a href="#" class="collapseall object">Collapse</a> all)</span></th>\
		  <th>alternativeid [restriction]</th>\
	  </tr>\
	  </table>\
	');
	$(".servername",fieldset).html("<b>Server Name:</b> "+getServerName(server));
	$(".restriction",fieldset).html("<b>Feed Restriction:</b> "+data['data']['feed']['restriction']);
	$(".detecttime",fieldset).html("<b>Time:</b> "+data['data']['feed']['restriction']);
	window.group_map=data['data']['feed']['group_map'];
	parseEntries(data['data']['feed']['entry'],fieldset);
	$('.showinfo',fieldset).click(function(){
		$('.addinfo',$(this).parent()).slideDown();
		$(this).hide();
		$('.hideinfo',$(this).parent()).show();
		return false;
	});
	$('.hideinfo',fieldset).click(function(){
		$('.addinfo',$(this).parent()).slideUp();
		$(this).hide();
		$('.showinfo',$(this).parent()).show();
		return false;
	});
	$('.expandall.incident',fieldset).click(function(){
		$('.showinfo.incidentshow',$(this).parent().parent().parent().parent()).click();
		return false;
	});
	$('.collapseall.incident',fieldset).click(function(){
		$('.hideinfo.incidenthide',$(this).parent().parent().parent().parent()).click();
		return false;
	});	
	$('.expandall.object',fieldset).click(function(){
		$('.showinfo.objectshow',$(this).parent().parent().parent().parent()).click();
		return false;
	});
	$('.collapseall.object',fieldset).click(function(){
		$('.hideinfo.objecthide',$(this).parent().parent().parent().parent()).click();
		return false;
	});
	$('.relatedevent',fieldset).each(function(){
		$(this).attr('title',"Click to query for related incident '"+$(this).attr('href')+"'");
		$(this).attr('alt',$(this).attr('title'));
		$(this).attr('server',server);
		$(this).click(function(){
			query = { 'query':$(this).attr('href'),
					  'type':'formquery',
				      'server':$(this).attr('server'),
					   'logquery':$("#logquery").is(':checked')
					};
			localStorage['query']=JSON.stringify(query);
			runQuerySet();
			return false;
		});
	});
}
function parseEntries(data,fieldset){
	for (i in data){
		parseIODEFentry(data[i],fieldset);
	}
}
function parseIODEFentry(data,fieldset){
	//alert();
	var ulchunk="<tr>";
	ulchunk+=tdwrap(extractItem('restriction',data['Incident'])); //restriction
	var address=extractItem('EventData,Flow,System,Node,Address,content',data['Incident']);
	if (address=='') address=extractItem('EventData,Flow,System,Node,Address',data['Incident']);
	ulchunk+=tdwrap(address);//address
	var protocol=translateProtocol(extractItem('EventData,Flow,System,Service,ip_protocol',data['Incident']));
	var ports=extractItem('EventData,Flow,System,Service,Portlist',data['Incident']);
	if (protocol!='' && ports!=''){
		ulchunk+=tdwrap(protocol+" / "+ports);//only need the slash separator if they are both not empty
	} else {
		ulchunk+=tdwrap(protocol+" "+ports);//protocol and ports
	}
	ulchunk+=tdwrap(extractItem('DetectTime',data['Incident'])); //detection time
	ulchunk+=tdwrap(extractItem('Assessment,Impact,content',data['Incident']));//impact
	ulchunk+=tdwrap(extractItem('Assessment,Impact,severity',data['Incident'])); //severity
	ulchunk+=tdwrap(extractItem('Assessment,Confidence,content',data['Incident'])); //confidence
	ulchunk+=tdwrap(extractItem('Description',data['Incident']));//description
	ulchunk+=tdwrap(getRelatedEventLink(data['Incident'])+parseAdditionalIncidentData(data['Incident']));//additional incident data
	ulchunk+=tdwrap(parseAdditionalObjectData(data['Incident']));//additional address data
	altid=extractItem('AlternativeID,IncidentID,content',data['Incident']);
	if (altid!='') altid="<a href='"+altid+"' target='_blank'>"+altid+"</a>";
	altidrestriction=extractItem('AlternativeID,IncidentID,restriction',data['Incident']);
	if (altidrestriction!="") altid+=' ['+altidrestriction+']';
	ulchunk+=tdwrap(altid);//alternative id and restriction
	ulchunk+="</tr>";
	$(".results",fieldset).append(ulchunk);
}
function extractItem(path,data){
	var arr=path.split(',');
	var datapath=data;
	for (i in arr){
		if (typeof datapath[arr[i]] == 'undefined') {
			return "";
		}
		datapath=datapath[arr[i]];
	}
	return datapath;
}
function tdwrap(string){
	return "<td>"+string+"</td>";
}
function parseAdditionalObjectData(Incident){
	var output='<a href="#" class="showinfo objectshow">Show Data</a><a href="#" class="hideinfo objecthide" style="display:none;">Hide Data</a>';
	output+="<div class='addinfo' style='display:none;'>";
	var items=extractItem('EventData,Flow,System,AdditionalData',Incident);
	if (items.length==0) return output+"</div>";
	if (typeof items['meaning'] != 'undefined'){
		output+='<b>'+items['meaning']+":</b> "+items['content']+"<br></div>";
		return output;
	}
	for (i in items){
		output+='<b>'+items[i]['meaning']+":</b> "+items[i]['content']+"<br>";
	}
	output+='</div>';
	return output;
}
function parseAdditionalIncidentData(Incident){
	var output='<a href="#" class="showinfo incidentshow">Show Data</a><a href="#" class="hideinfo incidenthide" style="display:none;">Hide Data</a>';
	output+="<div class='addinfo' style='display:none;'>";
	var items=extractItem('AdditionalData',Incident);
	if (items.length==0) return output;
	if (typeof items['meaning'] != 'undefined'){
		if (items['meaning']=='guid') items['content']=translateGroup(items['content']);
		output+='<b>'+items['meaning']+":</b> "+items['content']+"<br></div>";
		return output;
	}
	for (i in items){
		if (items['meaning']=='guid') items[i]['content']=translateGroup(items['content']);
		output+='<b>'+items[i]['meaning']+":</b> "+items[i]['content']+"<br>";
	}
	output+='</div>';
	return output;
}
function translateGroup(guid){
	if (typeof window.group_map[guid] != 'undefined') return window.group_map[guid];
	return guid;
}
function translateProtocol(number){
	for (i in window.protocoldata){
		if (number==window.protocoldata[i]['proto']) return window.protocoldata[i]['name'];
	}
	return number;
}
function getRelatedEventLink(Incident){
	var rel=extractItem('RelatedActivity',Incident);
	var ret="";
	if (typeof rel['IncidentID'] != 'undefined'){
		return "<a class='relatedevent' href='"+rel['IncidentID']+"'>Related Event</a><br/>";
	}
	for (i in rel){
		ret+="<a class='relatedevent' href='"+rel[i]['IncidentID']+"'>Related Event</a><br/>";
	}
	//return "<a class='relatedevent' href='example.org'>Related Event</a><br/>";
	return ret;
}