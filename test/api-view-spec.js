import Peaks from '../src/main';

describe('WaveformView', function() {
  let p;
  let drawWaveformLayer;
  let logger;

  beforeEach(function(done) {
    logger = sinon.spy();

    const options = {
      overview: {
        container: document.getElementById('overview-container')
      },
      zoomview: {
        container: document.getElementById('zoomview-container')
      },
      mediaElement: document.getElementById('media'),
      dataUri: {
        arraybuffer: 'base/test_data/sample.dat'
      },
      logger: logger
    };

    Peaks.init(options, function(err, instance) {
      expect(err).to.equal(null);

      p = instance;

      const zoomview = instance.views.getView('zoomview');
      expect(zoomview).to.be.ok;
      drawWaveformLayer = sinon.spy(zoomview, 'drawWaveformLayer');

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
          const view = p.views.getView(viewName);

          expect(function() {
            view.setAmplitudeScale(1.2);
          }).to.not.throw();

          expect(view.getAmplitudeScale()).to.equal(1.2);
        });

        it('should throw if no scale is given', function() {
          const view = p.views.getView(viewName);

          expect(function() {
            view.setAmplitudeScale();
          }).to.throw(/Scale must be a valid number/);
        });

        it('should throw if an invalid scale is given', function() {
          const view = p.views.getView(viewName);

          expect(function() {
            view.setAmplitudeScale('test');
          }).to.throw(/Scale must be a valid number/);
        });

        it('should throw if an invalid number is given', function() {
          const view = p.views.getView(viewName);

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
          const view = p.views.getView(viewName);

          view.setWaveformColor('#ff0000');

          expect(view._waveformShape._shape.fill()).to.equal('#ff0000');
        });

        it('should set the waveform to a linear gradient color', function() {
          const view = p.views.getView(viewName);

          view.setWaveformColor({
            linearGradientStart: 20,
            linearGradientEnd: 60,
            linearGradientColorStops: ['hsl(180, 78%, 46%)', 'hsl(180, 78%, 16%)']
          });

          expect(view._waveformShape._shape.fillLinearGradientStartPointY()).to.equal(20);
          expect(view._waveformShape._shape.fillLinearGradientEndPointY()).to.equal(60);
          expect(view._waveformShape._shape.fillLinearGradientColorStops().length).to.equal(4);
        });
      });
    });
  });

  describe('setPlayedWaveformColor', function() {
    ['zoomview', 'overview'].forEach(function(viewName) {
      describe(viewName, function() {
        it('should set the color of the waveform behind the playhead', function() {
          const view = p.views.getView(viewName);

          view.setPlayedWaveformColor('#ff0000');

          expect(view._playedWaveformShape._shape.fill()).to.equal('#ff0000');
        });
      });
    });
  });

  describe('scrollWaveform', function() {
    describe('zoomview', function() {
      let zoomview;

      beforeEach(function() {
        zoomview = p.views.getView('zoomview');
      });

      it('should scroll the waveform to the right by the given number of seconds', function() {
        zoomview.scrollWaveform({ seconds: 2.0 });

        expect(drawWaveformLayer.callCount).to.equal(1);
        expect(zoomview.getStartTime()).to.equal(1.9969160997732427);
      });

      it('should scroll the waveform to the left by the given number of seconds', function() {
        zoomview.scrollWaveform({ seconds: 2.0 });
        zoomview.scrollWaveform({ seconds: -2.0 });

        expect(drawWaveformLayer.callCount).to.equal(2);
        expect(zoomview.getStartTime()).to.equal(0);
      });

      it('should scroll the waveform to the right by the given number of pixels', function() {
        zoomview.scrollWaveform({ pixels: 100 });

        expect(drawWaveformLayer.callCount).to.equal(1);
        expect(zoomview.getStartTime()).to.equal(1.1609977324263039);
      });

      it('should scroll the waveform to the left by the given number of pixels', function() {
        zoomview.scrollWaveform({ pixels: 100 });
        zoomview.scrollWaveform({ pixels: -100 });

        expect(drawWaveformLayer.callCount).to.equal(2);
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
          const view = p.views.getView(viewName);
          const axisLayerDraw = sinon.spy(view._axisLayer, 'draw');

          view.showAxisLabels(false);

          expect(axisLayerDraw.callCount).to.equal(1);
        });
      });
    });
  });

  describe('setZoom', function() {
    describe('zoomview', function() {
      context('with scale option', function() {
        context('with target scale greater than the original waveform data', function() {
          it('should set the new zoom level', function() {
            const view = p.views.getView('zoomview');

            view.setZoom({ scale: 512 });

            expect(view._scale).to.equal(512);
            expect(logger.notCalled).to.equal(true);
          });
        });

        context('with target scale lower than the original waveform data', function() {
          it('should log an error and not change the zoom level', function() {
            const view = p.views.getView('zoomview');

            view.setZoom({ scale: 128 });

            expect(view._scale).to.equal(256);
            expect(logger.calledOnce).to.equal(true);
          });
        });

        context('with non-integer scale', function() {
          it('should round the scale down to an integer value', function() {
            const view = p.views.getView('zoomview');

            const resampleData = sinon.spy(view, '_resampleData');

            view.setZoom({ scale: 500.5 });

            expect(resampleData.callCount).to.equal(1);
            expect(resampleData).calledWithExactly({ scale: 500 });
            expect(view._scale).to.equal(500);
          });
        });

        context('with auto option', function() {
          it('should fit the waveform to the width of the view', function() {
            const view = p.views.getView('zoomview');

            view.setZoom({ scale: 'auto' });

            expect(view._data.length).to.equal(1000);
          });
        });
      });

      context('with seconds option', function() {
        context('with target scale greater than the original waveform data', function() {
          it('should set the new zoom level', function() {
            const view = p.views.getView('zoomview');

            view.setZoom({ seconds: 10.0 });

            expect(view._scale).to.equal(441);
            expect(logger.notCalled).to.equal(true);
          });
        });

        context('with target scale lower than the original waveform data', function() {
          it('should log an error and not change the zoom level', function() {
            const view = p.views.getView('zoomview');

            view.setZoom({ seconds: 1.0 });

            expect(view._scale).to.equal(256);
            expect(logger.calledOnce).to.equal(true);
          });
        });

        context('with auto option', function() {
          it('should fit the waveform to the width of the view', function() {
            const view = p.views.getView('zoomview');

            view.setZoom({ seconds: 'auto' });

            expect(view._data.length).to.equal(1000);
          });
        });
      });
    });
  });
});
