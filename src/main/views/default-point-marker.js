/**
 * @file
 *
 * Defines the {@link DefaultPointMarker} class.
 *
 * @module peaks/views/default-point-marker
 */

define([
  'peaks/views/point-marker',
  'peaks/waveform/waveform.utils',
  'konva'
  ], function(
    PointMarker,
    Utils,
    Konva) {
  'use strict';

  /**
   * Creates a point marker handle.
   *
   * @class
   * @alias DefaultPointMarker
   *
   * @param {PointMarkerOptions} options
   */

  function DefaultPointMarker(options) {
    PointMarker.call(this, options);
  }

  DefaultPointMarker.prototype = Object.create(PointMarker.prototype);

  DefaultPointMarker.prototype.createMarker = function(group, options) {
    var handleWidth  = 10;
    var handleHeight = 20;
    var handleX      = -(handleWidth / 2) + 0.5; // Place in the middle of the marker

    // Label
    this._label = null;

    if (options.showLabel) {
      // Label - create with default y, the real value is set in fitToView().
      this._label = new Konva.Text({
        x:          2,
        y:          0,
        text:       options.point.labelText,
        textAlign:  'left',
        fontSize:   10,
        fontFamily: 'sans-serif',
        fill:       '#000'
      });
    }

    // Handle - create with default y, the real value is set in fitToView().
    this._handle = null;

    if (this._draggable) {
      this._handle = new Konva.Rect({
        x:      handleX,
        y:      0,
        width:  handleWidth,
        height: handleHeight,
        fill:   options.color
      });
    }

    // Line - create with default y and points, the real values
    // are set in fitToView().
    this._line = new Konva.Line({
      x:           0,
      y:           0,
      stroke:      options.color,
      strokeWidth: 1
    });

    // Time label
    this._time = null;

    if (this._handle) {
      // Time - create with default y, the real value is set in fitToView().
      this._time = new Konva.Text({
        x:          -24,
        y:          0,
        text:       '',
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
  };

  DefaultPointMarker.prototype.bindEventHandlers = function() {
    var self = this;

    if (self._handle) {
      self._handle.on('mouseover touchstart', function() {
        // Position text to the left of the marker
        self._time.setX(-24 - self._time.getWidth());
        self._time.show();
        self._layer.draw();
      });

      self._handle.on('mouseout touchend', function() {
        self._time.hide();
        self._layer.draw();
      });
    }

    self._group.on('dragstart', function() {
      self._time.setX(-24 - self._time.getWidth());
      self._time.show();
      self._layer.draw();
    });

    self._group.on('dragend', function() {
      self._time.hide();
      self._layer.draw();
    });
  };

  DefaultPointMarker.prototype.fitToView = function() {
    var height = this._layer.getHeight();

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

  DefaultPointMarker.prototype.positionUpdated = function(x) {
    if (this._time) {
      var point = this.getPoint();
      var time = Utils.formatTime(point.time, false);

      this._time.setText(time);
    }
  };

  return DefaultPointMarker;
});
