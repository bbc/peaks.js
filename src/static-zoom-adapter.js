/**
 * @file
 *
 * Defines a zoom view adapter with no animations.
 *
 * @module static-zoom-adapter
 */
export function create(view /* , currentScale, previousScale */) {
  return {
    start(relativePosition) {
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
