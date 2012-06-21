// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var query;
var server;
var cifapikey;
var cifurl;
var logQuery;
$(document).ready(function() {
	window.protocoldata = new Array();
	populateProtocolTranslations();
	prepSearchBox();
	runQuerySet(); 
});
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
	query=JSON.parse(localStorage["query"]);
	chrome.tabs.getCurrent(function(tab){
		chrome.tabs.update(tab.id, {selected: true});
	});
	$("#loadinggif").show();
	queries=query['query'].split(',');
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
function runQuery(string,cifurl,cifapikey,logQuery){
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
	} 
	cifquery=string;
	
	var noLog='';
	if (!logQuery){
		noLog='&nolog=1';
	}
	$.getJSON(cifurl+cifquery+"?apikey="+cifapikey+"&fmt=json"+noLog,function(data) {
		//alert(data);
		$("#loadinggif").hide();
		$("#searchbox").show();
		if (data['message']=='no records') {
			showError('no results for "'+string+'"');
		}
		else {
			parseDataToBody(data);
		}
	}).error(function(e){ 
		var errorstring;
		if (e['status']==404){
			showError('no results for "'+string+'"');
			//window.close();
		} else {
			showError('error retrieving results for "'+origterm+'"');
		}
		$("#loadinggif").hide();
		$("#searchbox").show();
	});
}
function showError(errorstring){
	$('#queries').prepend('<fieldset><h3>'+errorstring+'</h3></fieldset>');
}
function uri_escape( text, re ) {

    function pad( num ) {
        return num.length < 2 ? "0" + num : num;
    }

    return text.replace( re, function(v){
        return "%"+pad(v.charCodeAt(0).toString(16)).toUpperCase();
    });
}
function parseDataToBody(data){
	$("#queries").prepend('<fieldset class="resultsfield">\
	  <legend>Results for <b>'+data['data']['feed']['description']+'</b></legend></fieldset>\
	 ');
	$(".resultsfield").first().append('\
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
	$(".servername").first().html("<b>Server Name:</b> "+getServerName(server));
	$.each(data['data']['feed'], function(key, val) {
		if (key==="restriction"){ $(".restriction").first().html("<b>Feed Restriction:</b> "+val);}
		if (key==="detecttime") { $(".detecttime").first().html("<b>Time:</b> "+val);}
		if (key==="entry") { parseEntries(val);}
		if (key==="group_map") {window.group_map=val;}
	});
	$('.showinfo',$(".resultsfield").first()).click(function(){
		$('.addinfo',$(this).parent()).slideDown();
		$(this).hide();
		$('.hideinfo',$(this).parent()).show();
		return false;
	});
	$('.hideinfo',$(".resultsfield").first()).click(function(){
		$('.addinfo',$(this).parent()).slideUp();
		$(this).hide();
		$('.showinfo',$(this).parent()).show();
		return false;
	});
	$('.expandall.incident',$(".resultsfield").first()).click(function(){
		$('.showinfo.incidentshow',$(this).parent().parent().parent().parent()).click();
		return false;
	});
	$('.collapseall.incident',$(".resultsfield").first()).click(function(){
		$('.hideinfo.incidenthide',$(this).parent().parent().parent().parent()).click();
		return false;
	});	
	$('.expandall.object',$(".resultsfield").first()).click(function(){
		$('.showinfo.objectshow',$(this).parent().parent().parent().parent()).click();
		return false;
	});
	$('.collapseall.object',$(".resultsfield").first()).click(function(){
		$('.hideinfo.objecthide',$(this).parent().parent().parent().parent()).click();
		return false;
	});
	$('.relatedevent',$(".resultsfield").first()).each(function(){
		$(this).attr('title',"Click to query for related incident '"+$(this).attr('href')+"'");
		$(this).attr('alt',$(this).attr('title'));
		$(this).attr('server',server);
		$(this).click(function(){
			query = { 'query':$(this).attr('href'),
					  'type':'formquery',
				      'server':$(this).attr('server'),
					   'logquery':$("#logquery").is(':checked')
					};
			localStorage['datatoadd']=JSON.stringify(query);
			runQuerySet();
			return false;
		});
	});
	
	
}
function parseEntries(data){
	$.each(data, function(key, val) {
		parseIODEFentry(val);
	});
}
function parseIODEFentry(data){
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
	$(".results").first().append(ulchunk);
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