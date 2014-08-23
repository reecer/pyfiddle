App.UPDATE = 1500;

App.Session = Backbone.Model.extend({
	defaults:{
		fiddle: {
			date: null,
			author: null,
			src: ''
		},
		host: '',
	},
	initialize: function(){
		this.msg = '';
		this.initWorker();
		this.on('stdout', this.onout.bind(this, 'stdout'));
		this.on('stderr', this.onout.bind(this, 'stderr'));
		this.on('eval', this.oneval, this);
		var self = this;
		this.on('load', function(){
			App.session.feedback.push('Loading analyzer');		
			$.ajax('/static/py/pypiler.py',{
				success: function(data, status){
					self.eval(data);
				},
				error: function(e){
				  throw e;
				}
			});
		});
		this.on('init', function(){
			App.session.feedback.push('Loaded. Get coding!');
		});
	},
	initWorker: function(){
		this.worker = new Worker("/static/py/worker.js");
		var self = this;
		this.worker.addEventListener("message", function(data){
			data = JSON.parse(data.data);
			self.trigger(data.type, data.data);
			console.debug(data);
		});
	},
	compyle: function(x){
		this.worker.postMessage(App.root.editor.cm.getValue());
	},
	eval: function(x){
		this.worker.postMessage(x);
	},

	oneval: function(data){
		console.debug('EVAL: ', data);
		App.root.feedback.push(data, 'eval');
	},
	onout: function(type, m){
		if(m.substr(m.length-1) === '\n'){
			App.root.feedback.push(this.msg+m, type);
			this.msg = '';
		}else if(m)
			this.msg += m;
	}
	// compyle: function(){
	// 	App.root.editor.cm.clearGutter('errors');
		
	// 	var data = this.toJSON();
	// 	this.send('compile', data);
	// },
	// eval: function(cmd){
	// 	if(cmd === '\n') return;
	// 	App.root.editor.cm.clearGutter('errors');

	// 	var data = this.toJSON();
	// 	data.cmd = cmd;
	// 	this.send('eval', data);
	// },



	// // helper functions
	// send: function(protocol, data){
	// 	this.socket.emit(protocol, data);
	// },
	// onmessage: function(data){
	// 	console.debug("MSG: ", data);
	// 	this.toPush.push(data);

	// 	clearTimeout(this.timeout);
	// 	this.timeout = setTimeout((function(){
	// 		App.root.feedback.push(this.toPush);
	// 		this.toPush = [];
	// 	}).bind(this), App.UPDATE);
	// 	if(data.type === 'stderr'){
	// 		if(data.data.tb[0].filename !== '<fiddle>') return;
	// 		var n = data.ln;
	// 		if(!n && data.data.tb.length) n = data.data.tb[0].ln;
	// 		App.root.editor.setError(n);
	// 	}
	// },
	// onclose: function(){
	// 	App.root.feedback.push('Disconnected!');
	// 	this.wsReconnect();
	// },
	// onerror: function(){

	// },
	// onopen: function(){
	// 	App.root.feedback.push('Connected!')
	// },
});
