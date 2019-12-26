/**
 * @file
 *
 * Common functions used in multiple modules are collected here for DRY purposes.
 *
 * @module peaks/waveform/waveform.mixins
 */

define([
  'peaks/views/default-point-marker',
  'peaks/views/segment-marker',
  'konva'
  ], function(DefaultPointMarker, SegmentMarker, Konva) {
  'use strict';

  /**
   * Creates a Left or Right side segment handle marker.
   *
   * @param {SegmentMarkerOptions} options
   * @returns {SegmentMarker}
   */

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

  /**
   * Creates a point marker handle.
   *
   * @param {PointMarkerOptions} options
   * @returns {PointMarker}
   */

  function createPointMarker(options) {
    return new DefaultPointMarker(options);
  }

  // Public API

  return {
    createSegmentMarker: createSegmentMarker,
    createSegmentLabel: createSegmentLabel,
    createPointMarker: createPointMarker
  };
});
