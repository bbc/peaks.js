import Peaks from '../../src/main';

describe('WaveformView', function() {
  var p;
  var waveformLayerDraw;

  beforeEach(function(done) {
    var options = {
      containers: {
        overview: document.getElementById('overview-container'),
        zoomview: document.getElementById('zoomview-container')
      },
      mediaElement: document.getElementById('media'),
      dataUri: 'base/test_data/sample.json'
    };

    Peaks.init(options, function(err, instance) {
      expect(err).to.equal(null);

      p = instance;

      var zoomview = instance.views.getView('zoomview');
      expect(zoomview).to.be.ok;
      waveformLayerDraw = sinon.spy(zoomview, '_drawWaveformLayer');

      done();
    });
  });

  afterEach(function() {
    if (p) {
      p.destroy();
      p = null;
    }
  });

  describe('setAmplitudeScale', function() {
    ['zoomview', 'overview'].forEach(function(viewName) {
      describe(viewName, function() {
        it('should set the amplitude scale to default', function() {
          var view = p.views.getView(viewName);

          expect(function() {
            view.setAmplitudeScale(1.2);
          }).to.not.throw();

          expect(view.getAmplitudeScale()).to.equal(1.2);
        });

        it('should throw if no scale is given', function() {
          var view = p.views.getView(viewName);

          expect(function() {
            view.setAmplitudeScale();
          }).to.throw(/Scale must be a valid number/);
        });

        it('should throw if an invalid scale is given', function() {
          var view = p.views.getView(viewName);

          expect(function() {
            view.setAmplitudeScale('test');
          }).to.throw(/Scale must be a valid number/);
        });

        it('should throw if an invalid number is given', function() {
          var view = p.views.getView(viewName);

          expect(function() {
            view.setAmplitudeScale(Infinity);
          }).to.throw(/Scale must be a valid number/);
        });
      });
    });
  });

  describe('setWaveformColor', function() {
    ['zoomview', 'overview'].forEach(function(viewName) {
      describe(viewName, function() {
        it('should set the waveform color', function() {
          var view = p.views.getView(viewName);

          view.setWaveformColor('#ff0000');

          expect(view._waveformShape._shape.fill()).to.equal('#ff0000');
        });
      });
    });
  });

  describe('setPlayedWaveformColor', function() {
    ['zoomview', 'overview'].forEach(function(viewName) {
      describe(viewName, function() {
        it('should set the color of the waveform behind the playhead', function() {
          var view = p.views.getView(viewName);

          view.setPlayedWaveformColor('#ff0000');

          expect(view._playedWaveformShape._shape.fill()).to.equal('#ff0000');
        });
      });
    });
  });

  describe('scrollWaveform', function() {
    describe('zoomview', function() {
      var zoomview;

      beforeEach(function() {
        zoomview = p.views.getView('zoomview');
      });

      it('should scroll the waveform to the right by the given number of seconds', function() {
        zoomview.scrollWaveform({ seconds: 2.0 });

        expect(waveformLayerDraw.callCount).to.equal(1);
        expect(zoomview.getStartTime()).to.equal(1.9969160997732427);
      });

      it('should scroll the waveform to the left by the given number of seconds', function() {
        zoomview.scrollWaveform({ seconds: 2.0 });
        zoomview.scrollWaveform({ seconds: -2.0 });

        expect(waveformLayerDraw.callCount).to.equal(2);
        expect(zoomview.getStartTime()).to.equal(0);
      });

      it('should scroll the waveform to the right by the given number of pixels', function() {
        zoomview.scrollWaveform({ pixels: 100 });

        expect(waveformLayerDraw.callCount).to.equal(1);
        expect(zoomview.getStartTime()).to.equal(1.1609977324263039);
      });

      it('should scroll the waveform to the left by the given number of pixels', function() {
        zoomview.scrollWaveform({ pixels: 100 });
        zoomview.scrollWaveform({ pixels: -100 });

        expect(waveformLayerDraw.callCount).to.equal(2);
        expect(zoomview.getStartTime()).to.equal(0);
      });

      it('throw if not give a number of pixels or seconds', function() {
        expect(function() {
          zoomview.scrollWaveform(100);
        }).to.throw(TypeError);
      });
    });
  });

  describe('showAxisLabels', function() {
    ['zoomview', 'overview'].forEach(function(viewName) {
      describe(viewName, function() {
        it('should hide the time axis labels', function() {
          var view = p.views.getView(viewName);
          var axisLayerDraw = sinon.spy(view._axisLayer, 'draw');

          view.showAxisLabels(false);

          expect(axisLayerDraw.callCount).to.equal(1);
        });
      });
    });
  });
});
