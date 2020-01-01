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
   * Parameters for the {@link createSegmentLabel} function.
   *
   * @typedef {Object} SegmentLabelOptions
   * @global
   * @property {Segment} segment The {@link Segment} object associated with this
   *   label.
   * @property {String} view The name of the view that the label is being
   *   created in, either <code>zoomview</code> or <code>overview</code>.
   * @property {SegmentsLayer} layer
   */

  /**
   * Creates a Konva object that renders information about a segment, such as
   * its label text.
   *
   * @param {SegmentLabelOptions} options
   * @returns {Konva.Text}
   */

  function createSegmentLabel(options) {
    return new Konva.Text({
      x:          12,
      y:          12,
      text:       options.segment.labelText,
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
