function getUrlParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++)
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam)
        {
            return sParameterName[1];
        }
    }
}

search = function(q, data, nolog) {
    var server = CIF_CLIENT.getDefaultServer();
    var token = CIF_CLIENT.getServerKey(server);
    var remote = CIF_CLIENT.getServerUrl(server);
    var log = CIF_CLIENT.getServerLogSetting(server);

    if (log) {
        nolog = 0;
    } else {
        nolog = 1;
    }

    //var limit = CIF_CLIENT.getServerLimit(server) || 100;
    var limit = 100;
    data["limit"] = limit;

    function success(data, textStatus, xhr) {
        //$("#results").html("<div class='alert alert-success'>Test Connection Successful.</div>").show().delay(2000).fadeOut('slow');
        //$('#results').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="example"></table>' );
        t.fnClearTable();
        for (var i in xhr.responseJSON){
            var protocol = xhr.responseJSON[i].protocol;
            switch(protocol) {
                case 0:
                    protocol = 'icmp';
                    break;
                case 6:
                    protocol = 'tcp';
                    break;
                case 17:
                    protocl = 'udp';
                    break;
                default:
                    protocol = '';
            }

            var tlp = xhr.responseJSON[i].tlp
            switch(tlp){
                case 'red':
                    tlp = '<div style="color:red">RED</div>';
                    break;
                case 'white':
                    tlp = '<div style="color:black">WHITE</div>';
                    break;
                case 'green':
                    tlp = '<div style="color:green">GREEN</div>';
                    break;
                case 'amber':
                    tlp = '<div style="color:orange">AMBER</div>';
                default:
                    tlp = '<div style="color:black">' + tlp + '</div>';
            }

            var observable = xhr.responseJSON[i].observable;

            if (xhr.responseJSON[i].altid) {
                observable = '<a href="' + xhr.responseJSON[i].altid + '">' + observable + '</a>'
            }


            t.fnAddData([
                xhr.responseJSON[i].reporttime,
                xhr.responseJSON[i].group.join(),
                tlp,
                observable,
                xhr.responseJSON[i].provider || '',
                xhr.responseJSON[i].tags.join(),
                xhr.responseJSON[i].confidence,
                protocol || '',
                xhr.responseJSON[i].portlist || '',

            ]);
        }
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
                html = "<div class='alert alert-danger'>Authorization <Failed></Failed>: <b>" + error + "</b> be sure to check your Token.</div>";
                break;

            case 404:
                html = "<div class='alert alert-danger'>Connection failed: <b>" + error + "</b> be sure to check your API location.</div>";
                break;
        }
        $("#results").html(html).show().delay(delay).fadeOut('slow');
    }

    cif_connector.search({
        remote: remote,
        token: token,
        query: q.toLowerCase(),
        success: success,
        data, data,
        fail: fail,
        filters: {
            limit: limit,
            nolog: nolog
        }
    });
}
// http://behstant.com/blog/?p=662
// http://api.jquery.com/jquery.post/
var t = {};
$(document).ready(function() {
    t = $('#results').dataTable({
        "mData": true,
        "searching": false
    });

    // Setup the ajax indicator
    $('#results').append('<div id="ajaxBusy"><p><img src="images/ajax-loader.gif"></p></div>');

    $('#ajaxBusy').css({
        display:"none",

    });

    t.fnClearTable();

    q = false;

    var nolog = 0;
    if (getUrlParameter('nolog')){
      nolog = getUrlParameter('nolog');
    }

    if (getUrlParameter('q')){
        q = getUrlParameter(('q'));
    } else if (localStorage.query) {
        q = JSON.parse(localStorage.query).query
        localStorage.query = false;
    } else {
        var $form = $(this),
            q = $form.find( "input[name='q']" ).val(),
            url = $form.attr('action');
    }

    console.log(q);

    if(q){
        search(q, nolog);
    }

    $('#searchForm').submit(function(e){
        e.preventDefault();
        t.fnClearTable();
        var $form = $(this),
            q = $form.find( "input[name='q']" ).val(),
            url = $form.attr('action');

        var fields = $(":input").serializeArray();
        data = {}
        for (var i in fields) {
          if (fields[i].name != "results_length" && fields[i].value != ""){
            data[fields[i].name] = fields[i].value;
          }
        }
        console.log(data)
        search(q, data);
    });

});

// Ajax activity indicator bound to ajax start/stop document events
$(document).ajaxStart(function(){
    $('#ajaxBusy').show();
}).ajaxStop(function(){
    $('#ajaxBusy').hide();
});
