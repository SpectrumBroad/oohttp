'use strict';

const TIMEOUT = 5000;

// node specific imports required to handle https requests
let https, http, url;
if (!process.browser) {

	https = require('https');
	http = require('http');
	url = require('url');

}

class Base {

	constructor(obj) {

		this.headers = {};

		if (obj) {
			Object.assign(this, obj);
		}

	}

	request(url, method) {

		let req = new Request(url, method);
		req.headers = this.headers;
		return req;

	}

}

class Request {

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

	toString(data) {

		return this.send(data).then((data) => {
			return "" + data;
		});

	}

	toJson(data) {

		return this.send(data).then((data) => {
			return JSON.parse(data);
		});

	}

	sendBrowser(data) {

		return new Promise((resolve, reject) => {

			//setup a xmlhttprequest to handle the http request
			let req = new XMLHttpRequest();
			req.open(this.method || Request.defaults.method, this.url);
			req.timeout = TIMEOUT;

			//set the headers
			let headers = Object.assign({}, Request.defaults.headers, this.headers);
			Object.keys(headers).forEach((headerName) => {

				if (typeof headers[headerName] === 'string' || typeof headers[headerName] === 'number') {
					req.setRequestHeader(headerName, headers[headerName]);
				}

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
			options.method = this.method || Request.defaults.method;
			options.headers = Object.assign({}, Request.defaults.headers, this.headers);

			let protocolName = options.protocol.substring(0, options.protocol.length - 1).toLowerCase();
			if (protocolName !== 'http' && protocolName !== 'https') {
				throw new Error(`unsupported protocol "${protocolName}"`);
			}

			let req = (protocolName === 'https' ? https : http).request(options, (res) => {

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

			});

			req.setTimeout(TIMEOUT, () => {
				req.abort();
			});

			req.on('error', (err) => {
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

		if (process.browser) {
			return this.sendBrowser(data);
		} else {
			return this.sendNode(data);
		}

	}

}

Request.defaults = {
	headers: {
		'content-type': 'application/json'
	},
	method: 'GET'
};

module.exports = {Request: Request, Base: Base};
