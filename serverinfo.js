var ServerInfoApi = function () {
  var http = require('http'),
		os = require('os'),
		exec = require('child_process').exec,
		self = this;

	this.options = {
		delay: 60 * 100,
		port: 8000,
		host: '0.0.0.0',
		head: {
			'Content-Type': 'application/json',
			'Server': 'ServerInfoApi/0.0.1'
		}
	},
	this.version = '0.0.1',
	this.data = {};

	this.start = function() {
		// collect monitoring data on startup
		onMonitor();

		// set monitor interval
		hInterval = setInterval(onMonitor, this.options.delay);

		// start server
		this.httpServer = http.createServer(onRequest);
		this.httpServer.listen(this.options.port, this.options.host);

		return this;
	};

	this.stop = function () {
		// if the interval is running clear it
		if(hInterval)
			clearInterval(hInterval);

		// if server is listening close it
		if(this.httpserver)
			this.httpserver.close();

		return this;
	};

	var onMonitor = function () {
		// get system informations from nodejs api
		self.data['mem'] = [os.freemem(), os.totalmem()];
		self.data['load'] = os.loadavg();

		// get uptime from /proc/uptime, os.uptimes() has a bug atm
		self.data['uptime'] = [];
		exec('awk \'{print $1}\' /proc/uptime', function (error, stdout, stderr) {
			if(error != null) {
				console.log(error);
				return false;
			}
			self.data['uptime'] = parseInt(stdout.split('\n')[0]);
		});
	};

	var onRequest = function(request, response) {
		// json response object
		var json = {
			api: {
				version: self.version,
				errors: []
			}
		};	

		request.url.split('/') // split by slashes
		.filter(function (element, index, array) {
			// filter empty items
			return (typeof element !== undefined && element != null && element != '');
		})
		.forEach(function (item) { 
			// loop trough items
			if(self.data[item]) {
				json[item] = self.data[item];
			} else {
				json.api.errors.push(item + ' not found');
			}
		});

		// send response header
		response.writeHead(200, self.options.head);
		// send response json
		response.end(JSON.stringify(json));
	};

	console.log(
		'ServerInfo ' + this.version + '\n' + 
		'Listen on ' + this.options.host + ':' + this.options.port + '\n'
	);

	// return self
	return this;
};

var sInfoApi = new ServerInfoApi().start();
