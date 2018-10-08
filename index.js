const { URL } = require('url')
const fetch = require('node-fetch-npm')
const util = require('./util')

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
  redirect: 'follow', // set to `manual` to extract redirect headers, `error` to reject redirect

  // The following properties are node-fetch-npm extensions
  follow: 20, // maximum redirect count. 0 to not follow redirect
  timeout: 10000, // req/res timeout in ms, it resets on redirect. 0 to disable (OS limit applies)
  compress: true, // support gzip/deflate content encoding. false to disable
  size: 0, // maximum response body size in bytes. 0 to disable
  agent: null // http(s).Agent instance, allows custom proxy, certificate etc.
}

/**
 * ifetch - fetch api for node
 * @param {String|URL} url URL
 * @param {Object} [options]
 * @return {Promise}
 */
function ifetch (url, options) {
  try {
    if (!(url instanceof URL)) {
      url = new URL(url)
    }

    if (!options) {
      options = {}
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
      genOptions.headers['Accept'] = 'application/json'
      if (options.method && (options.method + '').toLowerCase() !== 'get') {
        if (!options.body) {
          genOptions.headers['Content-Type'] = 'application/json'
          genOptions.body = JSON.stringify(options.json)
        }
      }
      delete options['json']
      json = true
    }

    // url encoded data
    if (options.data && util.isPlainObject(options.data)) {
      genOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded'
      if (!options.body) {
        genOptions.body = util.httpBuildQuery(options.data)
      }
      if (options.method.toLowerCase() === 'get') {
        genOptions.method = 'post'
      }
      delete options['data']
    }

    options.referer = url.href

    options = util.merge({}, DEFAULT_OPTIONS, genOptions, options)
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
ifetch.defaults = function (baseOptions) {
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
  return function (url, options) {
    // ifetch function
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

exports = module.exports = ifetch
