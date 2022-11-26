/**
 * @file
 *
 * Defines a zoom view adapter with no animations.
 *
 * @module static-zoom-adapter
 */

export default {
  create: function(view /* , currentScale, previousScale */) {
    return {
      start: function(relativePosition) {
        // This function is called after data is rescaled to currentScale
        // from previousScale.

        view.segmentLayer.draw();
        view.pointLayer.draw();

        const time = view.peaks.player.getCurrentTime();
        const index = view.timeToPixels(time);

        view.seekFrame(index, relativePosition);
      }
    };
  }
};
