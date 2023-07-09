/**
 * @file
 *
 * Defines the {@link WaveformPoints} class.
 *
 * @module waveform-points
 */

import { Point, setDefaultPointOptions, validatePointOptions } from './point';
import { extend, isNullOrUndefined, objectHasProperty } from './utils';

/**
 * Point parameters.
 *
 * @typedef {Object} PointOptions
 * @global
 * @property {Number} time Point time, in seconds.
 * @property {Boolean=} editable If <code>true</code> the point time can be
 *   adjusted via the user interface.
 *   Default: <code>false</code>.
 * @property {String=} color Point marker color.
 *   Default: a random color.
 * @property {String=} labelText Point label text.
 *   Default: an empty string.
 * @property {String=} id A unique point identifier.
 *   Default: an automatically generated identifier.
 * @property {*} data Optional application-specific data.
 */

/**
 * Handles all functionality related to the adding, removing and manipulation
 * of points. A point is a single instant of time.
 *
 * @class
 * @alias WaveformPoints
 *
 * @param {Peaks} peaks The parent Peaks object.
 */

function WaveformPoints(peaks) {
  this._peaks = peaks;
  this._points = [];
  this._pointsById = {};
  this._pointsByPid = {};
  this._pointIdCounter = 0;
  this._pointPid = 0;
}

/**
 * Returns a new unique point id value.
 *
 * @returns {String}
 */

WaveformPoints.prototype._getNextPointId = function() {
  return 'peaks.point.' + this._pointIdCounter++;
};

/**
 * Returns a new unique point id value, for internal use within
 * Peaks.js only.
 *
 * @returns {Number}
 */

WaveformPoints.prototype._getNextPid = function() {
  return this._pointPid++;
};

/**
 * Adds a new point object.
 *
 * @private
 * @param {Point} point
 */

WaveformPoints.prototype._addPoint = function(point) {
  this._points.push(point);

  this._pointsById[point.id] = point;
  this._pointsByPid[point.pid] = point;
};

/**
 * Creates a new point object.
 *
 * @private
 * @param {PointOptions} options
 * @returns {Point}
 */

WaveformPoints.prototype._createPoint = function(options) {
  const pointOptions = {};

  extend(pointOptions, options);

  if (isNullOrUndefined(pointOptions.id)) {
    pointOptions.id = this._getNextPointId();
  }

  const pid = this._getNextPid();

  setDefaultPointOptions(pointOptions, this._peaks.options);

  validatePointOptions(pointOptions, false);

  return new Point(this._peaks, pid, pointOptions);
};

/**
 * Returns all points.
 *
 * @returns {Array<Point>}
 */

WaveformPoints.prototype.getPoints = function() {
  return this._points;
};

/**
 * Returns the point with the given id, or <code>undefined</code> if not found.
 *
 * @param {String} id
 * @returns {Point}
 */

WaveformPoints.prototype.getPoint = function(id) {
  return this._pointsById[id];
};

/**
 * Returns all points within a given time region.
 *
 * @param {Number} startTime The start of the time region, in seconds.
 * @param {Number} endTime The end of the time region, in seconds.
 * @returns {Array<Point>}
 */

WaveformPoints.prototype.find = function(startTime, endTime) {
  return this._points.filter(function(point) {
    return point.isVisible(startTime, endTime);
  });
};

/**
 * Adds one or more points to the timeline.
 *
 * @param {PointOptions|Array<PointOptions>} pointOrPoints
 *
 * @returns Point|Array<Point>
 */

WaveformPoints.prototype.add = function(/* pointOrPoints */) {
  const self = this;

  const arrayArgs = Array.isArray(arguments[0]);
  let points = arrayArgs ?
               arguments[0] :
               Array.prototype.slice.call(arguments);

  points = points.map(function(pointOptions) {
    const point = self._createPoint(pointOptions);

    if (objectHasProperty(self._pointsById, point.id)) {
      throw new Error('peaks.points.add(): duplicate id');
    }

    return point;
  });

  points.forEach(function(point) {
    self._addPoint(point);
  });

  this._peaks.emit('points.add', {
    points: points
  });

  return arrayArgs ? points : points[0];
};

WaveformPoints.prototype.updatePointId = function(point, newPointId) {
  if (this._pointsById[point.id]) {
    if (this._pointsById[newPointId]) {
      throw new Error('point.update(): duplicate id');
    }
    else {
      delete this._pointsById[point.id];
      this._pointsById[newPointId] = point;
    }
  }
};

/**
 * Returns the indexes of points that match the given predicate.
 *
 * @private
 * @param {Function} predicate Predicate function to find matching points.
 * @returns {Array<Number>} An array of indexes into the points array of
 *   the matching elements.
 */

WaveformPoints.prototype._findPoint = function(predicate) {
  const indexes = [];

  for (let i = 0, length = this._points.length; i < length; i++) {
    if (predicate(this._points[i])) {
      indexes.push(i);
    }
  }

  return indexes;
};

/**
 * Removes the points at the given array indexes.
 *
 * @private
 * @param {Array<Number>} indexes The array indexes to remove.
 * @returns {Array<Point>} The removed {@link Point} objects.
 */

WaveformPoints.prototype._removeIndexes = function(indexes) {
  const removed = [];

  for (let i = 0; i < indexes.length; i++) {
    const index = indexes[i] - removed.length;

    const itemRemoved = this._points.splice(index, 1)[0];

    delete this._pointsById[itemRemoved.id];
    delete this._pointsByPid[itemRemoved.pid];

    removed.push(itemRemoved);
  }

  return removed;
};

/**
 * Removes all points that match a given predicate function.
 *
 * After removing the points, this function emits a
 * <code>points.remove</code> event with the removed {@link Point}
 * objects.
 *
 * @private
 * @param {Function} predicate A predicate function that identifies which
 *   points to remove.
 * @returns {Array<Point>} The removed {@link Points} objects.
 */

WaveformPoints.prototype._removePoints = function(predicate) {
  const indexes = this._findPoint(predicate);

  const removed = this._removeIndexes(indexes);

  this._peaks.emit('points.remove', {
    points: removed
  });

  return removed;
};

/**
 * Removes the given point.
 *
 * @param {Point} point The point to remove.
 * @returns {Array<Point>} The removed points.
 */

WaveformPoints.prototype.remove = function(point) {
  return this._removePoints(function(p) {
    return p === point;
  });
};

/**
 * Removes any points with the given id.
 *
 * @param {String} id
 * @returns {Array<Point>} The removed {@link Point} objects.
 */

WaveformPoints.prototype.removeById = function(pointId) {
  return this._removePoints(function(point) {
    return point.id === pointId;
  });
};

/**
 * Removes any points at the given time.
 *
 * @param {Number} time
 * @returns {Array<Point>} The removed {@link Point} objects.
 */

WaveformPoints.prototype.removeByTime = function(time) {
  return this._removePoints(function(point) {
    return point.time === time;
  });
};

/**
 * Removes all points.
 *
 * After removing the points, this function emits a
 * <code>points.remove_all</code> event.
 */

WaveformPoints.prototype.removeAll = function() {
  this._points = [];
  this._pointsById = {};
  this._pointsByPid = {};
  this._peaks.emit('points.remove_all');
};

export default WaveformPoints;
