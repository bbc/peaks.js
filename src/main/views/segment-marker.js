/**
 * @file
 *
 * Defines the {@link SegmentMarker} class.
 *
 * @module peaks/views/segment-marker
 */

define([
  'konva'
  ], function(Konva) {
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

  /**
   * Creates a Left or Right side segment handle marker.
   *
   * @class
   * @alias SegmentMarker
   *
   * @param {SegmentMarkerOptions} options
   */

  function SegmentMarker(options) {
    this._segment = options.segment;
    this._segmentShape = options.segmentShape;
    this._draggable = options.draggable;
    this._color = options.color;
    this._layer = options.layer;
    this._isInMarker = options.inMarker;

    this._onDrag = options.onDrag;
    this._onDragStart = options.onDragStart;
    this._onDragEnd = options.onDragEnd;

    this._dragBoundFunc = this._dragBoundFunc.bind(this);

    this._createUiObjects();
    this._bindEventHandlers();
  }

  SegmentMarker.prototype._createUiObjects = function() {
    var height = this._layer.getHeight();

    var handleHeight = 20;
    var handleWidth  = handleHeight / 2;
    var handleY      = (height / 2) - 10.5;
    var handleX      = -(handleWidth / 2) + 0.5;

    this._group = new Konva.Group({
      draggable: this._draggable,
      dragBoundFunc: this._dragBoundFunc
    });

    var xPosition = this._inMarker ? -24 : 24;

    this._label = new Konva.Text({
      x:          xPosition,
      y:          (height / 2) - 5,
      text:       '',
      fontSize:   10,
      fontFamily: 'sans-serif',
      fill:       '#000',
      textAlign:  'center'
    });

    this._label.hide();

    this._handle = new Konva.Rect({
      x:           handleX,
      y:           handleY,
      width:       handleWidth,
      height:      handleHeight,
      fill:        this._color,
      stroke:      this._color,
      strokeWidth: 1
    });

    // Vertical Line

    this._line = new Konva.Line({
      x:           0,
      y:           0,
      points:      [0.5, 0, 0.5, height],
      stroke:      this._color,
      strokeWidth: 1
    });

    this._group.add(this._label);
    this._group.add(this._line);
    this._group.add(this._handle);
  };

  SegmentMarker.prototype._bindEventHandlers = function() {
    var self = this;

    var xPosition = self._isInMarker ? -24 : 24;

    if (self._draggable && self._onDrag) {
      self._group.on('dragmove', function() {
        self._onDrag(self);
      });

      self._group.on('dragstart', function() {
        if (self._isInMarker) {
          self._label.setX(xPosition - self._label.getWidth());
        }

        self._onDragStart(self._segment, self._isInMarker);
        self._label.show();
        self._layer.draw();
      });

      self._group.on('dragend', function() {
        self._onDragEnd(self._segment, self._isInMarker);
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

  SegmentMarker.prototype._dragBoundFunc = function(pos) {
    var limit;

    if (this._isInMarker) {
      var outMarker = this._segmentShape.getOutMarker();

      limit = outMarker.getX() - outMarker.getWidth();

      if (pos.x > limit) {
        pos.x = limit;
      }
    }
    else {
      var inMarker = this._segmentShape.getInMarker();

      limit = inMarker.getX() + inMarker.getWidth();

      if (pos.x < limit) {
        pos.x = limit;
      }
    }

    return {
      x: pos.x,
      y: this._group.getAbsolutePosition().y
    };
  };

  SegmentMarker.prototype.addToGroup = function(group) {
    group.add(this._group);
  };

  SegmentMarker.prototype.isInMarker = function() {
    return this._isInMarker;
  };

  SegmentMarker.prototype.setX = function(x) {
    this._group.setX(x);
  };

  SegmentMarker.prototype.getX = function() {
    return this._group.getX();
  };

  SegmentMarker.prototype.getWidth = function() {
    return this._group.getWidth();
  };

  SegmentMarker.prototype.setLabelText = function(text) {
    this._label.setText(text);
  };

  SegmentMarker.prototype.fitToView = function() {
    var height = this._layer.getHeight();

    this._label.y(height / 2 - 5);
    this._handle.y(height / 2 - 10.5);
    this._line.points([0.5, 0, 0.5, height]);
  };

  SegmentMarker.prototype.destroy = function() {
    this._handle.destroy();
    this._line.destroy();
    this._label.destroy();
    this._group.destroy();
  };

  return SegmentMarker;
});
