'use strict';

// node specific imports required to handle https requests
let https, http, url;
if (typeof window === 'undefined') {

	https = require('https');
	http = require('http');
	url = require('url');

}

/**
 * returns the byte length of an utf-8 encoded string
 * from http://stackoverflow.com/questions/5515869/string-length-in-bytes-in-javascript
 * @param {String} str the string to calculate the byte length of
 * @returns {Number} the bytelength
 */
function utf8ByteLength(str) {

	let s = str.length;
	for (let i = str.length - 1; i >= 0; i--) {

		let code = str.charCodeAt(i);
		if (code > 0x7f && code <= 0x7ff) {
			s++;
		} else if (code > 0x7ff && code <= 0xffff) {
			s += 2;
		}

		//trail surrogate
		if (code >= 0xDC00 && code <= 0xDFFF) {
			i--;
		}

	}

	return s;

}

class Base {

	constructor(obj) {

		this.headers = {};
		this.rejectUnauthorized = null;
		this.timeout = null;
		this.autoContentLength = null;

		if (obj) {
			Object.assign(this, obj);
		}

	}

	request(method, url) {

		let req = new Request(method, url);

		Object.assign(req.headers, this.headers);
		req.rejectUnauthorized = this.rejectUnauthorized;
		req.timeout = this.timeout;
		req.autoContentLength = this.autoContentLength;

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
			return '' + data;
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
			req.timeout = this.timeout || Request.defaults.timeout;

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
					reject({
						statusCode: req.status,
						data: req.responseText
					});
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
			options.rejectUnauthorized = typeof this.rejectUnauthorized === 'boolean' ? this.rejectUnauthorized : Request.defaults.rejectUnauthorized;

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
						reject({
							statusCode: res.statusCode,
							data: data
						});
					}

				});

			});

			req.setTimeout(this.timeout || Request.defaults.timeout, () => {
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

			let contentType = this.headers['content-type'] || Request.defaults.headers['content-type'];
			if (contentType === 'application/json') {
				data = JSON.stringify(data);
			} else {

				let dataStr = '';
				for (let name in data) {

					if (dataStr.length) {
						dataStr += '&';
					}
					dataStr += `${encodeURIComponent(name)}=${encodeURIComponent(data[name])}`;

				}
				data = dataStr;

			}

		}

		//auto setting of content-length header
		if (data && !this.headers['content-length'] &&
			((typeof this.autoContentLength !== 'boolean' && Request.defaults.autoContentLength === true) ||
				this.autoContentLength === true)
		) {
			this.headers['content-length'] = utf8ByteLength(data);
		}

		if (typeof window === 'undefined') {
			return this.sendNode(data);
		} else {
			return this.sendBrowser(data);
		}

	}

}

Request.defaults = {
	headers: {
		'content-type': 'application/json'
	},
	method: 'GET',
	timeout: 5000,
	rejectUnauthorized: true,
	autoContentLength: false
};

module.exports = {
	Request: Request,
	Base: Base
};
