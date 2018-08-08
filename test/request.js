'use strict';

/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */

const assert = require('assert');
const oohttp = require('../index.js');
const express = require('express');
const httpProxy = require('http-proxy');

const expressApp = express();
expressApp.use(express.json());

expressApp.get('/testSend', (req, res) => {
  res.setHeader('test-header', 'true');
  res.send('some-data');
});

const testArray = [
  {
    name: 'testObject'
  },
  {
    name: 'testObject2'
  }
];
expressApp.get('/testArray', (req, res) => {
  res.json(testArray);
});

const testMap = {
  testObject: {
    name: 'testObject'
  },
  testObject2: {
    name: 'testObject2'
  }
};
expressApp.get('/testMap', (req, res) => {
  res.json(testMap);
});

const testObject = {
  name: 'testObject'
};
expressApp.get('/testObject', (req, res) => {
  res.json(testObject);
});

const testStr = 'this is a test str';
expressApp.get('/testStr', (req, res) => {
  res.end(testStr);
});

expressApp.get('/testHeaders', (req, res) => {
  res.json(req.headers);
});

expressApp.post('/testPostBody', (req, res) => {
  res.json(req.body);
});

expressApp.get('/testTimeout', (req, res) => {
  setTimeout(() => {
    res.end();
  }, 2000);
});

// express for urlencoded post bodies
const expressUrlEncodedApp = express();
expressUrlEncodedApp.use(express.urlencoded());

expressUrlEncodedApp.post('/testPostBody', (req, res) => {
  res.json(req.body);
});

// proxy
const proxyServer = httpProxy.createProxyServer();
const proxyWebserver = require('http').createServer((req, res) => {
  res.setHeader('proxy-test', 'true');

  const authHeader = req.headers['proxy-authorization'];
  if (authHeader) {
    res.setHeader('proxy-auth', authHeader);
  }

  proxyServer.web(req, res, {
    target: req.headers.path
  });
});

// test object
class Obj {
  constructor(obj) {
    Object.assign(this, obj);
  }
}

let expressServer;
let expressUrlEncodedAppServer;

