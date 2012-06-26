$(document).ready(function() {
	settingsCheck();
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
		switchToQueryPageAndRun();
		return false;
	});
	$("#datasubmissionlink").click(function(){
		query = { 'data':$("#querystring").val().trim(),
				  'type':'contextmenuadd'
				 };
		localStorage['datatoadd']=JSON.stringify(query);
		makeNewPage("core/adddata.html");
		return false;
	});
});
