$(document).ready(function() {
	window.protocoldata = new Array();
	CIF_CLIENT.settingsCheck();
	CIF_CLIENT.showVersion();
	CIF_CLIENT.populateProtocolTranslations();
	CIF_CLIENT.prepSearchBox();
	if (CIF_CLIENT.getItem('runquery')=='true'){
		CIF_CLIENT.storeItem('runquery','false');
		CIF_CLIENT.runQuerySet();
	}
	$("#searchbox").show();
	CIF_CLIENT.prepSearchFilters();
});

if(!CIF_CLIENT){
    var CIF_CLIENT = {};
}
CIF_CLIENT.querycount=0;
CIF_CLIENT.searchhashmap = {};
CIF_CLIENT.runQuerySet=function(){
	$('body').animate({scrollTop:0}, 'medium');
	var query=JSON.parse(CIF_CLIENT.getItem("query"));
	if (query===null){
		query={
			'query':'',
			'logquery':false,
			'type':'formquery'
		};
	}
	CIF_CLIENT.makeMeVisible();
	$("#loadinggif").show();
	var queries=query['query'].replace(/(\r\n|\n|\r| )/gm,',').split(',');
	var cleanedqueries = new Array();
	for (i in queries){
		if ($.trim(queries[i])!=''){
			cleanedqueries.push(queries[i]);
		}
	}
	queries=cleanedqueries;
	CIF_CLIENT.querycount+=queries.length;
	var filters={};
	var server;
	var logQuery;
	if (query['type']=='formquery'){
		server=query['server'];
		logQuery=query['logquery'];
		if (typeof query['filters'] != "undefined"){
			filters=query['filters'];
		}
	} else {
		server=CIF_CLIENT.getDefaultServer();
		logQuery=CIF_CLIENT.getServerLogSetting(server);
	}
	var cifapikey = CIF_CLIENT.getServerKey(server);
	var cifurl = CIF_CLIENT.getServerUrl(server);
	for (i in queries){
		queries[i]=$.trim(queries[i]);
		if (queries[i].substring(0,7)=='hxxp://' || queries[i].substring(0,8)=='hxxps://'){
			queries[i]=queries[i].replace('hxxp','http');
		}
		CIF_CLIENT.runQuery(queries[i],filters,cifurl,cifapikey,logQuery,server);
	}
	CIF_CLIENT.loadingHide();
}


CIF_CLIENT.runQuery=function(string,filterobj,cifurl,cifapikey,logQuery,server){
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
		string=CryptoJS.SHA1(string);
		CIF_CLIENT.searchhashmap[string]=origterm;
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
	var barid = 'searchres-'+origterm+Math.random();
	$("#stagingarea").prepend('<hr><fieldset class="resultsfield" id="'+barid+'">\
	  <legend>Results for <b>'+origterm+'</b>'+prettyfilters+'</legend></fieldset>\
	 ');
	$('<li><a href="#'+barid+'">'+origterm+'</a></li>').insertAfter("#resultsheader");
	fieldset=$('.resultsfield',$("#stagingarea")).first();
	fieldset.attr('server',server);
	fieldset.attr('origterm',origterm);
	if (cifurl.charAt(cifurl.length-1)!='/'){
		cifurl+='/';
	}
	cif_connector.query({
		url:cifurl,
		query:cifquery,
		apikey:cifapikey,
		filters:filters,
		log:logQuery,
		context:fieldset,
		successFunction: function(data){
			CIF_CLIENT.querycount--;
			CIF_CLIENT.loadingHide();
			if (data==null || data['message']=='no records') {
				CIF_CLIENT.showError('no results for "'+$(this).attr('origterm')+'"',$(this));
			}
			else {
				if (data['message']=='v1'){
					CIF_CLIENT.parseDataToBody(data,$(this));
				} else {
					CIF_CLIENT.parseLegacyDataToBody(data,$(this));
				}
				$(this).prependTo("#queries");
			}
		},
		errorFunction: function(e){ 
			var errorstring;
			if (e['status']==404){
				CIF_CLIENT.showError('no results for "'+$(this).attr('origterm')+'"',$(this));
			} else if (e['status']==0) {				
				var errormsg='Error retrieving results for "'+$(this).attr('origterm')+'".';
				errormsg+='<br> If you are using a self-signed certificate, you will have to open the API in a tab once during each browsing session to accept the certificate.';
				errormsg+='<br/>Otherwise, you need to install the certificate into your browser to avoid this issue.';
				errormsg+='<br> Click <a href='+cifurl+"?apikey="+cifapikey+' target="_blank">here</a> to open the API.';
				CIF_CLIENT.showError(errormsg,$(this));
			}
			else {
				CIF_CLIENT.showError('error retrieving results for "'+$(this).attr('origterm')+'"',$(this));
			}
			CIF_CLIENT.querycount--;
			CIF_CLIENT.loadingHide();
		}
	});
}
CIF_CLIENT.loadingHide=function(){
	$("#remainingqueries").html(CIF_CLIENT.querycount+' queries remaining');
	if (CIF_CLIENT.querycount<1) {
		$("#loadinggif").hide();
		$("#remainingqueries").html('');
		CIF_CLIENT.querycount=0;
	}
}
CIF_CLIENT.showError=function(errorstring,fieldset){
	fieldset.html('<h3>'+errorstring+'</h3>');
	fieldset.prependTo("#queries");
}

