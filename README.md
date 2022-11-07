# ifetch-node

Nodejs fetch api support: querystring (qs), data of form (data - urlencoded), json

# install
`npm i -S ifetch-node`

# Example
```js
// firstly run: npm i -S ifetch-node

const ifetch = require('ifetch-node')

// basic usage

ifetch('http://echo.opera.com/').then(r => r.text()).then(console.log).catch(console.error)

// with options
ifetch('http://echo.opera.com/', {
  method: 'POST',
  headers: {
    'X-Token': 'Access token here'
  }
})

// Raw http request support
ifetch('http://abc.com', {
  method: 'POST',
  raw: `GET /my-courses HTTP/1.1
Host: abc.com
Cookie: xxx
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:106.0) Gecko/20100101 Firefox/106.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Upgrade-Insecure-Requests: 1
Sec-Fetch-Dest: document
Sec-Fetch-Mode: navigate
Sec-Fetch-Site: same-origin
Sec-Fetch-User: ?1
Te: trailers
Connection: close

`
})

// POST form urlencoded data
ifetch('http//echo.opera.com/', {
  method: 'POST',
  data: {
    a: 1,
    b: 2,
    submit: 'OK'
  }
})

// POST json data
ifetch('http://echo.opera.com/', {
  method: "POST",
  json: {
    abc: 123
  }
})

// POST raw data
ifetch('http://echo.opera.com/', {
  method: 'POST',
  body: 'chak'
})

// POST form-data
// npm i -S form-data
const fs = require('fs')
const FormData = require('form-data')
const formData = new FormData()
formData.append('file', fs.createReadStream('./file_path'))
ifetch('http://echo.opera.com/', {
  method: 'POST',
  body: formData
})

// use json to receive and parse json
ifetch('http://echo.opera.com/', {
  json: true
})

// send json but dont parse the response
ifetch('http://echo.opera.com/', {
  noParseJSON: true,
  method: 'POST',
  json: {
    data: 1
  }
})

// querystring support
ifetch('http://echo.opera.com/', {
  qs: {
    this: 'is',
    in: 'url'
  }
})

// you can also use querystring in post request
ifetch('http://echo.opera.com/', {
  qs: {
    parent_id: 1
  },
  json: {
    id: 2
  },
  method: 'POST'
})


// Default options
const myFecth = ifetch.defaults({
  url: 'http://echo.opera.com', // baseURL,
  headers: { // default options
    'User-Agent': 'ifetch/1.0.3'
  },
  options: function () {
    // dynamic options function
    return {
      // return options object
      json: true,
      headers: {
        'X-Token': getAccessToken()
      }
    }
  }
})

myFecth('/?abc' /* => http://echo.opera.com/?abc */)

```

# Default options
```js
const DEFAULT_OPTIONS = {
  method: 'get',
  headers: {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    Pragma: 'no-cache',
    'Cache-Control': 'no-cache',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
  },
  body: null,
  credentials: true,
  keepalive: true,
  cache: 'no-cache',
  redirect: 'manual', // set to `manual` to extract redirect headers, `follow` to follow redirect, `error` to reject redirect

  // The following properties are node-fetch extensions
  follow: 20, // maximum redirect count. 0 to not follow redirect
  timeout: 10000, // req/res timeout in ms, it resets on redirect. 0 to disable (OS limit applies)
  compress: true, // support gzip/deflate content encoding. false to disable
  size: 0, // maximum response body size in bytes. 0 to disable
}
```

# Thank you
