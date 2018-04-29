'use strict';

/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */

const assert = require('assert');
const oohttp = require('../index.js');
const expressApp = require('express')();
const http = require('http');

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
  before(function () {
    expressServer = expressApp.listen(9800);
  });

  after(function () {
    expressServer.close();
  });

  describe('request()', function () {
    const base = new oohttp.Base('http://localhost');
    const req = base.request('GET', ':9800/testObject');

    it('should return an object', async function () {
      const obj = await req.toObject(Obj);
      assert.deepEqual(testObject, obj);
    });
  });
});
