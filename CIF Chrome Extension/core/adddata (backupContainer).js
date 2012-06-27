$(document).ready(function() {
	try{
		var fromcontext=JSON.parse(localStorage["datatoadd"]);
		$('#datapoints').val(fromcontext['data']);
	} catch(err) {}
	populateProtocols();
	populateRestrictions();
	populateConfidenceValues();
	addObservedGroups();
	parseDataInput();
	prepServerBox();
	$("#datapoints").keyup(function(){
		window.clearTimeout(window.keyuptimeoutid);
		window.keyuptimeoutid=window.setTimeout(parseDataInput,1000, true);
	});
	$("#submitbutton").click(function(){
		submitData();
	});
	$("#impact").change(function(){
		if ($("#impact option:selected").val()=='whitelist'){
			severitynull();
		} else {
			severitynotnull();
		}
	});
	severitynotnull();
});
function severitynull(){
	$("option",$("#severity")).remove();
	$("#severity").append('<option value="null">Null</option>');
}
function severitynotnull(){
	$("option",$("#severity")).remove();
	$("#severity").append('<option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>');
}
function submitData(){
	$("#submitbutton").attr("disabled","disabled");
	var groups = new Array();
	$('.groupbox:checked').each(function() {
		groups.push($(this).val());
	});
	if ($("#description").val().trim()==''){
		showError("Please enter a description.");
		return;
	}
	if (groups.length<1){
		showError("Please select at least one group.");
		return;
	}
	window.groupstosendto=groups;
	sendToServer();
}
function sendToServer(){
	$("#submissionstatus").html('<img src="ajax-loader.gif" id="loadinggif"/>');
	var server=$("#serverselect option:selected").val();
	var cifapikey = getServerKey(server);
	var cifurl = getServerUrl(server);
	var dataToSend = new Array();
	for (i in window.datapoints){
		for (j in window.groupstosendto){
			dataToSend.push({'address':window.datapoints[i],
							'impact':$("#impact option:selected").val(),
							'description':$("#description").val().trim(),
							'portlist':$("#portlist").val().trim(),
							'source':'API Submission',
							'protocol':$("#protocol option:selected").val(),
							'confidence':$("#confidence option:selected").val(),
							'severity':$("#severity option:selected").val(),
							'guid': window.groupstosendto[j],
							'restriction':$("#restriction option:selected").val().toLowerCase(),
							});
		}
	}
	window.dataToSend=dataToSend;
	$.ajax({
		type: "POST",
		url: cifurl+"/"+"?apikey="+cifapikey+"&fmt=json", 
		data: JSON.stringify(dataToSend),
		dataType: "json",
		success: function(data){
			parseResponse(data);
			resetForm();
		},
		error: function(e){ 
			if (e['status']==401){
				showError("Error: Authorization required. Does your API key have write access?");
				//window.close();
			} else {
				showError('Internal Server Error: '+e['responseText']);
			}
			console.log(e);
		}
	});
}
function prepServerBox(){    
	options = JSON.parse(localStorage["cifapiprofiles"]);
	for (i in options){
		if (options[i]['isDefault']){
			$('#serverselect').append('<option value="'+i+'" selected>'+options[i]['name']+'</option>');
		} else {
			$('#serverselect').append('<option value="'+i+'">'+options[i]['name']+'</option>');
		}
	}
}
function resetForm(){
	$("#datapoints").val('');
	$("#datapoints").keyup();
	$("#description").val('');
	$("option").removeAttr('selected');
}
function showError(string){
	$("#submitbutton").removeAttr("disabled");
	$("#submissionstatus").html("<h4 style='color:red;'>"+string+"</h4>");
}
function parseResponse(data){
	$("#submitbutton").removeAttr("disabled");
	$("#submissionstatus").html('');
	for (i in data['data']){
		$("#submissionstatus").append('Observation <b>'+window.dataToSend[i]['address']+'</b> submitted with ID <b>'+data['data'][i]+'</b><br/>');
	}
}
function addObservedGroups(){
	try{
		var observedgroups=JSON.parse(localStorage["observed_groups"]);
		for (i in observedgroups){
			if (observedgroups[i]['name']!="everyone"){
				$("#groupboxarea").append('<input type="checkbox" id="datapoints" class="groupbox" value="'+observedgroups[i]['name']+'"/>'+observedgroups[i]['name']+'<br>');
			}
		}
	} catch(err) {}
}

function populateProtocols(){
	$.ajax({
		type: "GET",
		url:'Protocol-Numbers.xml', 
		dataType: "xml",
		success: function(data){
			$(data).find("record").each(function(){
				$("#protocol").append("<option value='"+$(this).find('value').text()+"'>"+$(this).find('value').text()+". "+$(this).find('name').text()+"   ("+$(this).find('description').text()+")</option>");
			});
		}
	});
}

function parseDataInput(){
	var points=$("#datapoints").val().replace(/(\r\n|\n|\r| )/gm,',').split(',');
	var sorted_arr = points.sort();
	points = [];
	for (i in sorted_arr) {
		if (i>100) continue;
		if ((sorted_arr[i + 1] != sorted_arr[i]) && $.trim(sorted_arr[i])!='') {
			points.push($.trim(sorted_arr[i]));
		} 
	}
	var urlRegex = /(https?:\/\/[^\s]+)/;
	var urlfound=false;
	var ipordomainfound=false;
	var emailfound=false;
	$("#detectedentries").empty();
	$("#protocol-tr, #portlist-tr").show();
	$("#portlist").val('');
	$("option",$("#protocol")).removeAttr('selected');
	$("option[value='']",$("#protocol")).attr('selected',true);
	for (i in points){
		if (urlRegex.test(points[i])){
			urlfound=true;
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
			emailfound=true;
			$("#detectedentries").append("<li><b>Email:</b> "+points[i]+"</li>");
		} 
		else {
			$("#protocol-tr, #portlist-tr").show();
			ipordomainfound=true;
			$("#detectedentries").append("<li><b>Hostname/IP:</b> "+points[i]+"</li>");
		}
	}
	window.datapoints=points;
	if ((urlfound && ipordomainfound) || (urlfound && emailfound) || (emailfound && ipordomainfound)){
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
function populateRestrictions(){
	restrictions = getRestrictions();
	for (i in restrictions){
		$("#restriction").append('<option value="'+restrictions[i]+'">'+restrictions[i]+'</option>');
	}
}
function populateConfidenceValues(){
	cons = getConfidenceMap();
	for (i in cons){
		$("#confidence").append('<option value="'+cons[i]['numeric']+'">'+cons[i]['word']+'</option>');
	}
}