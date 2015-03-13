CIF_CLIENT.sendToServer=function(data){

    var remote = CIF_CLIENT.getDefaultServer();
    var token = CIF_CLIENT.getServerKey(remote);
    remote = CIF_CLIENT.getServerUrl(remote);

    function success(data, textStatus, xhr) {
        $("#results").html('<div class="alert alert-success">Successfully submitted <a href="search.html?nolog=1&q=' + obs + '">' + obs + '</a></div>');
    }

    function fail(xhr, textStatus, error) {
        delay = 5000;
        html = "<div class='alert alert-danger'>Failed: <b>" + error + "</b></div>";
        switch(xhr['status']) {
            case 500:
                html = "<div class='alert alert-danger'>500 Internal Server Error, check with your administrator</div>";
                break;
            case 401:
                html = "<div class='alert alert-danger'>Authorization <Failed></Failed>: <b>" + error + "</b> be sure to check your Token.</div>";
                break;

            case 404:
                html = "<div class='alert alert-danger'>Connection failed: <b>" + error + "</b> be sure to check your API location.</div>";
                break;
        }
       $("#results").html(html).show().delay(delay).fadeOut('slow');
    }

    if (!data['observable']) {
        fail({'status': 500});
    }

    var obs = data['observable'];

    cif_connector.submit({
        remote: remote,
        token: token,
        data: [data],
        success: success,
        fail: fail
    });
}

$(document).ready(function() {
    $('#tlp').css('color','orange');
    $('#tlp').change(function() {
        var current = $('#tlp').val();
        console.log(current);
        if ( current == 'RED' ){
            $('#tlp').css('color','red');
        }
        if ( current == 'AMBER' ){
            $('#tlp').css('color','orange');
        }
        if ( current == 'GREEN' ){
            $('#tlp').css('color','GREEN');
        }
        if ( current == 'WHITE' ){
            $('#tlp').css('color','black');
        }
    });

    $("#myform").submit(function (event) {
        event.preventDefault();
        var fields = $(":input").serializeArray();
        var data = {};
        for (var i in fields) {
            console.log(fields[i].name);
            data[fields[i].name] = fields[i].value;
        }
        data['group'] = 'everyone';
        CIF_CLIENT.sendToServer(data);

        $("#myform").find('input:text').val('');
    });
});