# Description
http(s) request handler for nodejs and the browser. Supports baseUrls and direct object construction from request results.

# Installation

## Node.js
<pre><code>npm install oohttp --only=prod</code></pre>

## Browser
The provided index.js can be used directly in the browser if it supports ECMAscript 2015 (and higher). For older browser you will need to transpile.

# Examples

## Simple GET request
```javascript
const oohttp = require('oohttp');

// new oohttp.Request('GET', 'http://someurl')
oohttp.Request.get('http://someurl')
  .toJson() // or toString() for the string result
  .then((jsonObj) => {
    console.log(jsonObj);
  });
```

## Posting data
```javascript
const oohttp = require('oohttp');

// new oohttp.Request('POST', 'http://someurl')
oohttp.Request.post('http://someurl')
  .toJson({
    data: 'somedata'
  }) // or toString() for the string result
  .then((jsonObj) => {
    console.log(jsonObj);
  });
```

## Behind a proxy
```javascript
oohttp.Request.get('http://someurl')
  .proxy('http://myproxy.intranet')
  .toJson()
  .then((jsonObj) => {
    console.log(jsonObj);
  });
```

## Basing
Will request http://someurl?other=value&token=x with the given `someHeader` header from this base in addition to the [default headers](#Defaults).
```javascript
const oohttp = require('oohttp');

const base = new oohttp.Base('?token=x');
base.headers['someHeader'] = 'value';

// base.request('GET', 'http://someurl?other=value')
base.get('http://someurl?other=value')
  .toJson()
  .then((jsonObj) => {
    console.log(jsonObj);
  });
```

## Error handling
```javascript
const oohttp = require('oohttp');

oohttp.Request.get('http://nonexistanturl')
  .toJson()
  .then((jsonObj) => {
    console.log(jsonObj);
  })
  .catch((err) => {
    console.log(err.message);

    /**
     * Log the response object which contains;
     * statusCode
     * headers
     * data
     */
    console.log(err.res);
  });
```

## Constructing objects
```javascript
const oohttp = require('oohttp');

class SomeClass {
  constructor(obj) {
    if(obj) {
      Object.assign(this, obj);
    }
  }
}

oohttp.Request.get('http://someurl/api/objects/someobject')
  .toObject(SomeClass)
  .then((someObj) => {
    console.log(someObj);
  });
```

## Constructing object arrays
```javascript
const oohttp = require('oohttp');

class SomeClass {
  constructor(obj) {
    if(obj) {
      Object.assign(this, obj);
    }
  }
}

oohttp.Request.get('http://someurl/api/objects')
  .toObjectArray(SomeClass)
  .then((someObjArray) => {
    console.log(someObjArray);
  });
```

## Passing results through a function
```javascript
const oohttp = require('oohttp');

class SomeClass {
  constructor(obj) {
    if(obj) {
      Object.assign(this, obj);
    }
  }
}

oohttp.Request.get('http://someurl/api/objects')
  .toFunctionArray((obj) => {
    return new SomeClass(obj);
  })
  .then((someObjArray) => {
    console.log(someObjArray);
  });
```

# Defaults
All requests inherit these default properties at the time the request is done.

If a similar property is set directly on the request handler (either Base or Request), than that value is used instead.

```javascript
Request.defaults = {
  headers: {
    'content-type': 'application/json'
  },
  method: 'GET',
  timeout: 60000,
  rejectUnauthorized: true,
  autoContentLength: false
};
```
