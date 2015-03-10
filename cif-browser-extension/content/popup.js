$(document).ready(function() {
	if (!CIF_CLIENT.settingsCheck()){
		CIF_CLIENT.closePanel();
		return;
	}

	$("#datasubmissionlink").click(function(){
		query = { 'data':$("#querystring").val().trim(),
				  'type':'contextmenuadd'
				 };
		CIF_CLIENT.storeItem('datatoadd',JSON.stringify(query));
		CIF_CLIENT.makeNewPage("content/submit.html");
		CIF_CLIENT.closePanel();
		return false;
	});
	CIF_CLIENT.prepSearchBox();
	CIF_CLIENT.prepSearchFilters();
	CIF_CLIENT.showVersion();
	$("#getCurrentURL").click(function(){
		CIF_CLIENT.populateQueryStringWithCurrentURL();//this is a browser dependant function. see browserDependent_functions.js
		return false;
	});
});