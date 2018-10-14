'use strict';

/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */

const assert = require('assert');
const oohttp = require('../index.js');

describe('Url', function () {
  describe('.parse({pathname})', function () {
    const url = new oohttp.Url({
      pathname: '/test',
      query: {
        woot: 'meuq'
      },
      hash: 'assignedHash'
    });

    it('should copy pathname', function () {
      assert.strictEqual(url.pathname, '/test');
    });

    it('should copy query', function () {
      assert.deepStrictEqual(url.query, { woot: 'meuq' });
    });

    it('should not have hostname', function () {
      assert.strictEqual(url.hostname, null);
    });

    it('should not have protocol', function () {
      assert.strictEqual(url.protocol, null);
    });

    it('should copy hash', function () {
      assert.strictEqual(url.hash, 'assignedHash');
    });

    it('toString should be correct', function () {
      assert.strictEqual(url.toString(), '/test?woot=meuq#assignedHash');
    });
  });

  describe('.parse({path})', function () {
    const url = new oohttp.Url({
      hostname: 'test.test.test',
      path: '/test?woot=meuq',
      protocol: 'http'
    });

    it('should have pathname', function () {
      assert.strictEqual(url.pathname, '/test');
    });

    it('should have query', function () {
      assert.deepStrictEqual(url.query, { woot: 'meuq' });
    });

    it('should have hostname', function () {
      assert.strictEqual(url.hostname, 'test.test.test');
    });

    it('should have protocol', function () {
      assert.strictEqual(url.protocol, 'http');
    });

    it('should not have hash', function () {
      assert.strictEqual(url.hash, null);
    });

    it('toString should be correct', function () {
      assert.strictEqual(url.toString(), 'http://test.test.test/test?woot=meuq');
    });
  });

  describe('.parse("str?#")', function () {
    const url = new oohttp.Url('https://test.test.test/test?woot=meuq&blaat=woot%20etc&woot=meuq2&woot=meuq3#strHash');

    it('should have pathname', function () {
      assert.strictEqual(url.pathname, '/test');
    });

    it('should have query', function () {
      assert.deepStrictEqual(url.query, { woot: ['meuq', 'meuq2', 'meuq3'], blaat: 'woot etc' });
    });

    it('should have hostname', function () {
      assert.strictEqual(url.hostname, 'test.test.test');
    });

    it('should have protocol', function () {
      assert.strictEqual(url.protocol, 'https');
    });

    it('should have hash', function () {
      assert.strictEqual(url.hash, 'strHash');
    });

    it('toString should be correct', function () {
      assert.strictEqual(url.toString(), 'https://test.test.test/test?woot=meuq&woot=meuq2&woot=meuq3&blaat=woot%20etc#strHash');
    });
  });

  describe('.parse("str")', function () {
    const url = new oohttp.Url('http://test.test.test');

    it('should not have pathname', function () {
      assert.equal(url.pathname, null);
    });

    it('should have hostname', function () {
      assert.strictEqual(url.hostname, 'test.test.test');
    });

    it('should have protocol', function () {
      assert.strictEqual(url.protocol, 'http');
    });

    it('should not have querystring', function () {
      assert.deepStrictEqual(url.query, {});
    });

    it('should not have hash', function () {
      assert.strictEqual(url.hash, null);
    });
  });

  describe('.parseQueryString(undefined)', function() {
    it('should not parse no querystring', function () {
      assert.deepStrictEqual(oohttp.Url.parseQueryString(), {});
    });
  });

  describe('merge', function () {
    describe('mergeFrom(Url)', function () {
      const baseUrl = new oohttp.Url('https://test.test.test:1234/test?woot=meuq&blaat=woot#strHash');
      const url = new oohttp.Url('http:///pathname');
      url.mergeFrom(baseUrl);

      it('should keep protocol', function () {
        assert.strictEqual(url.protocol, 'http');
      });

      it('should keep pathname', function () {
        assert.strictEqual(url.pathname, '/pathname');
      });

      it('should copy hostname', function () {
        assert.strictEqual(url.hostname, 'test.test.test');
      });

      it('should copy port', function () {
        assert.strictEqual(url.port, 1234);
      });

      it('toString should be correct', function () {
        assert.strictEqual(url.toString(), 'http://test.test.test:1234/pathname?woot=meuq&blaat=woot#strHash');
      });
    });

    describe('mergeFrom("url")', function () {
      it('toString should be correct', function () {
        const url = new oohttp.Url('https://:1234/pathname?query=str&test=test2&test=test3');
        url.mergeFrom('http://test.test.test?query=string&test=test4&test=test5');
        assert.strictEqual(url.toString(), 'https://test.test.test:1234/pathname?query=str&query=string&test=test2&test=test3&test=test4&test=test5');
      });

      it('toString should be correct', function () {
        const url = new oohttp.Url('https://:1234?query=str&test=test2');
        url.mergeFrom('http://test.test.test/pathname?query=string');
        assert.strictEqual(url.toString(), 'https://test.test.test:1234/pathname?query=str&query=string&test=test2');
      });
    });

    describe('mergeFrom(null)', function () {
      const url = new oohttp.Url('https://test');
      url.mergeFrom();
      it('should not do anything', function () {
        assert.strictEqual(url.toString(), 'https://test');
      });
    });
  });
});
