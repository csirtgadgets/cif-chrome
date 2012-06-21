$(document).ready(function() {
	try{
		var fromcontext=JSON.parse(localStorage["datatoadd"]);
		$('#datapoints').val(fromcontext['data']);
	} catch(err) {}
	populateProtocols();
	parseDataInput();
});

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
	var points=$("#datapoints").val().split(',');
	var sorted_arr = points.sort(); 
	points = [];
	for (var i = 0; i < sorted_arr.length - 1; i++) {
		if ((sorted_arr[i + 1] == sorted_arr[i]) && $.trim(sorted_arr[i])!='') {
			points.push(sorted_arr[i]);
		}
	}
	for (i in points){
		if (points[i].substring(0,7)=='http://'){
			$("#portlist").val('80');
		}
		else if (points[i].substring(0,8)=='https://'){
			$("#portlist").val('443');
		}
	}
	window.datapoints=points;
}