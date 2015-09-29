/**
 * WAVEFORM.SEGMENTS.JS
 *
 * This module handles all functionality related to the adding,
 * removing and manipulation of segments
 */
define([
  "konva",
  "peaks/waveform/waveform.mixins",
  "peaks/markers/shapes/wave"
], function (Konva, mixins, SegmentShape) {
  'use strict';

  return function (peaks) {
    var self = this;

    self.segments = [];
    self.views = [peaks.waveform.waveformZoomView, peaks.waveform.waveformOverview].map(function(view){
      if (!view.segmentLayer) {
        view.segmentLayer = new Konva.Layer();
        view.stage.add(view.segmentLayer);
        view.segmentLayer.moveToTop();
      }

      return view;
    });

    var createSegmentWaveform = function (segmentId, startTime, endTime, editable, color, labelText) {
      var segment = {
        id: segmentId,
        startTime: startTime,
        endTime: endTime,
        labelText: labelText || "",
        color: color || getSegmentColor(),
        editable: editable
      };

      var segmentZoomGroup = new Konva.Group();
      var segmentOverviewGroup = new Konva.Group();

      var segmentGroups = [segmentZoomGroup, segmentOverviewGroup];

      var menter = function (event) {
        this.parent.label.show();
        this.parent.view.segmentLayer.draw();
      };

      var mleave = function (event) {
        this.parent.label.hide();
        this.parent.view.segmentLayer.draw();
      };

      segmentGroups.forEach(function(segmentGroup, i){
        var view = self.views[i];

        segmentGroup.waveformShape = SegmentShape.createShape(segment, view);

        segmentGroup.waveformShape.on("mouseenter", menter);
        segmentGroup.waveformShape.on("mouseleave", mleave);

        segmentGroup.add(segmentGroup.waveformShape);

        segmentGroup.label = new peaks.options.segmentLabelDraw(segmentGroup, segment);
        segmentGroup.add(segmentGroup.label.hide());

        if (editable) {
          var draggable = true;

          segmentGroup.inMarker = new peaks.options.segmentInMarker(draggable, segmentGroup, segment, segmentHandleDrag);
          segmentGroup.add(segmentGroup.inMarker);

          segmentGroup.outMarker = new peaks.options.segmentOutMarker(draggable, segmentGroup, segment, segmentHandleDrag);
          segmentGroup.add(segmentGroup.outMarker);
        }

        view.segmentLayer.add(segmentGroup);
      });

      segment.zoom = segmentZoomGroup;
      segment.zoom.view = peaks.waveform.waveformZoomView;
      segment.overview = segmentOverviewGroup;
      segment.overview.view = peaks.waveform.waveformOverview;

      return segment;
    };

    var updateSegmentWaveform = function (segment) {
      // Binding with data
      peaks.waveform.waveformOverview.data.set_segment(peaks.waveform.waveformOverview.data.at_time(segment.startTime), peaks.waveform.waveformOverview.data.at_time(segment.endTime), segment.id);
      peaks.waveform.waveformZoomView.data.set_segment(peaks.waveform.waveformZoomView.data.at_time(segment.startTime), peaks.waveform.waveformZoomView.data.at_time(segment.endTime), segment.id);

      // Overview
      var overviewStartOffset = peaks.waveform.waveformOverview.data.at_time(segment.startTime);
      var overviewEndOffset = peaks.waveform.waveformOverview.data.at_time(segment.endTime);

      segment.overview.setWidth(overviewEndOffset - overviewStartOffset);

      if (segment.editable) {
        if (segment.overview.inMarker) segment.overview.inMarker.show().setX(overviewStartOffset - segment.overview.inMarker.getWidth());
        if (segment.overview.outMarker) segment.overview.outMarker.show().setX(overviewEndOffset);

        // Change Text
        segment.overview.inMarker.label.setText(mixins.niceTime(segment.startTime, false));
        segment.overview.outMarker.label.setText(mixins.niceTime(segment.endTime, false));
      }

      // Label
      // segment.overview.label.setX(overviewStartOffset);

      SegmentShape.update.call(segment.overview.waveformShape, peaks.waveform.waveformOverview, segment.id);

      // Zoom
      var zoomStartOffset = peaks.waveform.waveformZoomView.data.at_time(segment.startTime);
      var zoomEndOffset = peaks.waveform.waveformZoomView.data.at_time(segment.endTime);

      var frameStartOffset = peaks.waveform.waveformZoomView.frameOffset;
      var frameEndOffset = peaks.waveform.waveformZoomView.frameOffset + peaks.waveform.waveformZoomView.width;

      if (zoomStartOffset < frameStartOffset) zoomStartOffset = frameStartOffset;
      if (zoomEndOffset > frameEndOffset) zoomEndOffset = frameEndOffset;

      if (peaks.waveform.waveformZoomView.data.segments[segment.id].visible) {
        var startPixel = zoomStartOffset - frameStartOffset;
        var endPixel = zoomEndOffset - frameStartOffset;

        segment.zoom.show();

        if (segment.editable) {
          if (segment.zoom.inMarker) segment.zoom.inMarker.show().setX(startPixel - segment.zoom.inMarker.getWidth());
          if (segment.zoom.outMarker) segment.zoom.outMarker.show().setX(endPixel);

          // Change Text
          segment.zoom.inMarker.label.setText(mixins.niceTime(segment.startTime, false));
          segment.zoom.outMarker.label.setText(mixins.niceTime(segment.endTime, false));
        }

        SegmentShape.update.call(segment.zoom.waveformShape, peaks.waveform.waveformZoomView, segment.id);
      } else {
        segment.zoom.hide();
      }
    };

    var segmentHandleDrag = function (thisSeg, segment) {
      if (thisSeg.inMarker.getX() > 0) {
        var inOffset = thisSeg.view.frameOffset + thisSeg.inMarker.getX() + thisSeg.inMarker.getWidth();
        segment.startTime = thisSeg.view.data.time(inOffset);
      }

      if (thisSeg.outMarker.getX() < thisSeg.view.width) {
        var outOffset = thisSeg.view.frameOffset + thisSeg.outMarker.getX();
        segment.endTime = thisSeg.view.data.time(outOffset);
      }
      
      peaks.emit("segments.dragged", segment);

      updateSegmentWaveform(segment);
      this.render();
    }.bind(this);

    var getSegmentColor = function () {
      var c;
      if (peaks.options.randomizeSegmentColor) {
        var g = function () { return Math.floor(Math.random()*255); };
        c = 'rgba('+g()+', '+g()+', '+g()+', 1)';
      } else {
        c = peaks.options.segmentColor;
      }
      return c;
    };

    this.init = function () {
      peaks.on("waveform_zoom_displaying", this.updateSegments.bind(this));

      peaks.emit("segments.ready");
    };

    /**
     * Update the segment positioning accordingly to each view zoom level and so on.
     *
     * Also performs the rendering.
     *
     * @api
     */
    this.updateSegments = function () {
      this.segments.forEach(updateSegmentWaveform);
      this.render();
    };

    /**
     * Manage a new segment and propagates it into the different views
     *
     * @api
     * @param {Number} startTime
     * @param {Number} endTime
     * @param {Boolean} editable
     * @param {String=} color
     * @param {String=} labelText
     * @return {Object}
     */
    this.createSegment = function (startTime, endTime, editable, color, labelText) {
      var segmentId = "segment" + self.segments.length;

      if ((startTime >= 0) === false){
        throw new TypeError("[waveform.segments.createSegment] startTime should be a positive value");
      }

      if ((endTime > 0) === false){
        throw new TypeError("[waveform.segments.createSegment] endTime should be a positive value");
      }

      if ((endTime > startTime) === false){
        throw new RangeError("[waveform.segments.createSegment] endTime should be higher than startTime");
      }

      var segment = createSegmentWaveform(segmentId, startTime, endTime, editable, color, labelText);

      updateSegmentWaveform(segment);
      self.segments.push(segment);

      return segment;
    };

    this.remove = function removeSegment(segment){
      var index = null;

      this.segments.some(function(s, i){
        if (s === segment){
          index = i;
          return true;
        }
      });

      if (typeof index === 'number'){
        segment = this.segments[index];

        segment.overview.destroy();
        segment.zoom.destroy();
      }

      return index;
    };

    this.removeAll = function removeAllSegments(){
      this.views.forEach(function(view){
        view.segmentLayer.removeChildren();
      });

      this.segments = [];

      this.render();
    };

    /**
     * Performs the rendering of the segments on screen
     *
     * @api
     * @see https://github.com/bbcrd/peaks.js/pull/5
     * @since 0.0.2
     */
    this.render = function renderSegments(){
      this.views.forEach(function(view){
        view.segmentLayer.draw();
      });
    };
  };
});
