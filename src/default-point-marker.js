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

export default class DefaultPointMarker {
  constructor(options) {
    this._options = options;
  }

  init(group) {
    var handleWidth  = 10;
    var handleHeight = 20;
    var handleX      = -(handleWidth / 2) + 0.5; // Place in the middle of the marker

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

    if (this._options.draggable) {
      this._handle = new Rect({
        x:      handleX,
        y:      0,
        width:  handleWidth,
        height: handleHeight,
        fill:   this._options.color
      });
    }

    // Line - create with default y and points, the real values
    // are set in fitToView().
    this._line = new Line({
      x:           0,
      y:           0,
      stroke:      this._options.color,
      strokeWidth: 1
    });

    // Time label

    if (this._handle) {
      // Time - create with default y, the real value is set in fitToView().
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
    }

    if (this._handle) {
      group.add(this._handle);
    }

    group.add(this._line);

    if (this._label) {
      group.add(this._label);
    }

    if (this._time) {
      group.add(this._time);
    }

    this.fitToView();

    this.bindEventHandlers(group);
  }

  bindEventHandlers(group) {
    var self = this;

    if (self._handle) {
      self._handle.on('mouseover touchstart', function() {
        // Position text to the left of the marker
        self._time.setX(-24 - self._time.getWidth());
        self._time.show();
        self._options.layer.draw();
      });

      self._handle.on('mouseout touchend', function() {
        self._time.hide();
        self._options.layer.draw();
      });

      group.on('dragstart', function() {
        self._time.setX(-24 - self._time.getWidth());
        self._time.show();
        self._options.layer.draw();
      });

      group.on('dragend', function() {
        self._time.hide();
        self._options.layer.draw();
      });
    }
  }

  fitToView() {
    var height = this._options.layer.getHeight();

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
  }

  timeUpdated(time) {
    if (this._time) {
      this._time.setText(this._options.layer.formatTime(time));
    }
  }
}
