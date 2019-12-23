/**
 * @file
 *
 * Common functions used in multiple modules are collected here for DRY purposes.
 *
 * @module peaks/waveform/waveform.mixins
 */

define([
  'peaks/waveform/waveform.utils',
  'konva'
  ], function(Utils, Konva) {
  'use strict';

  /**
   * Parameters for the {@link createSegmentMarker} function.
   *
   * @typedef {Object} CreateSegmentMarkerOptions
   * @global
   * @property {Boolean} draggable If true, marker is draggable.
   * @property {Number} height Height of handle group container (canvas).
   * @property {String} color Colour hex value for handle and line marker.
   * @property {Boolean} inMarker Is this marker the inMarker (LHS) or outMarker (RHS).
   * @property {Konva.Group} segmentGroup
   * @property {Object} segment
   * @property {Konva.Layer} layer
   * @property {Function} onDrag Callback after drag completed.
   */

  /**
   * Creates a Left or Right side segment handle group in Konva based on the
   * given options.
   *
   * @param {CreateSegmentMarkerOptions} options
   * @returns {Konva.Group} Konva group object of handle marker element.
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
  };

  function createSegmentMarker(options) {
    return new SegmentMarker(options);
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
   * Parameters for the {@link createPointMarker} function.
   *
   * @typedef {Object} CreatePointMarkerOptions
   * @global
   * @property {Object} point Point object with timestamp.
   * @property {Boolean} draggable If true, marker is draggable.
   * @property {Boolean} showLabel If true, show the label text next to the marker.
   * @property {String} color Color for the marker's handle and line.
   * @property {Konva.Layer} layer Layer that contains the pointGroup.
   * @property {Function} onDblClick
   * @property {Function} onDragStart
   * @property {Function} onDragMove Callback during mouse drag operations.
   * @property {Function} onDragEnd
   * @property {Function} onMouseOver
   * @property {Function} onMouseLeave
   */

  /**
   * Creates a point handle group in Konva based on the given options.
   *
   * @param {CreatePointMarkerOptions} options
   * @returns {Konva.Group} Konva group object of handle marker elements
   */

  function PointMarker(options) {
    this._point     = options.point;
    this._layer     = options.layer;
    this._draggable = options.draggable;
    this._color     = options.color;
    this._showLabel = options.showLabel;

    this._onDblClick   = options.onDblClick;
    this._onDragStart  = options.onDragStart;
    this._onDragMove   = options.onDragMove;
    this._onDragEnd    = options.onDragEnd;
    this._onMouseEnter = options.onMouseEnter;
    this._onMouseLeave = options.onMouseLeave;

    this._dragBoundFunc = this._dragBoundFunc.bind(this);

    this._createUiObjects();
    this._bindEventHandlers();
  }

  PointMarker.prototype._createUiObjects = function() {
    var height = this._layer.getHeight();

    var handleTop = (height / 2) - 10.5;
    var handleWidth = 10;
    var handleHeight = 20;
    var handleX = -(handleWidth / 2) + 0.5; // Place in the middle of the marker

    this._group = new Konva.Group({
      draggable: this._draggable,
      dragBoundFunc: this._dragBoundFunc
    });

    // Label
    this._label = null;

    if (this._showLabel) {
      this._label = new Konva.Text({
        x:          2,
        y:          12,
        text:       this._point.labelText,
        textAlign:  'left',
        fontSize:   10,
        fontFamily: 'sans-serif',
        fill:       '#000'
      });
    }

    // Handle
    this._handle = null;

    if (this._draggable) {
      this._handle = new Konva.Rect({
        x:      handleX,
        y:      handleTop,
        width:  handleWidth,
        height: handleHeight,
        fill:   this._color
      });
    }

    // Line
    this._line = new Konva.Line({
      x:           0,
      y:           0,
      points:      [0, 0, 0, height],
      stroke:      this._color,
      strokeWidth: 1
    });

    // Time label
    this._time = null;

    if (this._handle) {
      // Time
      this._time = new Konva.Text({
        x:          -24,
        y:          (height / 2) - 5,
        text:       '',
        fontSize:   10,
        fontFamily: 'sans-serif',
        fill:       '#000',
        textAlign:  'center'
      });

      this._time.hide();
    }

    if (this._handle) {
      this._group.add(this._handle);
    }

    this._group.add(this._line);

    if (this._text) {
      this._group.add(this._text);
    }

    if (this._time) {
      this._group.add(this._time);
    }
  };

  PointMarker.prototype._bindEventHandlers = function() {
    var self = this;

    self._group.on('dragstart', function() {
      self._onDragStart(self._point);
    });

    self._group.on('dragmove', function() {
      self._onDragMove(self._point);
    });

    self._group.on('dragend', function() {
      self._onDragEnd(self._point);
    });

    self._group.on('dblclick', function() {
      self._onDblClick(self._point);
    });

    self._group.on('mouseenter', function() {
      self._onMouseEnter(self._point);
    });

    self._group.on('mouseleave', function() {
      self._onMouseLeave(self._point);
    });

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

  PointMarker.prototype._dragBoundFunc = function(pos) {
    return {
      x: pos.x, // No constraint horizontally
      y: this._group.getAbsolutePosition().y // Constrained vertical line
    };
  };

  /**
   * @param {Konva.Layer} layer
   */

  PointMarker.prototype.addToLayer = function(layer) {
    layer.add(this._group);
  };

  PointMarker.prototype.getPoint = function() {
    return this._point;
  };

  PointMarker.prototype.getX = function() {
    return this._group.getX();
  };

  PointMarker.prototype.getWidth = function() {
    return this._group.getWidth();
  };

  PointMarker.prototype.update = function(x) {
    this._group.setX(x);

    if (this._time) {
      var time = Utils.formatTime(this._point.time, false);

      this._time.setText(time);
    }
  };

  PointMarker.prototype.fitToView = function() {
    var height = this._layer.getHeight();

    this._line.points([0.5, 0, 0.5, height]);

    if (this._handle) {
      this._handle.y(height / 2 - 10.5);
    }

    if (this._time) {
      this._time.y(height / 2 - 5);
    }
  };

  PointMarker.prototype.destroy = function() {
    this._group.destroyChildren();
    this._group.destroy();
  };

  function createPointMarker(options) {
    return new PointMarker(options);
  }

  // Public API

  return {
    createSegmentMarker: createSegmentMarker,
    createPointMarker: createPointMarker,
    createSegmentLabel: createSegmentLabel
  };
});
