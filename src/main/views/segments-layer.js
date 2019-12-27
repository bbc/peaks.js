/**
 * @file
 *
 * Defines the {@link SegmentsLayer} class.
 *
 * @module peaks/views/segments-layer
 */

define([
  'peaks/views/segment-shape',
  'konva'
  ], function(SegmentShape, Konva) {
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

  SegmentsLayer.prototype.isEditingEnabled = function() {
    return this._allowEditing;
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
        marker.updatePosition(startPixel - marker.getWidth());
      }

      marker = segmentGroup.getOutMarker();

      if (marker) {
        marker.updatePosition(endPixel);
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
