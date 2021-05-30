import Peaks from '../../src/main';

describe('Peaks.zoom', function() {
  var p;

  beforeEach(function(done) {
    var options = {
      containers: {
        overview: document.getElementById('overview-container'),
        zoomview: document.getElementById('zoomview-container')
      },
      mediaElement: document.getElementById('media'),
      dataUri: {
        json: 'base/test_data/sample.json'
      },
      zoomLevels: [512, 1024]
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

  describe('getZoom', function() {
    it('should return the initial zoom level index', function() {
      expect(p.zoom.getZoom()).to.equal(0);
    });
  });

  describe('setZoom', function() {
    it('should update the zoom level index', function() {
      p.zoom.setZoom(1);

      expect(p.zoom.getZoom()).to.equal(1);
    });

    it('should emit a zoom.update event with the new zoom level index', function() {
      var spy = sinon.spy();

      p.on('zoom.update', spy);
      p.zoom.setZoom(1);

      expect(spy).to.have.been.calledWith(1024, 512);
    });

    it('should limit the zoom level index value to the minimum valid index', function() {
      p.zoom.setZoom(-1);

      expect(p.zoom.getZoom()).to.equal(0);
    });

    it('should limit the zoom level index to the maximum valid index', function() {
      p.zoom.setZoom(2);

      expect(p.zoom.getZoom()).to.equal(1);
    });

    it('should not throw an exception if an existing zoom level does not have sufficient data', function() {
      expect(function() {
        p.zoom.setZoom(3);
      }).not.to.throw();
    });
  });

  describe('zoomOut', function() {
    it('should call setZoom with a bigger zoom level', function() {
      var spy = sinon.spy();

      p.on('zoom.update', spy);
      p.zoom.zoomOut();

      expect(spy).to.have.been.calledWith(1024, 512);
    });
  });

  describe('zoomIn', function() {
    it('should call setZoom with a smaller zoom level', function() {
      p.zoom.setZoom(1);

      var spy = sinon.spy();

      p.on('zoom.update', spy);
      p.zoom.zoomIn();

      expect(spy).to.have.been.calledWith(512, 1024);
    });
  });
});
