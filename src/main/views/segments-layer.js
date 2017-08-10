/**
 * @file
 *
 * Defines the {@link SegmentsLayer} class.
 *
 * @module peaks/views/segments-layer
 */

define([
  'peaks/markers/shapes/wave',
  'peaks/waveform/waveform.utils',
  'konva'
  ], function(SegmentShape, Utils, Konva) {
  'use strict';

  /**
   * Creates a Konva.Layer that displays segment markers against the audio
   * waveform.
   *
   * @class
   * @alias SegmentsLayer
   *
   * @param {Peaks} peaks
   * @param {Konva.Stage} stage
   * @param {WaveformOverview|WaveformZoomView} view
   * @param {Boolean} allowEditing
   */

  function SegmentsLayer(peaks, stage, view, allowEditing) {
    this._peaks        = peaks;
    this._stage        = stage;
    this._view         = view;
    this._allowEditing = allowEditing;

    this._segmentGroups = {};
    this._createLayer();
  }

  SegmentsLayer.prototype._createSegmentGroup = function(segment) {
    var self = this;

    var segmentGroup = new Konva.Group();

    var SegmentLabel     = self._peaks.options.segmentLabelDraw;
    var SegmentMarkerIn  = self._peaks.options.segmentInMarker;
    var SegmentMarkerOut = self._peaks.options.segmentOutMarker;

    segmentGroup.segment = segment;

    segmentGroup.waveformShape = SegmentShape.createShape(segment, self._view);

    segmentGroup.waveformShape.on('mouseenter', function(event) {
      if (!event.target.parent) {
        self._peaks.logger('No parent for object:', event.target);
        return;
      }

      event.target.parent.label.show();
      self._layer.draw();
    });

    segmentGroup.waveformShape.on('mouseleave', function(event) {
      if (!event.target.parent) {
        self._peaks.logger('No parent for object:', event.target);
        return;
      }

      event.target.parent.label.hide();
      self._layer.draw();
    });

    segmentGroup.add(segmentGroup.waveformShape);

    segmentGroup.label = new SegmentLabel(segmentGroup, segment);
    segmentGroup.label.hide();
    segmentGroup.add(segmentGroup.label);

    if (self._allowEditing && segment.editable) {
      var draggable = true;

      segmentGroup.inMarker = new SegmentMarkerIn(
        draggable,
        segmentGroup,
        segment,
        self._layer,
        self._onSegmentHandleDrag.bind(self)
      );

      segmentGroup.add(segmentGroup.inMarker);

      segmentGroup.outMarker = new SegmentMarkerOut(
        draggable,
        segmentGroup,
        segment,
        self._layer,
        self._onSegmentHandleDrag.bind(self)
      );

      segmentGroup.add(segmentGroup.outMarker);
    }

    return segmentGroup;
  };

  SegmentsLayer.prototype._addSegmentGroup = function(segment) {
    var segmentGroup = this._createSegmentGroup(segment);

    this._layer.add(segmentGroup);

    this._segmentGroups[segment.id] = segmentGroup;

    return segmentGroup;
  };

  SegmentsLayer.prototype._createLayer = function() {
    var self = this;

    this._layer = new Konva.Layer();
    this._stage.add(this._layer);

    this._peaks.on('segments.add', function(segments) {
      var frameStartTime = self._view.pixelsToTime(self._view.frameOffset);
      var frameEndTime   = self._view.pixelsToTime(self._view.frameOffset + self._view.width);

      segments.forEach(function(segment) {
        if (segment.isVisible(frameStartTime, frameEndTime)) {
          self._addSegmentGroup(segment);
        }
      });

      self.updateSegments(frameStartTime, frameEndTime);
    });

    this._peaks.on('segments.remove', function(segments) {
      segments.forEach(function(segment) {
        self._removeSegment(segment);
      });

      self._layer.draw();
    });

    this._peaks.on('segments.remove_all', function() {
      self._layer.removeChildren();
      self._segmentGroups = {};

      self._layer.draw();
    });

    this._peaks.on('segments.dragged', function(segment) {
      self._updateSegment(segment);
      self._layer.draw();
    });
  };

  SegmentsLayer.prototype._updateSegment = function(segment) {
    var segmentGroup = this._segmentGroups[segment.id];

    if (!segmentGroup) {
      segmentGroup = this._addSegmentGroup(segment);
    }

    var segmentStartOffset = this._view.timeToPixels(segment.startTime);
    var segmentEndOffset   = this._view.timeToPixels(segment.endTime);

    var frameStartOffset = this._view.frameOffset;
    // var frameEndOffset   = this._view.frameOffset + this._view.width;

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

  SegmentsLayer.prototype._removeSegment = function(segment) {
    var segmentGroup = this._segmentGroups[segment.id];

    if (segmentGroup) {
      segmentGroup.destroyChildren();
      segmentGroup.destroy();
      delete this._segmentGroups[segment.id];
    }
  };

  SegmentsLayer.prototype._onSegmentHandleDrag = function(segmentGroup, segment) {
    var inMarkerX  = segmentGroup.inMarker.getX();
    var outMarkerX = segmentGroup.outMarker.getX();

    if (inMarkerX > 0) {
      var inOffset = this._view.frameOffset +
                     inMarkerX +
                     segmentGroup.inMarker.getWidth();

      segment.startTime = this._view.pixelsToTime(inOffset);
    }

    if (outMarkerX < this._view.width) {
      var outOffset = this._view.frameOffset + outMarkerX;

      segment.endTime = this._view.pixelsToTime(outOffset);
    }

    this._peaks.emit('segments.dragged', segment);
  };

  /**
   * Updates the positions of all displayed segments according to the view's
   * zoom level and scroll position.
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
   * Removes any segments that are not visible, i.e., are within or overlap the
   * given time range.
   *
   * @private
   * @param {Number} startTime The start of the visible time range, in seconds.
   * @param {Number} endTime The end of the visible time range, in seconds.
   * @returns {Number} The number of segments removed.
   */

  SegmentsLayer.prototype._removeInvisibleSegments = function(startTime, endTime) {
    var self = this;

    var count = 0;

    Object.keys(this._segmentGroups).forEach(function(segmentId) {
      var segment = self._segmentGroups[segmentId].segment;

      if (!segment.isVisible(startTime, endTime)) {
        self._removeSegment(segment);
        count++;
      }
    });

    return count;
  };

  return SegmentsLayer;
});
