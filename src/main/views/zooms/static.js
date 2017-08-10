/**
 * @file
 *
 * Defines a zoom view adapter with no animations.
 *
 * @module peaks/views/zooms/static
 */

define(['peaks/waveform/waveform.utils'], function(Utils) {
  'use strict';

  return {
    create: function(currentScale, previousScale, view) {
      return {
        start: function(relativePosition) {
          // This function is called after data is rescaled to currentScale
          // from previousScale.

          view.segmentLayer.draw();
          view.pointLayer.draw();

          var time = view.peaks.player.getCurrentTime();
          var index = view.timeToPixels(time);

          view.seekFrame(index, relativePosition);
        }
      };
    }
  };
});
