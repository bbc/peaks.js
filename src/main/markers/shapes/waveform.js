/**
 * @file
 *
 * Defines the {@link WaveformSegmentShape} class.
 *
 * @module peaks/markers/shapes/waveform
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
     * @param {Segment} segment
     * @param {WaveformZoomView|WaveformOverview} view
     * @returns {Konva.Shape}
     */

    create: function(segment, view) {
      return new Konva.Shape({
        fill: segment.color,
        strokeWidth: 0,
        opacity: 1,
        sceneFunc: function(context) {
          var waveformData = view.data;

          mixins.drawWaveform(
            context,
            waveformData,
            view.frameOffset,
            view.timeToPixels(segment.startTime),
            view.timeToPixels(segment.endTime),
            view.width,
            view.height
          );

          context.fillStrokeShape(this);
        }
      });
    }
  };
});
