'use strict';

require('./setup');

var Peaks = require('../../src/main');
var Segment = require('../../src/segment');

describe('Peaks.segments', function() {
  var p, deprecationLogger;

  beforeEach(function(done) {
    deprecationLogger = sinon.spy();

    var options = {
      containers: {
        overview: document.getElementById('overview-container'),
        zoomview: document.getElementById('zoomview-container')
      },
      mediaElement: document.getElementById('media'),
      dataUri: {
        json: 'base/test_data/sample.json'
      },
      deprecationLogger: deprecationLogger
    };

    Peaks.init(options, function(err, instance) {
      expect(err).to.equal(null);
      p = instance;
      done();
    });
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

    it('should should throw if the argument is not an object', function() {
      expect(function() {
        p.segments.add(0, 10);
      }).to.throw(TypeError);
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

    it('should accept optional user data', function() {
      p.segments.add({ startTime: 0, endTime: 10, data: 'test' });

      expect(p.segments.getSegments()[0].data).to.equal('test');
    });

    it('should accept an array of segment objects', function() {
      var segments = [{ startTime: 0, endTime: 10 }, { startTime: 5, endTime: 10 }];

      p.segments.add(segments);

      expect(p.segments.getSegments()).to.have.lengthOf(2);
      expect(p.segments.getSegments()[0].startTime).to.equal(0);
      expect(p.segments.getSegments()[0].endTime).to.equal(10);
      expect(p.segments.getSegments()[1].startTime).to.equal(5);
      expect(p.segments.getSegments()[1].endTime).to.equal(10);
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
        p.segments.add({ startTime: NaN, endTime: 1.0 });
      }).to.throw(TypeError);
    });

    it('should throw an exception if the endTime is NaN', function() {
      expect(function() {
        p.segments.add({ startTime: 1.0, endTime: NaN });
      }).to.throw(TypeError);
    });

    it('should throw an exception if the startTime is negative', function() {
      expect(function() {
        p.segments.add({ startTime: -1.0, endTime: 1.0 });
      }).to.throw(RangeError);
    });

    it('should throw an exception if the endTime is negative', function() {
      expect(function() {
        p.segments.add({ startTime: 1.0, endTime: -1.0 });
      }).to.throw(RangeError);
    });

    it('should throw an exception if the startTime is greater than the endTime', function() {
      expect(function() {
        p.segments.add({ startTime: 1.1, endTime: 1.0 });
      }).to.throw(RangeError);
    });

    it('should allow the startTime to equal the endTime', function() {
      p.segments.add({ startTime: 1.0, endTime: 1.0 });

      var segments = p.segments.getSegments();

      expect(segments[0].startTime).to.equal(1.0);
      expect(segments[0].endTime).to.equal(1.0);
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

    it('should add segments atomically', function() {
      p.segments.add([
        { startTime: 0,  endTime: 10 },
        { startTime: 10, endTime: 20 },
        { startTime: 20, endTime: 30 }
      ]);

      expect(p.segments.getSegments()).to.have.lengthOf(3);

      var segmentsToAdd = [
        { startTime: 30, endTime: 40 },
        { startTime: 40, endTime: 35 },
        { startTime: 40, endTime: 50 }
      ];

      expect(function() {
        p.segments.add(segmentsToAdd);
      }).to.throw(Error, /startTime/);

      var segments = p.segments.getSegments();

      expect(segments).to.have.lengthOf(3);
      expect(segments[0].startTime).to.equal(0);
      expect(segments[0].endTime).to.equal(10);
      expect(segments[1].startTime).to.equal(10);
      expect(segments[1].endTime).to.equal(20);
      expect(segments[2].startTime).to.equal(20);
      expect(segments[2].endTime).to.equal(30);
    });
  });

  describe('getSegmentsAtTime', function() {
    beforeEach(function() {
      p.segments.add({ startTime: 10, endTime: 12, id: 'segment1' });
      p.segments.add({ startTime: 13, endTime: 15, id: 'segment2' });
      p.segments.add({ startTime: 16, endTime: 18, id: 'segment3' });
      p.segments.add({ startTime: 17, endTime: 19, id: 'segment4' });
    });

    it('should return an empty array if no overlapping segments', function() {
      var segments = p.segments.getSegmentsAtTime(5);
      expect(segments).to.be.an.instanceOf(Array);
      expect(segments).to.have.lengthOf(0);
    });

    it('should return segment with time at the start of the segment', function() {
      var segments = p.segments.getSegmentsAtTime(10);
      expect(segments).to.be.an.instanceOf(Array);
      expect(segments).to.have.lengthOf(1);
      expect(segments[0].id).to.equal('segment1');
    });

    it('should not return segment with time at the end of the segment', function() {
      var segments = p.segments.getSegmentsAtTime(12);
      expect(segments).to.be.an.instanceOf(Array);
      expect(segments).to.have.lengthOf(0);
    });

    it('should return segment with time within the segment', function() {
      var segments = p.segments.getSegmentsAtTime(11);
      expect(segments).to.be.an.instanceOf(Array);
      expect(segments).to.have.lengthOf(1);
      expect(segments[0].id).to.equal('segment1');
    });

    it('should return all overlapping segments', function() {
      var segments = p.segments.getSegmentsAtTime(17);
      expect(segments).to.be.an.instanceOf(Array);
      expect(segments).to.have.lengthOf(2);
      expect(segments[0].id).to.equal('segment3');
      expect(segments[1].id).to.equal('segment4');
    });
  });

  describe('remove', function() {
    beforeEach(function() {
      p.segments.add({ startTime: 10, endTime: 12, id: 'segment1' });
      p.segments.add({ startTime: 13, endTime: 15, id: 'segment2' });
      p.segments.add({ startTime: 16, endTime: 18, id: 'segment3' });
    });

    it('should remove the given segment object', function() {
      var segments = p.segments.getSegments();

      var removed = p.segments.remove(segments[0]);

      expect(removed).to.be.an.instanceOf(Array);
      expect(removed).to.have.lengthOf(1);
      expect(removed[0].id).to.equal('segment1');
    });

    it('should remove the segment from the segments array', function() {
      var segments = p.segments.getSegments();

      p.segments.remove(segments[0]);

      var remainingSegments = p.segments.getSegments();

      expect(remainingSegments).to.have.lengthOf(2);
      expect(remainingSegments[0].id).to.equal('segment2');
      expect(remainingSegments[1].id).to.equal('segment3');
    });

    it('should emit an event with the removed segment', function(done) {
      p.on('segments.remove', function(segments) {
        expect(segments).to.be.an.instanceOf(Array);
        expect(segments).to.have.lengthOf(1);
        expect(segments[0]).to.be.an.instanceOf(Segment);
        expect(segments[0].id).to.equal('segment2');
        done();
      });

      var segments = p.segments.getSegments();

      p.segments.remove(segments[1]);
    });

    it('should return an empty array if the segment is not found', function() {
      var removed = p.segments.remove({});

      expect(removed).to.be.an.instanceOf(Array);
      expect(removed).to.be.empty;
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

    it('should allow a segment with the same id to be subsequently added', function() {
      p.segments.removeById('segment_id.1');

      p.segments.add({ startTime: 6, endTime: 7, id: 'segment_id.1' });

      var segments = p.segments.getSegments();

      expect(segments.length).to.equal(2);
      expect(segments[0].startTime).to.equal(15);
      expect(segments[1].startTime).to.equal(6);
    });
  });

  describe('removeAll', function() {
    beforeEach(function() {
      p.segments.add([
        { startTime: 10, endTime: 12, id: 'segment_id.1' },
        { startTime: 5,  endTime: 12, id: 'segment_id.2' }
      ]);
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

    it('should allow the same segment ids to be subsequently added', function() {
      p.segments.removeAll();

      p.segments.add({ startTime: 6, endTime: 7, id: 'segment_id.1' });
      p.segments.add({ startTime: 8, endTime: 9, id: 'segment_id.2' });

      var segments = p.segments.getSegments();

      expect(segments.length).to.equal(2);
      expect(segments[0].startTime).to.equal(6);
      expect(segments[1].startTime).to.equal(8);
    });
  });
});
