import Peaks from '../../src/main';

describe('SegmentsLayer', function() {
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

  context('when adding a segment', function() {
    it('should redraw the view if the segment is visible', function() {
      const zoomview = p.views.getView('zoomview');
      expect(zoomview).to.be.ok;

      const spy = sinon.spy(zoomview._segmentsLayer, '_createSegmentShape');

      p.segments.add({ startTime: 0, endTime: 10, editable: true, id: 'segment1' });

      expect(spy.callCount).to.equal(1);
    });

    it('should not redraw the view if the segment is not visible', function() {
      const zoomview = p.views.getView('zoomview');
      expect(zoomview).to.be.ok;

      const spy = sinon.spy(zoomview._segmentsLayer, '_createSegmentShape');

      p.segments.add({ startTime: 28, endTime: 32, editable: true, id: 'segment2' });

      expect(spy.callCount).to.equal(0);
    });
  });
});
