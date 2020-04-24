/**
 * @file
 *
 * Defines the {@link SegmentsLayer} class.
 *
 * @module segments-layer
 */

define([
  './segment-shape',
  './utils',
  'konva'
], function(
    SegmentShape,
    Utils,
    Konva) {
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
    this._segmentShapes = {};
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

  SegmentsLayer.prototype.formatTime = function(time) {
    return this._view.formatTime(time);
  };

  SegmentsLayer.prototype._onSegmentsUpdate = function(segment) {
    var redraw = false;
    var segmentShape = this._segmentShapes[segment.id];
    var frameOffset = this._view.getFrameOffset();
    var width = this._view.getWidth();
    var frameStartTime = this._view.pixelsToTime(frameOffset);
    var frameEndTime   = this._view.pixelsToTime(frameOffset + width);

    if (segmentShape) {
      this._removeSegment(segment);
      redraw = true;
    }

    if (segment.isVisible(frameStartTime, frameEndTime)) {
      this._addSegmentShape(segment);
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
        self._addSegmentShape(segment);
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
    this._segmentShapes = {};

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

  SegmentsLayer.prototype._addSegmentShape = function(segment) {
    var segmentShape = this._createSegmentShape(segment);

    segmentShape.addToLayer(this._layer);

    this._segmentShapes[segment.id] = segmentShape;

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
    var segmentShape = this._findOrAddSegmentShape(segment);

    var segmentStartOffset = this._view.timeToPixels(segment.startTime);
    var segmentEndOffset   = this._view.timeToPixels(segment.endTime);

    var frameStartOffset = this._view.getFrameOffset();

    var startPixel = segmentStartOffset - frameStartOffset;
    var endPixel   = segmentEndOffset   - frameStartOffset;

    var marker = segmentShape.getStartMarker();

    if (marker) {
      marker.setX(startPixel - marker.getWidth());
    }

    marker = segmentShape.getEndMarker();

    if (marker) {
      marker.setX(endPixel);
    }
  };

  /**
   * @private
   * @param {Segment} segment
   */

  SegmentsLayer.prototype._findOrAddSegmentShape = function(segment) {
    var segmentShape = this._segmentShapes[segment.id];

    if (!segmentShape) {
      segmentShape = this._addSegmentShape(segment);
    }

    return segmentShape;
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

    for (var segmentId in this._segmentShapes) {
      if (Utils.objectHasProperty(this._segmentShapes, segmentId)) {
        var segment = this._segmentShapes[segmentId].getSegment();

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
    var segmentShape = this._segmentShapes[segment.id];

    if (segmentShape) {
      segmentShape.destroy();
      delete this._segmentShapes[segment.id];
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
    for (var segmentId in this._segmentShapes) {
      if (Utils.objectHasProperty(this._segmentShapes, segmentId)) {
        var segmentShape = this._segmentShapes[segmentId];

        segmentShape.fitToView();
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
