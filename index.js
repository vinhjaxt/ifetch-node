const { URL } = require('url')
const fetch = require('node-fetch')
const util = require('./util')
const byte0d = Buffer.from('\r')[0]
const byte0a = Buffer.from('\n')[0]
const HttpAgent = require('agentkeepalive')
const HttpsAgent = HttpAgent.HttpsAgent
const defaultAgentOptions = {
  maxSockets: 100,
  maxFreeSockets: 10,
  timeout: 60000, // active socket keepalive for 60 seconds
  freeSocketTimeout: 30000, // free socket keepalive for 30 seconds
}
const defaultHttpAgent = new HttpAgent(defaultAgentOptions)
const defaultHttpsAgent = new HttpsAgent(defaultAgentOptions)

const DEFAULT_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    pragma: 'no-cache',
    'accept-language': 'en-US,en;q=0.5',
    'cache-control': 'no-cache',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
  },
  body: null,
  redirect: 'manual', // set to `manual` to extract redirect headers, `follow` to follow redirect, `error` to reject redirect

  // The following properties are node-fetch-npm extensions
  follow: 20, // maximum redirect count. 0 to not follow redirect
  timeout: 10000, // req/res timeout in ms, it resets on redirect. 0 to disable (OS limit applies)
  compress: true, // support gzip/deflate content encoding. false to disable
  size: 0, // maximum response body size in bytes. 0 to disable
  httpAgent: defaultHttpAgent, // httpAgent instance, allows custom proxy, certificate etc.
  httpsAgent: defaultHttpsAgent // httpsAgent instance, allows custom proxy, certificate etc.
}

function parseRawRequest(rawRequest) {
  if (!(rawRequest instanceof Buffer)) rawRequest = Buffer.from(rawRequest)
  let nextEmptyLineFlag = false
  for (let i = 0; i < rawRequest.length; i++) {
    if (rawRequest[i] === byte0d) continue
    if (rawRequest[i] === byte0a) {
      if (nextEmptyLineFlag) {
        // reach \r\n\r\n
        return [rawRequest.slice(0, i).toString().replace(/[\r\n]+$/, ''), rawRequest.slice(i + 1)]
      }
      nextEmptyLineFlag = true
    } else {
      nextEmptyLineFlag = false
    }
  }
  throw new Error('Invalid raw request')
}

/**
 * ifetch - fetch api for node
 * @param {String|URL} url URL
 * @param {Object} [options]
 * @return {Promise}
 */
function ifetch(url, options) {
  try {
    if (typeof url === 'string') {
      url = new URL(url)
    } else {
      throw new Error('URL must be a string')
    }

    if (!options) {
      options = {}
    }

    if (options.headers) {
      for (let k in options.headers) {
        const kl = k.toLowerCase()
        if (k === kl) continue
        options.headers[kl] = options.headers[k]
        delete options.headers[k]
      }
    }

    if (options.raw) {
      const [rawHeaders, rawBody] = parseRawRequest(options.raw)
      const lines = rawHeaders.split(/\r?\n/)
      const httpLine = /([A-Z]+)\s(.+?)\sHTTP\/[\d\.]+$/.exec(lines.shift())
      if (!httpLine) throw new Error('Invalid raw request')
      if (!options.method) options.method = httpLine[1]
      url = new URL(httpLine[2], url)
      if (!options.headers) options.headers = {}
      for (const line of lines) {
        let idx = line.indexOf(':')
        if (!~idx) continue
        const k = line.substr(0, idx).toLowerCase()
        if (line[idx + 1] === ' ') idx++
        if (!options.headers[k]) options.headers[k] = line.substr(idx + 1)
      }
      options.body = rawBody
      delete options.headers['content-length']
      delete options.raw
    }

    if (options.qs) {
      util.appendSearchParams(url, options.qs)
      delete options['qs']
    }

    const genOptions = {
      headers: {}
    }

    let noParseJSON
    if (options.hasOwnProperty('noParseJSON')) {
      noParseJSON = options.noParseJSON
      delete options['noParseJSON']
    }

    // json data
    let json = false
    if (options.hasOwnProperty('json')) {
      genOptions.headers['accept'] = 'application/json'
      if (options.method && (options.method + '').toUpperCase() !== 'GET') {
        if (!options.body) {
          genOptions.headers['content-type'] = 'application/json'
          genOptions.body = JSON.stringify(options.json)
        }
      }
      delete options['json']
      json = true
    }

    // url encoded data
    if (options.data && util.isPlainObject(options.data)) {
      genOptions.headers['content-type'] = 'application/x-www-form-urlencoded'
      if (!options.body) {
        genOptions.body = util.httpBuildQuery(options.data)
      }
      delete options['data']
    }

    if ((genOptions.body || options.body) && (!options.method || (options.method + '').toUpperCase() === 'GET')) {
      genOptions.method = 'POST'
    }

    options.referer = url.href

    options = util.merge({}, DEFAULT_OPTIONS, genOptions, options)

    options.agent = url.protocol === 'https:' ? options.httpsAgent : options.httpAgent
    delete options.httpAgent
    delete options.httpsAgent

    if (json && !noParseJSON) {
      return fetch(url, options).then(util.parseJSON)
    }
    return fetch(url, options)
  } catch (e) {
    return Promise.reject(e)
  }
}

/**
 * Set default ifetch options
 * @param {Object} baseOptions default options
 * @return {Function} fetch function
 */
ifetch.defaults = baseOptions => {
  let baseURL
  if (baseOptions.url) {
    baseURL = baseOptions.url
    delete baseOptions['url']
    if (!(baseURL instanceof URL)) {
      baseURL = new URL(baseURL) // it'll throw error if url not valid
    }
  }

  let baseOptionsFunction
  if (baseOptions.options) {
    baseOptionsFunction = baseOptions.options
    delete baseOptions['options']
  }

  /**
   * ifetch function
   * @param {String|URL} url
   * @param {Object} [options]
   */
  return (url, options) => {
    // ifetch function
    if (typeof url !== 'string' && !(url instanceof URL)) {
      options = url
      url = '/'
    }

    if (baseURL) {
      url = util.mergeURL(url, baseURL)
    }
    if (baseOptionsFunction && (typeof (baseOptionsFunction) === 'function')) {
      if (options) {
        options = util.merge({}, baseOptions, baseOptionsFunction(), options)
      } else {
        options = util.merge({}, baseOptions, baseOptionsFunction())
      }
    } else {
      if (options) {
        options = util.merge({}, baseOptions, options)
      } else {
        options = util.merge({}, baseOptions)
      }
    }
    return ifetch(url, options)
  }
}

ifetch.DEFAULT_OPTIONS = DEFAULT_OPTIONS

exports = module.exports = ifetch
