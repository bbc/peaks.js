/**
 * @file
 *
 * Defines the {@link DefaultPointMarker} class.
 *
 * @module default-point-marker
 */

define([
  'konva'
], function(
    Konva) {
  'use strict';

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
  }

  DefaultPointMarker.prototype.init = function(group) {
    var handleWidth  = 10;
    var handleHeight = 20;
    var handleX      = -(handleWidth / 2) + 0.5; // Place in the middle of the marker

    // Label

    if (this._options.view === 'zoomview') {
      // Label - create with default y, the real value is set in fitToView().
      this._label = new Konva.Text({
        x:          2,
        y:          0,
        text:       this._options.point.labelText,
        textAlign:  'left',
        fontSize:   10,
        fontFamily: 'sans-serif',
        fill:       '#000'
      });
    }

    // Handle - create with default y, the real value is set in fitToView().

    if (this._options.draggable) {
      this._handle = new Konva.Rect({
        x:      handleX,
        y:      0,
        width:  handleWidth,
        height: handleHeight,
        fill:   this._options.color
      });
    }

    // Line - create with default y and points, the real values
    // are set in fitToView().
    this._line = new Konva.Line({
      x:           0,
      y:           0,
      stroke:      this._options.color,
      strokeWidth: 1
    });

    // Time label

    if (this._handle) {
      // Time - create with default y, the real value is set in fitToView().
      this._time = new Konva.Text({
        x:          -24,
        y:          0,
        text:       this._options.layer.formatTime(this._options.point.time),
        fontSize:   10,
        fontFamily: 'sans-serif',
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
  };

  DefaultPointMarker.prototype.bindEventHandlers = function(group) {
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
  };

  DefaultPointMarker.prototype.fitToView = function() {
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
  };

  DefaultPointMarker.prototype.timeUpdated = function(time) {
    if (this._time) {
      this._time.setText(this._options.layer.formatTime(time));
    }
  };

  return DefaultPointMarker;
});
