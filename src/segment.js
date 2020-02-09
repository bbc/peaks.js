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

    if (options.endTime <= options.startTime) {
      // eslint-disable-next-line max-len
      throw new RangeError('peaks.segments.' + context + ': endTime should be greater than startTime');
    }

    if (Utils.isNullOrUndefined(options.labelText)) {
      // Set default label text
      options.labelText = '';
    }
    else if (!Utils.isString(options.labelText)) {
      throw new TypeError('peaks.points.' + context + ': labelText must be a string');
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
   */

  function Segment(peaks, id, startTime, endTime, labelText, color, editable) {
    var opts = {
      startTime: startTime,
      endTime:   endTime,
      labelText: labelText,
      color:     color,
      editable:  editable
    };

    validateSegment(opts, 'add()');

    this._peaks     = peaks;
    this._id        = id;
    this._startTime = opts.startTime;
    this._endTime   = opts.endTime;
    this._labelText = opts.labelText;
    this._color     = opts.color;
    this._editable  = opts.editable;
  }

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
      },

      set: function(time) {
        this._startTime = time;
      }
    },
    endTime: {
      enumerable: true,
      get: function() {
        return this._endTime;
      },

      set: function(time) {
        this._endTime = time;
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

  return Segment;
});
