/**
 * @file
 *
 * Defines the {@link Point} class.
 *
 * @module peaks/markers/point
 */

define(function() {
  'use strict';

  /**
   * A point is a single instant of time, with associated label and color.
   *
   * @class
   * @alias Point
   *
   * @param {String} id A unique identifier for the point.
   * @param {Number} time Point time, in seconds.
   * @param {String} labelText Point label text.
   * @param {String} color Point marker color.
   * @param {Boolean} editable If <code>true</code> the segment start and
   *   end times can be adjusted via the user interface.
   */

  function Point(id, time, labelText, color, editable) {
    this.id        = id;
    this.time      = time;
    this.labelText = labelText;
    this.color     = color;
    this.editable  = editable;
  }

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
