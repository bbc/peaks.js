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
  WaveShape.createShape = function createShape(segment, view) {
    var shape = new Konva.Shape({
      fill: segment.color,
      strokeWidth: 0,
      opacity: 1
    });

    shape.sceneFunc(WaveShape.drawFunc.bind(shape, view, segment.id));

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
  WaveShape.drawFunc = function WaveShapeDrawFunc(view, segmentId, context) {
    var waveformData = view.data;

    if (waveformData.segments[segmentId] === undefined) {
      return;
    }

    var segment = waveformData.segments[segmentId];
    var offsetLength = segment.offset_length;
    var offsetStart = segment.offset_start - waveformData.offset_start;
    var y = mixins.interpolateHeight(view.height);

    mixins.drawWaveform(context, segment.min, segment.max, offsetStart, offsetLength, y);
    context.fillStrokeShape(this);
  };

  return WaveShape;
});
