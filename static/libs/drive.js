

(function(){
	App.authorize = checkAuth;
	App.save = insertFile;

	var CLIENT_ID = '108034427219.apps.googleusercontent.com';
	var DEV_KEY = 'AIzaSyAkLs8enn885UbW4Ti-50RlEkUV8a60EJQ';
	var SCOPES = 'https://www.googleapis.com/auth/drive';

	window.driveAuth = function() {
		window.setTimeout(App.authorize.bind(App, true), 1);
		function loadPicker(){
		  App.openPicker = new OpenPicker();
		  App.savePicker = new SavePicker();
		}
		gapi.client.load('drive', 'v2');
		gapi.load('picker', {'callback': loadPicker});
	}

	/**
	* Check if the current user has authorized the application.
	*/
	function checkAuth(immd) {
		var dat = {
			'client_id': CLIENT_ID, 
			'scope': SCOPES, 
			'immediate': immd || false
		};
		gapi.auth.authorize(dat,function(authResult){
			App.root.model.set('loggedIn', !!(authResult && !authResult.error));
		});
	}


	function insertFile(metadata, content, callback, fileId) {
		const boundary = '-------314159265358979323846';
		const delimiter = "\r\n--" + boundary + "\r\n";
		const close_delim = "\r\n--" + boundary + "--";
		if (!callback) { callback = function(file) { console.log("Update Complete ",file) }; }

		var contentType = "text/plain";
		metadata.mimeType = contentType;

		var multipartRequestBody =
			delimiter +
			'Content-Type: application/json\r\n\r\n' +
			JSON.stringify(metadata) +
			delimiter +
			'Content-Type: ' + contentType + '\r\n\r\n' +
			content +
			close_delim;

		var request = gapi.client.request({
			'path': '/upload/drive/v2/files/' + (fileId || ''),
			'method': fileId ? 'PUT' : 'POST',
			'params': {'uploadType': 'multipart'},
			'headers': {
			  'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
			},
			'body': multipartRequestBody
		});
		request.execute(callback);
	}


	/// PICKERS
	function SavePicker(){		
	  var callback = null;
	  var view = new google.picker.DocsView(google.picker.ViewId.FOLDERS);
	  view.setIncludeFolders(true);
	  view.setSelectFolderEnabled(true);

	  var picker = new google.picker.PickerBuilder().
		  addView(view).
		  enableFeature(google.picker.Feature.NAV_HIDDEN).
		  setSelectableMimeTypes('application/vnd.google-apps.folder').
		  setDeveloperKey(DEV_KEY).
		  setCallback(pickerCallback).
		  build();
	  this.show = function(cb){
		callback = cb;
		picker.setVisible(true);
	  }
	  this.picker = picker;

	  function pickerCallback(data){
		if (data.action == google.picker.Action.PICKED) {
		  var doc = data[google.picker.Response.DOCUMENTS][0];
		  callback(doc);
		}
	  }
	}
	function OpenPicker(){
	  var callback = null;
	  var picker = new google.picker.PickerBuilder().
		  addView(google.picker.ViewId.DOCUMENTS).
		  enableFeature(google.picker.Feature.NAV_HIDDEN).
		  setSelectableMimeTypes('text/plain').
		  setDeveloperKey(DEV_KEY).
		  setCallback(pickerCallback).
		  build();
	  this.show = function(cb){
		callback = cb;
		picker.setVisible(true);
	  }
	  this.picker = picker;

	  function pickerCallback(data){
		if (data.action == google.picker.Action.PICKED) {
		  var doc = data[google.picker.Response.DOCUMENTS][0];
		  var url = doc[google.picker.Document.URL];
		  var req = gapi.client.drive.files.get({'fileId': doc.id});
		  console.log(req);
		  req.execute(callback);
		}
	  }
	}
})();