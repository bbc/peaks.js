function zeroPad(number, precision) {
  number = number.toString();

  while (number.length < precision) {
    number = '0' + number;
  }

  return number;
}

/**
 * Returns a formatted time string.
 *
 * @param {Number} time The time to be formatted, in seconds.
 * @param {Number} precision Decimal places to which time is displayed
 * @returns {String}
 */

export function formatTime(time, precision) {
  var result = [];

  var fractionSeconds = Math.floor((time % 1) * Math.pow(10, precision));
  var seconds = Math.floor(time);
  var minutes = Math.floor(seconds / 60);
  var hours = Math.floor(minutes / 60);

  if (hours > 0) {
    result.push(hours); // Hours
  }
  result.push(minutes % 60); // Mins
  result.push(seconds % 60); // Seconds

  for (var i = 0; i < result.length; i++) {
    result[i] = zeroPad(result[i], 2);
  }

  result = result.join(':');

  if (precision > 0) {
    result += '.' + zeroPad(fractionSeconds, precision);
  }

  return result;
}

/**
 * Rounds the given value up to the nearest given multiple.
 *
 * @param {Number} value
 * @param {Number} multiple
 * @returns {Number}
 *
 * @example
 * roundUpToNearest(5.5, 3); // returns 6
 * roundUpToNearest(141.0, 10); // returns 150
 * roundUpToNearest(-5.5, 3); // returns -6
 */

export function roundUpToNearest(value, multiple) {
  if (multiple === 0) {
    return 0;
  }

  var multiplier = 1;

  if (value < 0.0) {
    multiplier = -1;
    value = -value;
  }

  var roundedUp = Math.ceil(value);

  return multiplier * (((roundedUp + multiple - 1) / multiple) | 0) * multiple;
}

export function clamp(value, min, max) {
  if (value < min) {
    return min;
  }
  else if (value > max) {
    return max;
  }
  else {
    return value;
  }
}

export function objectHasProperty(object, field) {
  return Object.prototype.hasOwnProperty.call(object, field);
}

export function extend(to, from) {
  for (var key in from) {
    if (objectHasProperty(from, key)) {
      to[key] = from[key];
    }
  }

  return to;
}

/**
 * Checks whether the given array contains values in ascending order.
 *
 * @param {Array<Number>} array The array to test
 * @returns {Boolean}
 */

export function isInAscendingOrder(array) {
  if (array.length === 0) {
    return true;
  }

  var value = array[0];

  for (var i = 1; i < array.length; i++) {
    if (value >= array[i]) {
      return false;
    }

    value = array[i];
  }

  return true;
}

/**
 * Checks whether the given value is a number.
 *
 * @param {Number} value The value to test
 * @returns {Boolean}
 */

export function isNumber(value) {
  return typeof value === 'number';
}

/**
 * Checks whether the given value is a finite number.
 *
 * @param {Number} value The value to test
 * @returns {Boolean}
 */

export function isFinite(value) {
  if (typeof value !== 'number') {
    return false;
  }

  // Check for NaN and infinity
  // eslint-disable-next-line no-self-compare
  if (value !== value || value === Infinity || value === -Infinity) {
    return false;
  }

  return true;
}

/**
 * Checks whether the given value is a valid timestamp.
 *
 * @param {Number} value The value to test
 * @returns {Boolean}
 */

export function isValidTime(value) {
  return (typeof value === 'number') && Number.isFinite(value);
}

/**
 * Checks whether the given value is a valid object.
 *
 * @param {Object|Array} value The value to test
 * @returns {Boolean}
 */

export function isObject(value) {
  return (value !== null) && (typeof value === 'object')
    && !Array.isArray(value);
}

/**
 * Checks whether the given value is a valid string.
 *
 * @param {String} value The value to test
 * @returns {Boolean}
 */

export function isString(value) {
  return typeof value === 'string';
}

/**
 * Checks whether the given value is a valid ArrayBuffer.
 *
 * @param {ArrayBuffer} value The value to test
 * @returns {Boolean}
 */

export function isArrayBuffer(value) {
  return Object.prototype.toString.call(value).includes('ArrayBuffer');
}

/**
 * Checks whether the given value is null or undefined.
 *
 * @param {Object} value The value to test
 * @returns {Boolean}
 */

export function isNullOrUndefined(value) {
  return value === undefined || value === null;
}

/**
 * Checks whether the given value is a function.
 *
 * @param {Function} value The value to test
 * @returns {Boolean}
 */

export function isFunction(value) {
  return typeof value === 'function';
}

/**
 * Checks whether the given value is a boolean.
 *
 * @param {Function} value The value to test
 * @returns {Boolean}
 */

export function isBoolean(value) {
  return value === true || value === false;
}

/**
 * Checks whether the given value is a valid HTML element.
 *
 * @param {HTMLElement} value The value to test
 * @returns {Boolean}
 */

export function isHTMLElement(value) {
  return value instanceof HTMLElement;
}

/**
 * Checks whether the given value is an array
 * @param {Function} value The value to test
 * @returns {Boolean}
 */

export function isArray(value) {
  return Array.isArray(value);
}

/**
 * Checks whether the given value is a valid linear gradient color
 * @param {Function} value The value to test
 * @returns {Boolean}
 */

export function isLinearGradientColor(value) {
  return isObject(value) &&
    objectHasProperty(value, 'linearGradientStart') &&
    objectHasProperty(value, 'linearGradientEnd') &&
    objectHasProperty(value, 'linearGradientColorStops') &&
    isNumber(value.linearGradientStart) &&
    isNumber(value.linearGradientEnd) &&
    isArray(value.linearGradientColorStops) &&
    value.linearGradientColorStops.length === 2;
}
