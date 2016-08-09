/**
 * WAVEFORM.SEGMENTS.JS
 *
 * This module handles all functionality related to the adding,
 * removing and manipulation of segments
 */
define(['konva'], function(Konva) {
  'use strict';

  return {
    create: function(currentSampleRate, previousSampleRate, view) {
      var currentTime = view.peaks.time.getCurrentTime();
      var frameData = [];

      var numOfFrames = 30;
      var inputIndex;
      var outputIndex;
      var lastFrameOffsetTime;

      // Fade out the time axis and the segments
      // view.axis.axisShape.setAttr('opacity', 0);
      // Fade out segments
      if (view.segmentLayer) {
        view.segmentLayer.setVisible(false);
        view.pointLayer.setVisible(false);
      }

      // Determine whether zooming in or out
      if (previousSampleRate < currentSampleRate) {
        numOfFrames = 15;
      }

      // Create array with resampled data for each animation frame (need to
      // know duration, resample points per frame)
      for (var i = 0; i < numOfFrames; i++) {
        // Work out interpolated resample scale using currentSampleRate
        // and previousSampleRate
        var frameSampleRate = Math.round(
          previousSampleRate +
          ((i + 1) * (currentSampleRate - previousSampleRate) / numOfFrames)
        );

        // Determine the timeframe for the zoom animation (start and end of
        // dataset for zooming animation)
        var newWidthSeconds = view.width * frameSampleRate / view.rootData.adapter.sample_rate;

        if ((currentTime >= 0) && (currentTime <= 0 + newWidthSeconds / 2)) {
          inputIndex = 0;
          outputIndex = 0;
        }
        else if ((currentTime <= view.rootData.duration) &&
                 (currentTime >= view.rootData.duration - newWidthSeconds / 2)) {
          lastFrameOffsetTime = view.rootData.duration - newWidthSeconds;

          // sample rate = 44100
          inputIndex  = (lastFrameOffsetTime * view.rootData.adapter.sample_rate) / previousSampleRate;
          outputIndex = (lastFrameOffsetTime * view.rootData.adapter.sample_rate) / frameSampleRate;
        }
        else {
          // This way calculates the index of the start time at the scale we
          // are coming from and the scale we are going to

          // sample rate = 44100
          var oldPixelIndex = (currentTime * view.rootData.adapter.sample_rate) / previousSampleRate;
          var newPixelIndex = (currentTime * view.rootData.adapter.sample_rate) / frameSampleRate;

          inputIndex  = oldPixelIndex - (view.width / 2);
          outputIndex = newPixelIndex - (view.width / 2);
        }

        if (inputIndex < 0) {
          inputIndex = 0;
        }

        // rootData should be swapped for your resampled dataset:
        var resampled = view.rootData.resample({
          scale:        frameSampleRate,
          input_index:  Math.floor(inputIndex),
          output_index: Math.floor(outputIndex),
          width:        view.width
        });

        frameData.push(resampled);

        previousSampleRate = frameSampleRate;
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
          view.zoomWaveformLayer.draw();
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
