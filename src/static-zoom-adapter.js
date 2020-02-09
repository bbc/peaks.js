/**
 * @file
 *
 * Defines a zoom view adapter with no animations.
 *
 * @module static-zoom-adapter
 */

define([], function() {
  'use strict';

  return {
    create: function(view /* , currentScale, previousScale */) {
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
