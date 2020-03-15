/**
 * @file
 *
 * Defines the {@link Cue} class.
 *
 * @module cue
 */

define(function() {
  'use strict';

  /**
   * A cue represents an event to be triggered at some point on the media
   * timeline.
   *
   * @class
   * @alias Cue
   *
   * @param {Number} time Cue time, in seconds.
   * @param {Number} type Cue mark type, either <code>Cue.POINT</code>,
   *   <code>Cue.SEGMENT_START</code>, or <code>Cue.SEGMENT_END</code>.
   * @param {String} id The id of the {@link Point} or {@link Segment}.
   */

  function Cue(time, type, id) {
    this.time = time;
    this.type = type;
    this.id = id;
  }

  /**
    * @constant
    * @type {Number}
    */

  Cue.POINT = 0;
  Cue.SEGMENT_START = 1;
  Cue.SEGMENT_END = 2;

  /**
   * Callback function for use with Array.prototype.sort().
   *
   * @static
   * @param {Cue} a
   * @param {Cue} b
   * @return {Number}
   */

  Cue.sorter = function(a, b) {
    return a.time - b.time;
  };

  return Cue;
});
