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

    this._onSegmentHandleDrag = this._onSegmentHandleDrag.bind(this);
    this._onSegmentHandleDragStart = this._onSegmentHandleDragStart.bind(this);
    this._onSegmentHandleDragEnd = this._onSegmentHandleDragEnd.bind(this);

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
   * @returns {Konva.Group}
   */

  SegmentsLayer.prototype._createSegmentGroup = function(segment) {
    var self = this;

    var segmentGroup = new Konva.Group();

    segmentGroup.segment = segment;

    segmentGroup.waveformShape = new WaveformShape({
      color: segment.color,
      view: self._view,
      segment: segment
    });

    // Set up event handlers to show/hide the segment label text when the user
    // hovers the mouse over the segment.

    segmentGroup.waveformShape.on('mouseenter', function(event) {
      if (!event.target.parent) {
        self._peaks.logger('No parent for object:', event.target);
        return;
      }

      event.target.parent.label.show();
      self._layer.draw();
      self._peaks.emit('segments.mouseenter', event.target._segment);
    });

    segmentGroup.waveformShape.on('mouseleave', function(event) {
      if (!event.target.parent) {
        self._peaks.logger('No parent for object:', event.target);
        return;
      }

      event.target.parent.label.hide();
      self._layer.draw();
      self._peaks.emit('segments.mouseleave', event.target._segment);
    });

    segmentGroup.waveformShape.on('click', function(event) {
      if (!event.target.parent) {
        self._peaks.logger('No parent for object:', event.target);
        return;
      }

      self._peaks.emit('segments.click', event.target._segment);
    });

    segmentGroup.add(segmentGroup.waveformShape);

    segmentGroup.label = self._peaks.options.createSegmentLabel(segmentGroup, segment);
    segmentGroup.label.hide();
    segmentGroup.add(segmentGroup.label);

    var editable = self._allowEditing && segment.editable;

    if (editable) {
      segmentGroup.inMarker = this._peaks.options.createSegmentMarker({
        draggable:    editable,
        height:       this._view.getHeight(),
        color:        this._peaks.options.inMarkerColor,
        inMarker:     true,
        segmentGroup: segmentGroup,
        segment:      segment,
        layer:        self._layer,
        onDrag:       editable ? self._onSegmentHandleDrag : null,
        onDragStart:  editable ? self._onSegmentHandleDragStart : null,
        onDragEnd:    editable ? self._onSegmentHandleDragEnd : null
      });

      segmentGroup.add(segmentGroup.inMarker);

      segmentGroup.outMarker = this._peaks.options.createSegmentMarker({
        draggable:    editable,
        height:       this._view.getHeight(),
        color:        this._peaks.options.outMarkerColor,
        inMarker:     false,
        segmentGroup: segmentGroup,
        segment:      segment,
        layer:        self._layer,
        onDrag:       editable ? self._onSegmentHandleDrag : null,
        onDragStart:  editable ? self._onSegmentHandleDragStart : null,
        onDragEnd:    editable ? self._onSegmentHandleDragEnd : null
      });

      segmentGroup.add(segmentGroup.outMarker);
    }

    return segmentGroup;
  };

  /**
   * Adds a Konva UI object to the layer for a given segment.
   *
   * @private
   * @param {Segment} segment
   * @returns {Konva.Group}
   */

  SegmentsLayer.prototype._addSegmentGroup = function(segment) {
    var segmentGroup = this._createSegmentGroup(segment);

    this._layer.add(segmentGroup);

    this._segmentGroups[segment.id] = segmentGroup;

    return segmentGroup;
  };

  /**
   * @param {Konva.Group} segmentGroup
   * @param {Segment} segment
   */

  SegmentsLayer.prototype._onSegmentHandleDrag = function(segmentGroup, segment, inMarker) {
    var frameOffset = this._view.getFrameOffset();
    var width = this._view.getWidth();

    var inMarkerX  = segmentGroup.inMarker.getX();
    var outMarkerX = segmentGroup.outMarker.getX();

    if (inMarkerX > 0) {
      var inOffset = frameOffset +
                     inMarkerX +
                     segmentGroup.inMarker.getWidth();

      segment.startTime = this._view.pixelsToTime(inOffset);
    }

    if (outMarkerX < width) {
      var outOffset = frameOffset + outMarkerX;

      segment.endTime = this._view.pixelsToTime(outOffset);
    }

    this._peaks.emit('segments.dragged', segment, inMarker);
  };

  /**
   * @param {Boolean} inMarker
   * @param {Segment} segment
   */

  SegmentsLayer.prototype._onSegmentHandleDragStart = function(segment, inMarker) {
      this._peaks.emit('segments.dragstart', segment, inMarker);
  };

  /**
   * @param {Boolean} inMarker
   * @param {Segment} segment
   */

  SegmentsLayer.prototype._onSegmentHandleDragEnd = function(segment, inMarker) {
      this._peaks.emit('segments.dragend', segment, inMarker);
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
    // var frameEndOffset   = frameStartOffset + this._view.getWidth();

    var startPixel = segmentStartOffset - frameStartOffset;
    var endPixel   = segmentEndOffset   - frameStartOffset;

    if (this._allowEditing && segment.editable) {
      var marker = segmentGroup.inMarker;

      if (marker) {
        marker.setX(startPixel - marker.getWidth());

        marker.label.setText(Utils.formatTime(segment.startTime, false));
      }

      marker = segmentGroup.outMarker;

      if (marker) {
        marker.setX(endPixel);

        marker.label.setText(Utils.formatTime(segment.endTime, false));
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
        var segment = this._segmentGroups[segmentId].segment;

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
      segmentGroup.destroyChildren();
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

  return SegmentsLayer;
});
