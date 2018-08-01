'use strict';

// node specific imports required to handle http(s) requests
let https;
let http;
let url;
if (typeof window === 'undefined') {
  https = require('https');
  http = require('http');
  url = require('url');
}

/**
 * Returns the byte length of an utf-8 encoded string.
 * From http://stackoverflow.com/questions/5515869/string-length-in-bytes-in-javascript
 * @param {String} str String to calculate the byte length of.
 * @returns {Number} The bytelength.
 */
function utf8ByteLength(str) {
  let s = str.length;
  let i;
  for (i = str.length - 1; i >= 0; i -= 1) {
    const code = str.charCodeAt(i);
    if (code > 0x7f && code <= 0x7ff) {
      s += 1;
    } else if (code > 0x7ff && code <= 0xffff) {
      s += 2;
    }

    // trail surrogate
    if (code >= 0xDC00 && code <= 0xDFFF) {
      i -= 1;
    }
  }

  return s;
}

class Url {
  constructor(obj) {
    this.protocol = null;
    // this.auth = null;
    this.hostname = null;
    this.port = null;
    this.pathname = null;
    this.query = {};
    this.hash = null;

    if (obj) {
      Object.assign(this, Url.parse(obj));
    }
  }

  static parse(obj) {
    const returnObj = {};
    if (typeof obj === 'string') {
      returnObj.origStr = obj;
      let remainingPath = obj;

      const protocolDividerIndex = remainingPath.indexOf('://');
      if (protocolDividerIndex > -1) {
        returnObj.protocol = obj.substring(0, protocolDividerIndex) || null;
        remainingPath = obj.substring(protocolDividerIndex + 3);
      }

      const portDividerIndex = remainingPath.indexOf(':');
      if (portDividerIndex > -1) {
        returnObj.hostname = remainingPath.substring(0, portDividerIndex) || null;
        remainingPath = remainingPath.substring(portDividerIndex + 1);
      }

      const hashDividerIndex = remainingPath.lastIndexOf('#');
      if (hashDividerIndex > -1) {
        returnObj.hash = remainingPath.substring(hashDividerIndex + 1) || null;
        remainingPath = remainingPath.substring(0, hashDividerIndex);
      }

      const queryStringDividerIndex = remainingPath.lastIndexOf('?');
      if (queryStringDividerIndex > -1) {
        returnObj.search = remainingPath.substring(queryStringDividerIndex) || null;
        remainingPath = remainingPath.substring(0, queryStringDividerIndex);
        if (returnObj.search) {
          returnObj.query = this.parseQueryString(returnObj.search);
        }
      }

      const pathDividerIndex = remainingPath.indexOf('/');
      if (portDividerIndex > -1) {
        if (pathDividerIndex > -1) {
          returnObj.port = +remainingPath.substring(0, pathDividerIndex);
          remainingPath = remainingPath.substring(pathDividerIndex);
          returnObj.pathname = remainingPath;
        } else {
          returnObj.port = +remainingPath;
        }
      } else if (protocolDividerIndex === -1 || pathDividerIndex === 0) {
        returnObj.pathname = remainingPath || null;
      } else if (pathDividerIndex > -1) {
        returnObj.hostname = remainingPath.substring(0, pathDividerIndex) || null;
        returnObj.pathname = remainingPath.substring(pathDividerIndex);
      } else {
        returnObj.hostname = remainingPath || null;
      }
    } else {
      const { path } = obj;
      let { search, query, pathname } = obj;

      // path
      if (path && !pathname && !search && !query) {
        if (path.includes('?')) {
          const querySplit = path.split('?');
          [pathname, search] = querySplit;
        } else {
          pathname = path;
        }
      }

      // querystring
      if (search && !query) {
        query = this.parseQueryString(search);
      }

      // protocol
      if (typeof obj.protocol === 'string') {
        if (obj.protocol.slice(-1) === ':') {
          returnObj.protocol = obj.protocol.substring(0, obj.protocol.length - 1);
        } else {
          returnObj.protocol = obj.protocol;
        }
      }

      returnObj.hostname = obj.hostname || null;
      returnObj.port = obj.port || null;
      returnObj.pathname = pathname || null;
      returnObj.query = query || {};
      returnObj.hash = obj.hash || null;
    }

    return returnObj;
  }

