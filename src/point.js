/**
 * @file
 *
 * Defines the {@link Point} class.
 *
 * @module point
 */

import { isBoolean, isNullOrUndefined, isString, isValidTime, objectHasProperty } from './utils.js';

const pointOptions = ['peaks', 'id', 'time', 'labelText', 'color', 'editable'];

function validatePoint(options, context) {
  if (!isValidTime(options.time)) {
    // eslint-disable-next-line max-len
    throw new TypeError('peaks.points.' + context + ': time should be a numeric value');
  }

  if (options.time < 0) {
    // eslint-disable-next-line max-len
    throw new RangeError('peaks.points.' + context + ': time should not be negative');
  }

  if (isNullOrUndefined(options.labelText)) {
    // Set default label text
    options.labelText = '';
  }
  else if (!isString(options.labelText)) {
    throw new TypeError('peaks.points.' + context + ': labelText must be a string');
  }

  if (!isBoolean(options.editable)) {
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

export default class Point {
  constructor(options) {
    validatePoint(options, 'add()');

    this._peaks     = options.peaks;
    this._id        = options.id;
    this._time      = options.time;
    this._labelText = options.labelText;
    this._color     = options.color;
    this._editable  = options.editable;

    this._setUserData(options);
  }

  _setUserData(options) {
    for (var key in options) {
      if (objectHasProperty(options, key) && pointOptions.indexOf(key) === -1) {
        this[key] = options[key];
      }
    }
  }

  get id() {
    return this._id;
  }

  get time() {
    return this._time;
  }

  get labelText() {
    return this._labelText;
  }

  get color() {
    return this._color;
  }

  get editable() {
    return this._editable;
  }

  update(options) {
    let opts = {};

    const defaultOptions = {
      time:      this.time,
      labelText: this.labelText,
      color:     this.color,
      editable:  this.editable
    };

    opts = Object.assign({}, defaultOptions, options);

    validatePoint(opts, 'update()');

    this._time      = opts.time;
    this._labelText = opts.labelText;
    this._color     = opts.color;
    this._editable  = opts.editable;

    this._setUserData(options);

    this._peaks.emit('points.update', this);
  }

  /**
   * Returns <code>true</code> if the point lies with in a given time range.
   *
   * @param {Number} startTime The start of the time region, in seconds.
   * @param {Number} endTime The end of the time region, in seconds.
   * @returns {Boolean}
   */

  isVisible(startTime, endTime) {
    return this.time >= startTime && this.time < endTime;
  }

  _setTime(time) {
    this._time = time;
  }
}
