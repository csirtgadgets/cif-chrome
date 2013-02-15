$(document).ready(function() {
	try{
		var fromcontext=JSON.parse(CIF_CLIENT.getItem("datatoadd"));
		$('#datapoints').val(fromcontext['data']);
	} catch(err) {}
	CIF_CLIENT.settingsCheck();
	CIF_CLIENT.populateProtocols();
	CIF_CLIENT.populateRestrictions();
	CIF_CLIENT.populateConfidenceValues();
	CIF_CLIENT.addObservedGroups();
	CIF_CLIENT.parseDataInput();
	CIF_CLIENT.prepServerBox();
	$("#removealtid,#addaltid").click(function(){
		CIF_CLIENT.togglealternativeidinput();
	});
	$("#datapoints").keyup(function(){
		window.clearTimeout(window.keyuptimeoutid);
		window.keyuptimeoutid=window.setTimeout(CIF_CLIENT.parseDataInput,1000, true);
	});
	$("#submitbutton").click(function(){
		CIF_CLIENT.submitData();
		return false;
	});
});
if(!CIF_CLIENT){
    var CIF_CLIENT = {};
}
CIF_CLIENT.togglealternativeidinput=function(){
	if ($("#removealtid").is(":visible")){
		$("#altidrestriction-tr").hide();
		$("#altid-tr").hide();	
		$("#addaltid").show();
		$("#removealtid").hide();
		$("#altid").val('');
	} else {
		$("#altidrestriction-tr").show();
		$("#altid-tr").show();
		$("#addaltid").hide();
		$("#removealtid").show();
	}
}
CIF_CLIENT.severitynull=function(){
	$("option",$("#severity")).remove();
	$("#severity").append('<option value="null">Null</option>');
}
CIF_CLIENT.severitynotnull=function(){
	$("option",$("#severity")).remove();
	$("#severity").append('<option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>');
}
CIF_CLIENT.submitData=function(){
	$("#submitbutton").attr("disabled","disabled");
	var groups = new Array();
	$('.groupbox:checked').each(function() {
		groups.push($(this).val());
	});
	if ($("#description").val().trim()==''){
		CIF_CLIENT.showError("Please enter a description.");
		return;
	}
	if (groups.length<1){
		CIF_CLIENT.showError("Please select at least one group.");
		return;
	}
	if (window.datapoints.length==0 || $.trim(window.datapoints[0])==''){
		CIF_CLIENT.showError("Please enter some data.");
		return;
	}
	window.groupstosendto=groups;
	CIF_CLIENT.sendToServer();
}
CIF_CLIENT.sendToServer=function(){
	$("#submissionstatus").html('<div class="alert">Submitting...<img src="images/ajax-loader.gif" id="loadinggif"/></div>');
	var server=$("#serverselect").val();
	var cifapikey = CIF_CLIENT.getServerKey(server);
	var cifurl = CIF_CLIENT.getServerUrl(server);
	var dataToSend = new Array();
	for (i in window.datapoints){
		for (j in window.groupstosendto){
			var individualentry={'address':window.datapoints[i],
							'assessment':$("#assessment option:selected").val(),
							'description':$("#description").val().trim(),
							'portlist':$("#portlist").val().trim(),
							'protocol':$("#protocol option:selected").val(),
							'confidence':$("#confidence option:selected").val(),
							'guid': window.groupstosendto[j],
							'restriction':$("#restriction option:selected").val().toLowerCase(),
							};
			if ($("#altid").val().trim()!=''){
				individualentry['alternativeid']=$("#altid").val().trim();
				individualentry['alternativeid_restriction']=$("#altidrestriction option:selected").val().toLowerCase();
			}
			dataToSend.push(individualentry);
		}
	}
	window.dataToSend=dataToSend;
	cif_connector.post({
		url:cifurl,
		apikey:cifapikey,
		entries:dataToSend,
		successFunction: function(data){
			CIF_CLIENT.parseResponse(data);
			CIF_CLIENT.resetForm();
		},
		errorFunction: function(e){ 
			if (e['status']==401){
				CIF_CLIENT.showError("Error: Authorization required. Does your API key have write access?");
			} else if (e['status']==0){ 
				CIF_CLIENT.showError('Could not connect to the server. Try testing your server with a query.');
			}
			else {
				CIF_CLIENT.showError('Internal Server Error: '+e['responseText']);
			}
			console.log(e);
		}
	});
}
CIF_CLIENT.prepServerBox=function(){    
	options = JSON.parse(CIF_CLIENT.getItem("cifapiprofiles"));
	for (i in options){
		if (options[i]['isDefault']){
			$('#serverselect').append('<option value="'+i+'" selected>'+options[i]['name']+'</option>');
		} else {
			$('#serverselect').append('<option value="'+i+'">'+options[i]['name']+'</option>');
		}
	}
}
CIF_CLIENT.resetForm=function(){
	$("#datapoints").val('');
	$("#datapoints").keyup();
	if ($("#removealtid").is(":visible")){
		CIF_CLIENT.togglealternativeidinput();
	}
	$("#description").val('unknown');
	$("option",$("#protocol")).removeAttr('selected');
}
CIF_CLIENT.showError=function(string){
	$("#submitbutton").removeAttr("disabled");
	$("#submissionstatus").html("<h4 style='color:red;'>"+string+"</h4>");
}
CIF_CLIENT.parseResponse=function(data){
	$("#submitbutton").removeAttr("disabled");
	$("#submissionstatus").html('');
	for (i in data['data']){
	    // TODO add twitter button?
		var tweettext=encodeURIComponent("Submitted "+window.dataToSend[i]['address']+" to CIF");
		var tweetbutton='<a href="http://twitter.com/intent/tweet?text='+tweettext+'" target="_blank"><img alt="Tweet this" title="Tweet this" src="./images/tt-micro3.png"/></a>';
		tweetbutton=''; //disable twitter for future work
		$("#submissionstatus").append('<div class="alert alert-success"><b>'+window.dataToSend[i]['address']+'</b> submitted with ID <b>'+data['data'][i]+'</b> '+tweetbutton+'<br/></div>');
	}
}
CIF_CLIENT.addObservedGroups=function(){
	try{
		var observedgroups=JSON.parse(CIF_CLIENT.getItem("observed_groups"));
		for (i in observedgroups){
			if (observedgroups[i]['name']!="everyone"){
				$("#groupboxarea").append('<input type="checkbox" id="datapoints" class="groupbox" value="'+observedgroups[i]['name']+'"/>'+observedgroups[i]['name']+'<br>');
			}
		}
	} catch(err) {}
}

