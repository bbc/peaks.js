/**
 * @file
 *
 * Defines the {@link WaveformMarkers} class.
 *
 * @module peaks/waveform/waveform.markers
 */
define([
  'konva',
  'peaks/helpers/nice-time',
  'peaks/helpers/extend',
  'peaks/markers/shapes/wave'
], function(Konva, niceTime, extend, WaveShape) {
  'use strict';

  function rgbaValue() {
    return Math.floor(Math.random() * 255);
  }

  /**
   * handles all functionality related to the adding, removing and manipulation
   * of markers
   *
   * @class
   * @alias WaveformMarkers
   *
   * @param {WaveformView} view The view to render markers into
   */
  function WaveformMarkers(peaks) {
    var self = this;

    self.peaks = peaks;
    self.markers = [];
    self.views = [];
  }

  WaveformMarkers.getRandomId = function(length) {
    return Math.random().toString(36).slice(2, (length || 10) + 2);
  };

  WaveformMarkers.getRandomColour = function(opacity) {
    return 'rgba(' + rgbaValue() + ', ' + rgbaValue() + ', ' + rgbaValue() + ', ' + (opacity || 1) + ')';
  };

  WaveformMarkers.prototype.install = function(view) {
    view.markersLayer = new Konva.Layer();
    view.stage.add(view.markersLayer);
    // view.markersLayer.moveToTop();

    var updateMarkers = this.updateMarkers.bind(this, view);

    this.views.push(view);
    view.peaks.on('waveform.render.' + view.name, updateMarkers);

    return {
      subscribeTo: function(eventName) {

      }
    };
  };

  WaveformMarkers.prototype.createMarker = function(view, marker) {
    var self = this;
    var options = view.peaks.options;

    var markerGroup = new Konva.Group({
      id: marker.id
    });

    var MarkerLabel = options.markerLabelDraw;
    var MarkerIn = options.markerInDraw;
    var MarkerOut = options.markerOutDraw;

    markerGroup.waveformShape = WaveShape.createShape(marker, view);
    markerGroup.add(markerGroup.waveformShape);

    // markerGroup.waveformShape.on('mouseenter', function onMouseEnter(event) {
    //   event.target.parent.label.show();
    //   event.target.parent.view.segmentLayer.draw();
    // });
    //
    // markerGroup.waveformShape.on('mouseleave', function onMouseLeave(event) {
    //   event.target.parent.label.hide();
    //   event.target.parent.view.segmentLayer.draw();
    // });

    markerGroup.label = new MarkerLabel(markerGroup, marker);
    markerGroup.add(markerGroup.label.hide());

    if (marker.editable) {
      var draggable = true;

      markerGroup.inMarker = new MarkerIn(
        view,
        draggable,
        markerGroup,
        marker,
        self.handlePointerDrag.bind(self, view)
      );

      markerGroup.outMarker = new MarkerOut(
        view,
        draggable,
        markerGroup,
        marker,
        self.handlePointerDrag.bind(self, view)
      );

      markerGroup.add(markerGroup.inMarker);
      markerGroup.add(markerGroup.outMarker);
    }

    view.markersLayer.add(markerGroup);
  };

  WaveformMarkers.prototype._updateMarkers = function(view, marker) {
    var markerGroup = view.markersLayer.getChildren(function(child) {
      return child.attrs.id === marker.id;
    }).pop();

    var inMarker = markerGroup.inMarker;
    var outMarker = markerGroup.inMarker;

    view.data.set_segment(
      view.data.at_time(marker.startTime),
      view.data.at_time(marker.endTime),
      marker.id
    );

    var startTimePixel = view.data.at_time(marker.startTime);
    var endTimePixel   = view.data.at_time(marker.endTime);

    var frameStartOffset = view.frameOffset;
    var frameEndOffset   = view.frameOffset + view.width;

    if (startTimePixel < frameStartOffset) {
      startTimePixel = frameStartOffset;
    }

    if (endTimePixel > frameEndOffset) {
      endTimePixel = frameEndOffset;
    }

    if (view.data.in_offset(startTimePixel) || view.data.in_offset(endTimePixel)) {
      var startPixel = startTimePixel - frameStartOffset;
      var endPixel   = endTimePixel   - frameStartOffset;

      markerGroup.show();

      if (marker.editable) {
        if (inMarker) {
          inMarker.show().setX(startPixel - inMarker.getWidth());
        }

        if (outMarker) {
          outMarker.show().setX(endPixel);
        }

        // Change Text
        inMarker.label.setText(niceTime(marker.startTime, false));
        outMarker.label.setText(niceTime(marker.endTime, false));
      }

      WaveShape.update.call(markerGroup.waveformShape, view, marker.id);
    }
    else {
      markerGroup.hide();
    }
  };

  WaveformMarkers.prototype.handlePointerDrag = function(view, markerGroup, marker) {
    if (markerGroup.inMarker.getX() > 0) {
      var inOffset = view.frameOffset +
                     markerGroup.inMarker.getX() +
                     markerGroup.inMarker.getWidth();

      marker.startTime = view.data.time(inOffset);
    }

    if (markerGroup.outMarker.getX() < view.width) {
      var outOffset = view.frameOffset + markerGroup.outMarker.getX();

      marker.endTime = view.data.time(outOffset);
    }

    view.emit('markers.dragged', view, marker);

    this.updateMarkers(view);
  };

  /**
   * Update the segment positioning accordingly to each view zoom level and so on.
   *
   * Also performs the rendering.
   *
   * @api
   */
  WaveformMarkers.prototype.updateMarkers = function(view) {
    this.getAll().forEach(this._updateMarkers.bind(this, view));

    this.render();
  };

  WaveformMarkers.prototype.getAll = function() {
    return this.markers;
  };

  WaveformMarkers.prototype.add = function(markers) {
    var options = this.peaks.options;

    var newMarkers = (Array.isArray(markers) ? markers : [markers])
      .map(function(marker) {
        extend({
          startTime: null,
          endTime: null,
          label: '',
          id: '',
          color: options.markerColor || WaveformMarkers.getRandomColour(),
          editable: options.editable,
          data: {}
        }, marker);

        console.log(marker);

        if (isNaN(marker.startTime) || isNaN(marker.endTime)) {
          // eslint-disable-next-line max-len
          throw new TypeError('[peaks.markers.add] startTime an endTime must both be numbers');
        }

        if (marker.startTime < 0) {
          // eslint-disable-next-line max-len
          throw new RangeError('[peaks.markers.add] startTime should be a positive value');
        }

        if (marker.endTime <= 0) {
          // eslint-disable-next-line max-len
          throw new RangeError('[peaks.markers.add] endTime should be a positive value');
        }

        if (options.endTime <= options.startTime) {
          // eslint-disable-next-line max-len
          throw new RangeError('[peaks.markers.add] endTime should be higher than startTime');
        }

        if (!marker.id) {
          marker.id = 'peaks-' + WaveformMarkers.getRandomId();
        }

        return marker;
      }, this);

    this.views.forEach(function(view) {
      newMarkers.forEach(function(marker) {
        this.createMarker(view, marker);
      }, this);
    }, this);

    this.markers = this.markers.concat(newMarkers);

    this.render();
  };

  /**
   * @private
   */
  WaveformMarkers.prototype._remove = function(segment) {
    var index = null;

    this.markers.some(function(s, i) {
      if (s === segment) {
        index = i;

        return true;
      }
    });

    if (index !== null) {
      segment = this.markers[index];

      segment.overview.destroy();
      segment.zoom.destroy();
    }

    return index;
  };

  WaveformMarkers.prototype.remove = function(segment) {
    var index = this._remove(segment);

    if (index === null) {
      // eslint-disable-next-line max-len
      throw new RangeError('Unable to find the requested segment' + String(segment));
    }

    this.updatemarkers();

    return this.markers.splice(index, 1).pop();
  };

  WaveformMarkers.prototype.removeById = function(segmentId) {
    this.markers.filter(function(segment) {
      return segment.id === segmentId;
    }).forEach(this.remove.bind(this));
  };

  WaveformMarkers.prototype.removeByTime = function(startTime, endTime) {
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

    var matchingmarkers = this.markers.filter(fnFilter);

    matchingmarkers.forEach(this.remove.bind(this));

    return matchingmarkers.length;
  };

  WaveformMarkers.prototype.removeAll = function() {
    this.views.forEach(function(view) {
      view.markersLayer.removeChildren();
    });

    this.markers = [];

    this.render();
  };

  /**
   * Performs the rendering of the markers on screen
   *
   * @api
   * @see https://github.com/bbc/peaks.js/pull/5
   * @since 0.0.2
   */
  WaveformMarkers.prototype.render = function() {
    this.views.forEach(function(view) {
      view.markersLayer.draw();
    });
  };

  return WaveformMarkers;
});
