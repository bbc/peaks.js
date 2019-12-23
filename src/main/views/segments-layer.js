/**
 * @file
 *
 * Defines the {@link SegmentsLayer} class.
 *
 * @module peaks/views/segments-layer
 */

define([
  'peaks/views/waveform-shape',
  'peaks/waveform/waveform.utils',
  'konva'
  ], function(WaveformShape, Utils, Konva) {
  'use strict';

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
    this._inMarker.addToGroup(this._group);
    this._outMarker.addToGroup(this._group);
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
    var editable = true; // TODO

    this._inMarker = this._peaks.options.createSegmentMarker({
      segment:      this._segment,
      segmentShape: this,
      draggable:    true, // editable,
      color:        this._peaks.options.inMarkerColor,
      inMarker:     true,
      layer:        this._layer,
      onDrag:       editable ? this._onSegmentHandleDrag : null,
      onDragStart:  editable ? this._onSegmentHandleDragStart : null,
      onDragEnd:    editable ? this._onSegmentHandleDragEnd : null,
      onMouseEnter: this._onSegmentHandleMouseEnter,
      onMouseLeave: this._onSegmentHandleMouseLeave
    });

    this._outMarker = this._peaks.options.createSegmentMarker({
      segment:      this._segment,
      segmentShape: this,
      draggable:    true, // editable,
      color:        this._peaks.options.outMarkerColor,
      inMarker:     false,
      layer:        this._layer,
      onDrag:       editable ? this._onSegmentHandleDrag : null,
      onDragStart:  editable ? this._onSegmentHandleDragStart : null,
      onDragEnd:    editable ? this._onSegmentHandleDragEnd : null,
      onMouseEnter: this._onSegmentHandleMouseEnter,
      onMouseLeave: this._onSegmentHandleMouseLeave
    });
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
  };

  /**
   * Creates a Konva.Layer that displays segment markers against the audio
   * waveform.
   *
   * @class
   * @alias SegmentsLayer
   *
   * @param {Peaks} peaks
   * @param {WaveformOverview|WaveformZoomView} view
   * @param {Boolean} allowEditing
   */

  function SegmentsLayer(peaks, view, allowEditing) {
    this._peaks         = peaks;
    this._view          = view;
    this._allowEditing  = allowEditing;
    this._segmentGroups = {};
    this._layer         = new Konva.Layer();

    this._onSegmentsUpdate    = this._onSegmentsUpdate.bind(this);
    this._onSegmentsAdd       = this._onSegmentsAdd.bind(this);
    this._onSegmentsRemove    = this._onSegmentsRemove.bind(this);
    this._onSegmentsRemoveAll = this._onSegmentsRemoveAll.bind(this);
    this._onSegmentsDragged   = this._onSegmentsDragged.bind(this);

    this._peaks.on('segments.update', this._onSegmentsUpdate);
    this._peaks.on('segments.add', this._onSegmentsAdd);
    this._peaks.on('segments.remove', this._onSegmentsRemove);
    this._peaks.on('segments.remove_all', this._onSegmentsRemoveAll);
    this._peaks.on('segments.dragged', this._onSegmentsDragged);
  }

  /**
   * Adds the layer to the given {Konva.Stage}.
   *
   * @param {Konva.Stage} stage
   */

  SegmentsLayer.prototype.addToStage = function(stage) {
    stage.add(this._layer);
  };

  SegmentsLayer.prototype.enableEditing = function(enable) {
    this._allowEditing = enable;
  };

  SegmentsLayer.prototype._onSegmentsUpdate = function(segment) {
    var redraw = false;
    var segmentGroup = this._segmentGroups[segment.id];
    var frameOffset = this._view.getFrameOffset();
    var width = this._view.getWidth();
    var frameStartTime = this._view.pixelsToTime(frameOffset);
    var frameEndTime   = this._view.pixelsToTime(frameOffset + width);

    if (segmentGroup) {
      this._removeSegment(segment);
      redraw = true;
    }

    if (segment.isVisible(frameStartTime, frameEndTime)) {
      this._addSegmentGroup(segment);
      redraw = true;
    }

    if (redraw) {
      this.updateSegments(frameStartTime, frameEndTime);
    }
  };

  SegmentsLayer.prototype._onSegmentsAdd = function(segments) {
    var self = this;

    var frameOffset = self._view.getFrameOffset();
    var width = self._view.getWidth();

    var frameStartTime = self._view.pixelsToTime(frameOffset);
    var frameEndTime   = self._view.pixelsToTime(frameOffset + width);

    segments.forEach(function(segment) {
      if (segment.isVisible(frameStartTime, frameEndTime)) {
        self._addSegmentGroup(segment);
      }
    });

    self.updateSegments(frameStartTime, frameEndTime);
  };

  SegmentsLayer.prototype._onSegmentsRemove = function(segments) {
    var self = this;

    segments.forEach(function(segment) {
      self._removeSegment(segment);
    });

    self._layer.draw();
  };

  SegmentsLayer.prototype._onSegmentsRemoveAll = function() {
    this._layer.removeChildren();
    this._segmentGroups = {};

    this._layer.draw();
  };

  SegmentsLayer.prototype._onSegmentsDragged = function(segment) {
    this._updateSegment(segment);
    this._layer.draw();
  };

  /**
   * Creates the Konva UI objects for a given segment.
   *
   * @private
   * @param {Segment} segment
   * @returns {SegmentShape}
   */

  SegmentsLayer.prototype._createSegmentShape = function(segment) {
    return new SegmentShape(segment, this._peaks, this, this._view);
  };

  /**
   * Adds a Konva UI object to the layer for a given segment.
   *
   * @private
   * @param {Segment} segment
   * @returns {SegmentShape}
   */

  SegmentsLayer.prototype._addSegmentGroup = function(segment) {
    var segmentShape = this._createSegmentShape(segment);

    segmentShape.addToLayer(this._layer);

    this._segmentGroups[segment.id] = segmentShape;

    return segmentShape;
  };

  /**
   * Updates the positions of all displayed segments in the view.
   *
   * @param {Number} startTime The start of the visible range in the view,
   *   in seconds.
   * @param {Number} endTime The end of the visible range in the view,
   *   in seconds.
   */

  SegmentsLayer.prototype.updateSegments = function(startTime, endTime) {
    // Update segments in visible time range.
    var segments = this._peaks.segments.find(startTime, endTime);

    var count = segments.length;

    segments.forEach(this._updateSegment.bind(this));

    // TODO: in the overview all segments are visible, so no need to check
    count += this._removeInvisibleSegments(startTime, endTime);

    if (count > 0) {
      this._layer.draw();
    }
  };

  /**
   * @private
   * @param {Segment} segment
   */

  SegmentsLayer.prototype._updateSegment = function(segment) {
    var segmentGroup = this._findOrAddSegmentGroup(segment);

    var segmentStartOffset = this._view.timeToPixels(segment.startTime);
    var segmentEndOffset   = this._view.timeToPixels(segment.endTime);

    var frameStartOffset = this._view.getFrameOffset();

    var startPixel = segmentStartOffset - frameStartOffset;
    var endPixel   = segmentEndOffset   - frameStartOffset;

    if (this._allowEditing && segment.editable) {
      var marker = segmentGroup.getInMarker();

      if (marker) {
        marker.setX(startPixel - marker.getWidth());

        marker.setLabelText(Utils.formatTime(segment.startTime, false));
      }

      marker = segmentGroup.getOutMarker();

      if (marker) {
        marker.setX(endPixel);

        marker.setLabelText(Utils.formatTime(segment.endTime, false));
      }
    }
  };

  /**
   * @private
   * @param {Segment} segment
   */

  SegmentsLayer.prototype._findOrAddSegmentGroup = function(segment) {
    var segmentGroup = this._segmentGroups[segment.id];

    if (!segmentGroup) {
      segmentGroup = this._addSegmentGroup(segment);
    }

    return segmentGroup;
  };

  /**
   * Removes any segments that are not visible, i.e., are not within and do not
   * overlap the given time range.
   *
   * @private
   * @param {Number} startTime The start of the visible time range, in seconds.
   * @param {Number} endTime The end of the visible time range, in seconds.
   * @returns {Number} The number of segments removed.
   */

  SegmentsLayer.prototype._removeInvisibleSegments = function(startTime, endTime) {
    var count = 0;

    for (var segmentId in this._segmentGroups) {
      if (Object.prototype.hasOwnProperty.call(this._segmentGroups, segmentId)) {
        var segment = this._segmentGroups[segmentId].getSegment();

        if (!segment.isVisible(startTime, endTime)) {
          this._removeSegment(segment);
          count++;
        }
      }
    }

    return count;
  };

  /**
   * Removes the given segment from the view.
   *
   * @param {Segment} segment
   */

  SegmentsLayer.prototype._removeSegment = function(segment) {
    var segmentGroup = this._segmentGroups[segment.id];

    if (segmentGroup) {
      segmentGroup.destroy();
      delete this._segmentGroups[segment.id];
    }
  };

  /**
   * Toggles visibility of the segments layer.
   *
   * @param {Boolean} visible
   */

  SegmentsLayer.prototype.setVisible = function(visible) {
    this._layer.setVisible(visible);
  };

  SegmentsLayer.prototype.draw = function() {
    this._layer.draw();
  };

  SegmentsLayer.prototype.destroy = function() {
    this._peaks.off('segments.update', this._onSegmentsUpdate);
    this._peaks.off('segments.add', this._onSegmentsAdd);
    this._peaks.off('segments.remove', this._onSegmentsRemove);
    this._peaks.off('segments.remove_all', this._onSegmentsRemoveAll);
    this._peaks.off('segments.dragged', this._onSegmentsDragged);
  };

  SegmentsLayer.prototype.fitToView = function() {
    for (var segmentId in this._segmentGroups) {
      if (Object.hasOwnProperty.call(this._segmentGroups, segmentId)) {
        var segmentGroup = this._segmentGroups[segmentId];

        segmentGroup.fitToView();
      }
    }
  };

  SegmentsLayer.prototype.draw = function() {
    this._layer.draw();
  };

  SegmentsLayer.prototype.getHeight = function() {
    return this._layer.getHeight();
  };

  return SegmentsLayer;
});
