if(!CIF_CLIENT){
    var CIF_CLIENT = {};
}
var server;
var cifapikey;
var cifurl;
var logQuery;
window.querycount=0;
window.searchhashmap = {};
window.group_map = new Array();
$(document).ready(function() {
	window.protocoldata = new Array();
	CIF_CLIENT.settingsCheck();
	CIF_CLIENT.populateProtocolTranslations();
	CIF_CLIENT.prepSearchBox();
	CIF_CLIENT.runQuerySet(); 
	$("#searchbox").show();
	CIF_CLIENT.prepSearchFilters();
});

CIF_CLIENT.runQuerySet=function(){
	$('body').animate({scrollTop:0}, 'medium');
	//window.scrollTo(0, 0);
	var query=JSON.parse(localStorage["query"]);
	CIF_CLIENT.makeMeVisible("query");
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
	var filters={};
	if (query['type']=='formquery'){
		server=query['server'];
		logQuery=query['logquery'];
		filters=query['filters'];
	} else {
		server=CIF_CLIENT.getDefaultServer();
		logQuery=CIF_CLIENT.getServerLogSetting(server);
	}
	cifapikey = CIF_CLIENT.getServerKey(server);
	cifurl = CIF_CLIENT.getServerUrl(server);
	for (i in queries){
		CIF_CLIENT.runQuery($.trim(queries[i]),filters,cifurl,cifapikey,logQuery);
	}
	CIF_CLIENT.loadingHide();
}


CIF_CLIENT.runQuery=function(string,filterobj,cifurl,cifapikey,logQuery,fieldset){
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
		string=CIF_CLIENT.uri_escape( string, /[\x00-\x1f\x7f-\xff]/g );
		/* lower case */
		string=string.toLowerCase();
		/* sha1 hex */
		//alert(string);
		string=CryptoJS.SHA1(string);
		window.searchhashmap[string]=origterm;
	} 
	cifquery=string;
	
	
	var filters='';
	var prettyfilters='';
	if (typeof filterobj['limit']!='undefined'){
		filters+='&limit='+encodeURIComponent(filterobj['limit']);
		prettyfilters+="Limit: "+encodeURIComponent(filterobj['limit'])+" ";
	}
	if (typeof filterobj['restriction']!='undefined'){
		filters+='&restriction='+encodeURIComponent(filterobj['restriction']);
		prettyfilters+="Restriction: "+encodeURIComponent(filterobj['restriction'])+" ";
	}
	if (typeof filterobj['severity']!='undefined'){
		filters+='&severity='+encodeURIComponent(filterobj['severity']);
		prettyfilters+="Severity: "+encodeURIComponent(filterobj['severity'])+" ";
	}
	if (typeof filterobj['confidence']!='undefined'){
		filters+='&confidence='+encodeURIComponent(filterobj['confidence']);
		prettyfilters+="Confidence: "+encodeURIComponent(filterobj['confidence'])+" ";
	}
	if (prettyfilters!=''){
		prettyfilters=" [<b>Filters</b>: "+prettyfilters+"]";
	}
	var noLog='';
	if (!logQuery){
		noLog='&nolog=1';
	}
	$("#stagingarea").prepend('<fieldset class="resultsfield">\
	  <legend>Results for <b>'+origterm+'</b>'+prettyfilters+'</legend></fieldset>\
	 ');
	fieldset=$('.resultsfield',$("#stagingarea")).first();
	if (cifurl.charAt(cifurl.length-1)!='/'){
		cifurl+='/';
	}
	$.ajax({
		type: "GET",
		url: cifurl+cifquery+"?apikey="+cifapikey+"&fmt=json"+noLog+filters, 
		dataType: "json",
		context: fieldset,
		success: function(data){
			//alert(data);
			window.querycount--;
			CIF_CLIENT.loadingHide();
			if (data['message']=='no records') {
				CIF_CLIENT.showError('no results for "'+origterm+'"',$(this));
			}
			else {
				CIF_CLIENT.parseDataToBody(data,$(this));
				$(this).prependTo("#queries");
			}
		},
		error: function(e){ 
			var errorstring;
			if (e['status']==404){
				CIF_CLIENT.showError('no results for "'+origterm+'"',$(this));
				//window.close();
			} else if (e['status']==0) {				
				var errormsg='Error retrieving results for "'+origterm+'".';
				errormsg+='<br> If you are using a self-signed certificate, you will have to open the API in a tab once during each browsing session to accept the certificate.';
				errormsg+='<br/>Otherwise, you need to install the certificate into your browser to avoid this issue.';
				errormsg+='<br> Click <a href='+cifurl+"?apikey="+cifapikey+' target="_blank">here</a> to open the API.';
				CIF_CLIENT.showError(errormsg,$(this));
			}
			else {
				CIF_CLIENT.showError('error retrieving results for "'+origterm+'"',$(this));
			}
			window.querycount--;
			CIF_CLIENT.loadingHide();
			
		}
	});
}
CIF_CLIENT.loadingHide=function(){
	$("#remainingqueries").html(window.querycount+' queries remaining');
	if (window.querycount<1) {
		$("#loadinggif").hide();
		$("#remainingqueries").html('');
		window.querycount=0;
	}
}
CIF_CLIENT.showError=function(errorstring,fieldset){
	fieldset.html('<h3>'+errorstring+'</h3>');
	fieldset.prependTo("#queries");
}

