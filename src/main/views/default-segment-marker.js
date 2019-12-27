/**
 * @file
 *
 * Defines the {@link DefaultSegmentMarker} class.
 *
 * @module peaks/views/default-segment-marker
 */

define([
  'peaks/views/segment-marker',
  'peaks/waveform/waveform.utils',
  'konva'
  ], function(SegmentMarker, Utils, Konva) {
  'use strict';

  /**
   * Parameters for the {@link SegmentMarker} constructor and
   * {@link createSegmentMarker} function.
   *
   * @typedef {Object} SegmentMarkerOptions
   * @global
   * @property {Segment} segment
   * @property {SegmentShape} segmentShape
   * @property {Boolean} draggable If true, marker is draggable.
   * @property {String} color Colour hex value for handle and line marker.
   * @property {SegmentsLayer} layer
   * @property {Boolean} inMarker Is this marker the inMarker (LHS) or outMarker (RHS).
   * @property {Function} onDrag
   * @property {Function} onDragStart
   * @property {Function} onDragEnd
   */

  function DefaultSegmentMarker(options) {
    SegmentMarker.call(this, options);
  }

  DefaultSegmentMarker.prototype = Object.create(SegmentMarker.prototype);

  DefaultSegmentMarker.prototype._createMarker = function(group, options) {
    var handleWidth  = 10;
    var handleHeight = 20;
    var handleX      = -(handleWidth / 2) + 0.5; // Place in the middle of the marker

    var xPosition = options.inMarker ? -24 : 24;

    // Label - create with default y, the real value is set in fitToView().
    this._label = new Konva.Text({
      x:          xPosition,
      y:          0,
      text:       '',
      fontSize:   10,
      fontFamily: 'sans-serif',
      fill:       '#000',
      textAlign:  'center'
    });

    this._label.hide();

    // Handle - create with default y, the real value is set in fitToView().
    this._handle = new Konva.Rect({
      x:           handleX,
      y:           0,
      width:       handleWidth,
      height:      handleHeight,
      fill:        options.color,
      stroke:      options.color,
      strokeWidth: 1
    });

    // Vertical Line - create with default y and points, the real values
    // are set in fitToView().
    this._line = new Konva.Line({
      x:           0,
      y:           0,
      stroke:      options.color,
      strokeWidth: 1
    });

    group.add(this._label);
    group.add(this._line);
    group.add(this._handle);

    this.fitToView();
  };

  DefaultSegmentMarker.prototype._bindEventHandlers = function() {
    var self = this;

    var xPosition = self._isInMarker ? -24 : 24;

    if (self._draggable) {
      self._group.on('dragstart', function() {
        if (self._isInMarker) {
          self._label.setX(xPosition - self._label.getWidth());
        }

        self._label.show();
        self._layer.draw();
      });

      self._group.on('dragend', function() {
        self._label.hide();
        self._layer.draw();
      });
    }

    self._handle.on('mouseover touchstart', function() {
      if (self._isInMarker) {
        self._label.setX(xPosition - self._label.getWidth());
      }

      self._label.show();
      self._layer.draw();
    });

    self._handle.on('mouseout touchend', function() {
      self._label.hide();
      self._layer.draw();
    });
  };

  DefaultSegmentMarker.prototype.fitToView = function() {
    var height = this._layer.getHeight();

    this._label.y(height / 2 - 5);
    this._handle.y(height / 2 - 10.5);
    this._line.points([0.5, 0, 0.5, height]);
  };

  DefaultSegmentMarker.prototype._positionUpdated = function(x) {
    var segment = this.getSegment();
    var time = this.isInMarker() ? segment.startTime : segment.endTime;

    this._label.setText(Utils.formatTime(time, false));
  };

  return DefaultSegmentMarker;
});
