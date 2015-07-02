/**
 * WAVEFORM.SEGMENTS.JS
 *
 * This module handles all functionality related to the adding,
 * removing and manipulation of segments
 */
define(["konva"], function (Konva) {
  'use strict';

  return {
    init: function (currentSampleRate, previousSampleRate, view) {
      var that = view;
      var currentTime = that.peaks.time.getCurrentTime();
      var frameData = [];

      var numOfFrames = 30;
      var input_index;
      var output_index;
      var lastFrameOffsetTime;

      //Fade out the time axis and the segments
      //that.axis.axisShape.setAttr('opacity', 0);
      //Fade out segments
      if (that.segmentLayer) {
        that.segmentLayer.setVisible(false);
        that.pointLayer.setVisible(false);
      }

      // Determine whether zooming in or out
      if (previousSampleRate < currentSampleRate) {
        numOfFrames = 15;
      }

      // Create array with resampled data for each animation frame (need to know duration, resample points per frame)
      for (var i = 0; i < numOfFrames; i++) {
        // Work out interpolated resample scale using currentSampleRate and previousSampleRate
        var frame_sample_rate = Math.round(previousSampleRate + ((i + 1) * (currentSampleRate - previousSampleRate) / numOfFrames));
        //Determine the timeframe for the zoom animation (start and end of dataset for zooming animation)

        var newWidthSeconds = that.width * frame_sample_rate / that.rootData.adapter.sample_rate;

        if ((currentTime >= 0) && (currentTime <= 0 + newWidthSeconds/2)){
          input_index = 0;
          output_index = 0;
        }
        else if ((currentTime <= that.rootData.duration) && (currentTime >= that.rootData.duration - newWidthSeconds/2)) {
          lastFrameOffsetTime = that.rootData.duration - newWidthSeconds;

          input_index = (lastFrameOffsetTime * that.rootData.adapter.sample_rate) / previousSampleRate;
          output_index = (lastFrameOffsetTime * that.rootData.adapter.sample_rate) / frame_sample_rate; //sample rate = 44100
        }
        else {
          //This way calculates the index of the start time at the scale we are coming from and the scale we are going to
          var oldPixelIndex = (currentTime * that.rootData.adapter.sample_rate) / previousSampleRate;
          input_index = oldPixelIndex - (that.width/2);

          var newPixelIndex = (currentTime * that.rootData.adapter.sample_rate) / frame_sample_rate; //sample rate = 44100
          output_index = newPixelIndex - (that.width/2);
        }

        if (input_index < 0) {
          input_index = 0;
        }

        var resampled = that.rootData.resample({ // rootData should be swapped for your resampled dataset
          scale:        frame_sample_rate,
          input_index:  Math.floor(input_index),
          output_index: Math.floor(output_index),
          width:        that.width
        });

        frameData.push(resampled);

        previousSampleRate = frame_sample_rate;
      }

      return new Konva.Animation(this.onFrameData(view, frameData), view);
    },
    onFrameData: function(view, frameData){
      var that = view;
      that.intermediateData = null;

      /**
       * @param {Object} frame
       * @this {Konva.Animation}
       */
      return function(frame){
        if (frameData.length) {
          //Send correct resampled waveform data object to drawFunc and draw it
          that.intermediateData = frameData.shift();
          that.zoomWaveformLayer.draw();
        }
        else {
          this.stop();
          that.intermediateData = null;
          that.segmentLayer.setVisible(true);
          that.pointLayer.setVisible(true);
          that.seekFrame(that.data.at_time(that.peaks.time.getCurrentTime()));
        }
      };
    }
  };
});
