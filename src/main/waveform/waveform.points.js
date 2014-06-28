/**
 * WAVEFORM.POINTS.JS
 *
 * This module handles all functionality related to the adding,
 * removing and manipulation of points. A point in a segment of zero length
 */
define([
  "peaks/waveform/waveform.mixins"
], function (mixins) {

  return function (peaks) {
    var self = this;
    var waveformView = peaks.waveform;

    self.points = [];

    var views = [waveformView.waveformZoomView, waveformView.waveformOverview];

    var constructPoint = function (pointId, timeStamp, editable, color, labelText) {

      var point = {
        id:        pointId,
        timeStamp: timeStamp,
        labelText: labelText || ""
      };

      var pointZoomGroup = new Kinetic.Group();
      var pointOverviewGroup = new Kinetic.Group();

      var pointGroups = [pointZoomGroup, pointOverviewGroup];

      //color = color || getPointolor();

      for (var i = 0; i < pointGroups.length; i++) {

        var view = views[i];
        var pointGroup = pointGroups[i];

        if (!view.pointLayer) {
          view.pointLayer = new Kinetic.Layer();
          view.stage.add(view.pointLayer);
          view.pointLayer.moveToTop();
        }

        if (editable) {
          pointGroup.marker = new peaks.options.pointMarker(true, pointGroup, point, pointHandleDrag, peaks.options.pointDblClickHandler, peaks.options.pointDragEndHandler);
          pointGroup.add(pointGroup.marker);

        }

        view.pointLayer.add(pointGroup);
        view.pointLayer.draw();
      }

      point.zoom = pointZoomGroup;
      point.zoom.view = waveformView.waveformZoomView;
      point.overview = pointOverviewGroup;
      point.overview.view = waveformView.waveformOverview;
      point.color = color;
      point.editable = editable;

      return point;
    };

    var updatePoint = function (point) {
      // Binding with data
      waveformView.waveformOverview.data.set_point(waveformView.waveformOverview.data.at_time(point.timeStamp), point.id);
      waveformView.waveformZoomView.data.set_point(waveformView.waveformZoomView.data.at_time(point.timeStamp), point.id);

      // Overview
      var overviewTimeStampOffset = waveformView.waveformOverview.data.at_time(point.timeStamp);

      //point.overview.waveformShape.setDrawFunc(function(canvas) {
      //	mixins.waveformSegmentDrawFunction.call(this, waveformView.waveformOverview.data, segment.id, canvas, mixins.interpolateHeight(waveformView.waveformOverview.height));
      //});

      if (point.editable) {
        if (point.overview.marker) point.overview.marker.show().setX(overviewTimeStampOffset - point.overview.marker.getWidth());

        // Change Text
        point.overview.marker.label.setText(mixins.niceTime(point.timeStamp, false));
      }

      // Label
      //point.overview.label.setX(overviewTimeStampOffset);

      point.overview.view.pointLayer.draw();

      // Zoom
      var zoomTimeStampOffset = waveformView.waveformZoomView.data.at_time(point.timeStamp);

      var frameStartOffset = waveformView.waveformZoomView.frameOffset;
      var frameEndOffset = waveformView.waveformZoomView.frameOffset + waveformView.waveformZoomView.width;

      if (zoomTimeStampOffset < frameStartOffset) zoomStartOffset = frameStartOffset;
      //if (zoomEndOffset > frameEndOffset) zoomEndOffset = frameEndOffset;

      if (waveformView.waveformZoomView.data.points[point.id].visible) {
        var startPixel = zoomTimeStampOffset - frameStartOffset;

        point.zoom.show();

        //segment.zoom.waveformShape.setDrawFunc(function(canvas) {
        //	mixins.waveformSegmentDrawFunction.call(this, waveformView.waveformZoomView.data, segment.id, canvas, mixins.interpolateHeight(waveformView.waveformZoomView.height));
        //});

        if (point.editable) {
          if (point.zoom.marker) point.zoom.marker.show().setX(startPixel - point.zoom.marker.getWidth());

          // Change Text
          point.zoom.marker.label.setText(mixins.niceTime(point.timeStamp, false));
        }

      } else {
        point.zoom.hide();
      }

      // Label
      // segment.zoom.label.setX(0);
      // segment.zoom.label.setY(12);

      point.zoom.view.pointLayer.draw();
    };

    var pointHandleDrag = function (thisPoint, point) {
      if (thisPoint.marker.getX() > 0) {
        var inOffset = thisPoint.view.frameOffset + thisPoint.marker.getX() + thisPoint.marker.getWidth();
        point.timeStamp = thisPoint.view.data.time(inOffset);
      }

      updatePoint(point);
    };

    this.init = function () {
      peaks.on("waveform_zoom_displaying", self.updatePoints);
      peaks.emit("points.ready");
    };

    this.updatePoints = function () {
      self.points.forEach(function (point) {
        updatePoint(point);
      });
    };

    this.createPoint = function (timeStamp, editable, color, labelText) {

      if ((timeStamp >= 0) === false) {
        throw new RangeError("[waveform.points.createPoint] timeStamp should be a >=0 value");
      }

      var pointId = "point" + self.points.length;

      var point = constructPoint(pointId, timeStamp, editable, color, labelText);
      updatePoint(point);
      self.points.push(point);
    };

    this.removePoint = function (pointId) {
      for (var j = self.points.length - 1; j >= 0; j--) {
        var point = self.points[j];
        if (point.id === pointId) {
          point.overview.remove();
          point.zoom.remove();
          for (var i = 0; i < views.length; i++) {
            var view = views[i];
            view.pointLayer.draw();
            view.data.remove_point(pointId);
          }
          self.points.splice(j, 1);
          break;
        }
      }
      //Reassign point ids
      for (var k = 0; k < self.points.length; k++) {
        self.points[k].id = "point" + k;
      }
    };
  };
});