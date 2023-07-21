import Peaks from '../src/main';

describe('PointsLayer', function() {
  let p;

  beforeEach(function(done) {
    const options = {
      overview: {
        container: document.getElementById('overview-container')
      },
      zoomview: {
        container: document.getElementById('zoomview-container')
      },
      mediaElement: document.getElementById('media'),
      dataUri: {
        json: 'base/test_data/sample.json'
      }
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
      p = null;
    }
  });

  context('when adding a point', function() {
    it('should create a point marker if the point is visible', function() {
      const zoomview = p.views.getView('zoomview');
      expect(zoomview).to.be.ok;

      const createPointMarker = sinon.spy(zoomview._pointsLayer, '_createPointMarker');

      p.points.add({ time: 0, editable: true });

      expect(createPointMarker.callCount).to.equal(1);
    });

    it('should not create a point marker if the point is not visible', function() {
      const zoomview = p.views.getView('zoomview');
      expect(zoomview).to.be.ok;

      const createPointMarker = sinon.spy(zoomview._pointsLayer, '_createPointMarker');

      p.points.add({ time: 30, editable: true });

      expect(createPointMarker.callCount).to.equal(0);
    });
  });

  context('when updating a point', function() {
    it('should move the point marker if its time has changed', function() {
      const zoomview = p.views.getView('zoomview');
      expect(zoomview).to.be.ok;

      const overview = p.views.getView('overview');
      expect(overview).to.be.ok;

      const point = p.points.add({ time: 0, editable: true });

      const zoomviewPointMarker = zoomview._pointsLayer.getPointMarker(point);
      expect(zoomviewPointMarker).to.be.ok;

      expect(zoomviewPointMarker.getX()).to.equal(0);

      const overviewPointMarker = overview._pointsLayer.getPointMarker(point);
      expect(overviewPointMarker).to.be.ok;

      expect(overviewPointMarker.getX()).to.equal(0);

      const zoomviewPointMarkerUpdate = sinon.spy(zoomviewPointMarker, 'update');
      const overviewPointMarkerUpdate = sinon.spy(overviewPointMarker, 'update');

      point.update({ time: 5.0 });

      expect(zoomviewPointMarker.getX()).to.equal(Math.floor(5.0 * 44100 / p.zoom.getZoomLevel()));
      expect(zoomviewPointMarkerUpdate).calledOnceWithExactly({ time: 5.0 });

      expect(overviewPointMarker.getX()).to.equal(Math.floor(5.0 * 44100 / overview._data.scale));
      expect(overviewPointMarkerUpdate).calledOnceWithExactly({ time: 5.0 });
    });

    it('should remove the point marker if its time has changed and is no longer visible', function() {
      const zoomview = p.views.getView('zoomview');
      expect(zoomview).to.be.ok;

      const createPointMarker = sinon.spy(zoomview._pointsLayer, '_createPointMarker');
      const removePoint = sinon.spy(zoomview._pointsLayer, '_removePoint');

      const point = p.points.add({ time: 0, editable: true });

      const pointMarker = zoomview._pointsLayer.getPointMarker(point);
      expect(pointMarker).to.be.ok;

      const pointMarkerDestroy = sinon.spy(pointMarker, 'destroy');

      point.update({ time: 30.0 });

      expect(createPointMarker.callCount).to.equal(1);
      expect(removePoint.callCount).to.equal(1);
      expect(pointMarkerDestroy.callCount).to.equal(1);
    });

    it('should update the point marker if it is visible', function() {
      const zoomview = p.views.getView('zoomview');
      expect(zoomview).to.be.ok;

      const createPointMarker = sinon.spy(zoomview._pointsLayer, '_createPointMarker');

      const point = p.points.add({ time: 0, editable: true });

      const pointMarker = zoomview._pointsLayer.getPointMarker(point);
      expect(pointMarker).to.be.ok;

      const pointMarkerUpdate = sinon.spy(pointMarker, 'update');

      point.update({ labelText: 'test' });

      expect(createPointMarker.callCount).to.equal(1);
      expect(pointMarkerUpdate.callCount).to.equal(1);
    });

    it('should add the point marker if it has become visible', function() {
      const zoomview = p.views.getView('zoomview');
      expect(zoomview).to.be.ok;

      const createPointMarker = sinon.spy(zoomview._pointsLayer, '_createPointMarker');

      const point = p.points.add({ time: 30, editable: true });

      expect(createPointMarker.callCount).to.equal(0);

      const pointMarker = zoomview._pointsLayer.getPointMarker(point);
      expect(pointMarker).to.equal(undefined);

      point.update({ time: 0, labelText: 'test' });

      expect(createPointMarker.callCount).to.equal(1);
    });

    it('should remove the pointMarker if it is no longer visible', function() {
      const zoomview = p.views.getView('zoomview');
      expect(zoomview).to.be.ok;

      const createPointMarker = sinon.spy(zoomview._pointsLayer, '_createPointMarker');
      const removePoint = sinon.spy(zoomview._pointsLayer, '_removePoint');

      const point = p.points.add({ time: 0, editable: true });

      const pointMarker = zoomview._pointsLayer.getPointMarker(point);
      expect(pointMarker).to.be.ok;

      const pointMarkerDestroy = sinon.spy(pointMarker, 'destroy');

      point.update({ time: 30, labelText: 'test' });

      expect(createPointMarker.callCount).to.equal(1);
      expect(removePoint.callCount).to.equal(1);
      expect(pointMarkerDestroy.callCount).to.equal(1);
    });
  });
});
