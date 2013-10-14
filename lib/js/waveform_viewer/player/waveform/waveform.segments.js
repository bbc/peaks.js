/**
 * WAVEFORM.SEGMENTS.JS
 *
 * This module handles all functionality related to the adding,
 * removing and manipulation of segments
 */
define([
  "m/bootstrap",
  "m/player/waveform/waveform.mixins",
  ], function (bootstrap, mixins) {

  return function (waveformView, options) {
    var that = this;

    that.segments = [];

    var views = [waveformView.waveformZoomView, waveformView.waveformOverview];

    var createSegmentWaveform = function (segmentId, startTime, endTime, editable, color, labelText) {
      var that = this;

      var segment = {
        id: segmentId,
        startTime: startTime,
        endTime: endTime,
        labelText: labelText || ""
      };

      var segmentZoomGroup = new Kinetic.Group();
      var segmentOverviewGroup = new Kinetic.Group();

      var segmentGroups = [segmentZoomGroup, segmentOverviewGroup];

      color = color || getSegmentColor();

      var menter = function (event) {
        this.parent.label.show();
        this.parent.view.segmentLayer.draw();
      };

      var mleave = function (event) {
        this.parent.label.hide();
        this.parent.view.segmentLayer.draw();
      };

      for (var i = 0; i < segmentGroups.length; i++) {
        var view = views[i];
        var segmentGroup = segmentGroups[i];

        if (!view.segmentLayer) {
          view.segmentLayer = new Kinetic.Layer();
          view.stage.add(view.segmentLayer);
          view.segmentLayer.moveToTop();
        }

        segmentGroup.waveformShape = new Kinetic.Shape({
          fill: color,
          strokeWidth: 0
        });

        segmentGroup.waveformShape.on("mouseenter", menter);
        segmentGroup.waveformShape.on("mouseleave", mleave);

        segmentGroup.add(segmentGroup.waveformShape);

        segmentGroup.label = new options.segmentLabelDraw(segmentGroup, segment);
        segmentGroup.add(segmentGroup.label.hide());

        if (editable) {
          segmentGroup.inMarker = new options.segmentInMarker(true, segmentGroup, segment, segmentHandleDrag);
          segmentGroup.add(segmentGroup.inMarker);

          segmentGroup.outMarker = new options.segmentOutMarker(true, segmentGroup, segment, segmentHandleDrag);
          segmentGroup.add(segmentGroup.outMarker);
        }

        view.segmentLayer.add(segmentGroup);
        view.segmentLayer.draw();
      }

      segment.zoom = segmentZoomGroup;
      segment.zoom.view = waveformView.waveformZoomView;
      segment.overview = segmentOverviewGroup;
      segment.overview.view = waveformView.waveformOverview;
      segment.color = color;
      segment.editable = editable;

      return segment;
    };

    var updateSegmentWaveform = function (segment) {
      // Binding with data
      waveformView.waveformOverview.data.set_segment(waveformView.waveformOverview.data.at_time(segment.startTime), waveformView.waveformOverview.data.at_time(segment.endTime), segment.id);
      waveformView.waveformZoomView.data.set_segment(waveformView.waveformZoomView.data.at_time(segment.startTime), waveformView.waveformZoomView.data.at_time(segment.endTime), segment.id);

      // Overview
      var overviewStartOffset = waveformView.waveformOverview.data.at_time(segment.startTime);
      var overviewEndOffset = waveformView.waveformOverview.data.at_time(segment.endTime);

      segment.overview.waveformShape.setDrawFunc(function(canvas) {
        mixins.waveformSegmentDrawFunction.call(this, waveformView.waveformOverview.data, segment.id, canvas, mixins.interpolateHeight(waveformView.waveformOverview.height));
      });

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

      segment.overview.view.segmentLayer.draw();

      // Zoom
      var zoomStartOffset = waveformView.waveformZoomView.data.at_time(segment.startTime);
      var zoomEndOffset = waveformView.waveformZoomView.data.at_time(segment.endTime);

      var frameStartOffset = waveformView.waveformZoomView.frameOffset;
      var frameEndOffset = waveformView.waveformZoomView.frameOffset + waveformView.waveformZoomView.width;

      if (zoomStartOffset < frameStartOffset) zoomStartOffset = frameStartOffset;
      if (zoomEndOffset > frameEndOffset) zoomEndOffset = frameEndOffset;

      if (waveformView.waveformZoomView.data.segments[segment.id].visible) {
        var startPixel = zoomStartOffset - frameStartOffset;
        var endPixel = zoomEndOffset - frameStartOffset;

        segment.zoom.show();
        segment.zoom.waveformShape.setDrawFunc(function(canvas) {
          mixins.waveformSegmentDrawFunction.call(this, waveformView.waveformZoomView.data, segment.id, canvas, mixins.interpolateHeight(waveformView.waveformZoomView.height));
        });

        if (segment.editable) {
          if (segment.zoom.inMarker) segment.zoom.inMarker.show().setX(startPixel - segment.zoom.inMarker.getWidth());
          if (segment.zoom.outMarker) segment.zoom.outMarker.show().setX(endPixel);

          // Change Text
          segment.zoom.inMarker.label.setText(mixins.niceTime(segment.startTime, false));
          segment.zoom.outMarker.label.setText(mixins.niceTime(segment.endTime, false));
        }

      } else {
        segment.zoom.hide();
      }

      // Label
      // segment.zoom.label.setX(0);
      // segment.zoom.label.setY(12);

      segment.zoom.view.segmentLayer.draw();
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

      updateSegmentWaveform(segment);
    };

    var getSegmentColor = function () {
      var c;
      if (options.randomizeSegmentColor) {
        var g = function () { return Math.floor(Math.random()*255); };
        c = 'rgba('+g()+', '+g()+', '+g()+', 1)';
      } else {
        c = options.segmentColor;
      }
      return c;
    };

    that.init = function () {
      bootstrap.pubsub.on("waveform_zoom_displaying", this.updateSegments);
    };

    this.updateSegments = function () {
      that.segments.forEach(function(segment){
        updateSegmentWaveform(segment);
      });
    };

    this.createSegment = function (startTime, endTime, editable, color, labelText) {
      var segmentId = "segment" + that.segments.length;

      var segment = createSegmentWaveform(segmentId, startTime, endTime, editable, color, labelText);

      updateSegmentWaveform(segment);
      that.segments.push(segment);
    };
  };
});
