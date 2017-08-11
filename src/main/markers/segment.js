/**
 * @file
 *
 * Defines the {@link Segment} class.
 *
 * @module peaks/markers/segment
 */

define(function() {
  'use strict';

  /**
   * A segment is a region of time, with associated label and color.
   *
   * @class
   * @alias Segment
   *
   * @param {String} id A unique identifier for the segment.
   * @param {Number} startTime Segment start time, in seconds.
   * @param {Number} endTime Segment end time, in seconds.
   * @param {String} labelText Segment label text.
   * @param {String} color Segment waveform color.
   * @param {Boolean} editable If <code>true</code> the segment start and
   *   end times can be adjusted via the user interface.
   */

  function Segment(id, startTime, endTime, labelText, color, editable) {
    this.id        = id;
    this.startTime = startTime;
    this.endTime   = endTime;
    this.labelText = labelText;
    this.color     = color;
    this.editable  = editable;
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

  Segment.prototype.isVisible = function(startTime, endTime) {
    return this.startTime < endTime && startTime < this.endTime;
  };

  return Segment;
});
