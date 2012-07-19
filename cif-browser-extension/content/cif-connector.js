/* this js file contains the calls to the CIF server to query and post data */
/* requires jquery */
var cif_connector = {

	query:function(args){
		var noLog='';
		if (typeof args.url == 'undefined') throw "argument 'url' required";
		if (typeof args.query == 'undefined') throw "argument 'url' required";
		if (typeof args.apikey == 'undefined') throw "argument 'url' required";
		if (typeof args.successFunction == 'undefined') throw "argument 'successFunction' required";
		if (typeof args.errorFunction == 'undefined') throw "argument 'errorFunction' required";
		if (typeof args.filters == 'undefined') args.filters="";
		if (typeof args.log != 'undefined' && args.log===false) noLog='&nolog=1';
		
		var ajaxparams={type: "GET",dataType: "json"};
		ajaxparams.url=args.url+args.query+"?apikey="+args.apikey+"&fmt=json"+noLog+args.filters;
		if (typeof args.context != 'undefined') ajaxparams.context=args.context;
		ajaxparams.success=function(received){
								/* this doesn't do anything right now, but this would be a good place to modify the data 
								 * in the 'received' var if it were in some kind of special format like a 
								 * google protocol buffer...
								 * received=protoBufToJson(received);
								 */
								 
								//scopes $(this) for the success function to the context passed into the ajax call
								var scopedfunction=$.proxy(args.successFunction,$(this)); 
								scopedfunction(received);
						   };
		ajaxparams.error=args.errorFunction;//function called on ajax failures (e.g 404's)
		$.ajax(ajaxparams);
	},
	
	
	post:function(args){
		var ajaxparams={type:"POST",dataType:"JSON"};
		ajaxparams.data=JSON.stringify(args.entries);//this will probably be replaced with encode to protocol buffer
		ajaxparams.url=args.url+"/"+"?apikey="+args.apikey+"&fmt=json";
		ajaxparams.success=function(received){
								/* this doesn't do anything right now, but this would be a good place to modify the data 
								 * in the 'received' var if it were in some kind of special format like a 
								 * google protocol buffer...
								 * received=protoBufToJson(received);
								 */
								 
								//scopes $(this) for the success function to the context passed into the ajax call
								var scopedfunction=$.proxy(args.successFunction,$(this)); 
								scopedfunction(received);
						   }
		ajaxparams.error= args.errorFunction; //function called on ajax failures (e.g 404's)
		$.ajax(ajaxparams);
	},

};