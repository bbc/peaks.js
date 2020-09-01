'use strict';

require('./setup');

var Peaks = require('../../src/main');
var Point = require('../../src/point');

describe('Peaks.points', function() {
  var p, deprecationLogger;

  beforeEach(function(done) {
    deprecationLogger = sinon.spy();

    var options = {
      containers: {
        overview: document.getElementById('overview-container'),
        zoomview: document.getElementById('zoomview-container')
      },
      mediaElement: document.getElementById('media'),
      dataUri: 'base/test_data/sample.json',
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

  describe('getPoints', function() {
    it('should return an empty array by default', function() {
      expect(p.points.getPoints()).to.be.an('array').and.have.lengthOf(0);
    });

    it('should return any added points', function() {
      p.points.add({ time: 10 });
      p.points.add({ time: 12 });

      var points = p.points.getPoints();

      expect(points).to.have.lengthOf(2);
      expect(points[0]).to.be.an.instanceOf(Point);
      expect(points[0].time).to.equal(10);
      expect(points[1]).to.be.an.instanceOf(Point);
      expect(points[1].time).to.equal(12);
    });
  });

  describe('getPoint', function() {
    beforeEach(function() {
      p.points.add({ time: 10, editable: true, id: 'point1' });
    });

    it('should return a point given a valid id', function() {
      var point = p.points.getPoint('point1');

      expect(point).to.be.an.instanceOf(Point);
      expect(point.id).to.equal('point1');
    });

    it('should return null if point not found', function() {
      var point = p.points.getPoint('point2');

      expect(point).to.equal(null);
    });
  });

  describe('add', function() {
    it('should create a point from the supplied object', function() {
      p.points.add({ time: 10, editable: true, color: '#ff0000', labelText: 'A point' });

      var points = p.points.getPoints();

      expect(points).to.have.a.lengthOf(1);
      expect(points[0]).to.be.an.instanceOf(Point);
      expect(points[0].time).to.equal(10);
      expect(points[0].editable).to.equal(true);
      expect(points[0].color).to.equal('#ff0000');
      expect(points[0].labelText).to.equal('A point');
    });

    it('should accept an array of point objects', function() {
      var points = [
        { time: 10, editable: true, color: '#ff0000', labelText: 'A point' },
        { time: 12, editable: true, color: '#ff0000', labelText: 'Another point' }
      ];

      p.points.add(points);

      expect(p.points.getPoints()).to.have.lengthOf(2);
      expect(p.points.getPoints()[1].time).to.equal(12);
      expect(p.points.getPoints()[1].labelText).to.equal('Another point');
    });

    it('should should throw if the argument is not an object', function() {
      expect(function() {
        p.points.add(10, true, '#ff0000', 'A point');
      }).to.throw(TypeError);
    });

    it('should throw if the time is missing', function() {
      expect(function() {
        // 'timestamp' should be 'time'
        p.points.add({ timestamp: 10, editable: true, labelText: 'A point' });
      }).to.throw(TypeError);
    });

    it('should accept an optional id', function() {
      p.points.add({ time: 10, id: '500' });

      var points = p.points.getPoints();

      expect(points).to.have.lengthOf(1);
      expect(points[0]).to.be.an.instanceOf(Point);
      expect(points[0].id).to.equal('500');
    });

    it('should allow 0 for a point id', function() {
      p.points.add({ time: 10, id: 0 });

      var points = p.points.getPoints();

      expect(points).to.have.lengthOf(1);
      expect(points[0]).to.be.an.instanceOf(Point);
      expect(points[0].id).to.equal(0);
    });

    it('should accept an optional label text', function() {
      p.points.add({ time: 10, labelText: 'test' });

      expect(p.points.getPoints()[0].labelText).to.equal('test');
    });

    it('should assign a default label text if not specified', function() {
      p.points.add({ time: 10 });

      expect(p.points.getPoints()[0].labelText).to.equal('');
    });

    it('should accept optional user data', function() {
      p.points.add({ time: 10, data: 'test' });

      expect(p.points.getPoints()[0].data).to.equal('test');
    });

    it('should emit an event with an array containing a single point object', function(done) {
      p.on('points.add', function(points) {
        expect(points).to.have.lengthOf(1);
        expect(points[0]).to.be.an.instanceOf(Point);
        expect(points[0].time).to.equal(0);
        done();
      });

      p.points.add({ time: 0 });
    });

    it('should emit an event with multiple point objects', function(done) {
      p.on('points.add', function(points) {
        expect(points).to.have.lengthOf(2);
        expect(points[0]).to.be.an.instanceOf(Point);
        expect(points[0].time).to.equal(0);
        expect(points[1]).to.be.an.instanceOf(Point);
        expect(points[1].time).to.equal(20);
        done();
      });

      p.points.add([
        { time: 0  },
        { time: 20 }
      ]);
    });

    it('should return undefined', function() {
      var result = p.points.add({ time: 0 });

      expect(result).to.be.undefined;
    });

    it('should throw an exception if the time is undefined', function() {
      expect(function() {
        p.points.add({ time: undefined });
      }).to.throw(TypeError);
    });

    it('should throw an exception if the time is null', function() {
      expect(function() {
        p.points.add({ time: null });
      }).to.throw(TypeError);
    });

    it('should throw an exception if the time is NaN', function() {
      expect(function() {
        p.points.add(NaN);
      }).to.throw(TypeError);

      expect(function() {
        p.points.add({ time: NaN });
      }).to.throw(TypeError);
    });

    it('should throw an exception if the time is negative', function() {
      expect(function() {
        p.points.add({ time: -1.0 });
      }).to.throw(RangeError);
    });

    it('should throw an exception if given a duplicate id', function() {
      p.points.add({ time: 10, id: 'point1' });

      expect(function() {
        p.points.add({ time: 10, id: 'point1' });
      }).to.throw(Error, /duplicate/);
    });

    it('should add a point with the same id as a previously removed point', function() {
      p.points.add({ time: 10, id: 'point1' });
      p.points.removeById('point1');
      p.points.add({ time: 20, id: 'point1' });

      var points = p.points.getPoints();

      expect(points).to.have.lengthOf(1);
      expect(points[0].time).to.equal(20);
      expect(points[0].id).to.equal('point1');
    });

    it('should add points atomically', function() {
      p.points.add([
        { time: 0,  id: 'point1' },
        { time: 10, id: 'point2' },
        { time: 20, id: 'point3' }
      ]);

      expect(p.points.getPoints()).to.have.lengthOf(3);

      var pointsToAdd = [
        { time: 30, id: 'point4' },
        { time: 40, id: 'point1' },
        { time: 40, id: 'point6' }
      ];

      expect(function() {
        p.points.add(pointsToAdd);
      }).to.throw(Error, /duplicate id/);

      var points = p.points.getPoints();

      expect(points).to.have.lengthOf(3);
      expect(points[0].time).to.equal(0);
      expect(points[0].id).to.equal('point1');
      expect(points[1].time).to.equal(10);
      expect(points[1].id).to.equal('point2');
      expect(points[2].time).to.equal(20);
      expect(points[2].id).to.equal('point3');
    });
  });

  describe('remove', function() {
    beforeEach(function() {
      p.points.add({ time: 10, editable: true, id: 'point1' });
      p.points.add({ time: 5,  editable: true, id: 'point2' });
      p.points.add({ time: 3,  editable: true, id: 'point3' });
    });

    it('should remove the given point object', function() {
      var points = p.points.getPoints();

      var removed = p.points.remove(points[0]);

      expect(removed).to.be.an.instanceOf(Array);
      expect(removed).to.have.lengthOf(1);
      expect(removed[0].id).to.equal('point1');
    });

    it('should remove the point from the points array', function() {
      var points = p.points.getPoints();

      p.points.remove(points[0]);

      var remainingPoints = p.points.getPoints();

      expect(remainingPoints).to.have.lengthOf(2);
      expect(remainingPoints[0].id).to.equal('point2');
      expect(remainingPoints[1].id).to.equal('point3');
    });

    it('should emit an event with the removed points', function(done) {
      p.on('points.remove', function(points) {
        expect(points).to.be.an.instanceOf(Array);
        expect(points).to.have.lengthOf(1);
        expect(points[0]).to.be.an.instanceOf(Point);
        expect(points[0].id).to.equal('point2');

        done();
      });

      var points = p.points.getPoints();

      p.points.remove(points[1]);
    });

    it('should return an empty array if the point is not found', function() {
      var removed = p.points.remove({});

      expect(removed).to.be.an.instanceOf(Array);
      expect(removed).to.be.empty;
    });
  });

  describe('removeByTime', function() {
    beforeEach(function() {
      p.points.add({ time: 10, editable: true });
      p.points.add({ time: 5,  editable: true });
      p.points.add({ time: 3,  editable: true });
      p.points.add({ time: 3,  editable: true });
    });

    it('should remove any points with the given time', function() {
      p.points.removeByTime(5);

      expect(p.points.getPoints()).to.have.lengthOf(3);
    });

    it('should remove the only points matching the time', function() {
      p.points.removeByTime(5);

      var points = p.points.getPoints();

      expect(points).to.have.a.lengthOf(3);
      expect(points[0].time).to.equal(10);
      expect(points[1].time).to.equal(3);
      expect(points[2].time).to.equal(3);
    });

    it('should return the removed points', function() {
      var points = p.points.removeByTime(3);

      expect(points).to.be.an.instanceOf(Array);
      expect(points).to.have.lengthOf(2);
      expect(points[0]).to.be.an.instanceOf(Point);
      expect(points[0].time).to.equal(3);
      expect(points[1]).to.be.an.instanceOf(Point);
      expect(points[1].time).to.equal(3);
    });

    it('should emit an event with the removed points', function(done) {
      p.on('points.remove', function(points) {
        expect(points).to.be.an.instanceOf(Array);
        expect(points).to.have.lengthOf(2);
        expect(points[0]).to.be.an.instanceOf(Point);
        expect(points[0].time).to.equal(3);
        expect(points[1]).to.be.an.instanceOf(Point);
        expect(points[1].time).to.equal(3);

        done();
      });

      p.points.removeByTime(3);
    });
  });

  describe('removeById', function() {
    beforeEach(function() {
      p.points.add([
        { time: 0,  id: 'point_id.1' },
        { time: 15, id: 'point_id.2' }
      ]);
    });

    it('should remove the point with the given id', function() {
      p.points.removeById('point_id.1');

      var remainingPoints = p.points.getPoints();

      expect(remainingPoints).to.have.a.lengthOf(1);
      expect(remainingPoints[0].id).to.eq('point_id.2');
    });

    it('should return the removed points', function() {
      var removed = p.points.removeById('point_id.1');

      expect(removed).to.be.an.instanceOf(Array);
      expect(removed.length).to.equal(1);
      expect(removed[0]).to.be.an.instanceOf(Point);
      expect(removed[0].time).to.equal(0);
    });

    it('should emit an event with the removed points', function(done) {
      p.on('points.remove', function(points) {
        expect(points).to.be.an.instanceOf(Array);
        expect(points.length).to.equal(1);
        expect(points[0]).to.be.an.instanceOf(Point);
        expect(points[0].time).to.equal(15);
        expect(points[0].id).to.equal('point_id.2');

        done();
      });

      p.points.removeById('point_id.2');
    });

    it('should allow a point with the same id to be subsequently added', function() {
      p.points.removeById('point_id.1');

      p.points.add({ time: 6, id: 'point_id.1' });

      var points = p.points.getPoints();

      expect(points.length).to.equal(2);
      expect(points[0].time).to.equal(15);
      expect(points[1].time).to.equal(6);
    });
  });

  describe('removeAll', function() {
    beforeEach(function() {
      p.points.add({ time: 10, id: 'point_id.1' });
      p.points.add({ time: 5,  id: 'point_id.2' });
    });

    it('should remove all point objects', function() {
      p.points.removeAll();

      var remainingPoints = p.points.getPoints();

      expect(remainingPoints).to.be.empty;
    });

    it('should emit an event', function(done) {
      p.on('points.remove_all', function(param) {
        expect(param).to.be.undefined;

        var remainingPoints = p.points.getPoints();

        expect(remainingPoints).to.be.empty;
        done();
      });

      p.points.removeAll();
    });

    it('should return undefined', function() {
      var result = p.points.removeAll();

      expect(result).to.be.undefined;
    });

    it('should allow the same point ids to be subsequently added', function() {
      p.points.removeAll();

      p.points.add({ time: 6, id: 'point_id.1' });
      p.points.add({ time: 7, id: 'point_id.2' });

      var points = p.points.getPoints();

      expect(points.length).to.equal(2);
      expect(points[0].time).to.equal(6);
      expect(points[1].time).to.equal(7);
    });
  });
});