  static parseQueryString(search) {
    if (!search) {
      return {};
    }

    const query = {};
    let searchSplit = search;
    if (searchSplit.charAt() === '?') {
      searchSplit = searchSplit.substring(1);
    }
    searchSplit = searchSplit.split('&');
    let queryName;
    let queryValue;
    let querySplit;
    for (let i = 0; i < searchSplit.length; i += 1) {
      querySplit = searchSplit[i].split('=');
      if (querySplit.length === 2) {
        [queryName, queryValue] = querySplit;
        if (typeof query[queryName] === 'string') {
          query[queryName] = [query[queryName], queryValue];
        } else if (Array.isArray(query[queryName])) {
          query[queryName].push(queryValue);
        } else {
          query[queryName] = queryValue;
        }
      }
    }
    return query;
  }

  /**
  * Merges another (base-)url into this url.
  * This url is dominant, therefor all values in the current url will be kept.
  * Only new values (querystring parts, missing protocol, etc) will be added.
  * @param {Url} baseUrl The url to merge from.
  */
  mergeFrom(baseUrl) {
    if ((baseUrl instanceof Base) || (baseUrl instanceof Request)) {
      baseUrl = baseUrl.url;
    }

    if (typeof baseUrl === 'string') {
      baseUrl = new Url(baseUrl);
    }

    if (!baseUrl) {
      return;
    }

    if (!this.protocol && baseUrl.protocol) {
      this.protocol = baseUrl.protocol;
    }

    /*
    if (!this.auth && baseUrl.auth) {
      this.auth = baseUrl.auth;
    }
    */

    if (!this.hostname && baseUrl.hostname) {
      this.hostname = baseUrl.hostname;
    }

    if (!this.port && baseUrl.port) {
      this.port = baseUrl.port;
    }

    if (!this.pathname && baseUrl.pathname) {
      this.pathname = baseUrl.pathname;
    }

    // querystring
    if (baseUrl.query) {
      const baseQueryKeys = Object.keys(baseUrl.query);
      if (baseQueryKeys.length) {
        let baseQueryName;
        let baseQueryValue;
        for (let i = 0; i < baseQueryKeys.length; i += 1) {
          baseQueryName = baseQueryKeys[i];
          baseQueryValue = baseUrl.query[baseQueryName];
          if (!this.query[baseQueryName]) {
            this.query[baseQueryName] = baseQueryValue;
          } else {
            if (!Array.isArray(this.query[baseQueryName])) {
              this.query[baseQueryName] = [this.query[baseQueryName]];
            }
            if (Array.isArray(baseQueryValue)) {
              for (let j = 0; j < baseQueryValue.length; j += 1) {
                this.query[baseQueryName].push(baseQueryValue[j]);
              }
            } else {
              this.query[baseQueryName].push(baseQueryValue);
            }
          }
        }
      }
    }

    if (!this.hash && baseUrl.hash) {
      this.hash = baseUrl.hash;
    }
  }

  /**
  * Returns a string representation of the url.
  * Omits missing values, no defaults are applied here.
  * The port number is left out if the related protocol for that port is used.
  * I.e: if the protocol equals 'https' and port 443 is specified,
  * the port will not be part of the returned string.
  * @returns {String} The url string.
  */
  toString() {
    let str = '';

    if (this.protocol) {
      str += `${this.protocol}://`;
    }

    /*
    if (this.auth) {
      str += `${this.auth}@`;
    }
    */

    // hostname
    if (this.hostname) {
      str += `${this.hostname}`;
      if (this.port &&
        (!this.protocol || Url.protocolPortNumbers[this.protocol] !== this.port)
      ) {
        str += `:${this.port}`;
      }
    }

    if (this.pathname) {
      str += this.pathname;
    }

    // querystring
    if (this.query) {
      const queryKeys = Object.keys(this.query);
      if (queryKeys.length) {
        str += '?';
        let queryName;
        let queryValues;
        for (let i = 0; i < queryKeys.length; i += 1) {
          queryName = queryKeys[i];
          queryValues = this.query[queryName];
          if (Array.isArray(queryValues)) {
            for (let j = 0; j < queryValues.length; j += 1) {
              str += `${(i || j) ? '&' : ''}${encodeURIComponent(queryName)}=${encodeURIComponent(queryValues[j])}`;
            }
          } else {
            str += `${i ? '&' : ''}${encodeURIComponent(queryName)}=${encodeURIComponent(queryValues)}`;
          }
        }
      }
    }

    // hash
    if (this.hash) {
      str += `#${this.hash}`;
    }

    return str;
  }
}

Url.protocolPortNumbers = {
  ftp: 21,
  http: 80,
  https: 443,
  ws: 80,
  wss: 443
};

