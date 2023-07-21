import Peaks from '../src/main';

import InputController from './helpers/input-controller';

describe('KeyboardHandler', function() {
  let p = null;
  let zoomview = null;
  let inputController = null;

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
        arraybuffer: 'base/test_data/sample.dat'
      },
      keyboard: true
    };

    Peaks.init(options, function(err, instance) {
      expect(err).to.equal(null);

      p = instance;
      zoomview = instance.views.getView('zoomview');
      expect(zoomview).to.be.ok;

      inputController = new InputController('zoomview-container');

      done();
    });
  });

  afterEach(function() {
    if (p) {
      p.destroy();
      p = null;
      zoomview = null;
      inputController = null;
    }
  });

  describe('when the right arrow key is pressed', function() {
    it('should scroll the waveform to the right', function() {
      inputController.keyUp('ArrowRight', false);

      expect(zoomview.getStartTime()).to.be.closeTo(1.0, 0.01);
    });
  });

  describe('when the right arrow key is pressed (shifted)', function() {
    it('should scroll the waveform to the right', function() {
      inputController.keyUp('ArrowRight', true);

      expect(zoomview.getStartTime()).to.equal(zoomview.pixelsToTime(zoomview.getWidth()));
    });
  });

  describe('when the left arrow key is pressed', function() {
    it('should scroll the waveform to the left', function() {
      zoomview.setStartTime(10.0);

      inputController.keyUp('ArrowLeft', false);

      expect(zoomview.getStartTime()).to.be.closeTo(9.0, 0.01);
    });
  });

  describe('when the left arrow key is pressed (shifted)', function() {
    it('should scroll the waveform to the left', function() {
      zoomview.setStartTime(20.0);

      inputController.keyUp('ArrowLeft', true);

      expect(zoomview.getStartTime()).to.be.closeTo(20.0 - zoomview.pixelsToTime(zoomview.getWidth()), 0.1);
    });
  });
});
