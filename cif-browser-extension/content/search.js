
search = function(q) {
    console.log(q);

    var server = CIF_CLIENT.getDefaultServer();
    var token = CIF_CLIENT.getServerKey(server);
    var remote = CIF_CLIENT.getServerUrl(server);
    var nolog = CIF_CLIENT.getServerLogSetting(server);

    function success(data, textStatus, xhr) {
        //$("#results").html("<div class='alert alert-success'>Test Connection Successful.</div>").show().delay(2000).fadeOut('slow');
        //$('#results').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="example"></table>' );
        t.fnClearTable();
        for (var i in xhr.responseJSON){

            t.fnAddData([
                xhr.responseJSON[i].reporttime,
                xhr.responseJSON[i].group.join(),
                xhr.responseJSON[i].tlp,
                xhr.responseJSON[i].observable,
                xhr.responseJSON[i].provider,
                xhr.responseJSON[i].tags.join(),
                xhr.responseJSON[i].provider,
                xhr.responseJSON[i].protocol || '',
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
        query: q,
        success: success,
        fail: fail,
        filters: {
            limit: 50,
            nolog: 1
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

    var $form = $(this),
        q = $form.find( "input[name='q']" ).val(),
        url = $form.attr('action');
    search(q);

    $('#searchForm').submit(function(e){
        e.preventDefault();
        var $form = $(this),
            q = $form.find( "input[name='q']" ).val(),
            url = $form.attr('action');
        search(q);
    });

});