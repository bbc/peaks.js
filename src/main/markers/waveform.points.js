/**
 * WAVEFORM.POINTS.JS
 *
 * This module handles all functionality related to the adding,
 * removing and manipulation of points. A point in a segment of zero length
 */
define([
  "peaks/waveform/waveform.mixins",
  "konva"
], function (mixins, Konva) {

  return function (peaks) {
    var self = this;
    var waveformView = peaks.waveform;

    self.points = [];

    self.views = [waveformView.waveformZoomView, waveformView.waveformOverview].map(function(view){
      if (!view.pointLayer) {
        view.pointLayer = new Konva.Layer();
        view.stage.add(view.pointLayer);
        view.pointLayer.moveToTop();
      }

      return view;
    });

    function constructPoint(point) {
      var pointZoomGroup = new Konva.Group();
      var pointOverviewGroup = new Konva.Group();
      var pointGroups = [pointZoomGroup, pointOverviewGroup];

      point.editable = Boolean(point.editable);

      pointGroups.forEach(function(pointGroup, i){
        var view = self.views[i];

        if (point.editable) {
          pointGroup.marker = new peaks.options.pointMarker(true, pointGroup, point, pointHandleDrag, peaks.options.pointDblClickHandler, peaks.options.pointDragEndHandler);
          pointGroup.add(pointGroup.marker);
        }

        view.pointLayer.add(pointGroup);
      });

      point.zoom = pointZoomGroup;
      point.zoom.view = waveformView.waveformZoomView;
      point.overview = pointOverviewGroup;
      point.overview.view = waveformView.waveformOverview;

      return point;
    }

    function updatePoint(point) {
      // Binding with data
      waveformView.waveformOverview.data.set_point(waveformView.waveformOverview.data.at_time(point.timestamp), point.id);
      waveformView.waveformZoomView.data.set_point(waveformView.waveformZoomView.data.at_time(point.timestamp), point.id);

      // Overview
      var overviewtimestampOffset = waveformView.waveformOverview.data.at_time(point.timestamp);

      if (point.editable) {
        if (point.overview.marker) point.overview.marker.show().setX(overviewtimestampOffset - point.overview.marker.getWidth());

        // Change Text
        point.overview.marker.label.setText(mixins.niceTime(point.timestamp, false));
      }

      // Zoom
      var zoomtimestampOffset = waveformView.waveformZoomView.data.at_time(point.timestamp);
      var frameStartOffset = waveformView.waveformZoomView.frameOffset;

      if (zoomtimestampOffset < frameStartOffset) {
        zoomStartOffset = frameStartOffset;
      }

      if (waveformView.waveformZoomView.data.points[point.id].visible) {
        var startPixel = zoomtimestampOffset - frameStartOffset;

        point.zoom.show();

        if (point.editable) {
          if (point.zoom.marker) point.zoom.marker.show().setX(startPixel - point.zoom.marker.getWidth());

          // Change Text
          point.zoom.marker.label.setText(mixins.niceTime(point.timestamp, false));
        }
      }
      else {
        point.zoom.hide();
      }
    }

    function pointHandleDrag(thisPoint, point) {
      if (thisPoint.marker.getX() > 0) {
        var inOffset = thisPoint.view.frameOffset + thisPoint.marker.getX() + thisPoint.marker.getWidth();
        point.timestamp = thisPoint.view.data.time(inOffset);
      }

      updatePoint(point);
      self.render();
    }

    this.init = function () {
      peaks.on("waveform_zoom_displaying", self.updatePoints.bind(self));
      peaks.emit("points.ready");
    };

    this.updatePoints = function () {
      self.points.forEach(updatePoint);
      self.render();
    };

    this.createPoint = function (point) {

      if ((point.timestamp >= 0) === false) {
        throw new RangeError("[waveform.points.createPoint] timestamp should be a >=0 value");
      }

      point.id = "point" + self.points.length;

      point = constructPoint(point);
      updatePoint(point);
      self.points.push(point);
    };

    this.remove = function removePoint(point) {
      var index = null;

      this.points.some(function(p, i){
        if (p === point){
          index = i;
          return true;
        }
      });

      if (typeof index === 'number'){
        point.overview.destroy();
        point.zoom.destroy();
      }

      return index;
    };

    this.removeAll = function removeAllPoints(){
      this.views.forEach(function(view){
        view.pointLayer.removeChildren();
      });

      this.points = [];

      this.render();
    };

    /**
     * Performs the rendering of the segments on screen
     *
     * @api
     * @since 0.3.0
     */
    this.render = function renderPoints(){
      self.views.forEach(function(view){
        view.pointLayer.draw();
      });
    };
  };
});