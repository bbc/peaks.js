/**
 * WAVEFORM.SEGMENTS.JS
 *
 * This module handles all functionality related to the adding,
 * removing and manipulation of segments
 */
define([
  'peaks/markers/shapes/base',
  'peaks/waveform/waveform.mixins',
  'konva'
], function(BaseShape, mixins, Konva) {
  'use strict';

  var WaveShape = Object.create(BaseShape.prototype);

  /**
   *
   * @param {object} segment
   * @param {WaveformZoomView|WaveformOverview} view
   * @returns {Konva.Rect}
   */
  WaveShape.createShape = function createShape(segment, view) {
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
   */
  WaveShape.update = function updateRectShape(view, segmentId) {
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

  return WaveShape;
});
