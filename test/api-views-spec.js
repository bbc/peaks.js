import Peaks from '../src/main';
import WaveformOverview from '../src/waveform-overview';
import WaveformZoomView from '../src/waveform-zoomview';

describe('Peaks.views', function() {
  let p;

  afterEach(function() {
    if (p) {
      p.destroy();
    }
  });

  describe('createZoomview', function() {
    context('with existing zoomview', function() {
      beforeEach(function(done) {
        const options = {
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

      it('should return the existing zoomview instance', function() {
        const view = p.views.getView('zoomview');

        expect(view).to.be.an.instanceOf(WaveformZoomView);

        const zoomviewContainer = document.getElementById('zoomview-container');

        expect(p.views.createZoomview(zoomviewContainer)).to.equal(view);
      });
    });

    context('without existing zoomview', function() {
      beforeEach(function(done) {
        const options = {
          overview: {
            container: document.getElementById('overview-container')
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

      it('should return a new zoomview instance', function() {
        expect(p.views.getView('zoomview')).to.equal(null);

        const zoomviewContainer = document.getElementById('zoomview-container');

        const view = p.views.createZoomview(zoomviewContainer);

        expect(view).to.be.an.instanceOf(WaveformZoomView);

        expect(p.views.getView('zoomview')).to.equal(view);
      });
    });
  });

  describe('createOverview', function() {
    context('with existing overview', function() {
      beforeEach(function(done) {
        const options = {
          overview: {
            container: document.getElementById('overview-container')
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

      it('should return the existing overview instance', function() {
        const view = p.views.getView('overview');

        expect(view).to.be.an.instanceOf(WaveformOverview);

        const overviewContainer = document.getElementById('overview-container');

        expect(p.views.createOverview(overviewContainer)).to.equal(view);
      });
    });

    context('without existing overview', function() {
      beforeEach(function(done) {
        const options = {
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

      it('should return a new overview instance', function() {
        expect(p.views.getView('overview')).to.equal(null);

        const overviewContainer = document.getElementById('overview-container');

        const view = p.views.createOverview(overviewContainer);

        expect(view).to.be.an.instanceOf(WaveformOverview);

        expect(p.views.getView('overview')).to.equal(view);
      });
    });
  });

  describe('getView', function() {
    context('with zoomview and overview containers', function() {
      beforeEach(function(done) {
        const options = {
          zoomview: {
            container: document.getElementById('zoomview-container')
          },
          overview: {
            container: document.getElementById('overview-container')
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

      it('should return the zoomview', function() {
        const view = p.views.getView('zoomview');
        expect(view).to.be.an.instanceOf(WaveformZoomView);
      });

      it('should return the overview', function() {
        const view = p.views.getView('overview');
        expect(view).to.be.an.instanceOf(WaveformOverview);
      });

      it('should return null if given no view name', function() {
        const view = p.views.getView();
        expect(view).to.equal(null);
      });

      it('should return null if given an invalid view name', function() {
        const view = p.views.getView('unknown');
        expect(view).to.equal(null);
      });
    });

    context('with only a zoomview container', function() {
      beforeEach(function(done) {
        const options = {
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

      it('should return the zoomview', function() {
        const view = p.views.getView('zoomview');
        expect(view).to.be.an.instanceOf(WaveformZoomView);
      });

      it('should return null if given the overview view name', function() {
        const view = p.views.getView('overview');
        expect(view).to.equal(null);
      });

      it('should return the zoomview if given no view name', function() {
        const view = p.views.getView();
        expect(view).to.be.an.instanceOf(WaveformZoomView);
      });

      it('should return null if given an invalid view name', function() {
        const view = p.views.getView('unknown');
        expect(view).to.equal(null);
      });
    });

    context('with only an overview container', function() {
      beforeEach(function(done) {
        const options = {
          overview: {
            container: document.getElementById('overview-container')
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

      it('should return null if given the zoomview view name', function() {
        const view = p.views.getView('zoomview');
        expect(view).to.equal(null);
      });

      it('should return the overview', function() {
        const view = p.views.getView('overview');
        expect(view).to.be.an.instanceOf(WaveformOverview);
      });

      it('should return the overview if given no view name', function() {
        const view = p.views.getView();
        expect(view).to.be.an.instanceOf(WaveformOverview);
      });

      it('should return null if given an invalid view name', function() {
        const view = p.views.getView('unknown');
        expect(view).to.equal(null);
      });
    });
  });

  describe('destroyZoomview', function() {
    context('with zoomview and overview containers', function() {
      beforeEach(function(done) {
        const options = {
          zoomview: {
            container: document.getElementById('zoomview-container')
          },
          overview: {
            container: document.getElementById('overview-container')
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

      it('should destroy the zoomview', function() {
        const view = p.views.getView('zoomview');
        const spy = sinon.spy(view, 'destroy');

        p.views.destroyZoomview();

        expect(p.views.getView('zoomview')).to.equal(null);
        expect(spy.callCount).to.equal(1);
      });
    });

    context('with only a zoomview', function() {
      beforeEach(function(done) {
        const options = {
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

      it('should not destroy the zoomview', function() {
        p.views.destroyZoomview();

        expect(p.views.getView('zoomview')).to.be.an.instanceOf(WaveformZoomView);
      });
    });

    context('with no zoomview', function() {
      beforeEach(function(done) {
        const options = {
          overview: {
            container: document.getElementById('overview-container')
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

      it('should do nothing', function() {
        p.views.destroyZoomview();

        expect(p.views.getView('zoomview')).to.equal(null);
      });
    });
  });

  describe('destroyOverview', function() {
    context('with zoomview and overview containers', function() {
      beforeEach(function(done) {
        const options = {
          zoomview: {
            container: document.getElementById('zoomview-container')
          },
          overview: {
            container: document.getElementById('overview-container')
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

      it('should destroy the overview', function() {
        const view = p.views.getView('overview');
        const spy = sinon.spy(view, 'destroy');

        p.views.destroyOverview();

        expect(p.views.getView('overview')).to.equal(null);
        expect(spy.callCount).to.equal(1);
      });
    });

    context('with only an overview', function() {
      beforeEach(function(done) {
        const options = {
          overview: {
            container: document.getElementById('overview-container')
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

      it('should not destroy the overview', function() {
        p.views.destroyOverview();

        expect(p.views.getView('overview')).to.be.an.instanceOf(WaveformOverview);
      });
    });

    context('with no overview', function() {
      beforeEach(function(done) {
        const options = {
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

      it('should do nothing', function() {
        p.views.destroyOverview();

        expect(p.views.getView('overview')).to.equal(null);
      });
    });
  });
});
