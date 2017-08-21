'use strict';

var Peaks = require('../../src/main');
var Segment = require('../../src/main/markers/segment');

describe('Peaks.segments', function() {
  var p, deprecationLogger;

  beforeEach(function(done) {
    deprecationLogger = sinon.spy();

    p = Peaks.init({
      container: document.getElementById('waveform-visualiser-container'),
      mediaElement: document.querySelector('audio'),
      dataUri: {
        json: 'base/test_data/sample.json'
      },
      keyboard: true,
      height: 240,
      deprecationLogger: deprecationLogger
    });

    p.on('peaks.ready', done);
  });

  afterEach(function() {
    if (p) {
      p.destroy();
    }
  });

  describe('getSegments', function() {
    it('should return an empty array if no segments are present', function() {
      expect(p.segments.getSegments()).to.be.an('array').and.have.lengthOf(0);
    });

    it('should return any added segments', function() {
      p.segments.add({ startTime: 0, endTime: 10 });
      p.segments.add({ startTime: 2, endTime: 12 });

      var segments = p.segments.getSegments();

      expect(segments).to.have.lengthOf(2);
      expect(segments[0]).to.be.an.instanceOf(Segment);
      expect(segments[0].startTime).to.equal(0);
      expect(segments[0].endTime).to.equal(10);
      expect(segments[1]).to.be.an.instanceOf(Segment);
      expect(segments[1].startTime).to.equal(2);
      expect(segments[1].endTime).to.equal(12);
    });
  });

  describe('getSegment', function() {
    it('should return a segment given a valid id', function() {
      p.segments.add({ startTime: 0, endTime: 10, id: 'segment1' });
      p.segments.add({ startTime: 2, endTime: 12, id: 'segment2' });

      var segment = p.segments.getSegment('segment2');

      expect(segment).to.be.ok;
      expect(segment).to.be.an.instanceOf(Segment);
      expect(segment.id).to.equal('segment2');
      expect(segment.startTime).to.equal(2);
      expect(segment.endTime).to.equal(12);
    });

    it('should return null if segment not found', function() {
      p.segments.add({ startTime: 0, endTime: 10, id: 'segment1' });
      p.segments.add({ startTime: 2, endTime: 12, id: 'segment2' });

      var segment = p.segments.getSegment('segment3');

      expect(segment).to.equal(null);
    });
  });

  describe('add', function() {
    it('should accept a single segment object', function() {
      p.segments.add({ startTime: 0, endTime: 10 });

      var segments = p.segments.getSegments();

      expect(segments).to.have.lengthOf(1);
      expect(segments[0]).to.be.an.instanceOf(Segment);
      expect(segments[0].startTime).to.equal(0);
      expect(segments[0].endTime).to.equal(10);

      expect(deprecationLogger).to.not.have.been.called;
    });

    it('should accept a list of properties for a single segment (deprecated)', function() {
      p.segments.add(0, 10);

      var segments = p.segments.getSegments();

      expect(segments).to.have.lengthOf(1);
      expect(segments[0]).to.be.an.instanceOf(Segment);
      expect(segments[0].startTime).to.equal(0);
      expect(segments[0].endTime).to.equal(10);

      expect(deprecationLogger).to.have.been.calledOnce;
    });

    it('should throw an exception if the startTime argument is missing', function() {
      expect(function() {
        p.segments.add({ endTime: 10 });
      }).to.throw(TypeError);
    });

    it('should throw an exception if the endTime argument is missing', function() {
      expect(function() {
        p.segments.add({ startTime: 0 });
      }).to.throw(TypeError);
    });

    it('should accept an optional id', function() {
      p.segments.add({ startTime: 0, endTime: 10, id: '123' });

      expect(p.segments.getSegments()[0].id).to.equal('123');
    });

    it('should allow 0 for a segment id', function() {
      p.segments.add({ startTime: 0, endTime: 10, id: 0 });

      expect(p.segments.getSegments()[0].id).to.equal(0);
    });

    it('should assign a default id if not specified', function() {
      p.segments.add({ startTime: 0, endTime: 10 });

      expect(p.segments.getSegments()[0].id).to.equal('peaks.segment.0');
    });

    it('should accept an optional segment color', function() {
      p.segments.add({ startTime: 0, endTime: 10, color: '#888' });

      expect(p.segments.getSegments()[0].color).to.equal('#888');
    });

    it('should assign a default (random) color if not specified', function() {
      p.segments.add({ startTime: 0, endTime: 10 });

      expect(p.segments.getSegments()[0].color).to.match(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should accept an optional label text', function() {
      p.segments.add({ startTime: 0, endTime: 10, labelText: 'test' });

      expect(p.segments.getSegments()[0].labelText).to.equal('test');
    });

    it('should assign a default label text if not specified', function() {
      p.segments.add({ startTime: 0, endTime: 10 });

      expect(p.segments.getSegments()[0].labelText).to.equal('');
    });

    it('should accept an array of segment objects', function() {
      var segments = [{ startTime: 0, endTime: 10 }, { startTime: 5, endTime: 10 }];

      p.segments.add(segments);

      expect(p.segments.getSegments()).to.have.lengthOf(2);
      expect(p.segments.getSegments()[0]).to.include.keys('startTime', 'endTime');
      expect(p.segments.getSegments()[1]).to.include.keys('startTime', 'endTime');
    });

    it('should emit an event with an array containing a single segment object', function(done) {
      p.on('segments.add', function(segments) {
        expect(segments).to.have.lengthOf(1);
        expect(segments[0]).to.be.an.instanceOf(Segment);
        expect(segments[0].startTime).to.equal(0);
        expect(segments[0].endTime).to.equal(10);
        done();
      });

      p.segments.add({ startTime: 0,  endTime: 10 });
    });

    it('should emit an event with multiple segment objects', function(done) {
      p.on('segments.add', function(segments) {
        expect(segments).to.have.lengthOf(2);
        expect(segments[0]).to.be.an.instanceOf(Segment);
        expect(segments[0].startTime).to.equal(0);
        expect(segments[0].endTime).to.equal(10);
        expect(segments[1]).to.be.an.instanceOf(Segment);
        expect(segments[1].startTime).to.equal(20);
        expect(segments[1].endTime).to.equal(30);
        done();
      });

      p.segments.add([
        { startTime: 0,  endTime: 10 },
        { startTime: 20, endTime: 30 }
      ]);
    });

    it('should return undefined', function() {
      var result = p.segments.add({ startTime: 0, endTime: 10 });

      expect(result).to.be.undefined;
    });

    it('should throw an exception if arguments do not match any previous accepted signature form', function() {
      expect(function() { p.segments.add({}); }).to.throw(TypeError);
      expect(function() { p.segments.add(undefined); }).to.throw(TypeError);
      expect(function() { p.segments.add(null); }).to.throw(TypeError);
      expect(function() { p.segments.add(NaN, NaN); }).to.throw(TypeError);
    });

    it('should throw an exception if the startTime is NaN', function() {
      expect(function() {
        p.points.add({ startTime: NaN, endTime: 1.0 });
      }).to.throw(TypeError);
    });

    it('should throw an exception if the endTime is NaN', function() {
      expect(function() {
        p.segments.add({ startTime: 1.0, endTime: NaN });
      }).to.throw(TypeError);
    });

    it('should throw an exception if given a duplicate id', function() {
      p.segments.add({ startTime: 10, endTime: 20, id: 'segment1' });

      expect(function() {
        p.segments.add({ startTime: 10, endTime: 20, id: 'segment1' });
      }).to.throw(Error, /duplicate/);
    });

    it('should add a segment with the same id as a previously removed segment', function() {
      p.segments.add({ startTime: 10, endTime: 20, id: 'segment1' });
      p.segments.removeById('segment1');
      p.segments.add({ startTime: 20, endTime: 30, id: 'segment1' });

      var segments = p.segments.getSegments();

      expect(segments).to.have.lengthOf(1);
      expect(segments[0].startTime).to.equal(20);
      expect(segments[0].endTime).to.equal(30);
      expect(segments[0].id).to.equal('segment1');
    });
  });

  describe('remove', function() {
    beforeEach(function() {
      p.segments.add({ startTime: 10, endTime: 12 });
    });

    it('should throw an exception if the segment does not exist', function() {
      expect(function() { p.segments.remove({}); }).to.throw();
    });

    it('should return the deleted segment object if properly deleted', function() {
      var segment = p.segments.getSegments()[0];

      expect(p.segments.remove(segment)).to.equal(segment);
    });

    it('should remove the segment from the segments array', function() {
      var segment = p.segments.getSegments()[0];

      p.segments.remove(segment);

      expect(p.segments.getSegments()).to.not.include(segment);
    });

    it('should emit an event with the removed segment', function(done) {
      var segment = p.segments.getSegments()[0];

      p.on('segments.remove', function(segments) {
        expect(segments).to.be.an.instanceOf(Array);
        expect(segments).to.have.lengthOf(1);
        expect(segments[0]).to.deep.equal(segment);
        done();
      });

      p.segments.remove(segment);
    });
  });

  describe('removeByTime', function() {
    beforeEach(function() {
      p.segments.add({ startTime: 10, endTime: 12 });
      p.segments.add({ startTime: 5,  endTime: 12 });

      p.segments.add({ startTime: 3,  endTime: 6  });
      p.segments.add({ startTime: 3,  endTime: 10 });
    });

    it('should not remove any segment if the startTime does not match any segment', function() {
      p.segments.removeByTime(6);

      expect(p.segments.getSegments()).to.have.a.lengthOf(4);
    });

    it('should not remove any segment if only the endTime matches the end of a segment', function() {
      p.segments.removeByTime(6, 12);

      expect(p.segments.getSegments()).to.have.a.lengthOf(4);
    });

    it('should remove the only segment matching the startTime', function() {
      p.segments.removeByTime(5);

      var segments = p.segments.getSegments();

      expect(segments).to.have.a.lengthOf(3);
      expect(segments[0].startTime).to.equal(10);
      expect(segments[1].startTime).to.equal(3);
      expect(segments[2].startTime).to.equal(3);
    });

    it('should return the removed segments', function() {
      var segments = p.segments.removeByTime(3);

      expect(segments).to.be.an.instanceOf(Array);
      expect(segments).to.have.lengthOf(2);
      expect(segments[0]).to.be.an.instanceOf(Segment);
      expect(segments[0].startTime).to.equal(3);
      expect(segments[0].endTime).to.equal(6);
      expect(segments[1]).to.be.an.instanceOf(Segment);
      expect(segments[1].startTime).to.equal(3);
      expect(segments[1].endTime).to.equal(10);
    });

    it('should emit an event containing the removed segments', function(done) {
      p.on('segments.remove', function(segments) {
        expect(segments).to.be.an.instanceOf(Array);
        expect(segments).to.have.lengthOf(2);
        expect(segments[0]).to.be.an.instanceOf(Segment);
        expect(segments[0].startTime).to.equal(3);
        expect(segments[0].endTime).to.equal(6);
        expect(segments[1]).to.be.an.instanceOf(Segment);
        expect(segments[1].startTime).to.equal(3);
        expect(segments[1].endTime).to.equal(10);

        done();
      });

      p.segments.removeByTime(3);
    });

    it('should remove multiple segments with the same startTime', function() {
      p.segments.removeByTime(3);

      expect(p.segments.getSegments()).to.have.a.lengthOf(2);
    });

    it('should remove a segment matching both startTime and endTime', function() {
      p.segments.removeByTime(3, 6);

      expect(p.segments.getSegments()).to.have.a.lengthOf(3);
    });
  });

  describe('removeById', function() {
    beforeEach(function() {
      p.segments.add([
        { startTime: 0,  endTime: 10, id: 'segment_id.1' },
        { startTime: 15, endTime: 25, id: 'segment_id.2' }
      ]);
    });

    it('should remove the segment with the given id', function() {
      p.segments.removeById('segment_id.1');

      var remainingSegments = p.segments.getSegments();

      expect(remainingSegments).to.have.a.lengthOf(1);
      expect(remainingSegments[0].id).to.equal('segment_id.2');
      expect(remainingSegments[0].startTime).to.equal(15);
      expect(remainingSegments[0].endTime).to.equal(25);
    });

    it('should return the removed segments', function() {
      var removed = p.segments.removeById('segment_id.1');

      expect(removed).to.be.an.instanceOf(Array);
      expect(removed.length).to.equal(1);
      expect(removed[0]).to.be.an.instanceOf(Segment);
      expect(removed[0].startTime).to.equal(0);
      expect(removed[0].endTime).to.equal(10);
    });

    it('should emit an event with the removed segments', function(done) {
      p.on('segments.remove', function(segments) {
        expect(segments).to.be.an.instanceOf(Array);
        expect(segments.length).to.equal(1);
        expect(segments[0]).to.be.an.instanceOf(Segment);
        expect(segments[0].startTime).to.equal(15);
        expect(segments[0].endTime).to.equal(25);

        done();
      });

      p.segments.removeById('segment_id.2');
    });
  });

  describe('removeAll', function() {
    beforeEach(function() {
      p.segments.add({ startTime: 10, endTime: 12 });
      p.segments.add({ startTime: 5,  endTime: 12 });
    });

    it('should remove all segment objects', function() {
      p.segments.removeAll();

      var remainingSegments = p.segments.getSegments();

      expect(remainingSegments).to.be.empty;
    });

    it('should emit an event', function(done) {
      p.on('segments.remove_all', function(param) {
        expect(param).to.be.undefined;

        var remainingSegments = p.segments.getSegments();

        expect(remainingSegments).to.be.empty;
        done();
      });

      p.segments.removeAll();
    });

    it('should return undefined', function() {
      var result = p.segments.removeAll();

      expect(result).to.be.undefined;
    });
  });
});
