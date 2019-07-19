'use strict';

/** @type CueMark */
var CueMark = require('../../src/main/cues/cuemark');

describe('CueMark', function() {
  var event = {
    POINT: 'points.enter',
    SEGMENT_IN: 'segments.enter',
    SEGMENT_OUT: 'segments.exit'
  };

  it('should emit correct events for POINT', function(done) {
    var m = new CueMark(1, CueMark.POINT, 'p1');
    var emits = 0;
    var emitter = {
      emit: function(ev, detail) {  // eslint-disable-line no-unused-vars
        emits += 1;
        expect(ev).equals(event.POINT);
        expect(detail.id).equals('p1');
        if (emits === 2) {
          done();
        }
      }
    };

    m.emitEvent(emitter, true, m);
    m.emitEvent(emitter, false, m);
  });

  it('should emit correct events for SEGMENT_START', function(done) {
    var m = new CueMark(1, CueMark.SEGMENT_START, 's1');
    var emits = 0;
    var isForward = true;
    var emitter = {
      emit: function(ev, detail) {  // eslint-disable-line no-unused-vars
        emits += 1;
        expect(detail.id).equals('s1');
        expect(ev).equals(isForward ? event.SEGMENT_IN : event.SEGMENT_OUT);
        if (emits === 2) {
          done();
        }
      }
    };

    m.emitEvent(emitter, isForward, m);
    isForward = !isForward;
    m.emitEvent(emitter, isForward, m);
  });

  it('should emit correct events for SEGMENT_END', function(done) {
    var m = new CueMark(1, CueMark.SEGMENT_END, 's1');
    var emits = 0;
    var isForward = true;
    var emitter = {
      emit: function(ev, detail) {  // eslint-disable-line no-unused-vars
        emits += 1;
        expect(detail.id).equals('s1');
        expect(ev).equals(isForward ? event.SEGMENT_OUT : event.SEGMENT_IN);
        if (emits === 2) {
          done();
        }
      }
    };

    m.emitEvent(emitter, isForward, m);
    isForward = !isForward;
    m.emitEvent(emitter, isForward, m);
  });
});
