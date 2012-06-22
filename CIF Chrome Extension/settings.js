// Saves options to localStorage.
var options = new Array();
function save_options() {
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
	localStorage["cifapiprofiles"] = JSON.stringify(options);

	// Update status to let user know options were saved.
	$("#status").html("Options Saved.").show().delay(1000).fadeOut('slow');
}
// Restores select box state to saved value from localStorage.
function restore_options() {
  try {
	  options = JSON.parse(localStorage["cifapiprofiles"]);
	  for (i in options){
		addProfileRow(options[i]['name'],options[i]['url'],options[i]['key'],options[i]['isDefault'],options[i]['logQueries']);
	  }
  } catch(err) {
	console.log(err);
  }
  addProfileRow('','','',false,true);
}
function makeMeVisible(){
	chrome.tabs.getCurrent(function(tab){
		chrome.tabs.update(tab.id, {selected: true});
	});
}
function addProfileRow(name,url,key,isDefault,logQueries){
	toappend='<tr class="profilerow">\
<td><input type="text" class="nameinput" size=28 placeholder="e.g. My CIF Server"/></td>\
<td><input type="text" class="urlinput" size=50 placeholder="e.g. https://example.org/api/"/></td>\
<td><input type="text" class="keyinput" size=40 placeholder="e.g. 012345678-1234-abcd-4321-dcba00000000"/></td>\
<td><button class="testbutton">Test Connection</button><button class="deletebutton">Delete</button></td>\
<td class="teststatus" ></td>\
<td><input type="radio" class="defaultradioinput" name="isdefault" disabled/></td>\
<td><input type="checkbox" class="logqueriesinput" checked/></td>\
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
		test_settings($(this));
	});
	$(".deletebutton").last().click(function(){
		$(this).parent().parent().remove();
	});
	if (!$("input[name='isdefault']:checked").val()) {
		$('.defaultradioinput').last().prop('checked',true);
	}
}
function test_settings(clickedbutton){
	var cifurl=$(".urlinput",clickedbutton.parent().parent()).val();
	var cifquery="";
	var cifapikey=$(".keyinput",clickedbutton.parent().parent()).val();
	try{
		$.getJSON(cifurl+cifquery+"?apikey="+cifapikey+"&fmt=json",function(data) {
			if (data['status']==200){
				$(".teststatus",clickedbutton.parent().parent()).html('connection successful');
			}
		}).error(function(e){ 
			if (e['status']==401){
				$(".teststatus",clickedbutton.parent().parent()).html('401 authorization error. check your api key');
			}
			if (e['status']==0){
				$(".teststatus",clickedbutton.parent().parent()).html('could not connect to that address');
			}
			if (e['status']==404){
				$(".teststatus",clickedbutton.parent().parent()).html('404 error. make sure that you have the correct path to the API');
			}
			console.log(e);
		});
	} catch (err) {
		$(".teststatus",clickedbutton.parent().parent()).html('could not connect with those settings');
	}
}
$(document).ready(function() {
	restore_options();
	$("#savebutton").click(function(){
		save_options();
	});

	$("#addarow").click(function(){
		addProfileRow('','','',false,true);
	});
});