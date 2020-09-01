/**
 * @file
 *
 * Defines the {@link Point} class.
 *
 * @module point
 */

define([
  './utils'
], function(Utils) {
  'use strict';

  var pointOptions = ['peaks', 'id', 'time', 'labelText', 'color', 'editable'];

  function validatePoint(options, context) {
    if (!Utils.isValidTime(options.time)) {
      // eslint-disable-next-line max-len
      throw new TypeError('peaks.points.' + context + ': time should be a numeric value');
    }

    if (options.time < 0) {
      // eslint-disable-next-line max-len
      throw new RangeError('peaks.points.' + context + ': time should not be negative');
    }

    if (Utils.isNullOrUndefined(options.labelText)) {
      // Set default label text
      options.labelText = '';
    }
    else if (!Utils.isString(options.labelText)) {
      throw new TypeError('peaks.points.' + context + ': labelText must be a string');
    }

    if (!Utils.isBoolean(options.editable)) {
      throw new TypeError('peaks.points.' + context + ': editable must be true or false');
    }
  }

  /**
   * A point is a single instant of time, with associated label and color.
   *
   * @class
   * @alias Point
   *
   * @param {Peaks} peaks A reference to the Peaks instance.
   * @param {String} id A unique identifier for the point.
   * @param {Number} time Point time, in seconds.
   * @param {String} labelText Point label text.
   * @param {String} color Point marker color.
   * @param {Boolean} editable If <code>true</code> the segment start and
   *   end times can be adjusted via the user interface.
   * @param {*} data Optional application specific data.
   */

  function Point(options) {
    validatePoint(options, 'add()');

    this._peaks     = options.peaks;
    this._id        = options.id;
    this._time      = options.time;
    this._labelText = options.labelText;
    this._color     = options.color;
    this._editable  = options.editable;

    this._setUserData(options);
  }

  Point.prototype._setUserData = function(options) {
    for (var key in options) {
      if (Utils.objectHasProperty(options, key) && pointOptions.indexOf(key) === -1) {
        this[key] = options[key];
      }
    }
  };

  Object.defineProperties(Point.prototype, {
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
    var opts = {
      time:      this.time,
      labelText: this.labelText,
      color:     this.color,
      editable:  this.editable
    };

    Utils.extend(opts, options);

    validatePoint(opts, 'update()');

    this._time      = opts.time;
    this._labelText = opts.labelText;
    this._color     = opts.color;
    this._editable  = opts.editable;

    this._setUserData(options);

    this._peaks.emit('points.update', this);
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

  Point.prototype._setTime = function(time) {
    this._time = time;
  };

  return Point;
});
