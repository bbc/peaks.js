import Peaks from '../src/main';

import InputController from './helpers/input-controller';

describe('WaveformOverview', function() {
  describe('constructor', function() {
    context('with waveform longer than the container width', function() {
      it('should rescale the waveform to fit the container width', function(done) {
        const container = document.getElementById('overview-container');

        const options = {
          overview: {
            container: container
          },
          mediaElement: document.getElementById('media'),
          dataUri: { arraybuffer: '/base/test_data/sample.dat' }
        };

        Peaks.init(options, function(err, instance) {
          if (err) {
            done(err);
            return;
          }

          const overview = instance.views.getView('overview');
          expect(overview._data).to.be.ok;

          // TODO: Resampling by width isn't precise
          const diff = Math.abs(overview._data.length - container.offsetWidth);
          expect(diff).to.be.lessThan(2);

          done();
        });
      });
    });

    context('with waveform shorter than the container width', function() {
      it('should use default waveform scale', function(done) {
        const options = {
          overview: {
            container: document.getElementById('overview-container')
          },
          mediaElement: document.getElementById('media'),
          dataUri: { arraybuffer: '/base/test_data/STAT3S3.dat' }
        };

        Peaks.init(options, function(err, instance) {
          if (err) {
            done(err);
            return;
          }

          const view = instance.views.getView();
          expect(view._data).to.be.ok;
          expect(view._data.scale).to.equal(32);
          done();
        });
      });
    });
  });

  describe('enableSeek', function() {
    let p = null;
    let inputController = null;

    beforeEach(function(done) {
      const options = {
        overview: {
          container: document.getElementById('overview-container')
        },
        mediaElement: document.getElementById('media'),
        dataUri: { arraybuffer: '/base/test_data/sample.dat' }
      };

      Peaks.init(options, function(err, instance) {
        if (err) {
          done(err);
          return;
        }

        p = instance;

        inputController = new InputController('overview-container');

        done();
      });
    });

    afterEach(function() {
      if (p) {
        p.destroy();
        p = null;
      }
    });

    context('when enabled', function() {
      context('when clicking on the waveform', function() {
        it('should set the playback position', function() {
          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseUp({ x: 100, y: 50 });

          const view = p.views.getView('overview');

          expect(p.player.getCurrentTime()).to.be.closeTo(view.pixelsToTime(100), 0.01);
        });
      });

      context('when dragging the waveform to the left', function() {
        it('should set the playback position', function() {
          const distance = -50;

          inputController.mouseDown({ x: 50, y: 50 });
          inputController.mouseMove({ x: 50 + distance, y: 50 });
          inputController.mouseUp({ x: 50 + distance, y: 50 });

          expect(p.player.getCurrentTime()).to.equal(0);
        });

        it('should not scroll beyond the start of the waveform', function() {
          const distance = -200;

          inputController.mouseDown({ x: 50, y: 50 });
          inputController.mouseMove({ x: 50 + distance, y: 50 });
          inputController.mouseUp({ x: 50 + distance, y: 50 });

          expect(p.player.getCurrentTime()).to.equal(0);
        });
      });

      context('when dragging the waveform to the right', function() {
        it('should set the playback position', function() {
          const distance = 100;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const view = p.views.getView('overview');

          expect(p.player.getCurrentTime()).to.be.closeTo(view.pixelsToTime(200), 0.01);
        });

        it('should limit the playback position to the end of the waveform', function() {
          const distance = 1200;

          inputController.mouseDown({ x: 50, y: 50 });
          inputController.mouseMove({ x: 50 + distance, y: 50 });
          inputController.mouseUp({ x: 50 + distance, y: 50 });

          expect(p.player.getCurrentTime()).to.equal(p.player.getDuration());
        });
      });
    });

    context('when disabled', function() {
      beforeEach(function() {
        const view = p.views.getView('overview');
        view.enableSeek(false);
      });

      context('when clicking on the waveform', function() {
        it('should not change the playback position', function() {
          const time = p.player.getCurrentTime();

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseUp({ x: 100, y: 50 });

          expect(p.player.getCurrentTime()).to.equal(time);
        });
      });

      context('when dragging the waveform', function() {
        it('should not change the playback position', function() {
          const distance = 100;
          const time = p.player.getCurrentTime();

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          expect(p.player.getCurrentTime()).to.equal(time);
        });
      });
    });
  });
});