CIF_CLIENT.parseDataToBody=function(data,fieldset){
	feeddesc=data['data']['feed']['description'];
	if (typeof window.searchhashmap[feeddesc.replace("search ","")] != 'undefined'){
		feeddesc=window.searchhashmap[feeddesc.replace("search ","")];
	} 
	//fieldset.append('<legend>Results for <b>'+feeddesc+'</b></legend>');
	fieldset.append('\
	  <span class="servername"></span><br/><span class="restriction"></span><br/><span class="detecttime"></span>\
	  <table class="results"><thead>\
	  <tr>\
		  <th>restriction</th>\
		  <th>address</th><th>protocol/ports</th>\
		  <th>detecttime</th><th>impact</th><th>severity</th><th>confidence</th>\
		  <th>description</th>\
		  <th>Incident Meta Data <br/><span class="smallfont">(<a href="#" class="expandall incident">Expand</a>/<a href="#" class="collapseall incident">Collapse</a> all)</span></th>\
		  <th>Additional Data<br/><span class="smallfont">(<a href="#" class="expandall object">Expand</a>/<a href="#" class="collapseall object">Collapse</a> all)</span></th>\
		  <th>alternativeid [restriction]</th>\
	  </tr></thead><tbody></tbody>\
	  </table>\
	');
	$(".servername",fieldset).html("<b>Server Name:</b> "+CIF_CLIENT.getServerName(server));
	$(".restriction",fieldset).html("<b>Feed Restriction:</b> "+data['data']['feed']['restriction']);
	$(".detecttime",fieldset).html("<b>Time:</b> "+data['data']['feed']['restriction']);
	window.group_map=data['data']['feed']['group_map'];
	CIF_CLIENT.recordObservedGroups(data['data']['feed']['group_map']);
	CIF_CLIENT.parseEntries(data['data']['feed']['entry'],fieldset);
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
		$('.showinfo.incidentshow',$(this).parent().parent().parent().parent().parent()).click();
		return false;
	});
	$('.collapseall.incident',fieldset).click(function(){
		$('.hideinfo.incidenthide',$(this).parent().parent().parent().parent().parent()).click();
		return false;
	});	
	$('.expandall.object',fieldset).click(function(){
		$('.showinfo.objectshow',$(this).parent().parent().parent().parent().parent()).click();
		return false;
	});
	$('.collapseall.object',fieldset).click(function(){
		$('.hideinfo.objecthide',$(this).parent().parent().parent().parent().parent()).click();
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
			CIF_CLIENT.runQuerySet();
			return false;
		});
	});
	$('.results',fieldset).dataTable({
		"bFilter": false,
		"bPaginate": false,
		"bInfo": false,
	});
}
CIF_CLIENT.parseEntries=function(data,fieldset){
	if (data.length==1){
		if ((typeof data[0])=="string"){
			var deflated=CIF_CLIENT.poorinflate(window.atob(data[0].replace(/(\r\n|\n|\r|)/gm,'')));
			if (deflated==''){
				fieldset.prepend("<h3>This client doesn't support feeds.</h3>");
				$('.results,.restriction,.servername,.detecttime,br',fieldset).remove();
				return;
			} else {
				data=JSON.parse(deflated);
			}
			if (data==null || data.length==0){
				fieldset.prepend("<h3>This client doesn't support feeds.</h3>");
				$('.results,.restriction,.servername,.detecttime,br',fieldset).remove();
				return;
			}
		}
	}
	for (i in data){
		CIF_CLIENT.parseIODEFentry(data[i],fieldset);
	}
}

