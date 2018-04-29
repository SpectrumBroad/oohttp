'use strict';

/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */

const assert = require('assert');
const oohttp = require('../index.js');
const expressApp = require('express')();
expressApp.use(require('body-parser').json());
const http = require('http');

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

// test object
class Obj {
  constructor(obj) {
    Object.assign(this, obj);
  }
}

let expressServer;

describe('Request', function () {
  before(function () {
    expressServer = expressApp.listen(9800);
  });

  after(function () {
    expressServer.close();
  });

  describe('toObjectArray()', function () {
    let objs;
    before(async function () {
      const req = new oohttp.Request('GET', 'http://localhost:9800/testArray');
      objs = await req.toObjectArray(Obj);
    })

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

    it('should return statusCode 404', async function () {
      assert.strictEqual(thrownErr.statusCode, 404);
    })
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
        obj = await req.toObject(testStr);
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
});
