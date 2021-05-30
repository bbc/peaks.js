import Peaks from '../../src/main';
import CueEmitter from '../../src/cue-emitter';
import Cue from '../../src/cue';

describe('CueEmitter', function() {
  var p;
  var cueEmitter;

  var event = {
    POINT: 'points.enter',
    SEGMENT_IN: 'segments.enter',
    SEGMENT_OUT: 'segments.exit'
  };

  beforeEach(function(done) {
    var options = {
      containers: {
        overview: document.getElementById('overview-container'),
        zoomview: document.getElementById('zoomview-container')
      },
      mediaElement: document.getElementById('media'),
      dataUri: 'base/test_data/sample.json',
      emitCueEvents: false
    };

    Peaks.init(options, function(err, instance) {
      expect(err).to.equal(null);

      p = instance;
      cueEmitter = new CueEmitter(instance);

      done();
    });
  });

  afterEach(function() {
    if (p) {
      p.destroy();
      p = null;
    }

    cueEmitter = null;
  });

  it('should initialise correctly', function() {
    expect(p._cueEmitter).to.be.undefined;
    expect(cueEmitter._peaks).equals(p, 'instance did not match');
    expect(cueEmitter._cues.length).equals(0, 'mark array not empty');
  });

  it('should initialise with already existing points', function(done) {
    var options = {
      containers: {
        overview: document.getElementById('overview-container'),
        zoomview: document.getElementById('zoomview-container')
      },
      mediaElement: document.getElementById('media'),
      dataUri: 'base/test_data/sample.json',
      emitCueEvents: true,
      points: [{ time: 1.0 }],
      segments: [{ startTime: 1.1, endTime: 1.2 }]
    };

    Peaks.init(options, function(err, peaks) {
      expect(err).to.equal(null);
      expect(peaks).to.be.an.instanceOf(Peaks);
      expect(peaks._cueEmitter).to.be.an.instanceOf(CueEmitter);
      expect(peaks._cueEmitter._cues.length).to.equal(3);
      done();
    });
  });

  it('should be destroyed when the Peaks instance is destroyed', function(done) {
    var options = {
      containers: {
        overview: document.getElementById('overview-container'),
        zoomview: document.getElementById('zoomview-container')
      },
      mediaElement: document.getElementById('media'),
      dataUri: 'base/test_data/sample.json',
      emitCueEvents: true
    };

    Peaks.init(options, function(err, peaks) {
      expect(err).to.equal(null);
      expect(peaks).to.be.an.instanceOf(Peaks);
      expect(peaks._cueEmitter).to.be.an.instanceOf(CueEmitter);

      p.points.add({ time: 1.0 });
      p.destroy();
      expect(peaks._cueEmitter._cues.length).to.equal(0, 'did not empty cues');
      done();
    });
  });

  describe('adding points', function() {
    it('should add cues when point is added', function() {
      p.points.add({ time: 1.0 });
      expect(cueEmitter._cues.length).equals(1, 'cues length did not match');
      expect(cueEmitter._cues[0].time).equals(1.0, 'cue time did not match');
      expect(cueEmitter._cues[0].type).equals(Cue.POINT, 'cue type did not match');

      p.points.add({ time: 2.0 });
      expect(cueEmitter._cues.length).equals(2, 'cues length did not match');
    });

    it('should reorder cues when point is added earlier', function() {
      p.points.add({ time: 1.0 });
      p.points.add({ time: 1.5 });
      expect(cueEmitter._cues[0].time).equals(1.0, 'cue time did not match');
      p.points.add({ time: 0.2 });
      expect(cueEmitter._cues[0].time).equals(0.2, 'cue time did not match');
    });

    it('should update cues when point is updated', function() {
      var id = 'mypoint';

      p.points.add({ time: 1.1, id: id });
      p.points.add({ time: 9.1, id: 'other' });

      expect(cueEmitter._cues[0].id).equals(id, 'point id did not match');
      expect(cueEmitter._cues[0].time).equals(1.1, 'time did not match');
      expect(cueEmitter._cues[1].time).equals(9.1, 'time did not match');

      p.points.getPoint(id).update({ time: 2.2 });
      expect(cueEmitter._cues[0].time).equals(2.2, 'time did not match');
      expect(cueEmitter._cues[1].time).equals(9.1, 'time did not match');
    });

    it('should remove cues when point is removed', function() {
      p.points.add({ time: 1.1, id: 'id1' });
      p.points.add({ time: 9.1 });
      p.points.removeById('id1');
      expect(cueEmitter._cues[0].time).equals(9.1, 'time did not match');
    });

    it('should update when all points are removed', function() {
      p.points.add({ time: 2.1 });
      p.points.add({ time: 3.1 });
      p.segments.add({ startTime: 2.2, endTime: 3.2 });
      p.points.removeAll();
      expect(cueEmitter._cues.length).equals(2, 'cues length did not match');
    });
  });

  describe('adding segments', function() {
    it('should add start and end cues when segment is added', function() {
      p.segments.add({ startTime: 2.0, endTime: 3.0 });
      expect(cueEmitter._cues.length).equals(2, 'cues length did not match');

      expect(cueEmitter._cues[0].time).equals(2.0, 'start cue time did not match');
      expect(cueEmitter._cues[1].time).equals(3.0, 'end cue time did not match');

      expect(cueEmitter._cues[0].type).equals(Cue.SEGMENT_START, 'cue type did not match');
      expect(cueEmitter._cues[1].type).equals(Cue.SEGMENT_END, 'cue type did not match');
    });

    it('should reorder cues when segment is added earlier', function() {
      p.segments.add({ startTime: 2.0, endTime: 3.0, id: 'seg1' });
      p.segments.add({ startTime: 2.5, endTime: 3.3, id: 'seg2' });
      expect(cueEmitter._cues[1].time).equals(2.5, 'seg2 start cue time did not match');
      expect(cueEmitter._cues[2].time).equals(3.0, 'seg1 end cue time did not match');
    });

    it('should update cues when segment is updated', function() {
      p.segments.add({ startTime: 2.0, endTime: 3.0, id: 'seg1' });
      p.segments.getSegment('seg1').update({ startTime: 2.2, endTime: 3.3 });
      expect(cueEmitter._cues[0].time).equals(2.2, 'start cue time did not update?');
      expect(cueEmitter._cues[1].time).equals(3.3, 'end cue time did not update?');
    });

    it('should remove cues when segment is removed', function() {
      p.segments.add({ startTime: 3.3, endTime: 3.4, id: 'segx' });
      p.points.add({ time: 3.3 });
      p.segments.removeById('segx');
      expect(cueEmitter._cues.length).equals(1, 'cues length did not match');
      expect(cueEmitter._cues[0].type).equals(Cue.POINT, 'remaining cue type did not match');
    });

    it('should update when all segments are removed', function() {
      p.segments.add({ startTime: 3.3, endTime: 3.4, id: 'segx' });
      p.segments.add({ startTime: 4.3, endTime: 4.4, id: 'seg2' });
      p.points.add({ time: 3.3 });
      p.segments.removeAll();
      expect(cueEmitter._cues.length).equals(1, 'did not remove all segments?');
      expect(cueEmitter._cues[0].type).equals(Cue.POINT, 'remaining cue type did not match');
    });
  });

  describe('events', function() {
    it('should update internal previous time when seeking', function() {
      p.emit('player.timeupdate', 1.0);
      expect(cueEmitter._previousTime).equals(1.0, 'did not move previous time');
      p.emit('player.timeupdate', 2.0);
      expect(cueEmitter._previousTime).equals(2.0, 'did not move previous time');
    });

    it('should emit point events during forward playback', function(done) {
      var emitted = [];

      p.points.add({ time: 1.05, id: 'p1' });
      p.points.add({ time: 1.07, id: 'p2' });
      p.points.add({ time: 1.09, id: 'p3' });

      p.on(event.POINT, function(point) {
        emitted.push(point.id);

        if (emitted.length === 3) {
          expect(emitted).to.deep.equal(['p1', 'p2', 'p3']);
          done();
        }
      });

      cueEmitter._onUpdate(1.1, 1.0);
    });

    it('should emit point events during reverse playback', function(done) {
      var emitted = [];

      p.points.add({ time: 1.05, id: 'p1' });
      p.points.add({ time: 1.07, id: 'p2' });
      p.points.add({ time: 1.09, id: 'p3' });

      p.on(event.POINT, function(point) {
        emitted.push(point.id);

        if (emitted.length === 3) {
          expect(emitted).to.deep.equal(['p3', 'p2', 'p1']);
          done();
        }
      });

      cueEmitter._onUpdate(1.0, 1.1);
    });

    it('should emit segment events during forward playback', function(done) {
      var emitted = [];

      p.segments.add({ startTime: 1.05, endTime: 1.09, id: 'seg1' });

      p.on(event.SEGMENT_IN, function(segment) {
        expect(segment.id).equals('seg1', 'segment id did not match');
        emitted.push(1.05);
      });

      p.on(event.SEGMENT_OUT, function(segment) {
        expect(segment.id).equals('seg1', 'segment id did not match');
        emitted.push(1.09);
        expect(emitted).to.deep.equal([1.05, 1.09]);
        done();
      });

      cueEmitter._onUpdate(1.0, 1.1);
    });

    it('should emit segment events during reverse playback', function(done) {
      var emitted = [];

      p.segments.add({ startTime: 1.05, endTime: 1.09, id: 'seg1' });

      p.on(event.SEGMENT_IN, function(segment) {
        expect(segment.id).equals('seg1', 'segment id did not match');
        emitted.push(1.09);
      });

      p.on(event.SEGMENT_OUT, function(segment) {
        expect(segment.id).equals('seg1', 'segment id did not match');
        emitted.push(1.05);
        expect(emitted).to.deep.equal([1.09, 1.05]);
        done();
      });

      cueEmitter._onUpdate(1.1, 1.0);
    });

    it('should emit events on seeking', function(done) {
      var mediaElement = document.getElementById('media');

      var options = {
        containers: {
          overview: document.getElementById('overview-container'),
          zoomview: document.getElementById('zoomview-container')
        },
        mediaElement: mediaElement,
        dataUri: 'base/test_data/sample.json',
        emitCueEvents: true
      };

      Peaks.init(options, function(err, peaks) {
        expect(err).to.equal(null);
        expect(peaks).to.be.an.instanceOf(Peaks);

        peaks.segments.add({ startTime: 2, endTime: 4, id: 'segment.1' });
        peaks.segments.add({ startTime: 6, endTime: 8, id: 'segment.2' });
        peaks.segments.add({ startTime: 10, endTime: 12, id: 'segment.3' });

        var events = [];
        var seekTimes = [3, 11]; // Seek to segment.1 then segment.3

        mediaElement.addEventListener('seeked', function() {
          var time = seekTimes.shift();

          if (time) {
            peaks.player.seek(time);
          }
          else {
            expect(events.length).to.equal(3);
            expect(events[0].type).to.equal('segments.enter');
            expect(events[0].segment.id).to.equal('segment.1');
            expect(events[1].type).to.equal('segments.exit');
            expect(events[1].segment.id).to.equal('segment.1');
            expect(events[2].type).to.equal('segments.enter');
            expect(events[2].segment.id).to.equal('segment.3');
            done();
          }
        });

        peaks.on('segments.enter', function(segment) {
          events.push({ type: 'segments.enter', segment: segment });
        });

        peaks.on('segments.exit', function(segment) {
          events.push({ type: 'segments.exit', segment: segment });
        });

        var time = seekTimes.shift();
        peaks.player.seek(time);
      });
    });
  });
});
