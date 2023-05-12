import Peaks from '../../src/main';
import { Segment } from '../../src/segment';

import InputController from '../helpers/input-controller';

function getEmitCalls(emit, eventName) {
  const calls = [];

  for (let i = 0; i < emit.callCount; i++) {
    const call = emit.getCall(i);

    if (call.args[0] === eventName) {
      calls.push(call);
    }
  }

  return calls;
}

describe('WaveformZoomview', function() {
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
        json: 'base/test_data/sample.json'
      },
      segments: [
        { id: 'segment1', startTime: 1.0, endTime: 2.0, editable: true }
      ]
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
    }
  });

  describe('enableSegmentDragging', function() {
    context('when enabled', function() {
      beforeEach(function() {
        zoomview.enableSegmentDragging(true);
      });

      context('when dragging a segment', function() {
        it('should move the segment to the right', function() {
          const distance = 50;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const segment = p.segments.getSegment('segment1');

          expect(segment.startTime).to.equal(1.0 + distance * p.zoom.getZoomLevel() / 44100);
          expect(segment.endTime).to.equal(2.0 + distance * p.zoom.getZoomLevel() / 44100);
        });

        it('should move the segment to the left', function() {
          const distance = -50;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const segment = p.segments.getSegment('segment1');

          expect(segment.startTime).to.equal(1.0 + distance * p.zoom.getZoomLevel() / 44100);
          expect(segment.endTime).to.equal(2.0 + distance * p.zoom.getZoomLevel() / 44100);
        });

        it('should prevent the start time from becoming less than zero', function() {
          const distance = -100;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const segment = p.segments.getSegment('segment1');

          expect(segment.startTime).to.equal(0.0);
          expect(segment.endTime).to.equal(1.0);
        });

        it('should emit a segments.dragged event', function() {
          const emit = sinon.spy(p, 'emit');

          const distance = 50;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const calls = getEmitCalls(emit, 'segments.dragged');
          expect(calls.length).to.equal(1);

          expect(calls[0].args[1].segment).to.be.an.instanceof(Segment);
          expect(calls[0].args[1].marker).to.equal(false);
          expect(calls[0].args[1].segment.startTime).to.equal(1.0 + distance * p.zoom.getZoomLevel() / 44100);
          expect(calls[0].args[1].segment.endTime).to.equal(2.0 + distance * p.zoom.getZoomLevel() / 44100);
        });
      });

      context('when dragging the waveform', function() {
        it('should move the waveform to the right', function() {
          const distance = 50;

          inputController.mouseDown({ x: 50, y: 50 });
          inputController.mouseMove({ x: 50 - distance, y: 50 });
          inputController.mouseUp({ x: 50 - distance, y: 50 });

          expect(zoomview.getFrameOffset()).to.equal(50);
          expect(zoomview.getStartTime()).to.equal(0.0 + distance * p.zoom.getZoomLevel() / 44100);
        });
      });
    });

    context('when disabled', function() {
      context('when dragging the waveform view', function() {
        it('should scroll the waveform to the right', function() {
          const distance = 100;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 - distance, y: 50 });
          inputController.mouseUp({ x: 100 - distance, y: 50 });

          expect(zoomview.getFrameOffset()).to.equal(100);
          expect(zoomview.getStartTime()).to.equal(0.0 + distance * p.zoom.getZoomLevel() / 44100);
        });

        it('should scroll the waveform to the left', function() {
          zoomview.updateWaveform(500);

          const distance = 100;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          expect(zoomview.getFrameOffset()).to.equal(400);
          expect(zoomview.getStartTime()).to.equal(400 * p.zoom.getZoomLevel() / 44100);
        });

        it('should prevent the start time from becoming less than zero', function() {
          zoomview.updateWaveform(100);

          const distance = 150;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          expect(zoomview.getFrameOffset()).to.equal(0);
          expect(zoomview.getStartTime()).to.equal(0);
        });
      });
    });
  });
});
