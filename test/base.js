'use strict';

/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */

const assert = require('assert');
const expressApp = require('express')();
const oohttp = require('../index.js');

const testObject = {
  name: 'testObject'
};

expressApp.get('/testObject', (req, res) => {
  res.json(testObject);
});

// test object
class Obj {
  constructor(obj) {
    Object.assign(this, obj);
  }
}

let expressServer;

describe('Base', function () {
  const base = new oohttp.Base('http://localhost');
  before(function () {
    expressServer = expressApp.listen(9800);
  });

  after(function () {
    expressServer.close();
  });

  describe('passing object as argument', function () {
    const newBase = new oohttp.Base({
      url: 'http://127.0.0.1/',
      autoContentLength: true
    });

    it('should assign properties', function () {
      assert.equal(newBase.autoContentLength, true);
      assert(newBase.url instanceof oohttp.Url);
      assert.equal(newBase.url.toString(), 'http://127.0.0.1/');
    });
  });

  describe('request()', function () {
    const req = base.request('GET', ':9800/testObject');

    it('should return a Request object', async function () {
      assert(req instanceof oohttp.Request);
    });

    it('toObject(constr) should return an object', async function () {
      const obj = await req.toObject(Obj);
      assert.deepEqual(testObject, obj);
    });
  });

  describe('http methods', function () {
    describe('get()', function () {
      const req = base.get(':9800/testObject');

      it('should return a Request object', async function () {
        assert(req instanceof oohttp.Request);
      });

      it('method should be set to GET', async function () {
        assert.equal(req.method, 'GET');
      });
    });

    describe('post()', function () {
      const req = base.post(':9800/testObject');

      it('should return a Request object', async function () {
        assert(req instanceof oohttp.Request);
      });

      it('method should be set to POST', async function () {
        assert.equal(req.method, 'POST');
      });
    });

    describe('put()', function () {
      const req = base.put(':9800/testObject');

      it('should return a Request object', async function () {
        assert(req instanceof oohttp.Request);
      });

      it('method should be set to PUT', async function () {
        assert.equal(req.method, 'PUT');
      });
    });

    describe('delete()', function () {
      const req = base.delete(':9800/testObject');

      it('should return a Request object', async function () {
        assert(req instanceof oohttp.Request);
      });

      it('method should be set to DELETE', async function () {
        assert.equal(req.method, 'DELETE');
      });
    });

    describe('patch()', function () {
      const req = base.patch(':9800/testObject');

      it('should return a Request object', async function () {
        assert(req instanceof oohttp.Request);
      });

      it('method should be set to PATCH', async function () {
        assert.equal(req.method, 'PATCH');
      });
    });
  });

  describe('base.url = str', function () {
    base.url = 'http://127.0.0.1';

    it('should be parsed as Url when Request object is created', function () {
      const req = base.get('/something');

      assert(req.url instanceof oohttp.Url);
      assert.equal(req.url.toString(), 'http://127.0.0.1/something');
    });
  });
});
