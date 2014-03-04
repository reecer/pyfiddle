// PyFiddle 
// app.js -- the client-side app
//

(function(){
	var App = {};
	window.App = App;
	_.extend(App, Backbone.Events);
	App.template = function(id){ return Mustache.compile(document.getElementById(id + '-template').innerHTML); }

	
	App.init = function(rootId){
		App.driveFile = null;
		var router = new App.Router(document.getElementById(rootId));
		window.onresize();
		Backbone.history.start({pushState: true});

		App.root.editor.cm.refresh();
	}

	App.Router = Backbone.Router.extend({
		initialize: function(elm){
			App.root = new App.RootView();
			App.$el = $(elm);

			App.$el.html(App.root.render().el);
		},
		routes: {
			'': 'index',
			':query': 'edit'
		},
		index: function(){
			if(!App.session) return;
			App.driveFile = null;
			App.session = new App.Session();
			App.root.editor.update();
		},
		edit: function(key){
			if(App.session){
				console.log('REQ EDIT ', key);
				$.ajax('/edit/'+key,{
					error: console.error.bind(console),
					success: function(data){
						App.session.set('fiddle', JSON.parse(data));
						App.root.editor.update();
					},
					complete: App.root.editor.update.bind(App.root.editor)
				});
			}
		}
	});

	window.onresize = function(){
		var h = window.innerHeight - App.root.nav.$el.height() + 'px';
		var toResize = [ // elements to be height-adjusted
			App.root.editor.wrapper,
			App.root.feedback.el, 
		];
		toResize.forEach(function(elm){
			elm.style.height = h;
		});
	}
})();// All anonymous like