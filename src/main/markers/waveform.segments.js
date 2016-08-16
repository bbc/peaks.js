/**
 * WAVEFORM.SEGMENTS.JS
 *
 * This module handles all functionality related to the adding,
 * removing and manipulation of segments
 */
define([
  'konva',
  'peaks/waveform/waveform.mixins',
  'peaks/markers/shapes/wave'
], function(Konva, mixins, SegmentShape) {
  'use strict';

  return function(peaks) {
    var self = this;

    self.segments = [];

    var views = [
      peaks.waveform.waveformZoomView,
      peaks.waveform.waveformOverview
    ];

    self.views = views.map(function(view) {
      if (!view.segmentLayer) {
        view.segmentLayer = new Konva.Layer();
        view.stage.add(view.segmentLayer);
        view.segmentLayer.moveToTop();
      }

      return view;
    });

    var segmentId = 0;

    var createSegmentWaveform = function(options) {
      var segment = {
        startTime: options.startTime,
        endTime: options.endTime,
        labelText: options.labelText || '',
        color: options.color || getSegmentColor(),
        editable: options.editable || false
      };

      if (options.id !== undefined && options.id !== null) {
        segment.id = options.id;
      }
      else {
        segment.id = 'peaks.segment.' + segmentId++;
      }

      var segmentZoomGroup = new Konva.Group();
      var segmentOverviewGroup = new Konva.Group();

      var segmentGroups = [segmentZoomGroup, segmentOverviewGroup];

      var onMouseEnter = function(event) {
        this.parent.label.show();
        this.parent.view.segmentLayer.draw();
      };

      var onMouseLeave = function(event) {
        this.parent.label.hide();
        this.parent.view.segmentLayer.draw();
      };

      segmentGroups.forEach(function(segmentGroup, i) {
        var view = self.views[i];

        segmentGroup.waveformShape = SegmentShape.createShape(segment, view);

        segmentGroup.waveformShape.on('mouseenter', onMouseEnter);
        segmentGroup.waveformShape.on('mouseleave', onMouseLeave);

        segmentGroup.add(segmentGroup.waveformShape);

        segmentGroup.label = new peaks.options.segmentLabelDraw(segmentGroup, segment);
        segmentGroup.add(segmentGroup.label.hide());

        if (segment.editable) {
          var draggable = true;

          segmentGroup.inMarker = new peaks.options.segmentInMarker(
            draggable,
            segmentGroup,
            segment,
            segmentHandleDrag
          );

          segmentGroup.add(segmentGroup.inMarker);

          segmentGroup.outMarker = new peaks.options.segmentOutMarker(
            draggable,
            segmentGroup,
            segment,
            segmentHandleDrag
          );

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

    function updateSegmentWaveform(segment) {
      // Binding with data
      peaks.waveform.waveformOverview.data.set_segment(
        peaks.waveform.waveformOverview.data.at_time(segment.startTime),
        peaks.waveform.waveformOverview.data.at_time(segment.endTime),
        segment.id
      );

      peaks.waveform.waveformZoomView.data.set_segment(
        peaks.waveform.waveformZoomView.data.at_time(segment.startTime),
        peaks.waveform.waveformZoomView.data.at_time(segment.endTime),
        segment.id
      );

      // Overview
      var overviewStartOffset = peaks.waveform.waveformOverview.data.at_time(segment.startTime);
      var overviewEndOffset = peaks.waveform.waveformOverview.data.at_time(segment.endTime);

      segment.overview.setWidth(overviewEndOffset - overviewStartOffset);

      if (segment.editable) {
        if (segment.overview.inMarker) {
          segment.overview.inMarker.show().setX(overviewStartOffset - segment.overview.inMarker.getWidth());
        }

        if (segment.overview.outMarker) {
          segment.overview.outMarker.show().setX(overviewEndOffset);
        }

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

      if (zoomStartOffset < frameStartOffset) {
        zoomStartOffset = frameStartOffset;
      }

      if (zoomEndOffset > frameEndOffset) {
        zoomEndOffset = frameEndOffset;
      }

      if (peaks.waveform.waveformZoomView.data.segments[segment.id].visible) {
        var startPixel = zoomStartOffset - frameStartOffset;
        var endPixel = zoomEndOffset - frameStartOffset;

        segment.zoom.show();

        if (segment.editable) {
          if (segment.zoom.inMarker) {
            segment.zoom.inMarker.show().setX(startPixel - segment.zoom.inMarker.getWidth());
          }

          if (segment.zoom.outMarker) {
            segment.zoom.outMarker.show().setX(endPixel);
          }

          // Change Text
          segment.zoom.inMarker.label.setText(mixins.niceTime(segment.startTime, false));
          segment.zoom.outMarker.label.setText(mixins.niceTime(segment.endTime, false));
        }

        SegmentShape.update.call(
          segment.zoom.waveformShape,
          peaks.waveform.waveformZoomView,
          segment.id
        );
      }
      else {
        segment.zoom.hide();
      }
    }

    var segmentHandleDrag = function(thisSeg, segment) {
      if (thisSeg.inMarker.getX() > 0) {
        var inOffset = thisSeg.view.frameOffset +
                       thisSeg.inMarker.getX() +
                       thisSeg.inMarker.getWidth();

        segment.startTime = thisSeg.view.data.time(inOffset);
      }

      if (thisSeg.outMarker.getX() < thisSeg.view.width) {
        var outOffset = thisSeg.view.frameOffset + thisSeg.outMarker.getX();

        segment.endTime = thisSeg.view.data.time(outOffset);
      }

      peaks.emit('segments.dragged', segment);

      updateSegmentWaveform(segment);
      this.render();
    }.bind(this);

    function getSegmentColor() {
      if (peaks.options.randomizeSegmentColor) {
        var g = function() {
          return Math.floor(Math.random() * 255);
        };

        return 'rgba(' + g() + ', ' + g() + ', ' + g() + ', 1)';
      }
      else {
        return peaks.options.segmentColor;
      }
    }

    this.init = function() {
      peaks.on('waveform_zoom_displaying', this.updateSegments.bind(this));

      peaks.emit('segments.ready');
    };

    /**
     * Update the segment positioning accordingly to each view zoom level and so on.
     *
     * Also performs the rendering.
     *
     * @api
     */
    this.updateSegments = function() {
      this.segments.forEach(updateSegmentWaveform);
      this.render();
    };

    /**
     * Manage a new segment and propagates it into the different views
     *
     * @api
     * @param {Object} options
     * @param {Number} options.startTime
     * @param {Number} options.endTime
     * @param {Boolean=} options.editable
     * @param {String=} options.color
     * @param {String=} options.labelText
     * @param {Number=} options.id
     * @return {Object}
     */
    this.createSegment = function(options) {
      // Watch for anyone still trying to use the old createSegment(startTime, endTime, ...) API
      if (typeof options === 'number') {
        throw new TypeError('[waveform.segments.createSegment] `options` should be a Segment object');
      }

      if (isNaN(options.startTime) || isNaN(options.endTime)) {
        throw new TypeError('[waveform.segments.createSegment] startTime an endTime must both be numbers');
      }

      if (options.startTime < 0) {
        throw new RangeError('[waveform.segments.createSegment] startTime should be a positive value');
      }

      if (options.endTime <= 0) {
        throw new RangeError('[waveform.segments.createSegment] endTime should be a positive value');
      }

      if (options.endTime <= options.startTime) {
        throw new RangeError('[waveform.segments.createSegment] endTime should be higher than startTime');
      }

      var segment = createSegmentWaveform(options);

      updateSegmentWaveform(segment);
      self.segments.push(segment);

      return segment;
    };

    this.getSegments = function getSegments() {
      return this.segments;
    };

    this.add = function addSegment(segmentOrSegments) {
      var segments = Array.isArray(arguments[0]) ?
                     arguments[0] :
                     Array.prototype.slice.call(arguments);

      if (typeof segments[0] === 'number') {
        peaks.options.deprecationLogger('[Peaks.segments.addSegment] Passing spread-arguments to addSegment is deprecated, please pass a single object.');

        segments = [
          {
            startTime: arguments[0],
            endTime:   arguments[1],
            editable:  arguments[2],
            color:     arguments[3],
            labelText: arguments[4]
          }
        ];
      }

      segments.forEach(this.createSegment.bind(this));
      this.render();
    };

    /**
     * @private
     */
    this._remove = function _removeSegment(segment) {
      var index = null;

      this.segments.some(function(s, i) {
        if (s === segment) {
          index = i;

          return true;
        }
      });

      if (index !== null) {
        segment = this.segments[index];

        segment.overview.destroy();
        segment.zoom.destroy();
      }

      return index;
    };

    this.remove = function removeSegment(segment) {
      var index = this._remove(segment);

      if (index === null) {
        throw new RangeError('Unable to find the requested segment' + String(segment));
      }

      this.updateSegments();

      return this.segments.splice(index, 1).pop();
    };

    this.removeById = function removeSegmentById(segmentId) {
      this.segments.filter(function(segment) {
        return segment.id === segmentId;
      }).forEach(this.remove.bind(this));
    };

    this.removeByTime = function removeSegmentByTime(startTime, endTime) {
      endTime = (typeof endTime === 'number') ? endTime : 0;

      var fnFilter;

      if (endTime > 0) {
        fnFilter = function(segment) {
          return segment.startTime === startTime && segment.endTime === endTime;
        };
      }
      else {
        fnFilter = function(segment) {
          return segment.startTime === startTime;
        };
      }

      var matchingSegments = this.segments.filter(fnFilter);

      matchingSegments.forEach(this.remove.bind(this));

      return matchingSegments.length;
    };

    this.removeAll = function removeAllSegments() {
      this.views.forEach(function(view) {
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
    this.render = function renderSegments() {
      this.views.forEach(function(view) {
        view.segmentLayer.draw();
      });
    };
  };
});
