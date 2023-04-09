/**
 * @file
 *
 * Defines the {@link Segment} class.
 *
 * @module segment
 */

import {
  isBoolean, isNullOrUndefined, isLinearGradientColor,
  isString, isValidTime, objectHasProperty
} from './utils';

const segmentOptions = [
  'id', 'startTime', 'endTime', 'labelText', 'color', 'borderColor', 'editable'
];

const invalidOptions = [
  'update', 'isVisible', 'peaks'
];

function setDefaultSegmentOptions(options, globalSegmentOptions) {
  if (isNullOrUndefined(options.color)) {
    if (globalSegmentOptions.overlay) {
      options.color = globalSegmentOptions.overlayColor;
    }
    else {
      options.color = globalSegmentOptions.waveformColor;
    }
  }

  if (isNullOrUndefined(options.borderColor)) {
    options.borderColor = globalSegmentOptions.overlayBorderColor;
  }

  if (isNullOrUndefined(options.labelText)) {
    options.labelText = '';
  }

  if (isNullOrUndefined(options.editable)) {
    options.editable = false;
  }
}

function validateSegmentOptions(options, updating) {
  const context = updating ? 'update()' : 'add()';

  if (objectHasProperty(options, 'startTime') && !isValidTime(options.startTime)) {
    // eslint-disable-next-line max-len
    throw new TypeError('peaks.segments.' + context + ': startTime should be a valid number');
  }

  if (objectHasProperty(options, 'endTime') && !isValidTime(options.endTime)) {
    // eslint-disable-next-line max-len
    throw new TypeError('peaks.segments.' + context + ': endTime should be a valid number');
  }

  if (!updating) {
    if (!objectHasProperty(options, 'startTime') || !objectHasProperty(options, 'endTime')) {
      throw new TypeError('peaks.segments.' + context + ': missing startTime or endTime');
    }
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

  if (objectHasProperty(options, 'labelText') && !isString(options.labelText)) {
    throw new TypeError('peaks.segments.' + context + ': labelText must be a string');
  }

  if (objectHasProperty(options, 'editable') && !isBoolean(options.editable)) {
    throw new TypeError('peaks.segments.' + context + ': editable must be true or false');
  }

  if (objectHasProperty(options, 'color') &&
    !isString(options.color) &&
    !isLinearGradientColor(options.color)) {
    // eslint-disable-next-line max-len
    throw new TypeError('peaks.segments.' + context + ': color must be a string or a valid linear gradient object');
  }

  if (objectHasProperty(options, 'borderColor') && !isString(options.borderColor)) {
    // eslint-disable-next-line max-len
    throw new TypeError('peaks.segments.' + context + ': borderColor must be a string');
  }

  invalidOptions.forEach(function(name) {
    if (objectHasProperty(options, name)) {
      throw new Error('peaks.segments.' + context + ': invalid option name: ' + name);
    }
  });

  segmentOptions.forEach(function(name) {
    if (objectHasProperty(options, '_' + name)) {
      throw new Error('peaks.segments.' + context + ': invalid option name: _' + name);
    }
  });
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
 * @param {String | LinearGradientColor} color Segment color.
 * @param {String} borderColor Segment border color.
 * @param {Boolean} editable If <code>true</code> the segment start and
 *   end times can be adjusted via the user interface.
 * @param {*} data Optional application specific data.
 */

function Segment(options) {
  this._peaks       = options.peaks;
  this._id          = options.id;
  this._startTime   = options.startTime;
  this._endTime     = options.endTime;
  this._labelText   = options.labelText;
  this._color       = options.color;
  this._borderColor = options.borderColor;
  this._editable    = options.editable;

  this._setUserData(options);
}

Segment.prototype._setUserData = function(options) {
  for (const key in options) {
    if (objectHasProperty(options, key)) {
      if (segmentOptions.indexOf(key) === -1) {
        this[key] = options[key];
      }
      else {
        this['_' + key] = options[key];
      }
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
  borderColor: {
    enumerable: true,
    get: function() {
      return this._borderColor;
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
  if (objectHasProperty(options, 'id')) {
    throw new Error('peaks.segments.update(): id cannot be updated');
  }

  validateSegmentOptions(options, true);

  this._setUserData(options);

  this._peaks.emit('segments.update', this, options);
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

export { Segment, setDefaultSegmentOptions, validateSegmentOptions };
