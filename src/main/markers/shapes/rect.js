/**
 * WAVEFORM.SEGMENTS.JS
 *
 * This module handles all functionality related to the adding,
 * removing and manipulation of segments
 */
define([
  "peaks/markers/shapes/base",
  "peaks/waveform/waveform.mixins",
  "Kinetic"
], function (BaseShape, mixins, Kinetic) {
  'use strict';

  var WaveShape = Object.create(BaseShape.prototype);

  /**
   *
   * @param segmentData
   * @param view
   * @returns {Kinetic.Rect}
   */
  WaveShape.createShape = function createShape(segmentData, view){
    var shape = new Kinetic.Rect({
      fill: segmentData.color,
      strokeWidth: 0,
      y: 0,
      x: 0,
      width: 0,
      height: view.height,
      opacity:0.4
    });

    return shape;
  };

  /**
   *
   * @param {WaveformData} waveform
   * @param {Canvas} canvas
   * @param {interpolateHeight} y
   */
  WaveShape.update = function updateRectShape(view, segmentId){
    var waveformData = view.data;

    if (waveformData.segments[segmentId] === undefined){
      return;
    }

    var segment = waveformData.segments[segmentId];
    var offset_length = segment.offset_length;
    var offset_start = segment.offset_start - waveformData.offset_start;

    this.setAttrs({
      x: offset_start,
      width: offset_length
    });
  };

  return WaveShape;
});
