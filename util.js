const { URL } = require('url')
const toString = Object.prototype.toString
const qs = require('query-string')
const { Response } = require('node-fetch')

/**
 * Test if x is plain object
 * @param {any} x variable to test
 * @return {Boolean}
 */
function isPlainObject (x) {
  let prototype
  // eslint-disable-next-line no-return-assign
  return toString.call(x) === '[object Object]' && (prototype = Object.getPrototypeOf(x), prototype === null || prototype === Object.getPrototypeOf({}))
}

/**
 * Merge url instance
 * @param {String|URL} path path or url string
 * @param {URL} url base URL instance
 * @return {URL}
 */
function mergeURL (path, url) {
  return new URL(path, url)
}

/**
 * Merge objects
 * @param {Object} target object to store result
 * @param  {...Object} sources source object
 * @return target object
 */
function merge (target) {
  const sources = Array.prototype.slice.call(arguments, 1)
  for (const source of sources) {
    for (const [key, sourceValue] of Object.entries(source)) {
      if (undefined === sourceValue) {
        continue
      }

      const targetValue = target[key]
      if (targetValue instanceof URL) {
        target[key] = mergeURL(sourceValue, targetValue)
      } else if (isPlainObject(sourceValue)) {
        if (isPlainObject(targetValue)) {
          target[key] = merge({}, targetValue, sourceValue)
        } else {
          target[key] = merge({}, sourceValue)
        }
      } else if (sourceValue instanceof Array) {
        target[key] = merge([], sourceValue)
      } else {
        target[key] = sourceValue
      }
    }
  }

  return target
}

/**
 * Append params to url
 * @param {URL} url url to append to
 * @param {Object} o params object
 */
function appendSearchParams (url, o, prefix) {
  for (let p in o) {
    if (o.hasOwnProperty(p)) {
      const k = prefix ? prefix + '[' + p + ']' : p
      const v = o[p]
      if (v !== null && typeof v === 'object') {
        appendSearchParams(url, v, k)
      } else {
        url.searchParams.append(k, v)
      }
    }
  }
  return url
}

function httpBuildQuery (o) {
  return qs.stringify(o, '&', '=', { encodeURIComponent })
}

function parseJSON (t) {
  if (t instanceof Response) {
    return t.text().then(parseJSON)
  }
  return JSON.parse(t.replace('for (;;);\r\n', ''))
}

exports = module.exports = {
  merge,
  isPlainObject,
  toString,
  mergeURL,
  parseJSON,
  httpBuildQuery,
  appendSearchParams
}