CIF_CLIENT.parseDataToBody=function(data,fieldset){
	fieldset.append('\
	  <span class="servername"></span><br/>\
	  <span class="exportlinks"><b>Export:</b> <a href="#" class="btn-small btn tablebutton">Text Table</a> <a href="#" class="btn-small btn csvbutton">CSV</a></span><pre class="csv" style="display:none;"></pre><pre class="texttable" style="display:none;"></pre>\
	  <table class="table table-bordered table-condensed results table-hover"><thead>\
	  <tr>\
		  <th>restriction</th>\
		  <th>address</th><th>protocol/ports</th>\
		  <th>detecttime</th><th>impact</th><th>severity</th><th>confidence</th>\
		  <th>description</th>\
		  <th>Incident Meta Data <br/><span class="smallfont">(<a href="#" class="expandall incident">Expand</a>/<a href="#" class="collapseall incident">Collapse</a> all)</span></th>\
		  <th>Additional Data<br/><span class="smallfont">(<a href="#" class="expandall object">Expand</a>/<a href="#" class="collapseall object">Collapse</a> all)</span></th>\
		  <th>alternativeid [restriction]</th>\
	  </tr></thead><tbody></tbody>\
	  </table><hr><hr>\
	');
	$(".servername",fieldset).html("<b>Server Name:</b> "+CIF_CLIENT.getServerName(fieldset.attr('server')));
	var entries = CIF_CLIENT.parseEntries(data.entries,fieldset,'v1');
	
	var texttable=CIF_CLIENT.buildTextTable(entries);
	var csv=CIF_CLIENT.buildCSV(entries);
	$('.csv',fieldset).html(csv);
	$('.texttable',fieldset).html(texttable);
	
	$('.tablebutton',fieldset).click(function(){
		$('.texttable',$(this).parent().parent()).toggle('slow');
	});
	$('.csvbutton',fieldset).click(function(){
		$('.csv',$(this).parent().parent()).toggle('slow');
	});
	$('.showinfo',fieldset).click(function(){
		//$('.addinfo',$(this).parent()).slideDown();
		$('.addinfo',$(this).parent()).show();
		$(this).hide();
		$('.hideinfo',$(this).parent()).show();
		return false;
	});
	$('.hideinfo',fieldset).click(function(){
		//$('.addinfo',$(this).parent()).slideUp();
		$('.addinfo',$(this).parent()).hide();
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
		$(this).attr('server',$(this).parent().parent().parent().parent().parent().attr('server'));
		$(this).click(function(){
			query = { 'query':$(this).attr('href'),
					  'type':'formquery',
				      'server':$(this).attr('server'),
					   'logquery':$("#logquery").is(':checked')
					};
			CIF_CLIENT.storeItem('query',JSON.stringify(query));
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

CIF_CLIENT.parseLegacyDataToBody=function(data,fieldset){
	feeddesc=data['data']['feed']['description'];
	if (typeof CIF_CLIENT.searchhashmap[feeddesc.replace("search ","")] != 'undefined'){
		feeddesc=CIF_CLIENT.searchhashmap[feeddesc.replace("search ","")];
	} 
	//fieldset.append('<legend>Results for <b>'+feeddesc+'</b></legend>');
	fieldset.append('\
	  <span class="servername"></span><br/><span class="restriction"></span><br/><span class="detecttime"></span><br/>\
	  <span class="exportlinks"><b>Export:</b> <a href="#" class="btn-small btn tablebutton">Text Table</a> <a href="#" class="btn-small btn csvbutton">CSV</a></span><pre class="csv" style="display:none;"></pre><pre class="texttable" style="display:none;"></pre>\
	  <table class="table table-bordered table-condensed results table-hover"><thead>\
	  <tr>\
		  <th>restriction</th>\
		  <th>address</th><th>protocol/ports</th>\
		  <th>detecttime</th><th>impact</th><th>severity</th><th>confidence</th>\
		  <th>description</th>\
		  <th>Incident Meta Data <br/><span class="smallfont">(<a href="#" class="expandall incident">Expand</a>/<a href="#" class="collapseall incident">Collapse</a> all)</span></th>\
		  <th>Additional Data<br/><span class="smallfont">(<a href="#" class="expandall object">Expand</a>/<a href="#" class="collapseall object">Collapse</a> all)</span></th>\
		  <th>alternativeid [restriction]</th>\
	  </tr></thead><tbody></tbody>\
	  </table><hr><hr>\
	');
	$(".servername",fieldset).html("<b>Server Name:</b> "+CIF_CLIENT.getServerName(fieldset.attr('server')));
	$(".restriction",fieldset).html("<b>Feed Restriction:</b> "+data['data']['feed']['restriction']);
	$(".detecttime",fieldset).html("<b>Time:</b> "+data['data']['feed']['detecttime']);
	CIF_CLIENT.recordObservedGroups(data['data']['feed']['group_map']);
	var entries = CIF_CLIENT.parseEntries(data['data']['feed']['entry'],fieldset,'v0');
	
	var texttable=CIF_CLIENT.buildTextTable(entries);
	var csv=CIF_CLIENT.buildCSV(entries);
	
	
	$('.csv',fieldset).html(csv);
	$('.texttable',fieldset).html(texttable);
	
	$('.tablebutton',fieldset).click(function(){
		$('.texttable',$(this).parent().parent()).toggle('slow');
	});
	$('.csvbutton',fieldset).click(function(){
		$('.csv',$(this).parent().parent()).toggle('slow');
	});
	$('.showinfo',fieldset).click(function(){
		//$('.addinfo',$(this).parent()).slideDown();
		$('.addinfo',$(this).parent()).show();
		$(this).hide();
		$('.hideinfo',$(this).parent()).show();
		return false;
	});
	$('.hideinfo',fieldset).click(function(){
		//$('.addinfo',$(this).parent()).slideUp();
		$('.addinfo',$(this).parent()).hide();
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
		$(this).attr('server',$(this).parent().parent().parent().parent().parent().attr('server'));
		$(this).click(function(){
			query = { 'query':$(this).attr('href'),
					  'type':'formquery',
				      'server':$(this).attr('server'),
					   'logquery':$("#logquery").is(':checked')
					};
			CIF_CLIENT.storeItem('query',JSON.stringify(query));
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
CIF_CLIENT.parseEntries=function(data,fieldset,version){
	var entries = new Array();
	
	/* parse old legacy responses that may or may not be compressed */
	if (version=="v0"){
		if (data.length==1){
			if ((typeof data[0])=="string"){
				var deflated=CIF_CLIENT.poorinflate(window.atob(data[0].replace(/(\r\n|\n|\r|)/gm,'')));
				if (deflated==''){
					fieldset.prepend("<h3>This client doesn't support feeds.</h3>");
					$('.results,.restriction,.servername,.detecttime,br',fieldset).remove();
					return entries;
				} else {
					data=JSON.parse(deflated);
				}
				if (data==null || data.length==0){
					fieldset.prepend("<h3>This client doesn't support feeds.</h3>");
					$('.results,.restriction,.servername,.detecttime,br',fieldset).remove();
					return entries;
				}
			}
		}
		for (i in data){
			entries.push(CIF_CLIENT.parseIODEFentry(data[i],fieldset));
		}
	} else { /* parse new style responses */
		for (i in data){
			entries.push(CIF_CLIENT.parseV1entry(data[i],fieldset));
		}
	}
	
	/* adds a click to expand function to hide long descriptions */
	$('.description',fieldset).each(function(){
		$(this).attr('longmessage',$(this).html());
		$(this).attr('shortmessage',$(this).html().substring(0,140));
		$(this).html('<span class="shortdesc"></span><span class="longdesc" style="display:none;"></span>');
		$('.shortdesc',$(this)).html($(this).attr('shortmessage'));
		$('.longdesc',$(this)).html($(this).attr('longmessage'));
		$('.longdesc',$(this)).prepend('<a href="#" class="lessdescription">[collapse]</a>');
		$('.lessdescription',$('.longdesc',$(this))).click(function(){
				$('.shortdesc',$(this).parent().parent()).show();
				$(this).parent().hide();
				return false;
			});
		if ($(this).attr('longmessage').length>140){
			$('.shortdesc',$(this)).append('<a href="#" class="moredescription">...</a>');
			$('.moredescription',$('.shortdesc',$(this))).click(function(){
				$('.longdesc',$(this).parent().parent()).show();
				$(this).parent().hide();
				return false;
			});
		}
	});
	return entries;
}

/* parses a line that comes back from a v1 server */
CIF_CLIENT.parseV1entry=function(data,fieldset){
	var entry = {};
	for (j in data){
		if (data[j]==null) data[j]=''; // convert null entries into blank entries
	}
	if (typeof data.protocol == 'undefined') data.protocol='';
	if (typeof data.portlist == 'undefined') data.portlist='';
	jQuery.extend(entry,data);
	var ulchunk="<tr>";
	ulchunk+=CIF_CLIENT.tdwrap(data.restriction); //restriction
	ulchunk+=CIF_CLIENT.tdwrap(data.address);//address
	if (data.protocol!='' && data.portlist!=''){
		ulchunk+=CIF_CLIENT.tdwrap(CIF_CLIENT.translateProtocol(data.protocol)+" / "+data.portlist);//only need the slash separator if they are both not empty
	} else {
		ulchunk+=CIF_CLIENT.tdwrap(data.protocol+" "+data.portlist);//protocol and ports
	}
	ulchunk+=CIF_CLIENT.tdwrap(data.detecttime); //detection time
	if (data.impact==null){
		ulchunk+=CIF_CLIENT.tdwrap(data.assessment);//impact
	} else {
		ulchunk+=CIF_CLIENT.tdwrap(data.impact);//impact
	}
	ulchunk+=CIF_CLIENT.tdwrap(data.severity); //severity
	ulchunk+=CIF_CLIENT.tdwrap(data.confidence); //confidence
	ulchunk+=CIF_CLIENT.tdwrap(data.description,'description');//description
	ulchunk+=CIF_CLIENT.tdwrap(data.relatedid);//additional incident data
	ulchunk+=CIF_CLIENT.tdwrap(data.rdata+data.asn_desc+data.prefix); //additional data
	
	altid=data.alternativeid;
	if (altid!='') altid="<a href='"+altid+"' target='_blank'>"+altid+"</a>";
	altidrestriction=data.alternativeid_restriction;
	if (altidrestriction!="") altid+=' ['+altidrestriction+']';
	ulchunk+=CIF_CLIENT.tdwrap(altid);//alternative id and restriction
	ulchunk+="</tr>";
	$('tbody',$(".results",fieldset)).append(ulchunk);
	return entry;
}

/* parses an IODEF line that comes from a v0 server */
CIF_CLIENT.parseIODEFentry=function(data,fieldset){
	var entry = {};
	entry.restriction=CIF_CLIENT.extractItem('restriction',data['Incident'])	
	entry.address=CIF_CLIENT.extractItem('EventData,Flow,System,Node,Address,content',data['Incident']);
	if (entry.address=='') entry.address=CIF_CLIENT.extractItem('EventData,Flow,System,Node,Address',data['Incident']);
	entry.protocol=CIF_CLIENT.translateProtocol(CIF_CLIENT.extractItem('EventData,Flow,System,Service,ip_protocol',data['Incident']));
	entry.ports=CIF_CLIENT.extractItem('EventData,Flow,System,Service,Portlist',data['Incident']);
	entry.detecttime=CIF_CLIENT.extractItem('DetectTime',data['Incident']);
	entry.impact = CIF_CLIENT.extractItem('Assessment,Impact,content',data['Incident']);
	entry.severity = CIF_CLIENT.extractItem('Assessment,Impact,severity',data['Incident']);
	entry.confidence = CIF_CLIENT.extractItem('Assessment,Confidence,content',data['Incident']);
	entry.description = CIF_CLIENT.extractItem('Description',data['Incident']);
	entry.altid = CIF_CLIENT.extractItem('AlternativeID,IncidentID,content',data['Incident']);
	
	var ulchunk="<tr>";
	ulchunk+=CIF_CLIENT.tdwrap(entry.restriction); //restriction
	ulchunk+=CIF_CLIENT.tdwrap(entry.address);//address
	if (entry.protocol!='' && entry.ports!=''){
		ulchunk+=CIF_CLIENT.tdwrap(entry.protocol+" / "+entry.ports);//only need the slash separator if they are both not empty
	} else {
		ulchunk+=CIF_CLIENT.tdwrap(entry.protocol+" "+entry.ports);//protocol and ports
	}
	ulchunk+=CIF_CLIENT.tdwrap(entry.detecttime); //detection time
	ulchunk+=CIF_CLIENT.tdwrap(entry.impact);//impact
	ulchunk+=CIF_CLIENT.tdwrap(entry.severity); //severity
	ulchunk+=CIF_CLIENT.tdwrap(entry.confidence); //confidence
	ulchunk+=CIF_CLIENT.tdwrap(entry.description,'description');//description
	ulchunk+=CIF_CLIENT.tdwrap(CIF_CLIENT.getRelatedEventLink(data['Incident'])+CIF_CLIENT.parseAdditionalIncidentData(data['Incident']));//additional incident data
	ulchunk+=CIF_CLIENT.tdwrap(CIF_CLIENT.parseAdditionalObjectData(data['Incident']));//additional address data
	altid=entry.altid;
	if (altid!='') altid="<a href='"+altid+"' target='_blank'>"+altid+"</a>";
	altidrestriction=CIF_CLIENT.extractItem('AlternativeID,IncidentID,restriction',data['Incident']);
	if (altidrestriction!="") altid+=' ['+altidrestriction+']';
	ulchunk+=CIF_CLIENT.tdwrap(altid);//alternative id and restriction
	ulchunk+="</tr>";
	$('tbody',$(".results",fieldset)).append(ulchunk);
	return entry;
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
CIF_CLIENT.tdwrap=function(string,tdclass){
	if (!tdclass)	return "<td>"+string+"</td>";
	return "<td class='"+tdclass+"'>"+string+"</td>";
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
	try{
		var existing = JSON.parse(CIF_CLIENT.getItem("observed_groups"));
		if (existing===null) existing=new Array();
	} catch(err) {
		var existing = new Array();
	}
	for (i in existing){
		if (existing[i]['guid']==guid) return existing[i]['name'];
	}
	existing.push({'name':guid,'guid':guid});
	CIF_CLIENT.storeItem('observed_groups',JSON.stringify(existing));
	return guid;
}
CIF_CLIENT.translateProtocol=function(number){
	var protocoldata=JSON.parse(CIF_CLIENT.getItem("protocoldata"));
	for (i in protocoldata){
		if (number==protocoldata[i]['proto']) return protocoldata[i]['name'];
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
		var existing = JSON.parse(CIF_CLIENT.getItem("observed_groups"));
		if (existing===null) existing = new Array();
	} catch(err) {
		var existing = new Array();
	}
	var uniques = new Array();
	var exists=false;
	for (i in observed){
		exists=false;
		for (j in existing){
			if (observed[i]['guid']==existing[j]['guid']) {
				exists=true;
				existing[j]['name']==observed[i]['name'];//update with any newly observed names
			}
		}
		if (!exists){
			uniques.push(observed[i]);
		}
	}
	var combined=existing.concat(uniques);
	CIF_CLIENT.storeItem('observed_groups',JSON.stringify(combined));
}

/* build a plain text table from an array of entries */
CIF_CLIENT.buildTextTable=function(entries){
	var texttable="";
	var columnlengths = {}; //need to find widest character for each column in text table
	//first loop to find max widths
	for (i in entries){
		if (i==0){ //need the headers first time through
			for (j in entries[i]){
				columnlengths[j]=j.length;
			}
		}
		for (j in entries[i]){
			columnlengths[j]=(entries[i][j].length>columnlengths[j])?entries[i][j].length:columnlengths[j];
		}
	}
	//now we build the text table this time through
	for (i in entries){
		if (i==0){ //need the headers first time through
			for (j in entries[i]){
				texttable+='  '+j+new Array(columnlengths[j]-j.length+1).join(' ')+'  |';
			}
			texttable+="\n"+new Array(texttable.length+1).join('-');
			texttable+="\n";
		}
		for (j in entries[i]){
			texttable+='  '+entries[i][j]+new Array(columnlengths[j]-entries[i][j].length+1).join(' ')+'  |';
		}
		texttable+="\n";
	}
	return texttable;
}

/* build a CSV from an array of entries */
CIF_CLIENT.buildCSV=function(entries){
	var csv="";
	for (i in entries){
		if (i==0){ //need the headers first time through
			var ctr=0;
			for (j in entries[i]){
				csv+=j;
				if (ctr<(Object.keys(entries[i]).length-1)){
					csv+=',';
				} 
				
				ctr++;
			}
			csv+="\n";
		}
		var ctr=0;
		for (j in entries[i]){
			csv+=entries[i][j];
			if (ctr<(Object.keys(entries[i]).length-1)){
				csv+=',';
			}
			ctr++;
		}
		csv+="\n";
	}
	return csv;
}

/* try to decompress compressed feeds */
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