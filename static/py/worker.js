(function () {
	self.console = {
		log: function () {}
	};
	self.prompt = function () {
		return 'Input not supported in demo';
	};
	
	importScripts('python.opt.js');

	Python.initialize(null, function(chr) {
		if(chr !== null) send('stdout',  String.fromCharCode(chr));
	}, function(chr){
		if(chr !== null) send('stderr', String.fromCharCode(chr));
	});

	function send(eventName, eventData){
		postMessage(JSON.stringify({type:eventName, data:eventData}));
	}
	var first = true;
	var msgHandler = function (e) {
		if (Python.isFinished(e.data)) {
			var result = Python.eval(e.data);
			if (result !== null && result !== undefined) {
				send('eval', result);
			}else if(first){
				first = false;
				send('init')
			}
		}
	};  

	addEventListener('message', msgHandler, false);

	send('load');
})();
