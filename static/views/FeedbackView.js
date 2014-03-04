(function(){
	App.FeedbackView = Backbone.View.extend({
		className: 'feedback-wrapper',
		events: {
			'click': 'focusPrompt'
		},
		initialize: function(){
			this.console = new ConsoleView();
		},
		render: function(){
			this.$el.empty();
			this.$el.append(this.console.subnav.render().el);
			this.$el.append(this.console.render().el);
			return this;
		},
		push: function(msgs, type){
			if (typeof msgs === 'string'){
				this.console.msgs.push(new Message({
					msg: msgs.trim(),//.replace('\\n', '<br>'),
					type: type || 'log'
				}));
				return;
			}
			var models = [];
			for (var i = msgs.length - 1; i >= 0; i--) {
				models.push(new Message({
					msg: msgs[i],
					type: msgs[i].type || 'log'
				}));
			}
			this.console.msgs.push(models);
		},
		focusPrompt: function(){
			this.console.focusPrompt();
		}
	});
	

	// CONSOLE
	//

	var Message = Backbone.Model.extend({
		defaults:{
			type: 'stdout', // stdout, stderr, or log
			msg: '',
			timestamp: ''
		},
		initialize: function(){
			var d = new Date();
			var dfmt = [d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()];
			this.set('timestamp', dfmt.join(':'));
		}
	});
	var MessageView = Backbone.View.extend({
		template: App.template('message'),
		initialize: function(){
			this.$el.addClass(this.model.get('type'));
			return this;
		},
		render: function(){
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		}
	});

	var ConsoleMessages = Backbone.View.extend({
		className: 'console-messages',
		initialize: function(){
			this.messages = [];
			return this;
		},
		render: function(){
			this.$el.empty();
			this.messages.forEach(function(msg){
				var m = new MessageView({model: msg});
				this.$el.append(m.render().el);
			});
			return this;
		},
		clear: function(){			
			this.messages = [];
			this.render();
			return this;
		},
		push: function(models){	
			models = [].concat(models); // force array
			var container = document.createElement('div');
			this.messages.concat(models);

			for (var i = models.length - 1; i >= 0; i--) {
				var view = new MessageView({model: models[i]});
				container.appendChild(view.render().el);
			};

			this.$el.append(container);
			App.root.feedback.el.scrollTop = 99999;	
			return this;		
		}
	});

	var Prompt = Backbone.Model.extend({
		defaults:{
			history: [], // Passed inputs
			index: 0,	 // Used for up/down-ing thru history
			text: ''
		}
	});
	var ConsolePrompt = Backbone.View.extend({
		model: new Prompt,
		className: 'console-prompt',
		template: App.template('console-prompt'),
		events:{
			'keydown': 'onkeydown'
		},
		render: function(){
			this.$el.html(this.template(this.model.toJSON()));
			this.inputEl = this.$el.find('#console-input');
			return this;
		},
		// Model variables
		index: function(i){
			if(i != null) this.model.set('index', i);
			else return this.model.get('index');
		},
		history: function(h){
			if(h != null) this.model.set('history', h);
			else return this.model.get('history');			
		},


		onkeydown: function(evt){
			if(evt.shiftKey || evt.ctrlKey) return;
			if(evt.keyCode === 13){ // ENTER
				var cmd = this.inputEl.text();
				this.push(cmd);
				App.session.eval(cmd + '\n');
				App.root.feedback.push('>>> ' + cmd, 'log');

				this.inputEl.text('');
				this.index(this.history().length);
			}else if(evt.keyCode === 38){ // UP
				this.decrement();
				this.inputEl.text(this.current());
			}else if(evt.keyCode === 40){ // DOWN
				this.increment();
				if(this.index() == this.history().length)
					this.inputEl.text('');
				this.inputEl.text(this.current());
			}else return this;
			evt.preventDefault();
		},
		current: function(){
			return this.history()[this.index()];			
		},
		// Push current text into history
		push: function(cmd){
			cmd = cmd || this.inputEl.text();
			this.history(this.history().concat([cmd]));
			this.increment();
		},
		increment: function(){
			if(this.history().length > this.index()){
				this.index(this.index()+1);
			}		
		},
		decrement: function(){
			if(this.index() > 0){
				this.index(this.index()-1);
			}			
		},
		focus: function(){
			this.inputEl.focus();
			return this;
		}
	});

	var ConsoleNav = Backbone.View.extend({	
		className: 'subnav',	
		template: App.template('console-subnav'),
		events:{
			'click .icon-trash': 'clear',
			'click .icon-refresh': 'reconnect',
			'click .icon-play': 'run'
		},
		render: function(){
			this.$el.html(this.template());
			return this;
		},
		reconnect: function(){
			App.session.wsReconnect();
		},
		run: function(){
			App.session.compyle();
		},
		clear: function(){
			App.root.feedback.console.clear();
		}
	});

	// Root console view

	var ConsoleView = Backbone.View.extend({
		className: 'console-wrapper',
		events:{
			'click ': 'focusPrompt'
		},
		initialize: function(){
			this.history = [];
			this.subnav = new ConsoleNav();
			this.msgs = new ConsoleMessages()
			this.prompt = new ConsolePrompt();
			return this;
		},
		render: function(){
			this.$el.empty();
			this.$el.append(this.msgs.render().el);
			this.$el.append(this.prompt.render().el);
			return this;
		},
		clear: function(){
			this.msgs.clear();
			return this;
		},
		focusPrompt: function(evt){
			this.prompt.focus();
			return this;
		}
	});
})();