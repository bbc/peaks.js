/**
 * @file
 *
 * Defines the {@link WaveformPoints} class.
 *
 * @module waveform-points
 */

import Point from './point.js';
import { isNullOrUndefined, objectHasProperty } from './utils.js';

/**
 * Point parameters.
 *
 * @typedef {Object} PointOptions
 * @global
 * @property {Number} point Point time, in seconds.
 * @property {Boolean=} editable If <code>true</code> the point time can be
 *   adjusted via the user interface.
 *   Default: <code>false</code>.
 * @property {String=} color Point marker color.
 *   Default: a random color.
 * @property {String=} labelText Point label text.
 *   Default: an empty string.
 * @property {String=} id A unique point identifier.
 *   Default: an automatically generated identifier.
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

export default class WaveformPoints {
  constructor(peaks) {
    this._peaks = peaks;
    this._points = [];
    this._pointsById = {};
    this._pointIdCounter = 0;
  }

  /**
   * Returns a new unique point id value.
   *
   * @returns {String}
   */

  _getNextPointId() {
    return 'peaks.point.' + this._pointIdCounter++;
  }

  /**
   * Adds a new point object.
   *
   * @private
   * @param {Point} point
   */

  _addPoint(point) {
    this._points.push(point);

    this._pointsById[point.id] = point;
  }

  /**
   * Creates a new point object.
   *
   * @private
   * @param {PointOptions} options
   * @returns {Point}
   */

  _createPoint(options) {
    const defaultPointOptions = {
      peaks: this._peaks
    };

    const pointOptions = Object.assign({}, defaultPointOptions, options);

    if (isNullOrUndefined(pointOptions.id)) {
      pointOptions.id = this._getNextPointId();
    }

    if (isNullOrUndefined(pointOptions.labelText)) {
      pointOptions.labelText = '';
    }

    if (isNullOrUndefined(pointOptions.editable)) {
      pointOptions.editable = false;
    }

    return new Point(pointOptions);
  }

  /**
   * Returns all points.
   *
   * @returns {Array<Point>}
   */

  getPoints() {
    return this._points;
  }

  /**
   * Returns the point with the given id, or <code>null</code> if not found.
   *
   * @param {String} id
   * @returns {Point|null}
   */

  getPoint(id) {
    return this._pointsById[id] || null;
  }

  /**
   * Returns all points within a given time region.
   *
   * @param {Number} startTime The start of the time region, in seconds.
   * @param {Number} endTime The end of the time region, in seconds.
   * @returns {Array<Point>}
   */

  find(startTime, endTime) {
    return this._points.filter(function(point) {
      return point.isVisible(startTime, endTime);
    });
  }

  /**
   * Adds one or more points to the timeline.
   *
   * @param {PointOptions|Array<PointOptions>} pointOrPoints
   */

  add(/* pointOrPoints */) {
    var self = this;

    var points = Array.isArray(arguments[0]) ?
                 arguments[0] :
                 Array.prototype.slice.call(arguments);

    points = points.map(function(pointOptions) {
      var point = self._createPoint(pointOptions);

      if (objectHasProperty(self._pointsById, point.id)) {
        throw new Error('peaks.points.add(): duplicate id');
      }

      return point;
    });

    points.forEach(function(point) {
      self._addPoint(point);
    });

    this._peaks.emit('points.add', points);
  }

  /**
   * Returns the indexes of points that match the given predicate.
   *
   * @private
   * @param {Function} predicate Predicate function to find matching points.
   * @returns {Array<Number>} An array of indexes into the points array of
   *   the matching elements.
   */

  _findPoint(predicate) {
    var indexes = [];

    for (var i = 0, length = this._points.length; i < length; i++) {
      if (predicate(this._points[i])) {
        indexes.push(i);
      }
    }

    return indexes;
  }

  /**
   * Removes the points at the given array indexes.
   *
   * @private
   * @param {Array<Number>} indexes The array indexes to remove.
   * @returns {Array<Point>} The removed {@link Point} objects.
   */

  _removeIndexes(indexes) {
    var removed = [];

    for (var i = 0; i < indexes.length; i++) {
      var index = indexes[i] - removed.length;

      var itemRemoved = this._points.splice(index, 1)[0];

      delete this._pointsById[itemRemoved.id];

      removed.push(itemRemoved);
    }

    return removed;
  }

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

  _removePoints(predicate) {
    var indexes = this._findPoint(predicate);

    var removed = this._removeIndexes(indexes);

    this._peaks.emit('points.remove', removed);

    return removed;
  }

  /**
   * Removes the given point.
   *
   * @param {Point} point The point to remove.
   * @returns {Array<Point>} The removed points.
   */

  remove(point) {
    return this._removePoints(function(p) {
      return p === point;
    });
  }

  /**
   * Removes any points with the given id.
   *
   * @param {String} id
   * @returns {Array<Point>} The removed {@link Point} objects.
   */

  removeById(pointId) {
    return this._removePoints(function(point) {
      return point.id === pointId;
    });
  }

  /**
   * Removes any points at the given time.
   *
   * @param {Number} time
   * @returns {Array<Point>} The removed {@link Point} objects.
   */

  removeByTime(time) {
    return this._removePoints(function(point) {
      return point.time === time;
    });
  }

  /**
   * Removes all points.
   *
   * After removing the points, this function emits a
   * <code>points.remove_all</code> event.
   */

  removeAll() {
    this._points = [];
    this._pointsById = {};
    this._peaks.emit('points.remove_all');
  }
}
