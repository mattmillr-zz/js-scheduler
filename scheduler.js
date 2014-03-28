
var utils = (function() {
	var self = this;

	self._seed = 1;
	self.random = function (seed) {
		if (seed != undefined) { self._seed = seed; }
    var x = Math.sin(self._seed++) * 10000;
    return x - Math.floor(x);
	}
	
	self.randomColor = function () {
		var red = Math.floor(self.random() * 256);
		var green = Math.floor(self.random() * 256);
		var blue = Math.floor(self.random() * 256);
		return 'rgb(' + red + ',' + green + ',' + blue + ')';
	}

	self.hashString = function (stringToHash, range) {
		hash = 0;
		for (var i = 0; i < stringToHash.length; i++) {
      hash += stringToHash.charCodeAt(i);
		}
    return hash % range;
	}

	self._colors = ['aqua','black','blue','fuchsia','gray','green','lime','maroon','navy','olive','orange','purple','red','silver','teal','white','yellow']
	self.colorHash = function (stringToHash) {
		return self._colors[self.hashString(stringToHash, self._colors.length)];
	}

	// https://gist.github.com/jed/982883
	self.guid = function (a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,self.guid)};


	return self;
})();

var Observable = function(data) {
	var self = this;
	self.data = data;
	self.observers = [];

	self.set = function (newData) {
		self.data = newData;
		for (var i in self.observers) {
			self.observers[i](newData);
		}
	}
	self.observe = function (func) {
		self.observers.push(func);
	}
	self.get = function () {
		return self.data;
	}
	return self;
}

var ObservableArray = function(arr) {
	var self = this;
	self.arr = arr;
	self.observers = [];

	self.push = function(data) {
		self.arr.push(data);
		for (var i in self.observers) {
			self.observers[i]('push', data);
		}
	}
	self.observe = function (func) {
		self.observers.push(func);
	}
	self.each = function(func) {
		for(i=0; i<self.arr.length; i++) {
			func(self.arr[i]);
		}
	}
	return self;
}


var UserModel = function(data) {
	var self = this;
	self.firstName = new Observable(data.firstName);
	self.lastName = new Observable(data.lastName);
	self.email = new Observable(data.email);
	self.color = utils.randomColor();
	//self.color = utils.colorHash(firstName + lastName + email);
	return self;
}

var BlockModel = function(data) {
	var self = this;
	self.day = new Observable(data.day);
	self.slot = new Observable(data.slot);
	self.user = new Observable(null);
	return self;
}

var UserAdminController = function() {
	var self = this;

	self.initialized = false;
	self.initialize = function () {
		if (self.initialized) { return; }
		self.initialized = true;
		app.userListController.activeUser.observe(function(user) {
			if (self.isActive) {
				self.showFormFor(user);
			}
		});
		$('#new-user').on('click', function () {
			app.userListController.activeUser.set(null);
			self.showFormFor(null);
		})
	}

	self.form = null;
	self.currentUser = null;
	self.showFormFor = function(user) {
			$('#user-form-container').empty();
			self.form = app.tt.cloneTemplate('user-form');

			if (user != null) {
				self.currentUser = user;
				self.form.bind(self.currentUser);
				self.form.data('guid', self.currentUser.guid);
				self.form.find('input.submit-add').remove();
				self.form.find('input.submit-edit').show();
				self.form.on('submit', function () {
						self.form.formUpdate(user);
					});
			} else {
				self.form.on('submit', function () {
					app.userListController.users.push(self.form.formNew(UserModel));
					self.showFormFor(null);
				});
			}

			$('#user-form-container').append(self.form);
			self.form.find('input:first').focus();
	}

	self.isActive = false;

	self.show = function () {
		self.isActive = true;
		self.initialize();
		if ((self.form == null) || (self.currentUser != app.userListController.activeUser.get())) {
			self.showFormFor(app.userListController.activeUser.get());
		}
	}
	
	self.hide = function () {
		self.isActive = false;
	}

	return self;
};

var CalendarController= function() {
	var self = this;

	self.initialized = false;
	self.initialize = function () {
		if (self.initialized) { return; }

		self.initialized = true;
		self.drawCalendar();
	}

	self.show = function () {
		self.initialize();

	}
	
	self.hide = function () {}

	self.drawCalendar = function () {
		tbody = $('#calendar tbody');

		for(row_index=1; row_index<=app.config.slots; row_index++) {
			row = app.tt.cloneTemplate('schedule-row');
			for (col_index=0; col_index<7; col_index++) {
				cell = app.tt.cloneTemplate('schedule-cell');
				blockTemplate = app.tt.cloneTemplate('schedule-block');
				
				var block = (function () {
					var _block = new BlockModel({
						'day': col_index,
						'slot': row_index
					});

					_block.user.observe(function (data) {
						console.log(_block);
						console.log(_block.slot.get(), _block.day.get());
						if (data == null) {
							_block.template.find('.scheduled').hide();
							_block.template.find('.empty').show();
						} else {
							_block.template.bind(data, 'user');
							_block.template.find('.empty').hide();
							_block.template.find('.scheduled').show();
							_block.template.find('.scheduled').css({borderColor: data.color});
							_block.template.find('.scheduled .slot').css({color: data.color});
						}
					});

					return _block;
				})(); // fix closure over _block

				app.registerData(block);
				blockTemplate.data('block-guid', block.guid);
				blockTemplate.bind(block, 'block');

				blockTemplate.on('click', function (e) {
					var block = app.data[$(this).data('block-guid')];
					if (block.user.get() == null) {
						activeUser = app.userListController.activeUser.get();
						if (activeUser == null || activeUser == undefined) {
							alert('Please select a user first.');
							return;
						}
						block.user.set(activeUser);
					} else {
						block.user.set(null);
					}
				});

				block.template = blockTemplate;

				cell.append(blockTemplate);
				row.append(cell);
			}
			tbody.append(row);
		}
	}

	return self;
};

