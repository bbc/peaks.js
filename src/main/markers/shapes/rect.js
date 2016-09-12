/**
 * @file
 *
 * Defines the {@link RectShape} class.
 *
 * @module peaks/markers/shapes/rect
 */
define([
  'peaks/markers/shapes/base',
  'peaks/waveform/waveform.mixins',
  'konva'
], function(BaseShape, mixins, Konva) {
  'use strict';

  /**
   * @class
   * @alias RectShape
   */
  var RectShape = Object.create(BaseShape.prototype);

  /**
   * Returns a new RectShape object.
   *
   * @param {object} segment
   * @param {WaveformZoomView|WaveformOverview} view
   * @returns {Konva.Rect}
   */
  RectShape.createShape = function createShape(segment, view) {
    var shape = new Konva.Rect({
      fill: segment.color,
      strokeWidth: 0,
      y: 0,
      x: 0,
      width: 0,
      height: view.height,
      opacity: 0.4
    });

    return shape;
  };

  /**
   *
   * @param view
   * @param {String|Number} segmentId
   * @private
   */
  RectShape.update = function updateRectShape(view, segmentId) {
    var waveformData = view.data;

    if (waveformData.segments[segmentId] === undefined) {
      return;
    }

    var segment = waveformData.segments[segmentId];
    var offsetLength = segment.offset_length;
    var offsetStart = segment.offset_start - waveformData.offset_start;

    this.setAttrs({
      x: offsetStart,
      width: offsetLength
    });
  };

  return RectShape;
});
