'use strict';

/** @type CueMark */
var CueMark = require('../../src/main/cues/cuemark.js');

describe('CueMark', function() {
  var event = {
    POINT: 'cue.point',
    SEGMENT_IN: 'cue.segment.in',
    SEGMENT_OUT: 'cue.segment.out'
  };

  it('should create decorated array', function(done) {
    var m = CueMark.create(1.1, CueMark.POINT, 'p1');
    expect(typeof m.getTime).equals('function', 'm.getTime should be a function');
    expect(typeof m.emitEvent).equals('function', 'm.emitEvent should be a function');
    done();
  });

  it('getTime() should match', function(done) {
    var m = CueMark.create(1.1, CueMark.POINT, 'p1');
    expect(m.getTime()).equals(1.1, 'getTime() result did not match');
    done();
  });

  it('should emit correct events for POINT', function(done) {
    var m = CueMark.create(1, CueMark.POINT, 'p1');
    var emits = 0;
    var emitter = {
      emit: function(ev, id) {
        emits += 1;
        expect(ev).equals(event.POINT);
        expect(id).equals('p1');
        if (emits === 2) {
          done();
        }
      }
    };

    m.emitEvent(emitter, true);
    m.emitEvent(emitter, false);
  });

  it('should emit correct events for SEGMENT_START', function(done) {
    var m = CueMark.create(1, CueMark.SEGMENT_START, 's1');
    var emits = 0;
    var isForward = true;
    var emitter = {
      emit: function(ev, id) {
        emits += 1;
        expect(id).equals('s1');
        expect(ev).equals(isForward ? event.SEGMENT_IN : event.SEGMENT_OUT);
        if (emits === 2) {
          done();
        }
      }
    };

    m.emitEvent(emitter, isForward);
    isForward = !isForward;
    m.emitEvent(emitter, isForward);
  });

  it('should emit correct events for SEGMENT_END', function(done) {
    var m = CueMark.create(1, CueMark.SEGMENT_END, 's1');
    var emits = 0;
    var isForward = true;
    var emitter = {
      emit: function(ev, id) {
        emits += 1;
        expect(id).equals('s1');
        expect(ev).equals(isForward ? event.SEGMENT_OUT : event.SEGMENT_IN);
        if (emits === 2) {
          done();
        }
      }
    };

    m.emitEvent(emitter, isForward);
    isForward = !isForward;
    m.emitEvent(emitter, isForward);
  });
});
