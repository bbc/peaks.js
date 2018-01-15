/**
 * @file
 *
 * Some general utility functions.
 *
 * @module peaks/waveform/waveform.utils
 */

define(function() {
  'use strict';

  if (typeof Number.isFinite !== 'function') {
    Number.isFinite = function isFinite(value) {
      if (typeof value !== 'number') {
        return false;
      }

      // Check for NaN and infinity
      // eslint-disable-next-line no-self-compare
      if (value !== value || value === Infinity || value === -Infinity) {
        return false;
      }

      return true;
    };
  }

  function zeroPad(number) {
    return number < 10 ? '0' + number : number;
  }

  return {

    /**
     * Returns a formatted time string.
     *
     * @param {Number} time The time to be formatted, in seconds.
     * @param {Boolean} dropHundredths Don't display hundredths of a second if true.
     * @returns {String}
     */

    formatTime: function(time, dropHundredths) {
      var result = [];

      var hundredths = Math.floor((time % 1) * 100);
      var seconds = Math.floor(time);
      var minutes = Math.floor(seconds / 60);
      var hours = Math.floor(minutes / 60);

      if (hours > 0) {
        result.push(hours); // Hours
      }
      result.push(minutes % 60); // Mins
      result.push(seconds % 60); // Seconds

      for (var i = 0; i < result.length; i++) {
        result[i] = zeroPad(result[i]);
      }

      result = result.join(':');

      if (!dropHundredths) {
        result += '.' + zeroPad(hundredths);
      }

      return result;
    },

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

    roundUpToNearest: function(value, multiple) {
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
    },

    clamp: function(value, min, max) {
      if (value < min) {
        return min;
      }
      else if (value > max) {
        return max;
      }
      else {
        return value;
      }
    },

    extend: function(to, from) {
      for (var key in from) {
        if (from.hasOwnProperty(key)) {
          to[key] = from[key];
        }
      }

      return to;
    },

    /**
     * Checks whether the given array contains values in ascending order.
     *
     * @param {Array<Number>} array The array to test
     * @returns {Boolean}
     */

    isInAscendingOrder: function(array) {
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
    },

    /**
     * Checks whether the given value is a number.
     *
     * @param {Number} value The value to test
     * @returns {Boolean}
     */

    isNumber: function(value) {
      return typeof value === 'number';
    },

    /**
     * Checks whether the given value is a valid timestamp.
     *
     * @param {Number} value The value to test
     * @returns {Boolean}
     */

    isValidTime: function(value) {
      return (typeof value === 'number') && Number.isFinite(value);
    },

    /**
     * Checks whether the given value is a valid object.
     *
     * @param {Number} value The value to test
     * @returns {Boolean}
     */

    isObject: function(value) {
      return (value !== null) && (typeof value === 'object')
        && !Array.isArray(value);
    },

    /**
     * Checks whether the given value is a valid string.
     *
     * @param {String} value The value to test
     * @returns {Boolean}
     */

    isString: function(value) {
      return typeof value === 'string';
    },

    /**
     * Checks whether the given value is null or undefined.
     *
     * @param {Object} value The value to test
     * @returns {Boolean}
     */

    isNullOrUndefined: function(value) {
      return value === undefined || value === null;
    },

    /**
     * Checks whether the given value is a function.
     *
     * @param {Function} value The value to test
     * @returns {Boolean}
     */

    isFunction: function(value) {
      return typeof value === 'function';
    }
  };
});
