import * as path from "path"
import { fileURLToPath } from "url"

interface StringValidator {
  (s: string): boolean
}
const alwaysValid: StringValidator = s => true

/**
 * Helper functions
 */

/**
 * Remove all empty values from the given value (object, array, ...)
 */
export function cleanEmpty(value: any, keepEmptyArrays: boolean=false): any {
  const ignoreArrays = keepEmptyArrays
  if (Array.isArray(value)) {
    return value
        .map(v => (v && typeof v === 'object') ? cleanEmpty(v, keepEmptyArrays) : v)
        .filter(v => !isEmpty(v, ignoreArrays))
  }
  else if (typeof value === 'object') {
    return Object.entries(value)
        .map(([k, v]) => [k, v && typeof v === 'object' ? cleanEmpty(v, keepEmptyArrays) : v])
        .reduce((a: any, [k, v]) => (isEmpty(v, ignoreArrays) ? a : (a[k]=v, a)), {})
  }
  return value
}

/**
 * Check if the given value is empty
 * @note If the optional StringValidator fails to validate a string value, the string is supposed to be empty
 */
export function isEmpty(value: any, ignoreArrays: boolean=false, strValidator: StringValidator=alwaysValid): boolean {
  if (typeof value == 'number' && !isNaN(value)) {
    return false
  }
  else if (!value) {
    return true
  }
  else if (typeof value == 'object') {
    return Object.values(value).every(prop => isEmpty(prop, ignoreArrays, strValidator))
  }
  else if (!ignoreArrays && Array.isArray(value)) {
    return value.length == 0
  }
  else if (typeof value == 'string') {
    return value.trim().length == 0 || !strValidator(value)
  }
  return !value
}

export function isNotEmpty(value: any) {
  return !isEmpty(value)
}

/**
 * Convert the given value to undefined, if it is empty
 */
export function undefinedIfEmpty<Type>(value: Type, strValidator: StringValidator=alwaysValid): Type|undefined {
  return !isEmpty(value, false, strValidator) ? value : undefined
}

/**
 * Convert the given value to null, if it is empty
 */
export function nullIfEmpty<Type>(value: Type, strValidator: StringValidator=alwaysValid): Type|null {
  return !isEmpty(value, false, strValidator) ? value : null
}

/**
 * Check if the given environment variable is set to 1
 */
export function isEnvEnabled(name: string): boolean {
  return process.env[name] !== undefined && parseInt(process.env[name]!) == 1
}

// /**
//  * __dirname replacement for ESM
//  * @param modelMetaUrl Usually import.meta.url
//  * @returns string
//  */
// export function getDirName(modelMetaUrl: string): string {
//   const __filename = fileURLToPath(modelMetaUrl)
//   const __dirname = path.dirname(__filename)
//   return __dirname
// }

/**
 * Add the http protocol scheme to the given url, if not given
 */
export function addScheme(url: string): string {
  return (!url.match(/^https?:\/\//) ? 'http://' : '') + url
}

/**
 * Create a regular expression pattern from the given string (e.g. ".*[Ww][Aa][Ss][Ss][Ee][Rr].*" for "Water")
 */
export function makeRegex(str: string): string {
  let result = '.*'
  if (!str || str.length == 0) {
    return result
  }
  // generate character classes for each char
  const upper = str.toUpperCase()
  const lower = str.toLowerCase()
  for (let i=0; i<str.length; i++) {
    const lowerChar = lower.charAt(i);
    const upperChar = upper.charAt(i);
    if (lowerChar !== upperChar) {
      result += `[${upperChar}${lowerChar}]`
    }
    else {
      result += `[${lowerChar}]`
    }
  }
  result += '.*'
  return result
}
