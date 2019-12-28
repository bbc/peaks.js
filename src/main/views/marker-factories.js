/**
 * @file
 *
 * Factory functions for creating point and segment marker handles.
 *
 * @module peaks/waveform/waveform.mixins
 */

define([
  'peaks/views/default-point-marker',
  'peaks/views/default-segment-marker',
  'konva'
  ], function(
    DefaultPointMarker,
    DefaultSegmentMarker,
    Konva) {
  'use strict';

  /**
   * Creates a left or right side segment marker handle.
   *
   * @param {SegmentMarkerOptions} options
   * @returns {SegmentMarker}
   */

  function createSegmentMarker(options) {
    return new DefaultSegmentMarker(options);
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

  return {
    createSegmentMarker: createSegmentMarker,
    createSegmentLabel: createSegmentLabel,
    createPointMarker: createPointMarker
  };
});
