/**
 * @file
 *
 * Defines the {@link SegmentShape} class.
 *
 * @module peaks/views/segment-shape
 */

define([
  'peaks/views/waveform-shape',
  'konva'
  ], function(WaveformShape, Konva) {
  'use strict';

  /**
   * Creates a waveform segment shape with optional start and end markers.
   *
   * @class
   * @alias SegmentShape
   *
   * @param {Segment} segment
   * @param {Peaks} peaks
   * @param {SegmentsLayer} layer
   * @param {WaveformOverview|WaveformZoomView} view
   */

  function SegmentShape(segment, peaks, layer, view) {
    this._segment = segment;
    this._peaks = peaks;
    this._layer = layer;
    this._view = view;
    this._waveformShape = null;
    this._label = null;
    this._inMarker = null;
    this._outMarker = null;

    this._group = new Konva.Group();

    this._waveformShape = new WaveformShape({
      color: segment.color,
      view: view,
      segment: segment
    });

    this._onMouseEnter = this._onMouseEnter.bind(this);
    this._onMouseLeave = this._onMouseLeave.bind(this);
    this._onClick = this._onClick.bind(this);

    // Set up event handlers to show/hide the segment label text when the user
    // hovers the mouse over the segment.
    this._waveformShape.on('mouseenter', this._onMouseEnter);
    this._waveformShape.on('mouseleave', this._onMouseLeave);
    this._waveformShape.on('click', this._onClick);

    // Event handlers for markers
    this._onSegmentHandleDrag = this._onSegmentHandleDrag.bind(this);
    this._onSegmentHandleDragStart = this._onSegmentHandleDragStart.bind(this);
    this._onSegmentHandleDragEnd = this._onSegmentHandleDragEnd.bind(this);

    this._label = this._peaks.options.createSegmentLabel(segment);
    this._label.hide();

    this._group.add(this._waveformShape);
    this._group.add(this._label);

    this._createMarkers();

    if (this._inMarker) {
      this._inMarker.addToGroup(this._group);
    }

    if (this._outMarker) {
      this._outMarker.addToGroup(this._group);
    }
  }

  SegmentShape.prototype.getSegment = function() {
    return this._segment;
  };

  SegmentShape.prototype.getInMarker = function() {
    return this._inMarker;
  };

  SegmentShape.prototype.getOutMarker = function() {
    return this._outMarker;
  };

  SegmentShape.prototype.addToLayer = function(layer) {
    layer.add(this._group);
  };

  SegmentShape.prototype._createMarkers = function() {
    var editable = this._layer.isEditingEnabled() && this._segment.editable;

    if (editable) {
      this._inMarker = this._peaks.options.createSegmentMarker({
        segment:      this._segment,
        segmentShape: this,
        draggable:    editable,
        color:        this._peaks.options.inMarkerColor,
        inMarker:     true,
        layer:        this._layer,
        onDrag:       this._onSegmentHandleDrag,
        onDragStart:  this._onSegmentHandleDragStart,
        onDragEnd:    this._onSegmentHandleDragEnd
      });

      this._outMarker = this._peaks.options.createSegmentMarker({
        segment:      this._segment,
        segmentShape: this,
        draggable:    editable,
        color:        this._peaks.options.outMarkerColor,
        inMarker:     false,
        layer:        this._layer,
        onDrag:       this._onSegmentHandleDrag,
        onDragStart:  this._onSegmentHandleDragStart,
        onDragEnd:    this._onSegmentHandleDragEnd
      });
    }
  };

  SegmentShape.prototype._onMouseEnter = function() {
    this._label.show();
    this._layer.draw();
    this._peaks.emit('segments.mouseenter', this._segment);
  };

  SegmentShape.prototype._onMouseLeave = function() {
    this._label.hide();
    this._layer.draw();
    this._peaks.emit('segments.mouseleave', this._segment);
  };

  SegmentShape.prototype._onClick = function() {
    this._peaks.emit('segments.click', this._segment);
  };

  /**
   * @param {Konva.Group} segmentGroup
   * @param {Segment} segment
   */

  SegmentShape.prototype._onSegmentHandleDrag = function(segmentMarker) {
    var frameOffset = this._view.getFrameOffset();
    var width = this._view.getWidth();

    var inMarkerX  = this._inMarker.getX();
    var outMarkerX = this._outMarker.getX();

    if (inMarkerX >= 0) {
      var inOffset = frameOffset +
                     inMarkerX +
                     this._inMarker.getWidth();

      this._segment.startTime = this._view.pixelsToTime(inOffset);
    }

    if (outMarkerX < width) {
      var outOffset = frameOffset + outMarkerX;

      this._segment.endTime = this._view.pixelsToTime(outOffset);
    }

    var inMarker = segmentMarker.isInMarker();

    this._peaks.emit('segments.dragged', this._segment, inMarker);
  };

  /**
   * @param {Boolean} inMarker
   * @param {Segment} segment
   */

  SegmentShape.prototype._onSegmentHandleDragStart = function(segment, inMarker) {
    this._peaks.emit('segments.dragstart', segment, inMarker);
  };

  /**
   * @param {Boolean} inMarker
   * @param {Segment} segment
   */

  SegmentShape.prototype._onSegmentHandleDragEnd = function(segment, inMarker) {
    this._peaks.emit('segments.dragend', segment, inMarker);
  };

  SegmentShape.prototype.fitToView = function() {
    if (this._inMarker) {
      this._inMarker.fitToView();
    }

    if (this._outMarker) {
      this._outMarker.fitToView();
    }
  };

  SegmentShape.prototype.destroy = function() {
    this._waveformShape.destroy();
    this._label.destroy();

    if (this._inMarker) {
      this._inMarker.destroy();
    }

    if (this._outMarker) {
      this._outMarker.destroy();
    }

    this._group.destroy();
  };

  return SegmentShape;
});
