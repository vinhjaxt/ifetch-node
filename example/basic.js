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
  method: "PUT",
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
// npm i form-data
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

// send json but dont parse response
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

// Thanks