describe('Request', function () {
  before(function () {
    expressServer = expressApp.listen(9800);
    expressUrlEncodedAppServer = expressUrlEncodedApp.listen(9801);
    proxyWebserver.listen(9802);
  });

  after(function () {
    expressServer.close();
    expressUrlEncodedAppServer.close();
    proxyServer.close();
    proxyWebserver.close();
  });

  describe('send()', function () {
    let res;
    before(async function () {
      const req = new oohttp.Request('GET', 'http://localhost:9800/testSend');
      res = await req.send();
    });

    it('should have headers', function () {
      assert.equal(res.headers['test-header'], 'true');
    });

    it('should have data', function () {
      assert.equal(res.data, 'some-data');
    });
  });

  describe('toObjectArray()', function () {
    let objs;
    before(async function () {
      const req = new oohttp.Request('GET', 'http://localhost:9800/testArray');
      objs = await req.toObjectArray(Obj);
    });

    it('should return a list of Obj instances', async function () {
      objs.forEach(obj => assert(obj instanceof Obj));
    });

    it('should have assigned objects', async function () {
      assert.deepEqual(objs, testArray);
    });
  });

  describe('toObjectArray() 404', function () {
    let thrownErr;
    before(async function () {
      const req = new oohttp.Request('GET', 'http://localhost:9800/testArray404');
      try {
        await req.toObjectArray(Obj);
      } catch (err) {
        thrownErr = err;
      }
    });

    it('should throw', async function () {
      assert(thrownErr instanceof Error);
    });

    it('should contain error', async function () {
      assert(thrownErr.res instanceof oohttp.Response);
    });

    it('should return statusCode 404', async function () {
      assert.strictEqual(thrownErr.statusCode, 404);
    });

    it('statusCode on error should equal response statusCode', async function () {
      assert.strictEqual(thrownErr.statusCode, thrownErr.res.statusCode);
    });
  });

  describe('toObjectMap()', function () {
    let objs;
    before(async function () {
      const req = new oohttp.Request('GET', 'http://localhost:9800/testMap');
      objs = await req.toObjectMap(Obj);
    });

    it('should return a map of Obj instances', async function () {
      Object.keys(objs).forEach(key => assert(objs[key] instanceof Obj));
    });

    it('should have assigned objects', async function () {
      assert.deepEqual(objs, testMap);
    });
  });

  describe('toObject()', function () {
    let obj;
    before(async function () {
      const req = new oohttp.Request('GET', 'http://localhost:9800/testObject');
      obj = await req.toObject(Obj);
    });

    it('should return a single Obj instance', async function () {
      assert(obj instanceof Obj);
    });

    it('should have assigned objects', async function () {
      assert.deepEqual(obj, testObject);
    });
  });

  describe('toObject(nonConstr)', function () {
    let thrownErr;
    before(async function () {
      const req = new oohttp.Request('GET', 'http://localhost:9800/testObject');

      try {
        await req.toObject(testStr);
      } catch (err) {
        thrownErr = err;
      }
    });

    it('should throw', async function () {
      assert(thrownErr instanceof Error);
    });
  });

  describe('toObject() 404', function () {
    const req = new oohttp.Request('GET', 'http://localhost:9800/testObject404');

    it('should return null', async function () {
      const obj = await req.toObject(Obj);
      assert(obj === null);
    });
  });

  describe('toString()', function () {
    const req = new oohttp.Request('GET', 'http://localhost:9800/testStr');

    it('should return a string', async function () {
      const str = await req.toString();
      assert.strictEqual(str, testStr);
    });
  });

  describe('toJson()', function () {
    const req = new oohttp.Request('GET', 'http://localhost:9800/testObject');

    it('should return a JSON object', async function () {
      const json = await req.toJson();
      assert.deepEqual(json, testObject);
    });
  });

  describe('toJson("ws://")', function () {
    const req = new oohttp.Request('GET', 'ws://localhost:9800/testObject');
    it('should throw', async function () {
      let thrownErr;
      try {
        await req.toJson();
      } catch (err) {
        thrownErr = err;
      }

      assert(thrownErr instanceof Error);
    });
  });

  describe('headers', function () {
    const req = new oohttp.Request('GET', 'http://localhost:9800/testHeaders');

    it('should send headers', async function () {
      req.headers['x-test-header'] = 'test';
      const headers = await req.toJson();
      assert.strictEqual(headers['x-test-header'], 'test');
    });

    it('non-numbers and non-strings should be deleted', async function () {
      req.headers['x-test-header'] = 'test';
      req.headers['x-obj-header'] = { some: 'obj' };
      const headers = await req.toJson();
      assert.strictEqual(headers['x-test-header'], 'test');
      assert.strictEqual(headers['x-obj-header'], undefined);
    });
  });

  describe('post body', function () {
    const req = new oohttp.Request('POST', 'http://localhost:9800/testPostBody');

    it('should send body', async function () {
      const postBody = {
        test: 'value'
      };
      const returnBody = await req.toJson(postBody);
      assert.deepEqual(postBody, returnBody);
    });
  });

  describe('auto content length', function () {
    const req = new oohttp.Request('POST', 'http://localhost:9800/testPostBody');
    req.autoContentLength = true;

    it('should set content-length header', async function () {
      const postBody = {
        test: 'value'
      };
      await req.toJson(postBody);
      assert.equal(req.headers['content-length'], 16);
    });
  });

  describe('non json content-type', function () {
    const req = new oohttp.Request('POST', 'http://localhost:9801/testPostBody');
    req.headers['content-type'] = 'application/x-www-form-urlencoded';

    it('should encode form data', async function () {
      const postBody = {
        test: 'value',
        test2: 'value2',
        escaped: 'some&thing?etc'
      };
      const returnBody = await req.toJson(postBody);
      assert.deepEqual(postBody, returnBody);
    });
  });

  describe('timeouts', function () {
    const req = new oohttp.Request('GET', 'http://localhost:9800/testTimeout');
    req.timeout = 1000;

    it('should trigger timeout event', async function () {
      let thrownErr;
      try {
        await req.send();
      } catch (err) {
        thrownErr = err;
      }

      assert(thrownErr instanceof Error);
      assert.equal(thrownErr.message, 'timeout');
    });
  });

  describe('http methods', function () {
    describe('get()', function () {
      it('method should be set to GET', function () {
        const req = oohttp.Request.get('someurl');
        assert.equal(req.method, 'GET');
      });
    });

    describe('post()', function () {
      it('method should be set to POST', function () {
        const req = oohttp.Request.post('someurl');
        assert.equal(req.method, 'POST');
      });
    });

    describe('put()', function () {
      it('method should be set to PUT', function () {
        const req = oohttp.Request.put('someurl');
        assert.equal(req.method, 'PUT');
      });
    });

    describe('delete()', function () {
      it('method should be set to DELETE', function () {
        const req = oohttp.Request.delete('someurl');
        assert.equal(req.method, 'DELETE');
      });
    });

    describe('patch()', function () {
      it('method should be set to PATCH', function () {
        const req = oohttp.Request.patch('someurl');
        assert.equal(req.method, 'PATCH');
      });
    });
  });

  describe('proxy', function () {
    describe('req.proxyUrl', function () {
      let res;
      before(async function () {
        const req = oohttp.Request.get('http://localhost:9800/testObject');
        req.proxyUrl = 'http://localhost:9802';
        res = await req.send();
      });
  
      it('should have proxy header', function () {
        assert.equal(res.headers['proxy-test'], 'true');
      });
    });

    describe('req.proxy()', function () {
      let req;
      before(function () {
        req = oohttp.Request.get('http://localhost:9800/testObject');
      });

      it('should chain', function () {
        assert.equal(req.proxy('http://testusr:testpwd@localhost:9802'), req);
      });

      it('should set proxyUrl', function () {
        assert.equal(req.proxyUrl, 'http://testusr:testpwd@localhost:9802');
      });

      it('should have proxy header', async function () {
        const res = await req.send();
        assert.equal(res.headers['proxy-test'], 'true');
      });

      it('should have proxy-auth header', async function () {
        const res = await req.send();
        assert.equal(res.headers['proxy-auth'], 'Basic dGVzdHVzcjp0ZXN0cHdk');
      });
    });
  });
});
