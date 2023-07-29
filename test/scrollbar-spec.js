import Peaks from '../src/main';

import InputController from './helpers/input-controller';

describe('Scrollbar', function() {
  let p = null;
  let inputController = null;
  let zoomview = null;

  context('with only a zoomview waveform', function() {
    beforeEach(function(done) {
      const options = {
        zoomview: {
          container: document.getElementById('zoomview-container')
        },
        scrollbar: {
          container: document.getElementById('scrollbar-container')
        },
        mediaElement: document.getElementById('media'),
        dataUri: {
          arraybuffer: 'base/test_data/sample.dat'
        }
      };

      Peaks.init(options, function(err, instance) {
        if (err) {
          done(err);
          return;
        }

        p = instance;
        inputController = new InputController('scrollbar-container');
        zoomview = p.views.getView('zoomview');

        done();
      });
    });

    afterEach(function() {
      if (p) {
        p.destroy();
        p = null;
      }
    });

    context('when dragging the scrollbox to the right', function() {
      it('should update the scroll position', function() {
        const distance = 50;

        const updateWaveform = sinon.spy(zoomview, 'updateWaveform');

        inputController.mouseDown({ x: 50, y: 8 });
        inputController.mouseMove({ x: 50 + distance, y: 8 });
        inputController.mouseUp({ x: 50 + distance, y: 8 });

        expect(updateWaveform.callCount).to.equal(1);
        expect(updateWaveform).calledWithExactly(141);
      });
    });

    context('when dragging the scrollbox to the left', function() {
      beforeEach(function() {
        zoomview.updateWaveform(1000);
      });

      it('should update the scroll position', function() {
        const distance = -50;

        const updateWaveform = sinon.spy(zoomview, 'updateWaveform');

        inputController.mouseDown({ x: 500, y: 8 });
        inputController.mouseMove({ x: 500 + distance, y: 8 });
        inputController.mouseUp({ x: 500 + distance, y: 8 });

        expect(updateWaveform.callCount).to.equal(1);
        expect(updateWaveform).calledWithExactly(857);
      });
    });

    context('when clicking to the left of the scrollbox', function() {
      beforeEach(function() {
        zoomview.updateWaveform(1000);
      });

      it('should update the scroll position', function() {
        const updateWaveform = sinon.spy(zoomview, 'updateWaveform');

        inputController.mouseDown({ x: 50, y: 8 });
        inputController.mouseUp({ x: 50, y: 8 });

        expect(updateWaveform.callCount).to.equal(1);
        expect(updateWaveform).calledWithExactly(0);
      });
    });

    context('when clicking to the right of the scrollbox', function() {
      beforeEach(function() {
        zoomview.updateWaveform(1000);
      });

      it('should update the scroll position', function() {
        const updateWaveform = sinon.spy(zoomview, 'updateWaveform');

        inputController.mouseDown({ x: 900, y: 8 });
        inputController.mouseUp({ x: 900, y: 8 });

        expect(updateWaveform.callCount).to.equal(1);
        expect(updateWaveform).calledWithExactly(2040);
      });
    });
  });

  context('with only an overview waveform', function() {
    beforeEach(function(done) {
      const options = {
        overview: {
          container: document.getElementById('overview-container')
        },
        scrollbar: {
          container: document.getElementById('scrollbar-container')
        },
        mediaElement: document.getElementById('media'),
        dataUri: {
          arraybuffer: 'base/test_data/sample.dat'
        }
      };

      Peaks.init(options, function(err, instance) {
        if (err) {
          done(err);
          return;
        }

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

    it('should set the scrollbox width to the maximum width', function() {
      const scrollbar = p.views._scrollbar;

      expect(scrollbar._scrollboxRect.getX()).to.equal(0);
      expect(scrollbar._scrollboxRect.getWidth()).to.equal(1000);
    });

    context('when a zoomview is created', function() {
      it('should update the scrollbar state', function() {
        const container = document.getElementById('zoomview-container');
        p.views.createZoomview(container);

        const scrollbar = p.views._scrollbar;

        expect(scrollbar._scrollboxRect.getX()).to.equal(0);
        expect(scrollbar._scrollboxRect.getWidth()).to.equal(353);
      });
    });
  });
});
