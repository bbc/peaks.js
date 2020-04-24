/**
 * @file
 *
 * Defines the {@link SegmentShape} class.
 *
 * @module segment-shape
 */

define([
  './segment-marker',
  './waveform-shape'
], function(
    SegmentMarker,
    WaveformShape) {
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
    this._segment       = segment;
    this._peaks         = peaks;
    this._layer         = layer;
    this._view          = view;
    this._waveformShape = null;
    this._label         = null;
    this._startMarker   = null;
    this._endMarker     = null;

    this._waveformShape = new WaveformShape({
      color:   segment.color,
      view:    view,
      segment: segment
    });

    this._onMouseEnter = this._onMouseEnter.bind(this);
    this._onMouseLeave = this._onMouseLeave.bind(this);
    this._onClick      = this._onClick.bind(this);

    // Set up event handlers to show/hide the segment label text when the user
    // hovers the mouse over the segment.
    this._waveformShape.on('mouseenter', this._onMouseEnter);
    this._waveformShape.on('mouseleave', this._onMouseLeave);
    this._waveformShape.on('click', this._onClick);

    // Event handlers for markers
    this._onSegmentHandleDrag      = this._onSegmentHandleDrag.bind(this);
    this._onSegmentHandleDragStart = this._onSegmentHandleDragStart.bind(this);
    this._onSegmentHandleDragEnd   = this._onSegmentHandleDragEnd.bind(this);

    this._label = this._peaks.options.createSegmentLabel({
      segment: segment,
      view:    this._view.getName(),
      layer:   this._layer
    });

    if (this._label) {
      this._label.hide();
    }

    this._createMarkers();
  }

  SegmentShape.prototype.getSegment = function() {
    return this._segment;
  };

  SegmentShape.prototype.getStartMarker = function() {
    return this._startMarker;
  };

  SegmentShape.prototype.getEndMarker = function() {
    return this._endMarker;
  };

  SegmentShape.prototype.addToLayer = function(layer) {
    layer.add(this._waveformShape);

    if (this._label) {
      layer.add(this._label);
    }

    if (this._startMarker) {
      this._startMarker.addToLayer(layer);
    }

    if (this._endMarker) {
      this._endMarker.addToLayer(layer);
    }
  };

  SegmentShape.prototype._createMarkers = function() {
    var editable = this._layer.isEditingEnabled() && this._segment.editable;

    if (!editable) {
      return;
    }

    var startMarker = this._peaks.options.createSegmentMarker({
      segment:      this._segment,
      draggable:    editable,
      startMarker:  true,
      color:        this._peaks.options.segmentStartMarkerColor,
      layer:        this._layer,
      view:         this._view.getName()
    });

    if (startMarker) {
      this._startMarker = new SegmentMarker({
        segment:      this._segment,
        segmentShape: this,
        draggable:    editable,
        startMarker:  true,
        marker:       startMarker,
        onDrag:       this._onSegmentHandleDrag,
        onDragStart:  this._onSegmentHandleDragStart,
        onDragEnd:    this._onSegmentHandleDragEnd
      });
    }

    var endMarker = this._peaks.options.createSegmentMarker({
      segment:      this._segment,
      draggable:    editable,
      startMarker:  false,
      color:        this._peaks.options.segmentEndMarkerColor,
      layer:        this._layer,
      view:         this._view.getName()
    });

    if (endMarker) {
      this._endMarker = new SegmentMarker({
        segment:      this._segment,
        segmentShape: this,
        draggable:    editable,
        startMarker:  false,
        marker:       endMarker,
        onDrag:       this._onSegmentHandleDrag,
        onDragStart:  this._onSegmentHandleDragStart,
        onDragEnd:    this._onSegmentHandleDragEnd
      });
    }
  };

  SegmentShape.prototype._onMouseEnter = function() {
    if (this._label) {
      this._label.show();
      this._layer.draw();
    }

    this._peaks.emit('segments.mouseenter', this._segment);
  };

  SegmentShape.prototype._onMouseLeave = function() {
    if (this._label) {
      this._label.hide();
      this._layer.draw();
    }

    this._peaks.emit('segments.mouseleave', this._segment);
  };

  SegmentShape.prototype._onClick = function() {
    this._peaks.emit('segments.click', this._segment);
  };

  /**
   * @param {SegmentMarker} segmentMarker
   */

  SegmentShape.prototype._onSegmentHandleDrag = function(segmentMarker) {
    var frameOffset = this._view.getFrameOffset();
    var width = this._view.getWidth();

    var startMarker = segmentMarker.isStartMarker();

    var startMarkerX = this._startMarker.getX();
    var endMarkerX = this._endMarker.getX();

    if (startMarker && startMarkerX >= 0) {
      var startMarkerOffset = frameOffset +
                              startMarkerX +
                              this._startMarker.getWidth();

      this._segment.startTime = this._view.pixelsToTime(startMarkerOffset);

      segmentMarker.timeUpdated(this._segment.startTime);
    }

    if (!startMarker && endMarkerX < width) {
      var endMarkerOffset = frameOffset + endMarkerX;

      this._segment.endTime = this._view.pixelsToTime(endMarkerOffset);

      segmentMarker.timeUpdated(this._segment.endTime);
    }

    this._peaks.emit('segments.dragged', this._segment, startMarker);
  };

  /**
   * @param {SegmentMarker} segmentMarker
   */

  SegmentShape.prototype._onSegmentHandleDragStart = function(segmentMarker) {
    var startMarker = segmentMarker.isStartMarker();

    this._peaks.emit('segments.dragstart', this._segment, startMarker);
  };

  /**
   * @param {SegmentMarker} segmentMarker
   */

  SegmentShape.prototype._onSegmentHandleDragEnd = function(segmentMarker) {
    var startMarker = segmentMarker.isStartMarker();

    this._peaks.emit('segments.dragend', this._segment, startMarker);
  };

  SegmentShape.prototype.fitToView = function() {
    if (this._startMarker) {
      this._startMarker.fitToView();
    }

    if (this._endMarker) {
      this._endMarker.fitToView();
    }
  };

  SegmentShape.prototype.destroy = function() {
    this._waveformShape.destroy();

    if (this._label) {
      this._label.destroy();
    }

    if (this._startMarker) {
      this._startMarker.destroy();
    }

    if (this._endMarker) {
      this._endMarker.destroy();
    }
  };

  return SegmentShape;
});
