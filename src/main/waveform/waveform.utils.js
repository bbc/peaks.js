/**
 * @file
 *
 * Some general utility functions.
 *
 * @module peaks/waveform/waveform.utils
 */
define(function() {
  'use strict';

  return {

    /**
     * Returns a formatted time string.
     *
     * @param {int}     time            Time in seconds to be formatted
     * @param {Boolean} dropHundredths  Don't display hundredths of a second if true
     * @returns {String}
     */

    niceTime: function(time, dropHundredths) {
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
        var x = result[i];

        if (x < 10) {
          result[i] = '0' + x;
        }
        else {
          result[i] = x;
        }
      }

      result = result.join(':');

      if (!dropHundredths) {
        if (hundredths < 10) {
          hundredths = '0' + hundredths;
        }

        result += '.' + hundredths;
      }

      return result;
    }
  };
});
