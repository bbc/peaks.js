/**
 * @file
 *
 * Defines the {@link Cue} class.
 *
 * @module cue
 */

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

export default class Cue {
  constructor(time, type, id) {
    this.time = time;
    this.type = type;
    this.id = id;
  }

  /**
   * Callback function for use with Array.prototype.sort().
   *
   * @static
   * @param {Cue} a
   * @param {Cue} b
   * @return {Number}
   */
  static sorter(a, b) {
    return a.time - b.time;
  }
}

/**
 * @constant
 * @type {Number}
 */
export const CUE_POINT = 0;
export const CUE_SEGMENT_START = 1;
export const CUE_SEGMENT_END = 2;
