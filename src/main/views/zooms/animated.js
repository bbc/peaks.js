/**
 * @file
 *
 * Defines an animated zoom view adapter.
 *
 * @module peaks/views/zooms/animated
 */
define(['konva'], function(Konva) {
  'use strict';

  return {
    create: function(currentScale, previousScale, view) {
      var currentTime = view.peaks.time.getCurrentTime();
      var frameData = [];

      var inputIndex;
      var outputIndex;
      var lastFrameOffsetTime;

      var waveformData = view.waveformData;

      // Fade out the time axis and the segments
      // view.axis.axisShape.setAttr('opacity', 0);
      if (view.segmentLayer) {
        view.segmentLayer.setVisible(false);
        view.pointLayer.setVisible(false);
      }

      // Determine whether zooming in or out
      var frameCount = (previousScale < currentScale) ? 15 : 30;

      // Create array with resampled data for each animation frame (need to
      // know duration, resample points per frame)
      for (var i = 0; i < frameCount; i++) {
        // Work out interpolated resample scale using currentScale
        // and previousScale
        var frameScale = Math.round(
          previousScale +
          ((i + 1) * (currentScale - previousScale) / frameCount)
        );

        // Determine the timeframe for the zoom animation (start and end of
        // dataset for zooming animation)
        var newWidthSeconds = view.width * frameScale / waveformData.adapter.sample_rate;

        if ((currentTime >= 0) && (currentTime <= 0 + newWidthSeconds / 2)) {
          inputIndex = 0;
          outputIndex = 0;
        }
        else if ((currentTime <= waveformData.duration) &&
                 (currentTime >= waveformData.duration - newWidthSeconds / 2)) {
          lastFrameOffsetTime = waveformData.duration - newWidthSeconds;

          // sample rate = 44100
          inputIndex  = (lastFrameOffsetTime * waveformData.adapter.sample_rate) / previousScale;
          outputIndex = (lastFrameOffsetTime * waveformData.adapter.sample_rate) / frameScale;
        }
        else {
          // This way calculates the index of the start time at the scale we
          // are coming from and the scale we are going to

          // sample rate = 44100
          var oldPixelIndex = (currentTime * waveformData.adapter.sample_rate) / previousScale;
          var newPixelIndex = (currentTime * waveformData.adapter.sample_rate) / frameScale;

          inputIndex  = oldPixelIndex - (view.width / 2);
          outputIndex = newPixelIndex - (view.width / 2);
        }

        if (inputIndex < 0) {
          inputIndex = 0;
        }

        // waveformData should be swapped for your resampled dataset:
        var resampled = waveformData.resample({
          scale:        frameScale,
          input_index:  Math.floor(inputIndex),
          output_index: Math.floor(outputIndex),
          width:        view.width
        });

        frameData.push(resampled);

        previousScale = frameScale;
      }

      return new Konva.Animation(this.onFrameData(view, frameData), view);
    },

    onFrameData: function(view, frameData) {
      view.intermediateData = null;

      /**
       * @param {Object} frame
       * @this {Konva.Animation}
       */
      return function(frame) {
        if (frameData.length) {
          // Send correct resampled waveform data object to drawFunc and draw it
          view.intermediateData = frameData.shift();
          view.waveformLayer.draw();
        }
        else {
          this.stop();
          view.intermediateData = null;
          view.segmentLayer.setVisible(true);
          view.pointLayer.setVisible(true);
          view.seekFrame(view.data.at_time(view.peaks.time.getCurrentTime()));
        }
      };
    }
  };
});
