/**
 * @file
 *
 * Some general utility functions.
 *
 * @module peaks/waveform/waveform.utils
 */
define(function() {
  'use strict';

  function zeroPad(number) {
    return number < 10 ? '0' + number : number;
  }

  return {

    /**
     * Returns a formatted time string.
     *
     * @param {int}     time            Time in seconds to be formatted
     * @param {Boolean} dropHundredths  Don't display hundredths of a second if true
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
    }
  };
});
