var dataToSend = new Array();

$(document).ready(function() {
    try{
        var fromcontext=JSON.parse(CIF_CLIENT.getItem("datatoadd"));
        $('#observable').val(fromcontext['data']);
    } catch(err) {}
    CIF_CLIENT.settingsCheck();
    CIF_CLIENT.getRemotes();

    $("#observable").keyup(function(){
        window.clearTimeout(window.keyuptimeoutid);
        window.keyuptimeoutid = window.setTimeout(function () { CIF_CLIENT.parseDataInput(); }, 1000);
    });
    $("#submitbutton").click(function(){
        CIF_CLIENT.submitData();
        return false;
    });
});

if(!CIF_CLIENT){
    var CIF_CLIENT = {};
}


CIF_CLIENT.submitData=function(){
    $("#submitbutton").attr("disabled","disabled");

    if (window.observable.length==0 || $.trim(window.observable[0])==''){
        CIF_CLIENT.showError("Please enter an observable.");
        return;
    }
    CIF_CLIENT.sendToServer();
}

CIF_CLIENT.sendToServer=function(){
    $("#submissionstatus").html('<div class="alert">Submitting...<img src="images/ajax-loader.gif" id="loadinggif"/></div>');
    var server=$("#serverselect").val();
    var cifapikey = CIF_CLIENT.getServerKey(server);
    var cifurl = CIF_CLIENT.getServerUrl(server);



    for (i in window.datapoints){
        for (j in window.groupstosendto){
            var individualentry={'address':window.datapoints[i],

                'portlist':$("#portlist").val().trim(),
                'protocol':$("#protocol option:selected").val(),

            };
            dataToSend.push(individualentry);
        }
    }
    console.log(dataToSend);
    cif_connector.post({
        url:cifurl,
        apikey:cifapikey,
        entries:dataToSend,
        successFunction: function(data){
            CIF_CLIENT.parseResponse(data);
            CIF_CLIENT.resetForm();
        },
        errorFunction: function(e){
            if (e['status']==401){
                CIF_CLIENT.showError("Error: Authorization required. Does your API key have write access?");
            } else if (e['status']==0){
                CIF_CLIENT.showError('Could not connect to the server. Try testing your server with a query.');
            }
            else {
                CIF_CLIENT.showError('Internal Server Error: '+e['responseText']);
            }
            console.log(e);
        }
    });
}

CIF_CLIENT.getRemotes=function(){
    var options = JSON.parse(CIF_CLIENT.getItem("cifapiprofiles"));
    for (i in options){
        if (options[i]['isDefault']){
            $('#serverselect').append('<option value="'+ i + '" selected>' + options[i]['name'].toString() + '</option>');
        } else {
            $('#serverselect').append('<option value="'+ i +'">' + options[i]['name'].toString() + '</option>');
        }
    }
}
CIF_CLIENT.resetForm=function(){
    $("#observable").val('');
    $("#observable").keyup();

    $("option",$("#protocol")).removeAttr('selected');

}

CIF_CLIENT.showError=function(string){
    $("#submitbutton").removeAttr("disabled");
    $("#submissionstatus").html("<h4 style='color:red;'>"+string+"</h4>");
}

CIF_CLIENT.parseResponse=function(data){
    $("#submitbutton").removeAttr("disabled");
    $("#submissionstatus").html('');
    for (i in data['data']){
        $("#submissionstatus").append('<div class="alert alert-success"><b>'+window.dataToSend[i]['address']+'</b> submitted with ID <b>'+data['data'][i]+'</b> '+tweetbutton+'<br/></div>');
    }
    dataToSend = new Array();
}