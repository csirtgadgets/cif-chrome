var cif_connector = {
    get: function(args) {
        function setHeaders (xhr) {
            xhr.setRequestHeader('Authorization', 'Token token=' + args.token);
            xhr.setRequestHeader('Accept', 'application/vnd.cif.v2+json');
        }
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

        for (i = 0; i < args.data.length; i++){
            args.data[i].observable = args.data[i].observable.toLowerCase();
            args.data[i].observable = args.data[i].observable.trim();
            if(args.data[i].observable.startsWith('http')){
                args.data[i].observable = args.data[i].observable.replace(/\/$/g, '');
            }
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
        args.remote = args.remote + '/observables';
        this.post(args);
    },

    search: function(args) {
        args.remote = args.remote + '/observables';
        if (args.query) {
            q = args.query.toLowerCase();
            q = q.trim();
            if (q.startsWith('http')){
                q = q.replace(/\/$/g, "");
            }
            args.remote += '?q=' + q
        }
        if (args.filters){
            if(args.query){
                args.remote += '&';
            } else {
                args.remote += '?';
            }
            for (var i in args.filters){
                args.remote += i + '=' + args.filters[i] + '&';
            }
            args.remote = args.remote.substr(0, args.remote.length - 1);
        }
        this.get(args);
    }
};
