var cif_connector = {
    get: function(args) {
        function setHeaders (xhr) {
            xhr.setRequestHeader('Authorization', 'Token token=' + args.token);
            xhr.setRequestHeader('Accept', 'application/vnd.cif.v2+json');
        }
        console.log(args.remote);
        $.ajax({
            url: args.remote,
            type: 'GET',
            dataType: 'json',
            success: args.success,
            error: args.error,
            beforeSend: setHeaders,
            cache: args.cache || false
        });
    },

    post: function(args) {
        function setHeaders(xhr) {
            xhr.setRequestHeader('Authorization', 'Token token=' + args.token);
            xhr.setRequestHeader('Accept', 'application/vnd.cif.v2+json');
        }

        $.ajax({
            url: args.remote,
            type: 'POST',
            dataType: 'json',
            success: args.success,
            error: args.error,
            beforeSend: setHeaders,
            data: JSON.stringify(args.data)
        });
    },

    ping: function(args) {
        args.remote = args.remote + '/ping';
        this.get(args);
    },

    submit: function(args) {
        args.remote = args.remote + '/observables/new';
        this.post(args);
    },

    search: function(args) {
        args.remote = args.remote + '/observables?q=' + args.query;
        if (args.filters){
            for (var i in args.filters){
                args.remote += '&' + i;
            }
        }
        console.log(args.remote);
        this.get(args);
    }
};
