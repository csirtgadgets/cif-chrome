$(document).ready(function() {
	CIF_CLIENT.settingsCheck();
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
				  'filters': CIF_CLIENT.getFilters(),
				  'server':$("#serverselect option:selected").val(),
				  'logquery':$("#logquery").is(':checked')
				 };
		localStorage['query']=JSON.stringify(query);
		CIF_CLIENT.switchToQueryPageAndRun();
		return false;
	});
	$("#datasubmissionlink").click(function(){
		query = { 'data':$("#querystring").val().trim(),
				  'type':'contextmenuadd'
				 };
		localStorage['datatoadd']=JSON.stringify(query);
		CIF_CLIENT.makeNewPage("core/adddata.html");
		return false;
	});
	CIF_CLIENT.prepSearchFilters();
});
