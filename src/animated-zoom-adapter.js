/**
 * @file
 *
 * Defines an animated zoom view adapter.
 *
 * @module animated-zoom-adapter
 */

define(['konva'], function(Konva) {
  'use strict';

  return {

    /**
     * @param {WaveformZoomView} view
     * @param {Number} currentScale
     * @param {Number} previousScale
     * @returns {Konva.Animation}
     */

    create: function(view, currentScale, previousScale) {
      var currentTime = view.peaks.player.getCurrentTime();
      var frameData = [];

      var inputIndex;
      var outputIndex;
      var lastFrameOffsetTime;

      var rootData = view.originalWaveformData;

      view.beginZoom();

      // Determine whether zooming in or out
      var frameCount = (previousScale < currentScale) ? 15 : 30;

      // Create array with resampled data for each animation frame (need to
      // know duration, resample points per frame)
      for (var i = 0; i < frameCount; i++) {
        // Work out interpolated resample scale using currentScale
        // and previousScale
        var frameScale = Math.floor(
          previousScale +
          i * (currentScale - previousScale) / frameCount
        );

        // Determine the timeframe for the zoom animation (start and end of
        // dataset for zooming animation)
        var newWidthSeconds = view.width * frameScale / rootData.adapter.sample_rate;

        if (currentTime >= 0 && currentTime <= newWidthSeconds / 2) {
          inputIndex = 0;
          outputIndex = 0;
        }
        else if (currentTime <= rootData.duration &&
                 currentTime >= rootData.duration - newWidthSeconds / 2) {
          lastFrameOffsetTime = rootData.duration - newWidthSeconds;

          inputIndex  = lastFrameOffsetTime * rootData.adapter.sample_rate / previousScale;
          outputIndex = lastFrameOffsetTime * rootData.adapter.sample_rate / frameScale;
        }
        else {
          // This way calculates the index of the start time at the scale we
          // are coming from and the scale we are going to

          var oldPixelIndex = currentTime * rootData.adapter.sample_rate / previousScale;
          var newPixelIndex = currentTime * rootData.adapter.sample_rate / frameScale;

          inputIndex  = oldPixelIndex - view.width / 2;
          outputIndex = newPixelIndex - view.width / 2;
        }

        if (inputIndex < 0) {
          inputIndex = 0;
        }

        // rootData should be swapped for your resampled dataset:
        var resampled = rootData.resample({
          scale:        frameScale,
          input_index:  Math.floor(inputIndex),
          output_index: Math.floor(outputIndex),
          width:        view.width
        });

        frameData.push(resampled);
      }

      var animationFrameFunction =
        this.createAnimationFrameFunction(view, frameData);

      return new Konva.Animation(animationFrameFunction, view);
    },

    createAnimationFrameFunction: function(view, frameData) {
      var index = 0;

      view.intermediateData = null;

      /**
       * @param {Object} frame
       * @this {Konva.Animation}
       */

      return function(/* frame */) {
        if (index < frameData.length) {
          // Send correct resampled waveform data object to drawFunc and draw it
          view.intermediateData = frameData[index];
          index++;

          view.zoomWaveformLayer.draw();
        }
        else {
          this.stop();
          view.intermediateData = null;
          view.endZoom();
        }
      };
    }
  };
});