class Response {
  constructor(obj) {
    if (obj) {
      this.data = obj.data;
      this.headers = obj.headers;
      this.statusCode = obj.statusCode;
    }
  }
}

class Request {
  constructor(method, reqUrl) {
    this.open(method, reqUrl);
  }

  open(method, reqUrl) {
    this.method = method;
    this.url = reqUrl;
    this.headers = {};

    if (this.url && !(this.url instanceof Url)) {
      this.url = new Url(this.url);
    }
  }

  static get(reqUrl) {
    return new Request('GET', reqUrl);
  }

  static post(reqUrl) {
    return new Request('POST', reqUrl);
  }

  static put(reqUrl) {
    return new Request('PUT', reqUrl);
  }

  static delete(reqUrl) {
    return new Request('DELETE', reqUrl);
  }

  static patch(reqUrl) {
    return new Request('PATCH', reqUrl);
  }

  /**
  * Parses the result through JSON and passes it to the given constructor.
  * @param {Constructor} Constr The constructor.
  * @param {Object} [data] An object to send along with the request.
  * If the content-type header is set to 'application/json',
  * than this data will be stringified through JSON.stringify().
  * Otherwise the data will be parsed as an url encoded form string
  * from the first-level key/value pairs.
  * @returns {Promise.<Constr|null>} Returns a Promise with the constructed object on success,
  * or null if a 404 was returned. Other status codes reject the promise.
  */
  toObject(Constr, data) {
    return this.send(data)
    .then(res => new Constr(JSON.parse(res.data)))
    .catch((err) => {
      if (err.statusCode === 404) {
        return Promise.resolve(null);
      }
      return Promise.reject(err);
    });
  }

  toObjectArray(Constr, data) {
    return this.send(data)
    .then((res) => {
      const json = JSON.parse(res.data);
      const arr = [];

      let i;
      for (i = 0; i < json.length; i += 1) {
        arr.push(new Constr(json[i]));
      }

      return arr;
    });
  }

  toObjectMap(Constr, data) {
    return this.send(data)
    .then((res) => {
      const json = JSON.parse(res.data);
      const map = {};

      let key;
      for (key in json) {
        map[key] = new Constr(json[key]);
      }

      return map;
    });
  }

  toString(data) {
    return this.send(data)
    .then(res => `${res.data}`);
  }

  toJson(data) {
    return this.send(data)
    .then(res => JSON.parse(res.data));
  }

  /* istanbul ignore next */
  sendBrowser(data) {
    return new Promise((resolve, reject) => {
      // setup a xmlhttprequest to handle the http request
      const req = new XMLHttpRequest();
      req.open(this.method || Request.defaults.method, this.url.toString());
      req.timeout = this.timeout || Request.defaults.timeout;

      // set the headers
      const headers = Object.assign({}, Request.defaults.headers, this.headers);
      Object.keys(headers).forEach((headerName) => {
        if (typeof headers[headerName] === 'string' || typeof headers[headerName] === 'number') {
          req.setRequestHeader(headerName, headers[headerName]);
        }
      });

      req.onerror = (event) => {
        reject(event);
      };

      req.ontimeout = (event) => {
        reject(event);
      };

      req.onload = () => {
        const resHeaders = Request.parseXmlHttpRequestHeaders(req);
        if (req.status >= 200 && req.status < 300) {
          resolve(new Response({
            statusCode: req.status,
            headers: resHeaders,
            data: req.responseText
          }));
        } else {
          const err = new Error('Unsuccessful statuscode returned');
          err.statusCode = req.status;
          err.res = new Response({
            statusCode: req.status,
            headers: resHeaders,
            data: req.responseText
          });
          reject(err);
        }
      };

      req.send(data);
    });
  }

  /* istanbul ignore next */
  static parseXmlHttpRequestHeaders(req) {
    const headerMap = {};
    const headerStr = req.getAllResponseHeaders();
    if (!headerStr) {
      return headerMap;
    }

    const headerSplit = headerStr.split('\r\n');

    for (let i = 0; i < headerSplit.length; i += 1) {
      const colonIndex = headerSplit.indexOf(':');
      if (colonIndex > -1) {
        headerMap[headerSplit[i].substring(0, colonIndex)] = headerSplit[i].substring(colonIndex);
      }
    }

    return headerMap;
  }

