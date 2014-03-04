#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
from google.appengine.ext import ndb
from google.appengine.api import users
from datetime import datetime

import webapp2, json, jinja2, os

def DB_KEY(): return ndb.Key('Fiddle', 'fiddles') 
model = {'src': '', 'author': None, 'date':None}
class Fiddle(ndb.Model):
	"""Database model"""
	author = ndb.UserProperty()
	src = ndb.StringProperty()
	created = ndb.DateTimeProperty()
	modified = ndb.DateTimeProperty()

def fiddle_by_id(_id):
	_id = (int(_id, 36)) # id is base36
	entity = Fiddle.get_by_id(_id, parent=DB_KEY())
	obj = None

	if entity:
		obj = entity.to_dict()
		d = obj['created']
		obj['created'] = "%d/%d/%d %d:%d:%d" % (
			d.month, d.day, d.year, d.hour, d.minute, d.second)
	return obj

class MainHandler(webapp2.RequestHandler):
	"""Templating class"""
	def get(self):
		self.load()

	def load(self, fiddle=None):
		user = users.get_current_user();
		template_values = {
			'fiddle': json.dumps(fiddle or model),
			'login':  users.create_login_url()
		}
		template = _env.get_template('index.html')
		self.response.out.write(template.render(template_values))


class EditPage(MainHandler):
	"""Handles /asdf23 routes. Loads fiddle"""
	def get(self, _id):
		obj = fiddle_by_id(_id)
		if obj:
			self.load(obj)
		else:
			self.redirect('/')


class RawFiddle(webapp2.RequestHandler):
	def get(self, _id):
		obj = fiddle_by_id(_id)
		if obj:
			self.response.write(json.dumps(obj))
		else:
			self.response.set_status(404)


class SaveHandler(webapp2.RequestHandler):
	def post(self):
		fiddle = Fiddle(parent=DB_KEY())
		fiddle.created = datetime.now()
		fiddle.src = self.request.body
		if users.get_current_user():
			fiddle.author = users.get_current_user()
		_id = fiddle.put().id()
		self.response.write(_id)
		print 'ADDED FIDDLE ', _id, fiddle


_path = os.path.join(os.path.dirname(__file__), 'static')
_env = jinja2.Environment(loader=jinja2.FileSystemLoader(_path))
app = webapp2.WSGIApplication([
	('/', MainHandler),
	('/save', SaveHandler),
	('/(\d+|\w+)', EditPage),
	('/edit/(\d+|\w+)', RawFiddle)
], debug=True)
