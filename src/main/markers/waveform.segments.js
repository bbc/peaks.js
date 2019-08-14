/**
 * @file
 *
 * Defines the {@link WaveformSegments} class.
 *
 * @module peaks/markers/waveform.segments
 */

define([
  'colors.css',
  'peaks/markers/segment',
  'peaks/waveform/waveform.utils'
], function(Colors, Segment, Utils) {
  'use strict';

  /**
   * Segment parameters.
   *
   * @typedef {Object} SegmentOptions
   * @global
   * @property {Number} startTime Segment start time, in seconds.
   * @property {Number} endTime Segment end time, in seconds.
   * @property {Boolean=} editable If <code>true</code> the segment start and
   *   end times can be adjusted via the user interface.
   *   Default: <code>false</code>.
   * @property {String=} color Segment waveform color.
   *   Default: a random color.
   * @property {String=} labelText Segment label text.
   *   Default: an empty string.
   * @property {String=} id A unique segment identifier.
   *   Default: an automatically generated identifier.
   */

  /**
   * Handles all functionality related to the adding, removing and manipulation
   * of segments.
   *
   * @class
   * @alias WaveformSegments
   *
   * @param {Peaks} peaks The parent Peaks object.
   */

  function WaveformSegments(peaks) {
    this._peaks = peaks;
    this._segments = [];
    this._segmentsById = {};
    this._segmentIdCounter = 0;
    this._colorIndex = 0;
  }

  /**
   * Returns a new unique segment id value.
   *
   * @private
   * @returns {String}
   */

  WaveformSegments.prototype._getNextSegmentId = function() {
    return 'peaks.segment.' + this._segmentIdCounter++;
  };

  var colors = [
    Colors.navy,
    Colors.blue,
    Colors.aqua,
    Colors.teal,
    // Colors.olive,
    // Colors.lime,
    // Colors.green,
    Colors.yellow,
    Colors.orange,
    Colors.red,
    Colors.maroon,
    Colors.fuchsia,
    Colors.purple
    // Colors.black,
    // Colors.gray,
    // Colors.silver
  ];

  /**
   * @private
   * @returns {String}
   */

  WaveformSegments.prototype._getSegmentColor = function() {
    if (this._peaks.options.randomizeSegmentColor) {
      if (++this._colorIndex === colors.length) {
        this._colorIndex = 0;
      }

      return colors[this._colorIndex];
    }
    else {
      return this._peaks.options.segmentColor;
    }
  };

  /**
   * Adds a new segment object.
   *
   * @private
   * @param {Segment} segment
   */

  WaveformSegments.prototype._addSegment = function(segment) {
    this._segments.push(segment);

    this._segmentsById[segment.id] = segment;
  };

  /**
   * Creates a new segment object.
   *
   * @private
   * @param {SegmentOptions} options
   * @return {Segment}
   */

  WaveformSegments.prototype._createSegment = function(options) {
    // Watch for anyone still trying to use the old
    // createSegment(startTime, endTime, ...) API
    if (!Utils.isObject(options)) {
      // eslint-disable-next-line max-len
      throw new TypeError('peaks.segments.add(): expected a Segment object parameter');
    }

    var segment = new Segment(
      this,
      Utils.isNullOrUndefined(options.id) ? this._getNextSegmentId() : options.id,
      options.startTime,
      options.endTime,
      options.labelText || '',
      options.color || this._getSegmentColor(),
      options.editable || false
    );

    return segment;
  };

  /**
   * Returns all segments.
   *
   * @returns {Array<Segment>}
   */

  WaveformSegments.prototype.getSegments = function() {
    return this._segments;
  };

  /**
   * Returns the segment with the given id, or <code>null</code> if not found.
   *
   * @param {String} id
   * @returns {Segment|null}
   */

  WaveformSegments.prototype.getSegment = function(id) {
    return this._segmentsById[id] || null;
  };

  /**
   * Returns all segments that overlap a given point in time.
   *
   * @param {Number} time
   * @returns {Array<Segment>}
   */

  WaveformSegments.prototype.getSegmentsAtTime = function(time) {
    return this._segments.filter(function(segment) {
      return time >= segment.startTime && time < segment.endTime;
    });
  };

  /**
   * Returns all segments that overlap a given time region.
   *
   * @param {Number} startTime The start of the time region, in seconds.
   * @param {Number} endTime The end of the time region, in seconds.
   *
   * @returns {Array<Segment>}
   */

  WaveformSegments.prototype.find = function(startTime, endTime) {
    return this._segments.filter(function(segment) {
      return segment.isVisible(startTime, endTime);
    });
  };

  /**
   * Adds one or more segments to the timeline.
   *
   * @param {SegmentOptions|Array<SegmentOptions>} segmentOrSegments
   */

  WaveformSegments.prototype.add = function(segmentOrSegments) {
    var self = this;

    var segments = Array.isArray(arguments[0]) ?
                   arguments[0] :
                   Array.prototype.slice.call(arguments);

    if (typeof segments[0] === 'number') {
      // eslint-disable-next-line max-len
      this._peaks.options.deprecationLogger('peaks.segments.add(): expected a segment object or an array');

      segments = [{
        startTime: arguments[0],
        endTime:   arguments[1],
        editable:  arguments[2],
        color:     arguments[3],
        labelText: arguments[4]
      }];
    }

    segments = segments.map(function(segmentOptions) {
      var segment = self._createSegment(segmentOptions);

      if (Object.prototype.hasOwnProperty.call(self._segmentsById, segment.id)) {
        throw new Error('peaks.segments.add(): duplicate id');
      }

      return segment;
    });

    segments.forEach(function(segment) {
      self._addSegment(segment);
    });

    this._peaks.emit('segments.add', segments);
  };

  /**
   * Returns the indexes of segments that match the given predicate.
   *
   * @private
   * @param {Function} predicate Predicate function to find matching segments.
   * @returns {Array<Number>} An array of indexes into the segments array of
   *   the matching elements.
   */

  WaveformSegments.prototype._findSegment = function(predicate) {
    var indexes = [];

    for (var i = 0, length = this._segments.length; i < length; i++) {
      if (predicate(this._segments[i])) {
        indexes.push(i);
      }
    }

    return indexes;
  };

  /**
   * Removes the segments at the given array indexes.
   *
   * @private
   * @param {Array<Number>} indexes The array indexes to remove.
   * @returns {Array<Segment>} The removed {@link Segment} objects.
   */

  WaveformSegments.prototype._removeIndexes = function(indexes) {
    var removed = [];

    for (var i = 0; i < indexes.length; i++) {
      var index = indexes[i] - removed.length;

      var itemRemoved = this._segments.splice(index, 1)[0];

      delete this._segmentsById[itemRemoved.id];

      removed.push(itemRemoved);
    }

    return removed;
  };

  /**
   * Removes all segments that match a given predicate function.
   *
   * After removing the segments, this function also emits a
   * <code>segments.remove</code> event with the removed {@link Segment}
   * objects.
   *
   * @private
   * @param {Function} predicate A predicate function that identifies which
   *   segments to remove.
   * @returns {Array<Segment>} The removed {@link Segment} objects.
   */

  WaveformSegments.prototype._removeSegments = function(predicate) {
    var indexes = this._findSegment(predicate);

    var removed = this._removeIndexes(indexes);

    this._peaks.emit('segments.remove', removed);

    return removed;
  };

  /**
   * Removes the given segment.
   *
   * @param {Segment} segment The segment to remove.
   * @returns {Array<Segment>} The removed segment.
   */

  WaveformSegments.prototype.remove = function(segment) {
    return this._removeSegments(function(s) {
      return s === segment;
    });
  };

  /**
   * Removes any segments with the given id.
   *
   * @param {String} id
   * @returns {Array<Segment>} The removed {@link Segment} objects.
   */

  WaveformSegments.prototype.removeById = function(segmentId) {
    return this._removeSegments(function(segment) {
      return segment.id === segmentId;
    });
  };

  /**
   * Removes any segments with the given start time, and optional end time.
   *
   * @param {Number} startTime Segments with this start time are removed.
   * @param {Number?} endTime If present, only segments with both the given
   *   start time and end time are removed.
   * @returns {Array<Segment>} The removed {@link Segment} objects.
   */

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

    return this._removeSegments(fnFilter);
  };

  /**
   * Removes all segments.
   *
   * After removing the segments, this function emits a
   * <code>segments.remove_all</code> event.
   */

  WaveformSegments.prototype.removeAll = function() {
    this._segments = [];
    this._segmentsById = {};
    this._peaks.emit('segments.remove_all');
  };

  return WaveformSegments;
});
