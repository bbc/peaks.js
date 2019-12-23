/**
 * @file
 *
 * Common functions used in multiple modules are collected here for DRY purposes.
 *
 * @module peaks/waveform/waveform.mixins
 */

define([
  'peaks/views/point-marker',
  'peaks/views/segment-marker',
  'konva'
  ], function(PointMarker, SegmentMarker, Konva) {
  'use strict';

  function createSegmentMarker(options) {
    return new SegmentMarker(options);
  }

  /**
   * Creates a Konva.Text object that renders a segment's label text.
   *
   * @param {Segment} segment
   * @returns {Konva.Text}
   */

  function createSegmentLabel(segment) {
    return new Konva.Text({
      x:          12,
      y:          12,
      text:       segment.labelText,
      textAlign:  'center',
      fontSize:   12,
      fontFamily: 'Arial, sans-serif',
      fill:       '#000'
    });
  }

  function createPointMarker(options) {
    return new PointMarker(options);
  }

  // Public API

  return {
    createSegmentMarker: createSegmentMarker,
    createSegmentLabel: createSegmentLabel,
    createPointMarker: createPointMarker
  };
});
