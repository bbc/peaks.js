/**
 * @file
 *
 * Defines the {@link Segment} class.
 *
 * @module peaks/markers/segment
 */

define([
  'peaks/waveform/waveform.utils'
], function(Utils) {
  'use strict';

  function validateSegment(startTime, endTime, validationContext) {
    if (!Utils.isValidTime(startTime)) {
      // eslint-disable-next-line max-len
      throw new TypeError('peaks.segments.' + validationContext + ': startTime should be a valid number');
    }

    if (!Utils.isValidTime(endTime)) {
      // eslint-disable-next-line max-len
      throw new TypeError('peaks.segments.' + validationContext + ': endTime should be a valid number');
    }

    if (startTime < 0) {
      // eslint-disable-next-line max-len
      throw new RangeError('peaks.segments.' + validationContext + ': startTime should not be negative');
    }

    if (endTime < 0) {
      // eslint-disable-next-line max-len
      throw new RangeError('peaks.segments.' + validationContext + ': endTime should not be negative');
    }

    if (endTime <= startTime) {
      // eslint-disable-next-line max-len
      throw new RangeError('peaks.segments.' + validationContext + ': endTime should be greater than startTime');
    }
  }

  /**
   * A segment is a region of time, with associated label and color.
   *
   * @class
   * @alias Segment
   *
   * @param {Object} parent A reference to the parent WaveformSegments instance
   * @param {String} id A unique identifier for the segment.
   * @param {Number} startTime Segment start time, in seconds.
   * @param {Number} endTime Segment end time, in seconds.
   * @param {String} labelText Segment label text.
   * @param {String} color Segment waveform color.
   * @param {Boolean} editable If <code>true</code> the segment start and
   *   end times can be adjusted via the user interface.
   */

  function Segment(parent, id, startTime, endTime, labelText, color, editable) {
    validateSegment(startTime, endTime, 'add()');
    this._parent    = parent;
    this._id        = id;
    this._startTime = startTime;
    this._endTime   = endTime;
    this._labelText = labelText;
    this._color     = color;
    this._editable  = editable;
  }

  Object.defineProperties(Segment.prototype, {
    parent: {
      get: function() {
        return this._parent;
      }
    },
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
    var startTime = Object.prototype.hasOwnProperty.call(options, 'startTime') ? options.startTime : this.startTime;
    var endTime   = Object.prototype.hasOwnProperty.call(options, 'endTime')   ? options.endTime   : this.endTime;
    var labelText = Object.prototype.hasOwnProperty.call(options, 'labelText') ? options.labelText : this.labelText;
    var color     = Object.prototype.hasOwnProperty.call(options, 'color')     ? options.color     : this.color;
    var editable  = Object.prototype.hasOwnProperty.call(options, 'editable')  ? options.editable  : this.editable;

    validateSegment(startTime, endTime, 'updateTime()');

    this._startTime = startTime;
    this._endTime   = endTime;
    this._labelText = labelText;
    this._color     = color;
    this._editable  = editable;
    this._parent._peaks.emit('segments.update', this);
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
