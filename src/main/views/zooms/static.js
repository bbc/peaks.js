/**
 * ZOOMS.STATIC.JS
 *
 * This module is a zoom view adapter with no animations.
 */
define([], function () {
  'use strict';

  return {
    init: function (currentSampleRate, previousSampleRate, view) {
      return {
        start: function() {
          view.segmentLayer.draw();
          view.pointLayer.draw();

          view.seekFrame(view.data.at_time(view.peaks.time.getCurrentTime()));
        }
      };
    },
  };
});
