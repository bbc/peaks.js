/**
 * @file
 *
 * Defines the {@link OverlaySegmentMarker} class.
 *
 * @module overlay-segment-marker
 */

import { Rect } from 'konva/lib/shapes/Rect';
import { Text } from 'konva/lib/shapes/Text';

import { clamp } from './utils';

/**
 * Creates a segment marker handle.
 *
 * @class
 * @alias OverlaySegmentMarker
 *
 * @param {CreateSegmentMarkerOptions} options
 */

function OverlaySegmentMarker(options) {
  this._options = options;
}

OverlaySegmentMarker.prototype.init = function(group) {
  const handleWidth  = 10;
  const handleHeight = 20;
  const handleX      = -(handleWidth / 2) + 0.5; // Place in the middle of the marker

  const xPosition = this._options.startMarker ? -24 : 24;

  const time = this._options.startMarker ? this._options.segment.startTime :
                                           this._options.segment.endTime;

  // Label - create with default y, the real value is set in fitToView().
  this._label = new Text({
    x:          xPosition,
    y:          0,
    text:       this._options.layer.formatTime(time),
    fontFamily: this._options.fontFamily,
    fontSize:   this._options.fontSize,
    fontStyle:  this._options.fontStyle,
    fill:       '#000',
    textAlign:  'center',
    visible:    false
  });

  // Handle - create with default y, the real value is set in fitToView().
  this._handle = new Rect({
    x:       handleX,
    y:       0,
    width:   handleWidth,
    height:  handleHeight
  });

  group.add(this._label);
  group.add(this._handle);

  this.fitToView();

  this.bindEventHandlers(group);
};

OverlaySegmentMarker.prototype.bindEventHandlers = function(group) {
  const self = this;

  const xPosition = self._options.startMarker ? -24 : 24;

  group.on('dragstart', function() {
    if (self._options.startMarker) {
      self._label.setX(xPosition - self._label.getWidth());
    }

    self._label.show();
  });

  group.on('dragend', function() {
    self._label.hide();
  });

  self._handle.on('mouseover touchstart', function() {
    if (self._options.startMarker) {
      self._label.setX(xPosition - self._label.getWidth());
    }

    self._label.show();

    document.body.style.cursor = 'ew-resize';
  });

  self._handle.on('mouseout touchend', function() {
    self._label.hide();

    document.body.style.cursor = 'default';
  });
};

OverlaySegmentMarker.prototype.fitToView = function() {
  const viewHeight = this._options.layer.getHeight();

  const overlayOffset = this._options.segmentOptions.overlayOffset;
  const overlayRectHeight = clamp(0, viewHeight - 2 * overlayOffset);

  this._label.y(viewHeight / 2 - 5);
  this._handle.y(overlayOffset);
  this._handle.height(overlayRectHeight);
};

OverlaySegmentMarker.prototype.update = function(options) {
  if (options.startTime !== undefined && this._options.startMarker) {
    this._label.text(this._options.layer.formatTime(options.startTime));
  }

  if (options.endTime !== undefined && !this._options.startMarker) {
    this._label.text(this._options.layer.formatTime(options.endTime));
  }
};

export default OverlaySegmentMarker;
