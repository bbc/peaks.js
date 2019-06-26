/**
 * @file
 * @module peaks/cues/cuemark
 */
define(function() {
  'use strict';

  /**
   * @typedef CueMarkDef
   * @property {function(): number} getTime
   * @property {function(EventEmitter|{emit:function(string,any)}, boolean)} emitEvent
   */

  /**
   * @static
   * @type {{
   *   SEGMENT_END: number,
   *   SEGMENT_START: number,
   *   POINT: number,
   *   create: function(number, number, string): CueMarkDef,
   *   sorter: function(CueMarkDef, CueMarkDef): number
   * }}
   */
  var CueMark = {
    POINT: 0,
    SEGMENT_START: 1,
    SEGMENT_END: 2
  };

  var eventNames = {
    forward: {},
    reverse: {}
  };

  eventNames.forward[CueMark.POINT] = 'cue.point';
  eventNames.forward[CueMark.SEGMENT_START] = 'cue.segment.in';
  eventNames.forward[CueMark.SEGMENT_END] = 'cue.segment.out';

  eventNames.reverse[CueMark.POINT] = eventNames.forward[CueMark.POINT];
  eventNames.reverse[CueMark.SEGMENT_START] = eventNames.forward[CueMark.SEGMENT_END];
  eventNames.reverse[CueMark.SEGMENT_END] = eventNames.forward[CueMark.SEGMENT_START];

  function def_getTime() {
    return this[0];
  }

  function def_emitEvent(emitter, isForwardPlayback) {
    var time = this[0];
    var typ = this[1];
    var id = this[2];
    var eventName = isForwardPlayback ? eventNames.forward[typ] : eventNames.reverse[typ];

    emitter.emit(eventName, id, time);
  }

  /**
   * make a new mark
   * @param {number} time
   * @param {number} type
   * @param {string} id
   * @return {CueMarkDef}
   */
  CueMark.create = function(time, type, id) {
    return Object.assign(Array(time, type, id), {
      getTime: def_getTime,
      emitEvent: def_emitEvent
    });
  };

  CueMark.sorter = function(e1, e2) {
    return e1[0] - e2[0];
  };

  return CueMark;
});
