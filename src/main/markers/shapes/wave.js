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
   * @returns {Kinetic.Shape}
   */
  WaveShape.createShape = function createShape(segmentData, view){
    var shape = new Kinetic.Shape({
      fill: segmentData.color,
      strokeWidth: 0,
      opacity: 1
    });

    shape.setDrawFunc(WaveShape.drawFunc.bind(shape, view, segmentData.id));

    return shape;
  };

  /**
   *
   * @this  {Kinetic.Shape}
   * @param {WaveformData} waveform
   * @param {Kinetic.Context} context
   * @param {interpolateHeight} y
   */
  WaveShape.drawFunc = function WaveShapedrawFunc(view, segmentId, context){
    var waveformData = view.data;

    if (waveformData.segments[segmentId] === undefined){
      return;
    }

    var segment = waveformData.segments[segmentId];
    var offset_length = segment.offset_length;
    var offset_start = segment.offset_start - waveformData.offset_start;
    var y = mixins.interpolateHeight(view.height);

    mixins.drawWaveform(context, segment.min, segment.max, offset_start, offset_length, y);
    context.fillStrokeShape(this);
  };

  return WaveShape;
});
