'use strict';


const https = require('https');
const url = require('url');


function HttpRequest(method, url) {
	this.open(method, url);
}


HttpRequest.defaults = {
	headers: {
		'content-type': 'application/json'
	},
	method: 'GET'
};


module.exports = HttpRequest;


HttpRequest.prototype.open = function(method, url) {

	this.method = method;
	this.url = url;
	this.headers = {};

};


HttpRequest.prototype.toObject = function(Constr, data) {

	return this.send(data).then((data) => {
		return new Constr(JSON.parse(data));
	});

};


HttpRequest.prototype.toObjectArray = function(Constr, data) {

	return this.send(data).then((data) => {

		let json = JSON.parse(data);
		let arr = [];

		json.forEach((obj) => {
			arr.push(new Constr(obj));
		});

		return arr;

	});

};


HttpRequest.prototype.send = function(data) {

	if (data && typeof data !== 'string') {
		data = JSON.stringify(data);
	}

	return new Promise((resolve, reject) => {

		let options = url.parse(this.url);
		options.method = this.method || HttpRequest.defaults.method;
		options.headers = Object.assign({}, HttpRequest.defaults.headers, this.headers);

		let req = https.request(options, (res) => {

			res.setEncoding('utf8');
			let data = '';
			res.on('data', (chunk) => {
				data += chunk;
			});

			res.on('end', () => {

				if (res.statusCode >= 200 && res.statusCode < 300) {
					resolve(data);
				} else {
					reject(res.statusCode);
				}

			});

		}).on('error', (err) => {
			reject(err);
		});

		if (data) {

			req.write(data, () => {
				req.end();
			});

		} else {
			req.end();
		}

	});

};
