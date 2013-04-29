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
		
		var ajaxparams={type: "GET",dataType: "text", accept: 'application/json', cache: false};
		ajaxparams.url=args.url+args.query+"?apikey="+args.apikey+"&fmt=json"+noLog+args.filters+"&query="+args.query;
		if (typeof args.context != 'undefined') ajaxparams.context=args.context;
		ajaxparams.success=function(received){
								/* 
								 * Parses the received data into a data structure
								 */
								var data = {};
								// TODO
								/* we should try to \n split this into an array and for-loop it 
								 * KB: It's already in memory at this point. Splitting by line breaks into an array instead of making it into correct JSON
								 *     and parsing it as an array results in the same memory cost.
								 *	   Iterating over individual records at this point would require all of the downstream functions to be rewritten and other functions 
								 *     would have to be created to prepare the initial table for the records and setup the sorting when done. In the current design, this function
								 *	   is agnostic to the structure of the data, it just cleans responses and catches errors before passing the data to the original callback. 
								 */
								 
								try {
									parseddata=jQuery.parseJSON($.trim(received));
									if (typeof parseddata.message == 'undefined'){ //is v1
										data = {}
										data.entries=new Array();
										data.entries.push(parseddata);
										data.message='v1';
									} else {
										data = parseddata;
									}
								} catch(err){
									
									//bad JSON. probably a v1 response, this encapsulates the individual JSON responses into one
									received=received.replace(/(\r\n|\n|\r)/gm,"").replace(/}{/g,"},{");
									try{
										data.entries=jQuery.parseJSON("["+received+"]");
										data.message='v1';
									} catch(err) {
										//not json
									}
								}
								
								if (typeof data.data == 'undefined'){
									if (!data.entries || typeof data.entries == 'undefined' || data.entries.length==0){
										data.message='no records';
										data.entries = new Array();
									}
								} 
								
								//scopes $(this) for the success function to the context passed into the ajax call
								var scopedfunction=$.proxy(args.successFunction,$(this)); 
								scopedfunction(data);
						    };
		ajaxparams.error=function(xhr,status,error){ //function called on ajax failures (e.g 404's)
								var scopedfunction=$.proxy(args.errorFunction,$(this));
								scopedfunction(xhr,status,error);
							};
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