CIF_CLIENT.parseIODEFentry=function(data,fieldset){
	//alert();
	var ulchunk="<tr>";
	ulchunk+=CIF_CLIENT.tdwrap(CIF_CLIENT.extractItem('restriction',data['Incident'])); //restriction
	var address=CIF_CLIENT.extractItem('EventData,Flow,System,Node,Address,content',data['Incident']);
	if (address=='') address=CIF_CLIENT.extractItem('EventData,Flow,System,Node,Address',data['Incident']);
	ulchunk+=CIF_CLIENT.tdwrap(address);//address
	var protocol=CIF_CLIENT.translateProtocol(CIF_CLIENT.extractItem('EventData,Flow,System,Service,ip_protocol',data['Incident']));
	var ports=CIF_CLIENT.extractItem('EventData,Flow,System,Service,Portlist',data['Incident']);
	if (protocol!='' && ports!=''){
		ulchunk+=CIF_CLIENT.tdwrap(protocol+" / "+ports);//only need the slash separator if they are both not empty
	} else {
		ulchunk+=CIF_CLIENT.tdwrap(protocol+" "+ports);//protocol and ports
	}
	ulchunk+=CIF_CLIENT.tdwrap(CIF_CLIENT.extractItem('DetectTime',data['Incident'])); //detection time
	ulchunk+=CIF_CLIENT.tdwrap(CIF_CLIENT.extractItem('Assessment,Impact,content',data['Incident']));//impact
	ulchunk+=CIF_CLIENT.tdwrap(CIF_CLIENT.extractItem('Assessment,Impact,severity',data['Incident'])); //severity
	ulchunk+=CIF_CLIENT.tdwrap(CIF_CLIENT.extractItem('Assessment,Confidence,content',data['Incident'])); //confidence
	ulchunk+=CIF_CLIENT.tdwrap(CIF_CLIENT.extractItem('Description',data['Incident']));//description
	ulchunk+=CIF_CLIENT.tdwrap(CIF_CLIENT.getRelatedEventLink(data['Incident'])+CIF_CLIENT.parseAdditionalIncidentData(data['Incident']));//additional incident data
	ulchunk+=CIF_CLIENT.tdwrap(CIF_CLIENT.parseAdditionalObjectData(data['Incident']));//additional address data
	altid=CIF_CLIENT.extractItem('AlternativeID,IncidentID,content',data['Incident']);
	if (altid!='') altid="<a href='"+altid+"' target='_blank'>"+altid+"</a>";
	altidrestriction=CIF_CLIENT.extractItem('AlternativeID,IncidentID,restriction',data['Incident']);
	if (altidrestriction!="") altid+=' ['+altidrestriction+']';
	ulchunk+=CIF_CLIENT.tdwrap(altid);//alternative id and restriction
	ulchunk+="</tr>";
	$('tbody',$(".results",fieldset)).append(ulchunk);
}
CIF_CLIENT.extractItem=function(path,data){
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
CIF_CLIENT.tdwrap=function(string){
	return "<td>"+string+"</td>";
}
CIF_CLIENT.parseAdditionalObjectData=function(Incident){
	var output='<a href="#" class="showinfo objectshow">Show Data</a><a href="#" class="hideinfo objecthide" style="display:none;">Hide Data</a>';
	output+="<div class='addinfo' style='display:none;'>";
	var items=CIF_CLIENT.extractItem('EventData,Flow,System,AdditionalData',Incident);
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
CIF_CLIENT.parseAdditionalIncidentData=function(Incident){
	var output='<a href="#" class="showinfo incidentshow">Show Data</a><a href="#" class="hideinfo incidenthide" style="display:none;">Hide Data</a>';
	output+="<div class='addinfo' style='display:none;'>";
	var items=CIF_CLIENT.extractItem('AdditionalData',Incident);
	if (items.length==0) return output;
	if (typeof items['meaning'] != 'undefined'){
		if (items['meaning']=='guid') items['content']=CIF_CLIENT.translateGroup(items['content']);
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
CIF_CLIENT.translateGroup=function(guid){
	if (typeof window.group_map[guid] != 'undefined') return window.group_map[guid];
	try{
		var existing = JSON.parse(localStorage["observed_groups"]);
	} catch(err) {
		var existing = new Array();
	}
	for (i in existing){
		if (existing[i]['guid']==guid) return existing[i]['name'];
	}
	return guid;
}
CIF_CLIENT.translateProtocol=function(number){
	for (i in window.protocoldata){
		if (number==window.protocoldata[i]['proto']) return window.protocoldata[i]['name'];
	}
	return number;
}
CIF_CLIENT.getRelatedEventLink=function(Incident){
	var rel=CIF_CLIENT.extractItem('RelatedActivity',Incident);
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

CIF_CLIENT.recordObservedGroups=function(groups){
	var observed = new Array();
	for (i in groups){
		observed.push({'name':groups[i],'guid':i});
	}
	try{
		var existing = JSON.parse(localStorage["observed_groups"]);
	} catch(err) {
		var existing = new Array();
	}
	var uniques = new Array();
	var exists=false;
	for (i in observed){
		exists=false;
		for (j in existing){
			if (observed[i]['name']==existing[j]['name']) exists=true;
		}
		if (!exists){
			uniques.push(observed[i]);
		}
	}
	var combined=existing.concat(uniques);
	localStorage['observed_groups']=JSON.stringify(combined);
}
CIF_CLIENT.poorinflate=function(data){
	var res=RawDeflate.inflate(data);
	if (res==""){
		data=data.substring(2,data.length);
	}
	res=RawDeflate.inflate(data);
	while (res=="" && data.length > 1){
		data=data.substring(0,data.length-2);
		res=RawDeflate.inflate(data);
	}
	return res;
}