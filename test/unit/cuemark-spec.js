'use strict';

/** @type CueMark */
var CueMark = require('../../src/main/cues/cuemark.js');

describe('CueMark', function() {
  var event = {
    POINT: 'points.enter',
    SEGMENT_IN: 'segments.enter',
    SEGMENT_OUT: 'segments.exit'
  };

  it('should not allow overwriting props', function(done) {
    var m = new CueMark(1.1, CueMark.POINT, 'p1');
    expect(function() { m.time = 0; }).to.throw();
    expect(function() { m.id = 'p2'; }).to.throw();
    expect(function() { m.type = -1; }).to.throw();
    done();
  });

  it('should emit correct events for POINT', function(done) {
    var m = new CueMark(1, CueMark.POINT, 'p1');
    var emits = 0;
    var emitter = {
      emit: function(ev, detail, time, id) {  // eslint-disable-line no-unused-vars
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
    var m = new CueMark(1, CueMark.SEGMENT_START, 's1');
    var emits = 0;
    var isForward = true;
    var emitter = {
      emit: function(ev, detail, time, id) {  // eslint-disable-line no-unused-vars
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
    var m = new CueMark(1, CueMark.SEGMENT_END, 's1');
    var emits = 0;
    var isForward = true;
    var emitter = {
      emit: function(ev, detail, time, id) {  // eslint-disable-line no-unused-vars
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
