/**
 * @file
 *
 * Defines the {@link WaveformSegments} class.
 *
 * @module peaks/markers/waveform.segments
 */
define([
  'konva',
  'peaks/waveform/waveform.mixins',
  'peaks/markers/shapes/wave',
  'peaks/markers/shapes/rect'
], function(Konva, mixins, WaveShape, RectangleShape) {
  'use strict';

  /**
   * handles all functionality related to the adding, removing and manipulation
   * of segments
   *
   * @class
   * @alias WaveformSegments
   *
   * @param {Peaks} peaks The parent Peaks object.
   */
  function WaveformSegments(peaks) {
    var self = this;

    self.peaks = peaks;
    self.segments = [];

    self.SegmentShape = this._getSegmentShape();

    var views = [
      peaks.waveform.waveformZoomView,
      peaks.waveform.waveformOverview
    ];

    self.views = views.map(function(view) {
      if (!view.segmentLayer) {
        view.segmentLayer = new Konva.Layer();
        view.stage.add(view.segmentLayer);
        view.segmentLayer.moveToTop();

        // Let the view know that it the segment layer has been added
        // so that it may reorganise its layers
        view.segmentLayerAdded();
      }

      return view;
    });

    self.segmentId = 0;
  }

  WaveformSegments.prototype._getSegmentShape = function() {
    var segmentStyle = this.peaks.options.segmentStyle;

    switch (segmentStyle) {
      case 'wave':
        return WaveShape;

      case 'rect':
        return RectangleShape;

      default:
        throw new Error('Invalid segmentStyle: ' + segmentStyle);
    }
  };

  WaveformSegments.prototype.getNextSegmentId = function() {
    return this.segmentId++;
  };

  WaveformSegments.prototype.createSegmentWaveform = function(options) {
    var self = this;

    var segment = {
      startTime: options.startTime,
      endTime: options.endTime,
      labelText: options.labelText || '',
      color: options.color || this.getSegmentColor(),
      editable: options.editable || false
    };

    if (options.id !== undefined && options.id !== null) {
      segment.id = options.id;
    }
    else {
      segment.id = 'peaks.segment.' + this.getNextSegmentId();
    }

    var segmentZoomGroup = new Konva.Group();
    var segmentOverviewGroup = new Konva.Group();

    var segmentGroups = [segmentZoomGroup, segmentOverviewGroup];

    segmentGroups.forEach(function(segmentGroup, i) {
      var view = self.views[i];

      segmentGroup.waveformShape = self.SegmentShape.createShape(segment, view);

      segmentGroup.waveformShape.on('mouseenter', function onMouseEnter(event) {
        event.target.parent.label.show();
        event.target.parent.view.segmentLayer.draw();
      });

      segmentGroup.waveformShape.on('mouseleave', function onMouseLeave(event) {
        event.target.parent.label.hide();
        event.target.parent.view.segmentLayer.draw();
      });

      segmentGroup.add(segmentGroup.waveformShape);

      segmentGroup.label = new self.peaks.options.segmentLabelDraw(segmentGroup, segment);
      segmentGroup.add(segmentGroup.label.hide());

      if (segment.editable) {
        var draggable = true;

        segmentGroup.inMarker = new self.peaks.options.segmentInMarker(
          draggable,
          segmentGroup,
          segment,
          self.segmentHandleDrag.bind(self)
        );

        segmentGroup.add(segmentGroup.inMarker);

        segmentGroup.outMarker = new self.peaks.options.segmentOutMarker(
          draggable,
          segmentGroup,
          segment,
          self.segmentHandleDrag.bind(self)
        );

        segmentGroup.add(segmentGroup.outMarker);
      }

      view.segmentLayer.add(segmentGroup);
    });

    segment.zoom = segmentZoomGroup;
    segment.zoom.view = this.peaks.waveform.waveformZoomView;
    segment.overview = segmentOverviewGroup;
    segment.overview.view = this.peaks.waveform.waveformOverview;

    return segment;
  };

  WaveformSegments.prototype.updateSegmentWaveform = function(segment) {
    // Binding with data
    this.peaks.waveform.waveformOverview.data.set_segment(
      this.peaks.waveform.waveformOverview.data.at_time(segment.startTime),
      this.peaks.waveform.waveformOverview.data.at_time(segment.endTime),
      segment.id
    );

    this.peaks.waveform.waveformZoomView.data.set_segment(
      this.peaks.waveform.waveformZoomView.data.at_time(segment.startTime),
      this.peaks.waveform.waveformZoomView.data.at_time(segment.endTime),
      segment.id
    );

    // Overview
    var overviewStartOffset = this.peaks.waveform.waveformOverview.data.at_time(segment.startTime);
    var overviewEndOffset   = this.peaks.waveform.waveformOverview.data.at_time(segment.endTime);

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

    this.SegmentShape.update.call(
      segment.overview.waveformShape,
      this.peaks.waveform.waveformOverview,
      segment.id
    );

    // Zoom
    var zoomStartOffset = this.peaks.waveform.waveformZoomView.data.at_time(segment.startTime);
    var zoomEndOffset   = this.peaks.waveform.waveformZoomView.data.at_time(segment.endTime);

    var frameStartOffset = this.peaks.waveform.waveformZoomView.frameOffset;
    var frameEndOffset   = this.peaks.waveform.waveformZoomView.frameOffset + this.peaks.waveform.waveformZoomView.width;

    if (zoomStartOffset < frameStartOffset) {
      zoomStartOffset = frameStartOffset;
    }

    if (zoomEndOffset > frameEndOffset) {
      zoomEndOffset = frameEndOffset;
    }

    if (this.peaks.waveform.waveformZoomView.data.segments[segment.id].visible) {
      var segmentData = this.peaks.waveform.waveformZoomView.data.segments[segment.id];
      var offsetLength = segmentData.offset_length;
      var offsetStart  = segmentData.offset_start - this.peaks.waveform.waveformZoomView.data.offset_start;

      // var startPixel = zoomStartOffset - frameStartOffset;
      // var endPixel   = zoomEndOffset - frameStartOffset;

      segment.zoom.show();

      if (segment.editable) {
        if (segment.zoom.inMarker) {
          segment.zoom.inMarker.show().setX(offsetStart - segment.zoom.inMarker.getWidth());
        }

        if (segment.zoom.outMarker) {
          segment.zoom.outMarker.show().setX(offsetLength + offsetStart);
        }

        // Change Text
        segment.zoom.inMarker.label.setText(mixins.niceTime(segment.startTime, false));
        segment.zoom.outMarker.label.setText(mixins.niceTime(segment.endTime, false));
      }

      this.SegmentShape.update.call(
        segment.zoom.waveformShape,
        this.peaks.waveform.waveformZoomView,
        segment.id
      );
    }
    else {
      segment.zoom.hide();
    }
  };

  WaveformSegments.prototype.segmentHandleDrag = function(thisSeg, segment) {
    if (thisSeg.inMarker.getX() > 0) {
      var inOffset = thisSeg.view.frameOffset +
                     thisSeg.inMarker.getX() +
                     thisSeg.inMarker.getWidth();

      segment.startTime = thisSeg.view.atPixelTime(inOffset);
    }

    if (thisSeg.outMarker.getX() < thisSeg.view.width) {
      var outOffset = thisSeg.view.frameOffset + thisSeg.outMarker.getX();

      segment.endTime = thisSeg.view.atPixelTime(outOffset);
    }

    this.peaks.emit('segments.dragged', segment);

    this.updateSegmentWaveform(segment);
    this.render();
  };

  function g() {
    return Math.floor(Math.random() * 255);
  }

  WaveformSegments.prototype.getSegmentColor = function() {
    if (this.peaks.options.randomizeSegmentColor) {
      return 'rgba(' + g() + ', ' + g() + ', ' + g() + ', 1)';
    }
    else {
      return this.peaks.options.segmentColor;
    }
  };

  WaveformSegments.prototype.init = function() {
    this.peaks.on('waveform_zoom_displaying', this.updateSegments.bind(this));

    this.peaks.emit('segments.ready');
  };

  /**
   * Update the segment positioning accordingly to each view zoom level and so on.
   *
   * Also performs the rendering.
   *
   * @api
   */
  WaveformSegments.prototype.updateSegments = function() {
    this.segments.forEach(this.updateSegmentWaveform.bind(this));
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
  WaveformSegments.prototype.createSegment = function(options) {
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

    var segment = this.createSegmentWaveform(options);

    this.updateSegmentWaveform(segment);
    this.segments.push(segment);

    return segment;
  };

  WaveformSegments.prototype.getSegments = function() {
    return this.segments;
  };

  WaveformSegments.prototype.add = function(segmentOrSegments) {
    var segments = Array.isArray(arguments[0]) ?
                   arguments[0] :
                   Array.prototype.slice.call(arguments);

    if (typeof segments[0] === 'number') {
      this.peaks.options.deprecationLogger('[Peaks.segments.addSegment] Passing spread-arguments to addSegment is deprecated, please pass a single object.');

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
  WaveformSegments.prototype._remove = function(segment) {
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

  WaveformSegments.prototype.remove = function(segment) {
    var index = this._remove(segment);

    if (index === null) {
      throw new RangeError('Unable to find the requested segment' + String(segment));
    }

    this.updateSegments();

    return this.segments.splice(index, 1).pop();
  };

  WaveformSegments.prototype.removeById = function(segmentId) {
    this.segments.filter(function(segment) {
      return segment.id === segmentId;
    }).forEach(this.remove.bind(this));
  };

  WaveformSegments.prototype.removeByTime = function(startTime, endTime) {
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

  WaveformSegments.prototype.removeAll = function() {
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
  WaveformSegments.prototype.render = function() {
    this.views.forEach(function(view) {
      view.segmentLayer.draw();
    });
  };

  return WaveformSegments;
});
