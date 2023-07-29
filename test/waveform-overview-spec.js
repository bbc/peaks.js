import Peaks from '../src/main';

import InputController from './helpers/input-controller';
import { getEmitCalls } from './helpers/utils';

import Konva from 'konva';

describe('WaveformOverview', function() {
  let p = null;

  beforeEach(function() {
    const mediaElement = document.createElement('audio');
    mediaElement.id = 'audio';
    mediaElement.src = '/base/test_data/STAT3S3.mp3';
    mediaElement.muted = true;
    document.body.appendChild(mediaElement);
  });

  afterEach(function() {
    if (p) {
      p.destroy();
      p = null;
    }
  });

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

          p = instance;

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
          mediaElement: document.getElementById('audio'),
          dataUri: { arraybuffer: '/base/test_data/STAT3S3.dat' }
        };

        Peaks.init(options, function(err, instance) {
          if (err) {
            done(err);
            return;
          }

          p = instance;

          const view = instance.views.getView();
          expect(view._data).to.be.ok;
          expect(view._data.scale).to.equal(32);
          done();
        });
      });
    });
  });

  describe('enableSeek', function() {
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

  describe('click events', function() {
    let inputController = null;

    beforeEach(function(done) {
      // TODO: Konva.js uses global state to handle double click timing.
      // Instead of adding time delays, we just reset Konva's internal
      // flag here.
      Konva._mouseInDblClickWindow = false;

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

    it('should emit an overview.click event', function() {
      const emit = sinon.spy(p, 'emit');

      inputController.mouseDown({ x: 100, y: 50 });
      inputController.mouseUp({ x: 100, y: 50 });

      const calls = getEmitCalls(emit, /overview/);

      expect(calls.length).to.equal(1);

      expect(calls[0].args[0]).to.equal('overview.click');
      expect(calls[0].args[1].evt).to.be.an.instanceOf(MouseEvent);
      expect(calls[0].args[1].time).to.be.a('number');
    });

    it('should emit an overview.dblclick event', function() {
      const emit = sinon.spy(p, 'emit');

      inputController.mouseDown({ x: 100, y: 50 });
      inputController.mouseUp({ x: 100, y: 50 });
      inputController.mouseDown({ x: 100, y: 50 });
      inputController.mouseUp({ x: 100, y: 50 });

      const calls = getEmitCalls(emit, /overview/);

      expect(calls.length).to.equal(3);

      expect(calls[0].args[0]).to.equal('overview.click');
      expect(calls[1].args[0]).to.equal('overview.click');
      expect(calls[2].args[0]).to.equal('overview.dblclick');

      expect(calls[0].args[1].evt).to.be.an.instanceOf(MouseEvent);
      expect(calls[0].args[1].time).to.be.a('number');
    });
  });
});
