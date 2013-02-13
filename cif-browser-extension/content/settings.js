if(!CIF_CLIENT){
    var CIF_CLIENT = {};
}
var options = new Array();
// Saves options to localStorage.
CIF_CLIENT.save_options=function() {
	options = [];
	$('.profilerow').each(function() {
		var key=$(".keyinput",$(this)).val().trim();
		var name=$(".nameinput",$(this)).val().trim();
		var url=$(".urlinput",$(this)).val().trim();
		var isDefault=$('.defaultradioinput',$(this)).is(':checked');
		var logQueries=$('.logqueriesinput',$(this)).is(':checked');
		var set = {'name':name,'key':key,'url':url,'isDefault':isDefault,'logQueries':logQueries};
		if (key!="" && name!="" && url!=""){
			options.push(set);
		}
	});
	CIF_CLIENT.storeItem("cifapiprofiles",JSON.stringify(options));
	/*
	var restrictions=$("#restrictionsnames").val().trim().split("\n");
	if (restrictions.length>0){
		CIF_CLIENT.storeItem('restrictions',JSON.stringify(restrictions));
	}
	*/

	var confidences=$("#confidencevalues").val().split("\n");
	var tosave= new Array();
	for (i in confidences){
		var parts=confidences[i].split(':');
		if (parts.length!=2) continue;
		tosave.push({'numeric':parts[0],'word':parts[1]});
	}
	if (tosave.length>0){
		CIF_CLIENT.storeItem('confidencemap',JSON.stringify(tosave));
	}
		
	var miscOptions = {};
	miscOptions.newTabOnquery=$('#setting_openQueryInNewWindow').is(':checked');
	CIF_CLIENT.storeItem('miscOptions',JSON.stringify(miscOptions));
	
	// Update status to let user know options were saved.
	$("#status").html("<div class='alert alert-block alert-success'>Options Saved.</div>").show().delay(1000).fadeOut('slow');
}
// Restores select box state to saved value from localStorage.
CIF_CLIENT.restore_options=function() {
  try {
	  options = JSON.parse(CIF_CLIENT.getItem("cifapiprofiles"));
	  for (i in options){
		CIF_CLIENT.addProfileRow(options[i]['name'],options[i]['url'],options[i]['key'],options[i]['isDefault'],options[i]['logQueries']);
	  }
  } catch(err) {
	console.log(err);
  }
  confidencemap=CIF_CLIENT.getConfidenceMap();
  $("#confidencevalues").val('');
  for (i in confidencemap){
	$("#confidencevalues").val($("#confidencevalues").val()+confidencemap[i]['numeric']+":"+confidencemap[i]['word']+"\n");
  }
  restrictions=CIF_CLIENT.getRestrictions();
  $("#restrictionsnames").val('');
  for (i in restrictions){
	$("#restrictionsnames").val($("#restrictionsnames").val()+restrictions[i]+"\n");
  }
  try{
	miscOptions=JSON.parse(CIF_CLIENT.getItem("miscOptions"));
	if (miscOptions.newTabOnquery){
		$("#setting_openQueryInNewWindow").prop('checked',true);
	}
  } catch(err) {
	console.log(err);
  }
  CIF_CLIENT.addProfileRow('','','',false,true);
}