var UserListController = function() {
	var self = this;

	self.users = new ObservableArray([]);
	self.activeUser = new Observable(null);

	self.initialized = false;
	self.initialize = function () {
		if (self.initialized) { return; }

		self.users.each(function(user) {
			self.addUser(user);
		});

		self.users.observe(function (action, user) {
			if (action = 'push') {
				self.addUser(user);
			}
		});

		$('#user-list').on('click', 'li', function () {
			var user = app.data[$(this).data('guid')];
			self.activeUser.set(user);
		});

		self.activeUser.observe(function (data) {
			var guid = (data == null) ? null : data.guid;

			$('#user-list li').each(function(idx, element) {
				if ($(element).data('guid') == guid) { 
					$(element).addClass('active');
				} else {
					$(element).removeClass('active');
				}
			});
		});

	}

	// Internal, creates template. 
	// Externally, use users.push(user) to add a user to the list.
	self.addUser = function (user) {
		app.registerData(user);
		var userListItem = app.tt.cloneTemplate('user-list-item');
		userListItem.data('guid', user.guid);
		userListItem.bind(user);
		userListItem.find('.color-dot').css({backgroundColor: user.color});
		$('#user-list ul').append(userListItem);
	}
	return self;
}

var TemplateTools = function () {
	var self = this;

	self.cloneTemplate = function (id) {
		var template = $('#' + id + '-template').clone();
		template.removeClass('template');
		template.removeAttr('id');
		template.find('.template').remove();
		template.linkData = function(data, namespace) {
			namespace = (namespace == undefined) ? '' : namespace + '--';
			for (var key in data) { 
				template.find('.' + namespace + key).html(data[key]);
			}
		}
		template.bind = function(model, namespace) {
			var namespace = (namespace == undefined) ? '' : namespace + '.';
			for (var idx in model) {
				var observable = model[idx];
				if (observable instanceof Observable) {
					var query = '[data-bind="' + namespace + idx + '"]';
					template.find(query).each(function(idx, element) {
						if (['INPUT'].indexOf(element.tagName) > -1) {
							$(element).val(observable.get());
							observable.observe(function (data) { $(element).val(data); });
						} else {
							$(element).html(observable.get());	
							observable.observe(function (data) { $(element).html(data); });
						}
					});
				}
			}
		}
		template.formNew = function (model) {
			var data = {};
			template.find('input').each(function (idx, element) {
				var key = $(element).data('bind');
				if (key != undefined && key != null) {
					data[key] = $(element).val();
				}
			});
			return new model(data);
		}
		template.formUpdate = function (instance) {
			template.find('input').each(function (idx, element) {
				var key = $(element).data('bind');
				if (key != undefined && key != null) {
					instance[key].set($(element).val());
				}
			});
		}
		return template;
	}

	return self;
}

var app = (function () {
	var self = this;

	self.config = {
		'slots': 8
	}

	self.data = {};
	self.registerData = function (data) {
		data.guid = utils.guid();
		self.data[data.guid] = data;
	}

		// 'appointments': new ObservableArray([]),
		// 'slots': new ObservableArray([])

	self.controllers = {
		'#user-admin': new UserAdminController(),
		'#calendar': new CalendarController()
	}

	self.activeController = undefined;

	self.router = function () {
		if (self.activeController) { self.activeController.hide(); }
		$('#menu li').removeClass('active');
		$('#menu a[href="' + window.location.hash + '"]').parent('li').addClass('active');

		$('.view').hide();
		$(window.location.hash).show();
		self.activeController = self.controllers[window.location.hash];
		self.activeController.show();
	};

	self.setUpRouter = function () {
		window.onhashchange = self.router;

		if (window.location.hash) {
			self.router();
		} else {
			window.location.hash = "#user-admin";
		}	
	}

	self.userListController = new UserListController();

	self.tt = new TemplateTools();

	self.initialize = function () {
		self.userListController.initialize();
		self.setUpRouter();
	}

	return self;
})();

$(document).ready(function () {
	app.initialize();

});

