(function(){
	var loginModel = Backbone.Model.extend({
		defaults:{
			loggedIn: false,
			fname: 'untitled.py',
		}
	});


	App.RootView = Backbone.View.extend({
		model: new loginModel,
		initialize: function(){
			this.nav = new App.RootView.Nav();
			this.editor = new App.RootView.Editor();
			this.feedback = new App.FeedbackView();
			this.model.bind('change', this.nav.render.bind(this.nav));
		},
		render: function(){
			this.$el.empty();
			this.$el.append(this.nav.render().el);
			this.$el.append(this.editor.el);
			this.$el.append(this.feedback.render().el);
			return this;
		}
	});
	App.RootView.Nav = Backbone.View.extend({
		template: App.template('root-nav'),
		className: 'nav-wrapper',
		events: {
			'click #share': 'commit',
			'click #new': 'create',
			'click #logo': 'create',
			'click #login': 'login',
			'click #open': 'open',
			'click #save': 'save',
			'keyup #fname': 'updateName'
		},
		render: function(){
			this.$el.html(this.template(App.root.model.toJSON()));
			return this;
		},
		commit: function(){
			console.debug('COMMIT');
			commit();
		},
		create: function(){
			if(Backbone.history.fragment)
				Backbone.history.navigate('/', {trigger: true});
			else
				Backbone.history.loadUrl(Backbone.history.fragment);
		},
		login: function(){
			App.authorize();
		},
		open: function(){
			App.openPicker.show(function(f){
				App.driveFile = f;
				downloadFile(f, function(c){
					console.log(c);
					console.log(c.indexOf('\n'));

					if(c) App.root.editor.cm.setValue(c);
				});
				App.root.model.set('fname', f.title);
			});
		},
		save: function(){
			var fname = App.root.model.get('fname');
			if(!fname) return;
			var isNew = !(App.driveFile && App.driveFile.title == fname);
			var src = App.root.editor.cm.getValue();
			var mdata = {};
			// EXISTING FILE
			if(!isNew){
				mdata.fileId = App.driveFile.id;
				App.save(mdata, src, function(resp){
					App.driveFile = resp;
				}, App.driveFile.id);
			}
			// NEW FILE
			else{
				App.savePicker.show(function(f){
					mdata.parents = [{id: f.id}];
					mdata.title = fname;
					App.save(mdata, src, function(resp){
						App.driveFile = resp;
					});
				});
			}
		},
		updateName: function(evt){
			App.root.model.set('fname', evt.target.innerText, {silent: true});
		}
	});


	App.RootView.Editor = Backbone.View.extend({
		className: 'editor',
		initialize: function(){
			this.cm = CodeMirror(this.el, {
				mode: 'python',
				lineNumbers: true,
				// indentWithTabs: true,
				indentUnit: 4,
				// smartIndent: false,
				theme: 'monokai',
				gutters: ["CodeMirror-linenumbers", "errors"],
				extraKeys:{
					'Ctrl-Enter': function(){
						App.session.compyle();
					}
				}
			});		
			this.wrapper = this.cm.getWrapperElement();
		},
		marker: function(){
			return $('<div>').addClass('errors').html('●')[0];
		},
		update: function(){
			this.cm.setValue(App.session.get('fiddle').src);
		},
		setError: function(n){
			n -= 1;
			var info = this.cm.lineInfo(n);
			this.cm.setGutterMarker(n, "errors", info.gutterMarkers ? null : this.marker());
		}
	});



	//
	// private
	//
	function commit(){
		$.ajax('/save',{
			type: 'POST',
			data: App.root.editor.cm.getValue(),
			success: function(data){
				var key = parseInt(data).toString(36);
				Backbone.history.navigate('/' + key, {trigger: true});
			},
			error: function(data){
				alert('Error saving');
				console.log(data);
			}
		});
	}

	function downloadFile(file, callback) {
		if (file.downloadUrl) {
			var accessToken = gapi.auth.getToken().access_token;
			$.ajax(file.downloadUrl, {
				beforeSend: function(xhr, settings){
					xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);              
				},
				success: function(data){
					callback(data);
				}
			});
		}
	}
})();
