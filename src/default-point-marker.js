/**
 * @file
 *
 * Defines the {@link DefaultPointMarker} class.
 *
 * @module default-point-marker
 */

import { Line } from 'konva/lib/shapes/Line';
import { Rect } from 'konva/lib/shapes/Rect';
import { Text } from 'konva/lib/shapes/Text';

/**
 * Creates a point marker handle.
 *
 * @class
 * @alias DefaultPointMarker
 *
 * @param {CreatePointMarkerOptions} options
 */

function DefaultPointMarker(options) {
  this._options = options;
  this._draggable = options.editable;
}

DefaultPointMarker.prototype.init = function(group) {
  const handleWidth  = 10;
  const handleHeight = 20;
  const handleX      = -(handleWidth / 2) + 0.5; // Place in the middle of the marker

  // Label

  if (this._options.view === 'zoomview') {
    // Label - create with default y, the real value is set in fitToView().
    this._label = new Text({
      x:          2,
      y:          0,
      text:       this._options.point.labelText,
      textAlign:  'left',
      fontFamily: this._options.fontFamily || 'sans-serif',
      fontSize:   this._options.fontSize || 10,
      fontStyle:  this._options.fontStyle || 'normal',
      fill:       '#000'
    });
  }

  // Handle - create with default y, the real value is set in fitToView().

  this._handle = new Rect({
    x:       handleX,
    y:       0,
    width:   handleWidth,
    height:  handleHeight,
    fill:    this._options.color,
    visible: this._draggable
  });

  // Line - create with default y and points, the real values
  // are set in fitToView().
  this._line = new Line({
    x:           0,
    y:           0,
    stroke:      this._options.color,
    strokeWidth: 1
  });

  // Time label - create with default y, the real value is set
  // in fitToView().
  this._time = new Text({
    x:          -24,
    y:          0,
    text:       this._options.layer.formatTime(this._options.point.time),
    fontFamily: this._options.fontFamily,
    fontSize:   this._options.fontSize,
    fontStyle:  this._options.fontStyle,
    fill:       '#000',
    textAlign:  'center'
  });

  this._time.hide();

  group.add(this._handle);

  group.add(this._line);

  if (this._label) {
    group.add(this._label);
  }

  group.add(this._time);

  this.fitToView();

  this.bindEventHandlers(group);
};

DefaultPointMarker.prototype.bindEventHandlers = function(group) {
  const self = this;

  self._handle.on('mouseover touchstart', function() {
    if (self._draggable) {
      // Position text to the left of the marker
      self._time.setX(-24 - self._time.getWidth());
      self._time.show();
    }
  });

  self._handle.on('mouseout touchend', function() {
    if (self._draggable) {
      self._time.hide();
    }
  });

  group.on('dragstart', function() {
    self._time.setX(-24 - self._time.getWidth());
    self._time.show();
  });

  group.on('dragend', function() {
    self._time.hide();
  });
};

DefaultPointMarker.prototype.fitToView = function() {
  const height = this._options.layer.getHeight();

  this._line.points([0.5, 0, 0.5, height]);

  if (this._label) {
    this._label.y(12);
  }

  if (this._handle) {
    this._handle.y(height / 2 - 10.5);
  }

  if (this._time) {
    this._time.y(height / 2 - 5);
  }
};

DefaultPointMarker.prototype.update = function(options) {
  if (options.time !== undefined) {
    if (this._time) {
      this._time.setText(this._options.layer.formatTime(options.time));
    }
  }

  if (options.labelText !== undefined) {
    if (this._label) {
      this._label.text(options.labelText);
    }
  }

  if (options.color !== undefined) {
    if (this._handle) {
      this._handle.fill(options.color);
    }

    this._line.stroke(options.color);
  }

  if (options.editable !== undefined) {
    this._draggable = options.editable;

    this._handle.visible(this._draggable);
  }
};

export default DefaultPointMarker;
