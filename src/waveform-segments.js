/**
 * @file
 *
 * Defines the {@link WaveformSegments} class.
 *
 * @module waveform-segments
 */

import { Segment, setDefaultSegmentOptions, validateSegmentOptions } from './segment';
import { extend, isNullOrUndefined, objectHasProperty } from './utils';

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
 *   Default: Set by the <code>segmentOptions.waveformColor</code> option
 *   or the <code>segmentOptions.overlayColor</code> option.
 * @property {String=} borderColor Segment border color.
 *   Default: Set by the <code>segmentOptions.overlayBorderColor</code> option.
 * @property {String=} labelText Segment label text.
 *   Default: an empty string.
 * @property {String=} id A unique segment identifier.
 *   Default: an automatically generated identifier.
 * @property {*} data Optional application specific data.
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
  this._segmentsByPid = {};
  this._segmentIdCounter = 0;
  this._segmentPid = 0;
  this._isInserting = false;
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

/**
 * Returns a new unique segment id value, for internal use within
 * Peaks.js only.
 *
 * @private
 * @returns {Number}
 */

WaveformSegments.prototype._getNextPid = function() {
  return this._segmentPid++;
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
  this._segmentsByPid[segment.pid] = segment;
};

/**
 * Creates a new segment object.
 *
 * @private
 * @param {SegmentOptions} options
 * @return {Segment}
 */

WaveformSegments.prototype._createSegment = function(options) {
  const segmentOptions = {};

  extend(segmentOptions, options);

  if (isNullOrUndefined(segmentOptions.id)) {
    segmentOptions.id = this._getNextSegmentId();
  }

  const pid = this._getNextPid();

  setDefaultSegmentOptions(segmentOptions, this._peaks.options.segmentOptions);

  validateSegmentOptions(segmentOptions, false);

  return new Segment(this._peaks, pid, segmentOptions);
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
 * Returns the segment with the given id, or <code>undefined</code> if not found.
 *
 * @param {String} id
 * @returns {Segment}
 */

WaveformSegments.prototype.getSegment = function(id) {
  return this._segmentsById[id];
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
 * Returns a copy of the segments array, sorted by ascending segment start time.
 *
 * @returns {Array<Segment>}
 */

WaveformSegments.prototype._getSortedSegments = function() {
  return this._segments.slice().sort(function(a, b) {
    return a.startTime - b.startTime;
  });
};

WaveformSegments.prototype.findPreviousSegment = function(segment) {
  const sortedSegments = this._getSortedSegments();

  const index = sortedSegments.findIndex(function(s) {
    return s.id === segment.id;
  });

  if (index !== -1) {
    return sortedSegments[index - 1];
  }

  return undefined;
};

WaveformSegments.prototype.findNextSegment = function(segment) {
  const sortedSegments = this._getSortedSegments();

  const index = sortedSegments.findIndex(function(s) {
    return s.id === segment.id;
  });

  if (index !== -1) {
    return sortedSegments[index + 1];
  }

  return undefined;
};

/**
 * Adds one or more segments to the timeline.
 *
 * @param {SegmentOptions|Array<SegmentOptions>} segmentOrSegments
 *
 * @returns Segment|Array<Segment>
 */

WaveformSegments.prototype.add = function(/* segmentOrSegments */) {
  const self = this;

  const arrayArgs = Array.isArray(arguments[0]);
  let segments = arrayArgs ?
                 arguments[0] :
                 Array.prototype.slice.call(arguments);

  segments = segments.map(function(segmentOptions) {
    const segment = self._createSegment(segmentOptions);

    if (objectHasProperty(self._segmentsById, segment.id)) {
      throw new Error('peaks.segments.add(): duplicate id');
    }

    return segment;
  });

  segments.forEach(function(segment) {
    self._addSegment(segment);
  });

  this._peaks.emit('segments.add', {
    segments: segments,
    insert: this._isInserting
  });

  return arrayArgs ? segments : segments[0];
};

WaveformSegments.prototype.updateSegmentId = function(segment, newSegmentId) {
  if (this._segmentsById[segment.id]) {
    if (this._segmentsById[newSegmentId]) {
      throw new Error('segment.update(): duplicate id');
    }
    else {
      delete this._segmentsById[segment.id];
      this._segmentsById[newSegmentId] = segment;
    }
  }
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
  const indexes = [];

  for (let i = 0, length = this._segments.length; i < length; i++) {
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
  const removed = [];

  for (let i = 0; i < indexes.length; i++) {
    const index = indexes[i] - removed.length;

    const itemRemoved = this._segments.splice(index, 1)[0];

    delete this._segmentsById[itemRemoved.id];
    delete this._segmentsByPid[itemRemoved.pid];

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
  const indexes = this._findSegment(predicate);

  const removed = this._removeIndexes(indexes);

  this._peaks.emit('segments.remove', {
    segments: removed
  });

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

  let filter;

  if (endTime > 0) {
    filter = function(segment) {
      return segment.startTime === startTime && segment.endTime === endTime;
    };
  }
  else {
    filter = function(segment) {
      return segment.startTime === startTime;
    };
  }

  return this._removeSegments(filter);
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
  this._segmentsByPid = {};
  this._peaks.emit('segments.remove_all');
};

WaveformSegments.prototype.setInserting = function(value) {
  this._isInserting = value;
};

WaveformSegments.prototype.isInserting = function() {
  return this._isInserting;
};

export default WaveformSegments;