CIF_CLIENT.addProfileRow=function(name,url,key,isDefault,logQueries){
	toappend='<tr class="profilerow">\
				<td><input type="text" class="nameinput input-medium"  placeholder="e.g. My CIF Server"/></td>\
				<td><input type="text" class="urlinput input-xlarge" placeholder="e.g. https://example.org/api/"/></td>\
				<td><input type="text" class="keyinput input-xlarge" placeholder="e.g. 012345678-1234-abcd-4321-dcba00000000"/></td>\
				<td><button class="testbutton btn btn-small">Test Connection</button> 
				    <button class="deletebutton btn btn-danger btn-small">Delete</button>
				</td>\
				<td class="teststatus" ></td>\
				<td><span class="label">Default Server:</span> <input type="radio" class="defaultradioinput" name="isdefault" disabled/><br/>\
				<span class="label">Log Queries by Default:</span> <input type="checkbox" class="logqueriesinput" checked/></td>\
				</tr>';
	$("#profilestable").append(toappend);
	$(".nameinput").last().val(name);
	$(".urlinput").last().val(url);
	$(".keyinput").last().val(key);
	if (isDefault){
		$('.defaultradioinput').last().prop('checked',true);
	}
	if (!logQueries){
		$('.logqueriesinput').last().removeAttr('checked');
	}
	$(".nameinput").last().keyup(function(){
		if ($(this).val().trim()!=""){
			$('.defaultradioinput',$(this).parent().parent()).removeAttr('disabled');
		} else {
			$('.defaultradioinput',$(this).parent().parent()).attr('disabled',true);
		}
	});
	if ($(".nameinput").last().val().trim()!=""){
		$('.defaultradioinput').last().removeAttr('disabled');
	} else {
		$('.defaultradioinput').last().attr('disabled',true);
	}
	$(".testbutton").last().click(function(){
		CIF_CLIENT.test_settings($(this));
	});
	$(".deletebutton").last().click(function(){
		$(this).parent().parent().remove();
	});
	if (!$("input[name='isdefault']:checked").val()) {
		$('.defaultradioinput').last().prop('checked',true);
	}
}
CIF_CLIENT.test_settings=function(clickedbutton){
	var cifurl=$(".urlinput",clickedbutton.parent().parent()).val().trim();
	var cifquery="";
	var cifapikey=$(".keyinput",clickedbutton.parent().parent()).val().trim();
	window.visitme="If you use a self-signed certificate, you will need to <a target='_blank' href='"+cifurl+cifquery+"?apikey="+cifapikey+"'>accept your certificate</a> before this will work.";
	try{
		$.getJSON(cifurl+cifquery+"?apikey="+cifapikey+"&fmt=json",function(data) {
			if (data['status']==200){
				$(".teststatus",clickedbutton.parent().parent()).html('<span class="label label-success">connection successful</span>');
			}
		}).error(function(xhr,status,error){ 
			e=xhr;
			var errmsg='';
			if (e['status']==401){
				errmsg='401 authorization error. check your api key';
			} else if (e['status']==0){
				errmsg='Could not connect to that address.<br/><i>'+window.visitme+'</i>';
			} else if (e['status']==404){
				errmsg='404 error. make sure that you have the correct path to the API';
			} else if (e['status']==200){
				console.log(e);
				errmsg='bad response. is that the path to a CIF API?';
			} else {
				errmsg='Could not connect to that address.<br/><i>'+window.visitme+'</i>';
			}
			$(".teststatus",clickedbutton.parent().parent()).html('<span class="label label-important">'+errmsg+'</span>');
			//console.log(e);
		});
	} catch (err) {
		$(".teststatus",clickedbutton.parent().parent()).html('<span class="label label-important">could not connect with those settings</span>');
	}
}
$(document).ready(function() {
	CIF_CLIENT.restore_options();
	$("#savebutton").click(function(){
		CIF_CLIENT.save_options();
	});

	$("#addarow").click(function(){
		CIF_CLIENT.addProfileRow('','','',false,true);
	});
	$("#showtax").click(function(){
		$(this).hide();
		$('#hidetax').show();
		$("#additional").slideDown();
		return false;
	});
	$("#hidetax").click(function(){
		$(this).hide();
		$('#showtax').show();
		$("#additional").slideUp();
		return false;
	});
	$("#def_confidence").click(function(){
		confidencemap = CIF_CLIENT.defaultConfidence();
		$("#confidencevalues").val('');
		for (i in confidencemap){
			$("#confidencevalues").val($("#confidencevalues").val()+confidencemap[i]['numeric']+":"+confidencemap[i]['word']+"\n");
		}
	});
	/*
	$("#def_restriction").click(function(){
		restrictions = defaultRestrictions();  
		$("#restrictionsnames").val('');
		for (i in restrictions){
			$("#restrictionsnames").val($("#restrictionsnames").val()+restrictions[i]+"\n");
		}
	});
	*/
});