/**
 * @file
 * @module peaks/cues/cuemark
 */

define(function() {
  'use strict';

  /**
   * A cue represents an event to be triggered at some point on the media
   * timeline.
   *
   * @class
   * @alias CueMark
   *
   * @param {Number} time Cue time, in seconds.
   * @param {Number} type Cue mark type, either <code>CueMark.POINT</code>,
   *   <code>CueMark.SEGMENT_START</code>, or <code>CueMark.SEGMENT_END</code>.
   * @param {String} id The id of the {@link Point} or {@link Segment}.
   */

  function CueMark(time, type, id) {
    this.time = time;
    this.type = type;
    this.id = id;
  }

   /**
    * @constant
    * @type {Number}
    */

  CueMark.POINT = 0;
  CueMark.SEGMENT_START = 1;
  CueMark.SEGMENT_END = 2;

  /**
   * Callback function for use with Array.prototype.sort().
   *
   * @static
   * @param {CueMark} a
   * @param {CueMark} b
   * @return {Number}
   */

  CueMark.sorter = function(a, b) {
    return a.time - b.time;
  };

  return CueMark;
});
