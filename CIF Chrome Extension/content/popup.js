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
		CIF_CLIENT.makeNewPage("content/adddata.html");
		CIF_CLIENT.closePanel();
		return false;
	});
	CIF_CLIENT.prepSearchBox();
	CIF_CLIENT.prepSearchFilters();
	CIF_CLIENT.showVersion();
});