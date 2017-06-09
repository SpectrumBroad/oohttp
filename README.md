# Description
http(s) request handler for nodejs and the browser. Supports baseUrls and direct object construction from request results.

# Installation

## Node.js
<pre><code>npm install oohttp --only=prod</code></pre>

## Browser
The provided index.js can be used directly in the browser if it supports ECMAscript 2015 (and higher). For older browser you will need to transpile.

# Examples

## Simple request
<pre><code>const oohttp = require('oohttp');

new oohttp.Request('GET', 'http://someurl')
  .toJson() // or toString() for the string result
  .then((jsonObj) => {
    console.log(jsonObj);
  });
</code></pre>

## Basing
Will request http://someurl?other=value&token=x with the given 'someHeader' header from the base and the [default headers](#Defaults).
<pre><code>const oohttp = require('oohttp');

const base = new oohttp.Base('?token=x');
base.headers['someHeader'] = 'value';

base.request('http://someurl?other=value')
  .toJson()
  .then((jsonObj) => {
    console.log(jsonObj);
  });
</pre></code>

## Error handling
<pre><code>const oohttp = require('oohttp');

new oohttp.Request('GET', 'http://nonexistanturl')
  .toJson()
  .then((jsonObj) => {
    console.log(jsonObj);
  })
  .catch((err) => {
    console.log(err.message);
    console.log(err.statusCode);
    console.log(err.data);
  });
</code></pre>

## Constructing objects
<pre><code>const oohttp = require('oohttp');

class SomeClass {
  constructor(obj) {
    if(obj) {
      Object.assign(this, obj);
    }
  }
}

new oohttp.Request('GET', 'http://someurl/api/objects/someobject')
  .toObject(SomeClass)
  .then((someObj) => {
    console.log(someObj);
  });
</code></pre>

## Constructing object arrays
<pre><code>const oohttp = require('oohttp');

class SomeClass {
  constructor(obj) {
    if(obj) {
      Object.assign(this, obj);
    }
  }
}

new oohttp.Request('GET', 'http://someurl/api/objects')
  .toObjectArray(SomeClass)
  .then((someObjArray) => {
    console.log(someObjArray);
  });
</code></pre>

# Defaults
All requests inherit these default properties at the time the request is done.

If a similar property is set directly on the request handler (either Base or Request), than that value is used instead.

<pre><code>Request.defaults = {
  headers: {
    'content-type': 'application/json'
  },
  method: 'GET',
  timeout: 60000,
  rejectUnauthorized: true,
  autoContentLength: false
};</code></pre>
