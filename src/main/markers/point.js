/**
 * @file
 *
 * Defines the {@link Point} class.
 *
 * @module peaks/markers/point
 */

define([
  'peaks/waveform/waveform.utils'
], function(Utils) {
  'use strict';

  function validatePoint(time, labelText) {
    if (!Utils.isValidTime(time)) {
      // eslint-disable-next-line max-len
      throw new TypeError('peaks.points.add(): time should be a numeric value');
    }

    if (time < 0) {
      // eslint-disable-next-line max-len
      throw new TypeError('peaks.points.add(): time should not be negative');
    }

    if (Utils.isNullOrUndefined(labelText)) {
      // Set default label text
      labelText = '';
    }
    else if (!Utils.isString(labelText)) {
      throw new TypeError('peaks.points.add(): labelText must be a string');
    }
  }

  /**
   * A point is a single instant of time, with associated label and color.
   *
   * @class
   * @alias Point
   *
   * @param {Object} parent A reference to the parent WaveformPoints instance
   * @param {String} id A unique identifier for the point.
   * @param {Number} time Point time, in seconds.
   * @param {String} labelText Point label text.
   * @param {String} color Point marker color.
   * @param {Boolean} editable If <code>true</code> the segment start and
   *   end times can be adjusted via the user interface.
   */

  function Point(parent, id, time, labelText, color, editable) {
    labelText = labelText || '';
    validatePoint(time, labelText);
    this._parent    = parent;
    this._id        = id;
    this._time      = time;
    this._labelText = labelText;
    this._color     = color;
    this._editable  = editable;
  }

  Object.defineProperties(Point.prototype, {
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
    time: {
      enumerable: true,
      get: function() {
        return this._time;
      },

      set: function(time) {
        this._time = time;
      }
    },
    labelText: {
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

  Point.prototype.update = function(options) {
    var time      = Object.prototype.hasOwnProperty.call(options, 'time')      ? options.time            : this.time;
    var labelText = Object.prototype.hasOwnProperty.call(options, 'labelText') ? options.labelText || '' : this.labelText;
    var color     = Object.prototype.hasOwnProperty.call(options, 'color')     ? options.color           : this.color;
    var editable  = Object.prototype.hasOwnProperty.call(options, 'editable')  ? options.editable        : this.editable;

    validatePoint(time, labelText);

    this._time      = time;
    this._labelText = labelText;
    this._color     = color;
    this._editable  = editable;
    this._parent._peaks.emit('points.update', this);
  };

  /**
   * Returns <code>true</code> if the point lies with in a given time range.
   *
   * @param {Number} startTime The start of the time region, in seconds.
   * @param {Number} endTime The end of the time region, in seconds.
   * @returns {Boolean}
   */

  Point.prototype.isVisible = function(startTime, endTime) {
    return this.time >= startTime && this.time < endTime;
  };

  return Point;
});
