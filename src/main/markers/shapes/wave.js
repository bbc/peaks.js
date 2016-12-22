/**
 * @file
 *
 * Defines the {@link WaveShape} class.
 *
 * @module peaks/markers/shapes/wave
 */
define([
  'peaks/markers/shapes/base',
  'peaks/waveform/waveform.mixins',
  'konva'
], function(BaseShape, mixins, Konva) {
  'use strict';

  /**
   * @class
   * @alias WaveShape
   */
  var WaveShape = Object.create(BaseShape.prototype);

  /**
   *
   * @param {object} segment
   * @param {WaveformZoomView|WaveformOverview} view
   * @returns {Konva.Shape}
   */
  WaveShape.createShape = function createShape(marker, view) {
    var shape = new Konva.Shape({
      fill: marker.color,
      strokeWidth: 0,
      opacity: 1
    });

    shape.sceneFunc(WaveShape.drawFunc.bind(shape, view, marker.id));

    return shape;
  };

  /**
   *
   * @this  {Konva.Shape}
   * @param {WaveformZoomView|WaveformOverview} view
   * @param {String|Number} segmentId
   * @param {Konva.Context} context
   * @private
   */
  WaveShape.drawFunc = function WaveShapeDrawFunc(view, markerId, context) {
    var waveformData = view.data;
    var marker = waveformData.segments[markerId];

    if (marker === undefined) {
      return;
    }

    var offsetLength = marker.offset_length;
    var offsetStart = marker.offset_start - waveformData.offset_start;
    var y = mixins.interpolateHeight(view.height);

    mixins.drawWaveform(context, marker.min, marker.max, offsetStart, offsetLength, y);

    context.fillStrokeShape(this);
  };

  return WaveShape;
});
