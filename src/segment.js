/**
 * @file
 *
 * Defines the {@link Segment} class.
 *
 * @module segment
 */

import {
  isBoolean,
  isLinearGradientColor,
  isNullOrUndefined,
  isString,
  isValidTime,
  objectHasProperty
} from './utils.js';

const segmentOptions = ['peaks', 'id', 'startTime', 'endTime', 'labelText', 'color', 'editable'];

function validateSegment(options, context) {
  if (!isValidTime(options.startTime)) {
    // eslint-disable-next-line max-len
    throw new TypeError('peaks.segments.' + context + ': startTime should be a valid number');
  }

  if (!isValidTime(options.endTime)) {
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

  if (isNullOrUndefined(options.labelText)) {
    // Set default label text
    options.labelText = '';
  }
  else if (!isString(options.labelText)) {
    throw new TypeError('peaks.segments.' + context + ': labelText must be a string');
  }

  if (!isBoolean(options.editable)) {
    throw new TypeError('peaks.segments.' + context + ': editable must be true or false');
  }

  if (options.color &&
    !isString(options.color) &&
    !isLinearGradientColor(options.color)) {
    // eslint-disable-next-line max-len
    throw new TypeError('peaks.segments.' + context + ': color must be a string or a valid linear gradient object');
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
 * @param {String | LinearGradientColor} color Segment waveform color.
 * @param {Boolean} editable If <code>true</code> the segment start and
 *   end times can be adjusted via the user interface.
 * @param {*} data Optional application specific data.
 */

export default class Segment {
  constructor(options) {
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

  _setUserData(options) {
    for (var key in options) {
      if (objectHasProperty(options, key) && segmentOptions.indexOf(key) === -1) {
        this[key] = options[key];
      }
    }
  }

  get id() {
    return this._id;
  }

  get startTime() {
    return this._startTime;
  }

  get endTime() {
    return this._endTime;
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
      startTime: this.startTime,
      endTime:   this.endTime,
      labelText: this.labelText,
      color:     this.color,
      editable:  this.editable
    };

    opts = Object.assign({}, defaultOptions, options);

    validateSegment(opts, 'update()');

    this._startTime = opts.startTime;
    this._endTime   = opts.endTime;
    this._labelText = opts.labelText;
    this._color     = opts.color;
    this._editable  = opts.editable;

    this._setUserData(options);

    this._peaks.emit('segments.update', this);
  }

  /**
   * Returns <code>true</code> if the segment overlaps a given time region.
   *
   * @param {Number} startTime The start of the time region, in seconds.
   * @param {Number} endTime The end of the time region, in seconds.
   * @returns {Boolean}
   *
   * @see http://wiki.c2.com/?TestIfDateRangesOverlap
   */

  isVisible(startTime, endTime) {
    return this.startTime < endTime && startTime < this.endTime;
  }

  _setStartTime(time) {
    this._startTime = time;
  }

  _setEndTime(time) {
    this._endTime = time;
  }
}
