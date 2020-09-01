/**
 * @file
 *
 * Defines the {@link Segment} class.
 *
 * @module segment
 */

define([
  './utils'
], function(Utils) {
  'use strict';

  var segmentOptions = ['peaks', 'id', 'startTime', 'endTime', 'labelText', 'color', 'editable'];

  function validateSegment(options, context) {
    if (!Utils.isValidTime(options.startTime)) {
      // eslint-disable-next-line max-len
      throw new TypeError('peaks.segments.' + context + ': startTime should be a valid number');
    }

    if (!Utils.isValidTime(options.endTime)) {
      // eslint-disable-next-line max-len
      throw new TypeError('peaks.segments.' + context + ': endTime should be a valid number');
    }

    if (options.startTime < 0) {
      // eslint-disable-next-line max-len
      throw new RangeError('peaks.segments.' + context + ': startTime should not be negative');
    }

    if (options.endTime < 0) {
      // eslint-disable-next-line max-len
      throw new RangeError('peaks.segments.' + context + ': endTime should not be negative');
    }

    if (options.endTime < options.startTime) {
      // eslint-disable-next-line max-len
      throw new RangeError('peaks.segments.' + context + ': endTime should not be less than startTime');
    }

    if (Utils.isNullOrUndefined(options.labelText)) {
      // Set default label text
      options.labelText = '';
    }
    else if (!Utils.isString(options.labelText)) {
      throw new TypeError('peaks.segments.' + context + ': labelText must be a string');
    }

    if (!Utils.isBoolean(options.editable)) {
      throw new TypeError('peaks.segments.' + context + ': editable must be true or false');
    }
  }

  /**
   * A segment is a region of time, with associated label and color.
   *
   * @class
   * @alias Segment
   *
   * @param {Peaks} peaks A reference to the Peaks instance.
   * @param {String} id A unique identifier for the segment.
   * @param {Number} startTime Segment start time, in seconds.
   * @param {Number} endTime Segment end time, in seconds.
   * @param {String} labelText Segment label text.
   * @param {String} color Segment waveform color.
   * @param {Boolean} editable If <code>true</code> the segment start and
   *   end times can be adjusted via the user interface.
   * @param {*} data Optional application specific data.
   */

  function Segment(options) {
    validateSegment(options, 'add()');

    this._peaks     = options.peaks;
    this._id        = options.id;
    this._startTime = options.startTime;
    this._endTime   = options.endTime;
    this._labelText = options.labelText;
    this._color     = options.color;
    this._editable  = options.editable;

    this._setUserData(options);
  }

  Segment.prototype._setUserData = function(options) {
    for (var key in options) {
      if (Utils.objectHasProperty(options, key) && segmentOptions.indexOf(key) === -1) {
        this[key] = options[key];
      }
    }
  };

  Object.defineProperties(Segment.prototype, {
    id: {
      enumerable: true,
      get: function() {
        return this._id;
      }
    },
    startTime: {
      enumerable: true,
      get: function() {
        return this._startTime;
      }
    },
    endTime: {
      enumerable: true,
      get: function() {
        return this._endTime;
      }
    },
    labelText: {
      enumerable: true,
      get: function() {
        return this._labelText;
      }
    },
    color: {
      enumerable: true,
      get: function() {
        return this._color;
      }
    },
    editable: {
      enumerable: true,
      get: function() {
        return this._editable;
      }
    }
  });

  Segment.prototype.update = function(options) {
    var opts = {
      startTime: this.startTime,
      endTime:   this.endTime,
      labelText: this.labelText,
      color:     this.color,
      editable:  this.editable
    };

    Utils.extend(opts, options);

    validateSegment(opts, 'update()');

    this._startTime = opts.startTime;
    this._endTime   = opts.endTime;
    this._labelText = opts.labelText;
    this._color     = opts.color;
    this._editable  = opts.editable;

    this._setUserData(options);

    this._peaks.emit('segments.update', this);
  };

  /**
   * Returns <code>true</code> if the segment overlaps a given time region.
   *
   * @param {Number} startTime The start of the time region, in seconds.
   * @param {Number} endTime The end of the time region, in seconds.
   * @returns {Boolean}
   *
   * @see http://wiki.c2.com/?TestIfDateRangesOverlap
   */

  Segment.prototype.isVisible = function(startTime, endTime) {
    return this.startTime < endTime && startTime < this.endTime;
  };

  Segment.prototype._setStartTime = function(time) {
    this._startTime = time;
  };

  Segment.prototype._setEndTime = function(time) {
    this._endTime = time;
  };

  return Segment;
});