  sendNode(data) {
    return new Promise((resolve, reject) => {
      const urlStr = this.url.toString();
      const options = url.parse(urlStr);
      options.method = this.method || Request.defaults.method;

      options.headers = Object.assign({}, Request.defaults.headers, this.headers);
      for (const key in options.headers) {
        if (typeof options.headers[key] !== 'string' && typeof options.headers[key] !== 'number') {
          delete options.headers[key];
        }
      }

      options.rejectUnauthorized = typeof this.rejectUnauthorized === 'boolean' ? this.rejectUnauthorized : Request.defaults.rejectUnauthorized;

      let protocolName = options.protocol.substring(0, options.protocol.length - 1).toLowerCase();
      if (protocolName !== 'http' && protocolName !== 'https') {
        throw new Error(`unsupported protocol "${protocolName}"`);
      }

      let proxyOptions;
      if (this.proxyUrl) {
        proxyOptions = url.parse(this.proxyUrl);

        proxyOptions.headers = options.headers;
        proxyOptions.headers.Host = options.host;
        proxyOptions.headers.path = urlStr;
        protocolName = 'http';
      }

      const req = (protocolName === 'https' ? https : http).request(proxyOptions || options, (res) => {
        res.setEncoding('utf8');
        let resData = '';
        res.on('data', (chunk) => {
          resData += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(new Response({
              statusCode: res.statusCode,
              headers: res.headers,
              data: resData
            }));
          } else {
            const err = new Error('Unsuccessful statuscode returned');
            err.statusCode = res.statusCode;
            err.res = new Response({
              statusCode: res.statusCode,
              headers: res.headers,
              data: resData
            });
            reject(err);
          }
        });
      });

      req.setTimeout(this.timeout || Request.defaults.timeout, () => {
        req.abort();
        reject(new Error('timeout'));
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

  proxy(proxyUrl) {
    this.proxyUrl = proxyUrl;
    return this;
  }

  send(data) {
    if (data && typeof data !== 'string') {
      const contentType = this.headers['content-type'] || Request.defaults.headers['content-type'];
      if (contentType === 'application/json') {
        data = JSON.stringify(data);
      } else {
        let dataStr = '';
        for (const name in data) {
          if (dataStr.length) {
            dataStr += '&';
          }
          dataStr += `${encodeURIComponent(name)}=${encodeURIComponent(data[name])}`;
        }
        data = dataStr;
      }
    }

    // auto setting of content-length header
    if (data && !this.headers['content-length'] &&
      ((typeof this.autoContentLength !== 'boolean' && Request.defaults.autoContentLength === true) ||
      this.autoContentLength === true)
    ) {
      this.headers['content-length'] = utf8ByteLength(data);
    }

    if (typeof window === 'undefined') {
      return this.sendNode(data);
    }

    /* istanbul ignore next */
    return this.sendBrowser(data);
  }
}

Request.defaults = {
  headers: {
    'content-type': 'application/json'
  },
  method: 'GET',
  timeout: 60000,
  rejectUnauthorized: true,
  autoContentLength: false
};

class Base {
  constructor(obj) {
    this.headers = {};
    this.rejectUnauthorized = null;
    this.timeout = null;
    this.autoContentLength = null;

    if (typeof obj === 'string' || (obj instanceof Url)) {
      this.url = obj;
    } else if (obj) {
      Object.assign(this, obj);
    }

    if (this.url && !(this.url instanceof Url)) {
      this.url = new Url(this.url);
    }
  }

  /**
   * Creates a Request object merged from this base.
   * @param {String} method The method for this request.
   * GET, POST, ...
   * @param {String|Object|Url} reqUrl The url to request.
   * @returns {Request}
   */
  request(method, reqUrl) {
    if (!(reqUrl instanceof Url)) {
      reqUrl = new Url(reqUrl);
    }
    let baseUrl = this.url;
    if (!(baseUrl instanceof Url)) {
      baseUrl = new Url(baseUrl);
    }
    reqUrl.mergeFrom(baseUrl);
    const req = new Request(method, reqUrl.toString());

    Object.assign(req.headers, this.headers);
    req.rejectUnauthorized = this.rejectUnauthorized;
    req.timeout = this.timeout;
    req.autoContentLength = this.autoContentLength;

    return req;
  }

  get(reqUrl) {
    return this.request('GET', reqUrl);
  }

  post(reqUrl) {
    return this.request('POST', reqUrl);
  }

  put(reqUrl) {
    return this.request('PUT', reqUrl);
  }

  delete(reqUrl) {
    return this.request('DELETE', reqUrl);
  }

  patch(reqUrl) {
    return this.request('PATCH', reqUrl);
  }
}

module.exports = {
  Response,
  Request,
  Base,
  Url
};
