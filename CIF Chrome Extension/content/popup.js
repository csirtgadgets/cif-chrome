$(document).ready(function() {
	CIF_CLIENT.settingsCheck();
	
	$("#datasubmissionlink").click(function(){
		query = { 'data':$("#querystring").val().trim(),
				  'type':'contextmenuadd'
				 };
		localStorage['datatoadd']=JSON.stringify(query);
		CIF_CLIENT.makeNewPage("content/adddata.html");
		return false;
	});
	CIF_CLIENT.prepSearchBox();
	CIF_CLIENT.prepSearchFilters();
	CIF_CLIENT.showVersion();
});
