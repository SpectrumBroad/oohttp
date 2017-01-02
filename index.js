'use strict';

// node specific imports required to handle https requests
const isNode = typeof module !== 'undefined' && module.exports;
let https, url;
if (isNode) {

	https = require('https');
	url = require('url');

}

class HttpRequest {

	constructor(method, url) {
		this.open(method, url);
	}

	open(method, url) {

		this.method = method;
		this.url = url;
		this.headers = {};

	}

	toObject(Constr, data) {

		return this.send(data).then((data) => {
			return new Constr(JSON.parse(data));
		});

	}

	toObjectArray(Constr, data) {

		return this.send(data).then((data) => {

			let json = JSON.parse(data);
			let arr = [];

			json.forEach((obj) => {
				arr.push(new Constr(obj));
			});

			return arr;

		});

	}

	sendBrowser(data) {

		return new Promise((resolve, reject) => {

			//setup a xmlhttprequest to handle the http request
			let req = new XMLHttpRequest();
			req.open(this.method || HttpRequest.defaults.method, this.url);

			//set the headers
			let headers = Object.assign({}, HttpRequest.defaults.headers, this.headers);
			Object.keys(headers).forEach((headerName) => {
				req.setRequestHeader(headerName, headers[headerName]);
			});

			req.onerror = (event) => {
				reject(event);
			};

			req.onload = (event) => {

				if (req.status >= 200 && req.status < 300) {
					resolve(req.responseText);
				} else {
					reject(req.status);
				}

			};

			req.send(data);

		});

	}

	sendNode(data) {

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

	}

	send(data) {

		if (data && typeof data !== 'string') {
			data = JSON.stringify(data);
		}

		if (isNode) {
			return this.sendNode(data);
		} else {
			return this.sendBrowser(data);
		}

	}

}

HttpRequest.defaults = {
	headers: {
		'content-type': 'application/json'
	},
	method: 'GET'
};

module.exports = HttpRequest;