CIF_CLIENT.populateProtocols=function(moreplease){
	moreplease = (typeof moreplease !== 'undefined') ? moreplease : false;
	var protocoldata=JSON.parse(CIF_CLIENT.getItem("protocoldata"));
	var popularprotocols = new Array('4','6','17');
	$("#protocol").append('<option value="" id="naoption">N/A</option>');
	for (i in protocoldata){
		if ($.inArray(protocoldata[i]['proto'],popularprotocols)!=-1 || moreplease){
			$("#protocol").append("<option value='"+protocoldata[i]['proto']+"'>"+protocoldata[i]['proto']+". "+protocoldata[i]['name']+"   ("+protocoldata[i]['desc']+")</option>");
		}
	}
	if (!moreplease){
		$("#protocol").append("<option value='moreplease'>(Click this for more)</option>");
		$("#protocol").change(function(){
			if ($(this).val()=='moreplease'){
				$(this).html('');
				CIF_CLIENT.populateProtocols(true);
			}
		});
	}
}

//parses the input field to determine the entry types
CIF_CLIENT.parseDataInput=function(){
	var points=$("#datapoints").val().replace(/(\r\n|\n|\r| )/gm,',').split(',');
	var sorted_arr = points.sort();
	points = [];
	for (i in sorted_arr) {
		if (i>1000) continue; //sets maximum number of data points that can be submitted at once
		if ((sorted_arr[i + 1] != sorted_arr[i]) && $.trim(sorted_arr[i])!='') {
			points.push($.trim(sorted_arr[i]));
		} 
	}
	var urlRegex = /(https?:\/\/[^\s]+)/;
	var typesfound= {};
	typesfound['url']=false;
	typesfound['ipordomain']=false;
	typesfound['email']=false;
	typesfound['uid']=false;

	$("#detectedentries").empty();
	$("#protocol-tr, #portlist-tr").show();
	$("#portlist").val('');
	$("option",$("#protocol")).removeAttr('selected');
	$("option[value='']",$("#protocol")).attr('selected',true);
	for (i in points){
		if (urlRegex.test(points[i])){
			typesfound['url']=true;
			var copy=points[i];
			if (points[i].substring(0,7)=='http://'){
				$("#portlist").val('80');
				copy=copy.replace("http://","");
			}
			else if (points[i].substring(0,8)=='https://'){
				$("#portlist").val('443');
				copy=copy.replace("https://","");
			}
			$("option",$("#protocol")).removeAttr('selected');
			$("option[value=6]",$("#protocol")).attr('selected',true);
			//remove any leading slashes
			while (copy.indexOf('/') == 0){
				copy=copy.replace('/');
			}
			if (copy.indexOf(':') != -1){
				if (copy.indexOf('/') != -1){
					$("#portlist").val(copy.substr(copy.indexOf(':')+1,copy.indexOf('/')-copy.indexOf(':')-1));
				} else {
					$("#portlist").val(copy.substr(copy.indexOf(':')+1,(copy.length-copy.indexOf(':'))-1));
				}
			}
			$("#protocol-tr, #portlist-tr").hide();
			$("#detectedentries").append("<li><b>URL:</b> "+points[i]+"</li>");
		} 
		else if (points[i].indexOf('@') != -1){
			$("option",$("#protocol")).removeAttr('selected');
			$("#naoption").attr('selected',true);
			$("#portlist").val('');
			$("#protocol-tr, #portlist-tr").hide();
			typesfound['email']=true;
			$("#detectedentries").append("<li><b>Email:</b> "+points[i]+"</li>");
		}
		else if (points[i].match(/^[a-fA-F0-9]{32}$/) || points[i].match(/^[a-fA-F0-9]{40}$/) 
				|| points[i].match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)){
			typesfound['uid']=true;
			$("#detectedentries").append("<li><b>SHA1/MD5/UUID:</b> "+points[i]+"</li>");
		}
		else {
			$("#protocol-tr, #portlist-tr").show();
			typesfound['ipordomain']=true;
			$("#detectedentries").append("<li><b>address:</b> "+points[i]+"</li>");
		}
	}
	window.datapoints=points;
	var toomany=false;
	var onefound=false;
	for (i in typesfound){
		if (typesfound[i]==true){
			if (!onefound){
				onefound=true;
			} else {
				toomany=true;
			}
		}
	}
	if (toomany){
		$("#submitbutton").attr("disabled","disabled");
		$("#mixedContentWarning").show();
		$("#datapoints").css('border-color', 'red');
	} else {
		$("#mixedContentWarning").hide();
		$("#submitbutton").removeAttr("disabled");
		$("#datapoints").css('border-color', 'black');
		$("#datapoints").css('border-color', 'none');
	}
}

CIF_CLIENT.populateConfidenceValues=function (){
	cons = CIF_CLIENT.getConfidenceMap();
	for (i in cons){
		$("#confidence").append('<option value="'+cons[i]['numeric']+'">'+cons[i]['word']+'</option>');
	}
}