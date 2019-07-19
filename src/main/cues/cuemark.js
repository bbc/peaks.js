/**
 * @file
 * @module peaks/cues/cuemark
 */
define(function() {
  'use strict';

  var eventNames = {
    forward: {},
    reverse: {}
  };

  /**
   * @class
   * @property {number} time
   * @property {string} id
   * @property {number} type
   * @constructor
   * @param {number} time
   * @param {number} type
   * @param {string} id
   */
  function CueMark(time, type, id) {
    this.time = time;
    this.type = type;
    this.id = id;
  }

  /**
   * @typedef {number} CueMark.POINT
   * @typedef {number} CueMark.SEGMENT_START
   * @typedef {number} CueMark.SEGMENT_END
   */
  CueMark.POINT = 0;
  CueMark.SEGMENT_START = 1;
  CueMark.SEGMENT_END = 2;

  eventNames.forward[CueMark.POINT] = 'points.enter';
  eventNames.forward[CueMark.SEGMENT_START] = 'segments.enter';
  eventNames.forward[CueMark.SEGMENT_END] = 'segments.exit';

  eventNames.reverse[CueMark.POINT] = eventNames.forward[CueMark.POINT];
  eventNames.reverse[CueMark.SEGMENT_START] = eventNames.forward[CueMark.SEGMENT_END];
  eventNames.reverse[CueMark.SEGMENT_END] = eventNames.forward[CueMark.SEGMENT_START];

  /**
   * @param {EventEmitter|{emit:function(string, *)}} emitter
   * @param {boolean} isForwardPlayback
   * @param {*?} detail
   */
  CueMark.prototype.emitEvent = function(emitter, isForwardPlayback, detail) {
    var eventName = isForwardPlayback ?
      eventNames.forward[this.type] : eventNames.reverse[this.type];

    emitter.emit(eventName, detail);
  };

  /**
   * @static
   * @param e1
   * @param e2
   * @return {number}
   */
  CueMark.sorter = function(e1, e2) {
    return e1.time - e2.time;
  };

  return CueMark;
});
