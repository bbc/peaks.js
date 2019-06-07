/**
 * @file
 *
 * Defines the {@link Segment} class.
 *
 * @module peaks/markers/segment
 */

define([
  'peaks/waveform/waveform.utils'
],function(Utils) {
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

  /**
   * Segment instance API
   */
  Object.defineProperties(Segment.prototype, {
    parent: {
      get: function() {
        return this._parent;
      }
    },
    id: {
      get: function() {
        return this._id;
      }
    },
    startTime: {
      get: function() {
        return this._startTime;
      },
      set: function(val) {
        validateSegment(val, this.endTime, 'startTime');
        this._startTime = val;
        this._parent._peaks.emit('segments.update', this);
      }
    },
    endTime: {
      get: function() {
        return this._endTime;
      },
      set: function(val) {
        validateSegment(this.startTime, val, 'endTime');
        this._endTime = val;
        this._parent._peaks.emit('segments.update', this);
      }
    },
    labelText: {
      get: function() {
        return this._labelText;
      },
      set: function(val) {
        this._labelText = val;
        this._parent._peaks.emit('segments.update', this);
      }
    },
    color: {
      get: function() {
        return this._color;
      },
      set: function(val) {
        this._color = val;
        this._parent._peaks.emit('segments.update', this);
      }
    },
    editable: {
      get: function() {
        return this._editable;
      },
      set: function(val) {
         this._editable = val;
         this._parent._peaks.emit('segments.update', this);
        }
    }
  });

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
