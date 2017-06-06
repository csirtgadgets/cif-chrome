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
		var groups=$(".groupsinput", $(this)).val().trim();
		var provider=$(".providerinput", $(this)).val().trim();
		var isDefault=$('.defaultradioinput',$(this)).is(':checked');
		var logQueries=$('.logqueriesinput',$(this)).is(':checked');
		var set = {
			'name': name,
			'key': key,
			'url': url,
			'groups': groups,
			'provider': provider,
			'isDefault': isDefault,
			'logQueries': logQueries
		};
		if (key!="" && name!="" && url!=""){
			options.push(set);
		}
	});
	CIF_CLIENT.storeItem("cifapiprofiles",JSON.stringify(options));

	var miscOptions = {};
	CIF_CLIENT.storeItem('miscOptions',JSON.stringify(miscOptions));

	// Update status to let user know options were saved.
	$("#status").html("<div class='alert alert-block alert-success'>Options Saved.</div>").show().delay(5000).fadeOut('slow');
}
// Restores select box state to saved value from localStorage.
CIF_CLIENT.restore_options=function() {
  try {
	  options = JSON.parse(CIF_CLIENT.getItem("cifapiprofiles"));
	  for (i in options){
		CIF_CLIENT.addProfileRow(options[i]['name'],options[i]['url'],options[i]['key'],options[i]['groups'], options[i]['provider'],options[i]['isDefault'],options[i]['logQueries']);
	  }
  } catch(err) {
	console.log(err);
  }

  try{
	miscOptions=JSON.parse(CIF_CLIENT.getItem("miscOptions"));
  } catch(err) {
	console.log(err);
  }
  CIF_CLIENT.addProfileRow('','','','','', false,true);
}


CIF_CLIENT.addProfileRow=function(name, url, key, groups, provider, isDefault, logQueries){
	toappend='<tr class="profilerow">';
	toappend+='<td><input type="text" class="nameinput form-control"  placeholder="Name"/></td>';
	toappend+='<td><input type="text" class="urlinput form-control" placeholder="https://example.org" size="50"/></td>';
	toappend+='<td><input type="text" class="keyinput form-control" placeholder="12341234" size="72"/></td>';
	toappend+= '<td><input type="text" class="groupsinput form-control" placeholder="everyone,groupA,groupB" size="30"/></td>';
	toappend+='<td><input type="text" class="providerinput form-control" placeholder="Organization (no spaces)" size="50"/></td>';

	toappend+='<td><span class="aria-label">Default Server:</span> <input type="radio" class="defaultradioinput" name="isdefault" disabled/><br/>';
	toappend+='<span class="aria-label">Log Queries:</span> <input type="checkbox" class="logqueriesinput" checked/></td>';
    toappend+='<td><button class="deletebutton btn btn-danger btn-small">Delete</button> ';
    toappend+='<button class="testbutton btn btn-small btn-success">Test Connection</button></td>';
	toappend+='</tr>';

	$("#profilestable").append(toappend);
	$(".nameinput").last().val(name);
	$(".urlinput").last().val(url);
	$(".keyinput").last().val(key);
	$(".providerinput").last().val(provider);


	if(groups){
		$(".groupsinput").last().val(groups);
	}

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
		if (!confirm('Are you sure you want to delete this profile?')) return false;
		$(this).parent().parent().remove();
        $("#status").html("<div class='alert alert-block alert-success'>Profile Removed.</div>").show().delay(5000).fadeOut('slow');
	});
	if (!$("input[name='isdefault']:checked").val()) {
		$('.defaultradioinput').last().prop('checked',true);
	}
}

CIF_CLIENT.test_settings=function(clickedbutton){
	var remote=$(".urlinput",clickedbutton.parent().parent()).val().trim();
	var uri="/ping";
	var token=$(".keyinput",clickedbutton.parent().parent()).val().trim();

    function success() {
        $("#status").html("<div class='alert alert-success'>Test Connection Successful.</div>").show().delay(2000).fadeOut('slow');
    }

    function fail(xhr, textStatus, error) {
        delay = 5000;
        html = "<div class='alert alert-danger'>Test Connection Failed: <b>" + error + "</b></div>";
        switch(xhr['status']) {
            case 0:
                html = '<div class="alert alert-danger">Please visit your CIF instance and  <a href="' + remote + '" target="_blank">accept the TLS certificate</a></div>';
                delay = 20000;
                break;

            case 401:
                html = "<div class='alert alert-danger'>Test Connection Failed: <b>" + error + "</b> be sure to check your Token.</div>";
                break;

            case 404:
                html = "<div class='alert alert-danger'>Test Connection Failed: <b>" + error + "</b> be sure to check your API location.</div>";
                break;
        }
        $("#status").html(html).show().delay(delay).fadeOut('slow');
    }

    cif_connector.ping({
        remote: remote,
        token: token,
        success: success,
        error: fail
    });
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
});
