/**
 * @file
 *
 * Factory functions for creating point and segment marker handles.
 *
 * @module marker-factories
 */

import DefaultPointMarker from './default-point-marker';
import DefaultSegmentMarker from './default-segment-marker';
import { Text } from 'konva/lib/shapes/Text';

/**
 * Parameters for the {@link createSegmentMarker} function.
 *
 * @typedef {Object} CreateSegmentMarkerOptions
 * @global
 * @property {Segment} segment
 * @property {Boolean} draggable If true, marker is draggable.
 * @property {Boolean} startMarker
 * @property {String} color
 * @property {String} fontFamily
 * @property {Number} fontSize
 * @property {String} fontStyle
 * @property {Layer} layer
 * @property {String} view
 */

/**
 * Creates a left or right side segment marker handle.
 *
 * @param {CreateSegmentMarkerOptions} options
 * @returns {Marker}
 */

export function createSegmentMarker(options) {
  if (options.view === 'zoomview') {
    return new DefaultSegmentMarker(options);
  }

  return null;
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
 * @property {String} fontFamily
 * @property {Number} fontSize
 * @property {String} fontStyle
 */

/**
 * Creates a Konva object that renders information about a segment, such as
 * its label text.
 *
 * @param {SegmentLabelOptions} options
 * @returns {Konva.Text}
 */

export function createSegmentLabel(options) {
  return new Text({
    x:          12,
    y:          12,
    text:       options.segment.labelText,
    textAlign:  'center',
    fontFamily: options.fontFamily || 'sans-serif',
    fontSize:   options.fontSize || 12,
    fontStyle:  options.fontStyle || 'normal',
    fill:       '#000'
  });
}

/**
 * Parameters for the {@link createPointMarker} function.
 *
 * @typedef {Object} CreatePointMarkerOptions
 * @global
 * @property {Point} point
 * @property {Boolean} draggable If true, marker is draggable.
 * @property {String} color
 * @property {Layer} layer
 * @property {String} view
 * @property {String} fontFamily
 * @property {Number} fontSize
 * @property {String} fontStyle
 */

/**
 * Creates a point marker handle.
 *
 * @param {CreatePointMarkerOptions} options
 * @returns {Marker}
 */

export function createPointMarker(options) {
  return new DefaultPointMarker(options);
}
