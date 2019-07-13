'use strict';

require('./setup.js');
var Peaks = require('../../src/main');
/** @type CueMark */
var CueMark = require('../../src/main/cues/cuemark');

describe('CueEmitter', function() {
  /** @type Peaks */
  var p;
  /** @type CueEmitter */
  var cue;

  var event = {
    POINT: 'points.enter',
    SEGMENT_IN: 'segments.enter',
    SEGMENT_OUT: 'segments.exit'
  };

  beforeEach(function(done) {
    p = Peaks.init({
      container: document.getElementById('container'),
      mediaElement: document.getElementById('media'),
      dataUri: 'base/test_data/sample.json',
      emitCueEvents: false
    });

    cue = new Peaks.CueEmitter(p);
    p.on('peaks.ready', done);
  });

  afterEach(function() {
    if (p) {
      p.destroy();
    }
    p = undefined;
    cue = undefined;
  });

  it('should initialise correctly', function(done) {
    expect(p.cueEmitter).to.be.undefined;
    expect(cue.peaks).equals(p, 'instance did not match');
    expect(cue.marks.length).equals(0, 'mark array not empty');
    done();
  });

  it('should initialise with already existing points', function(done) {
    cue.destroy();
    p.points.add({ time: 1.0 });
    p.segments.add({ startTime: 1.1, endTime: 1.2 });
    cue = new Peaks.CueEmitter(p);
    expect(cue.marks.length).equals(3, 'marks length did not match');
    done();
  });

  it('should destroy tracker when peaks is destroyed', function(done) {
    p.points.add({ time: 1.0 });
    p.destroy();
    expect(cue.peaks).equals(undefined, 'did not detach from instance');
    expect(cue.marks.length).equals(0, 'did not empty edges');
    done();
  });

  describe('points -> marks', function() {
    it('should add marks when point is added', function(done) {
      p.points.add({ time: 1.0 });
      expect(cue.marks.length).equals(1, 'mark length did not match');
      expect(cue.marks[0].time).equals(1.0, 'mark time did not match');
      expect(cue.marks[0].type).equals(CueMark.POINT, 'did not match marker type');

      p.points.add({ time: 2.0 });
      expect(cue.marks.length).equals(2, 'mark length did not match');
      done();
    });

    it('should reorder when point is added earlier', function(done) {
      p.points.add({ time: 1.0 });
      p.points.add({ time: 1.5 });
      expect(cue.marks[0].time).equals(1.0, 'mark time did not match');
      p.points.add({ time: 0.2 });
      expect(cue.marks[0].time).equals(0.2, "mark time didn't match");
      done();
    });

    it('should update marks when point is updated', function(done) {
      var id = 'mypoint';

      p.points.add({ time: 1.1, id: id });
      p.points.add({ time: 9.1, id: 'other' });

      expect(cue.marks[0].id).equals(id, 'point id did not match');
      expect(cue.marks[0].time).equals(1.1, 'time did not match');
      expect(cue.marks[1].time).equals(9.1, 'time did not match');

      p.points.getPoint(id).update({ time: 2.2 });
      expect(cue.marks[0].time).equals(2.2, 'time did not match');
      expect(cue.marks[1].time).equals(9.1, 'time did not match');

      done();
    });

    it('should remove marks when point is removed', function(done) {
      p.points.add({ time: 1.1, id: 'id1' });
      p.points.add({ time: 9.1 });
      p.points.removeById('id1');
      expect(cue.marks[0].time).equals(9.1, 'did not match time');
      done();
    });

    it('should update when all points are removed', function(done) {
      p.points.add({ time: 2.1 });
      p.points.add({ time: 3.1 });
      p.segments.add({ startTime: 2.2, endTime: 3.2 });
      p.points.removeAll();
      expect(cue.marks.length).equals(2, 'marks length didnt match');
      done();
    });
  });

  describe('segments -> marks', function() {
    it('should add dual marks when segment is added', function(done) {
      p.segments.add({ startTime: 2.0, endTime: 3.0 });
      expect(cue.marks.length).equals(2, 'mark length did not match');

      expect(cue.marks[0].time).equals(2.0, 'start mark time did not match');
      expect(cue.marks[1].time).equals(3.0, 'end mark time did not match');

      // test for type
      expect(cue.marks[0].type).equals(CueMark.SEGMENT_START, 'mark type did not match');
      expect(cue.marks[1].type).equals(CueMark.SEGMENT_END, 'mark type did not match');

      done();
    });

    it('should reorder when segment is added earlier', function(done) {
      p.segments.add({ startTime: 2.0, endTime: 3.0, id: 'seg1' });
      p.segments.add({ startTime: 2.5, endTime: 3.3, id: 'seg2' });
      expect(cue.marks[1].time).equals(2.5, 'seg2 start mark did not match');
      expect(cue.marks[2].time).equals(3.0, 'seg1 end mark did not match');
      done();
    });

    it('should update marks when segment is updated', function(done) {
      p.segments.add({ startTime: 2.0, endTime: 3.0, id: 'seg1' });
      p.segments.getSegment('seg1').update({ startTime: 2.2, endTime: 3.3 });
      expect(cue.marks[0].time).equals(2.2, 'start mark did not update?');
      expect(cue.marks[1].time).equals(3.3, 'end mark did not update?');
      done();
    });

    it('should remove marks when segment is removed', function(done) {
      p.segments.add({ startTime: 3.3, endTime: 3.4, id: 'segx' });
      p.points.add({ time: 3.3 });
      p.segments.removeById('segx');
      expect(cue.marks.length).equals(1, 'mark length did not match');
      expect(cue.marks[0].type).equals(CueMark.POINT, 'did not match remaining mark type');
      done();
    });

    it('should update when all segments are removed', function(done) {
      p.segments.add({ startTime: 3.3, endTime: 3.4, id: 'segx' });
      p.segments.add({ startTime: 4.3, endTime: 4.4, id: 'seg2' });
      p.points.add({ time: 3.3 });
      p.segments.removeAll();
      expect(cue.marks.length).equals(1, 'did not remove all segments?');
      done();
    });
  });

  describe('events', function() {
    it('should update internal previous time when seeking', function(done) {
      p.emit('player_time_update', 1.0);
      expect(cue.previousTime).equals(1.0, 'did not move previous time');
      p.emit('player_time_update', 2.0);
      expect(cue.previousTime).equals(2.0, 'did not move previous time');
      done();
    });

    it('should emit point events in forward', function(done) {
      var emitted = [];

      p.points.add({ time: 1.05, id: 'p1' });
      p.points.add({ time: 1.07, id: 'p2' });
      p.points.add({ time: 1.09, id: 'p3' });

      p.on(event.POINT, function(pt) {
        emitted.push(pt.id);
        if (emitted.length > 2) {
          expect(emitted).eql(['p1', 'p2', 'p3']);
          done();
        }
      });
      cue._onUpdate(1.1, 1.0);
    });

    it('should emit point events in reverse', function(done) {
      var emitted = [];

      p.points.add({ time: 1.05, id: 'p1' });
      p.points.add({ time: 1.07, id: 'p2' });
      p.points.add({ time: 1.09, id: 'p3' });

      p.on(event.POINT, function(pt) {
        emitted.push(pt.id);
        if (emitted.length > 2) {
          expect(emitted).eql(['p3', 'p2', 'p1']);
          done();
        }
      });
      cue._onUpdate(1.0, 1.1);
    });

    it('should emit segment events in forward', function(done) {
      var emitted = [];

      p.segments.add({ startTime: 1.05, endTime: 1.09, id: 'seg1' });

      p.on(event.SEGMENT_IN, function(seg) {
        expect(seg.id).equals('seg1', 'segment id did not match');
        emitted.push(1.05);
      });
      p.on(event.SEGMENT_OUT, function(seg) {
        expect(seg.id).equals('seg1', 'segment id did not match');
        emitted.push(1.09);
        expect(emitted).eql([1.05, 1.09]);
        done();
      });

      cue._onUpdate(1.0, 1.1);
    });

    it('should emit segment events in reverse', function(done) {
      var emitted = [];

      p.segments.add({ startTime: 1.05, endTime: 1.09, id: 'seg1' });

      p.on(event.SEGMENT_IN, function(seg) {
        expect(seg.id).equals('seg1', 'segment id did not match');
        emitted.push(1.09);
      });
      p.on(event.SEGMENT_OUT, function(seg) {
        expect(seg.id).equals('seg1', 'segment id did not match');
        emitted.push(1.05);
        expect(emitted).eql([1.09, 1.05]);
        done();
      });

      cue._onUpdate(1.1, 1.0);
    });
  });
});
