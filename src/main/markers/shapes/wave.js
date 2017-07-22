/**
 * @file
 *
 * Defines the {@link WaveShape} class.
 *
 * @module peaks/markers/shapes/wave
 */

define([
  'peaks/waveform/waveform.mixins',
  'konva'
], function(mixins, Konva) {
  'use strict';

  return {

    /**
     * Returns a new {Konva.Shape} object that renders the given waveform
     * segment.
     *
     * @param {object} segment
     * @param {WaveformZoomView|WaveformOverview} view
     * @returns {Konva.Shape}
     */

    createShape: function(segment, view) {
      var shape = new Konva.Shape({
        fill: segment.color,
        strokeWidth: 0,
        opacity: 1,
        sceneFunc: function(context) {
          var waveformData = view.data;

          mixins.drawWaveform(
            context,
            waveformData,
            view.frameOffset,
            waveformData.at_time(segment.startTime),
            waveformData.at_time(segment.endTime),
            view.height
          );

          context.fillStrokeShape(shape);
        }
      });

      return shape;
    }
  };
});
