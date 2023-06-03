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

  describe('setSegmentDragMode', function() {
    beforeEach(function(done) {
      p.segments.add({ id: 'segment2', startTime: 3.0, endTime: 4.0, editable: true });
      zoomview.enableSegmentDragging(true);
      setTimeout(done, 50);
    });

    context('overlap', function() {
      beforeEach(function() {
        zoomview.setSegmentDragMode('overlap');
      });

      context('when dragging a segment over the next segment', function() {
        it('should emit a segments.dragged event', function() {
          const emit = sinon.spy(p, 'emit');

          const distance = 150;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const calls = getEmitCalls(emit, 'segments.dragged');
          expect(calls.length).to.equal(1);

          expect(calls[0].args[1].segment).to.be.an.instanceof(Segment);
          expect(calls[0].args[1].segment.startTime).to.equal(1.0 + distance * p.zoom.getZoomLevel() / 44100);
          expect(calls[0].args[1].segment.endTime).to.equal(2.0 + distance * p.zoom.getZoomLevel() / 44100);
        });

        it('should not move the next segment', function() {
          const distance = 150;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const nextSegment = p.segments.getSegment('segment2');

          expect(nextSegment.startTime).to.equal(3.0);
          expect(nextSegment.endTime).to.equal(4.0);
        });
      });
    });

    context('no-overlap', function() {
      beforeEach(function() {
        zoomview.setSegmentDragMode('no-overlap');
      });
    });

    context('compress', function() {
      beforeEach(function() {
        zoomview.setSegmentDragMode('compress');
        zoomview.setMinSegmentDragWidth(20);
      });

      context('when dragging a segment over the next segment', function() {
        it('should emit a segments.dragged event', function() {
          const emit = sinon.spy(p, 'emit');

          const distance = 150;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const calls = getEmitCalls(emit, 'segments.dragged');
          expect(calls.length).to.equal(2);

          expect(calls[0].args[1].segment).to.be.an.instanceof(Segment);
          expect(calls[0].args[1].segment.id).to.equal('segment1');
          expect(calls[0].args[1].segment.startTime).to.equal(1.0 + distance * p.zoom.getZoomLevel() / 44100);
          expect(calls[0].args[1].segment.endTime).to.equal(2.0 + distance * p.zoom.getZoomLevel() / 44100);

          expect(calls[1].args[1].segment).to.be.an.instanceof(Segment);
          expect(calls[1].args[1].segment.id).to.equal('segment2');
          expect(calls[1].args[1].segment.startTime).to.equal(2.0 + distance * p.zoom.getZoomLevel() / 44100);
          expect(calls[1].args[1].segment.endTime).to.equal(4.0);
        });

        it('should move the next segment start time', function() {
          const distance = 150;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const nextSegment = p.segments.getSegment('segment2');

          expect(nextSegment.startTime).to.equal(2.0 + distance * p.zoom.getZoomLevel() / 44100);
          expect(nextSegment.endTime).to.equal(4.0);
        });

        it('should compress the next segment to a minimum width', function() {
          const distance = 300;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const nextSegment = p.segments.getSegment('segment2');

          expect(nextSegment.startTime).to.equal(4.0 - 20 * p.zoom.getZoomLevel() / 44100);
          expect(nextSegment.endTime).to.equal(4.0);
        });
      });

      context('when dragging a segment over the previous segment', function() {
        it('should emit a segments.dragged event', function() {
          const emit = sinon.spy(p, 'emit');

          const distance = -150;

          inputController.mouseDown({ x: 300, y: 50 });
          inputController.mouseMove({ x: 300 + distance, y: 50 });
          inputController.mouseUp({ x: 300 + distance, y: 50 });

          const calls = getEmitCalls(emit, 'segments.dragged');
          expect(calls.length).to.equal(2);

          expect(calls[0].args[1].segment).to.be.an.instanceof(Segment);
          expect(calls[0].args[1].segment.id).to.equal('segment2');
          expect(calls[0].args[1].segment.startTime).to.equal(3.0 + distance * p.zoom.getZoomLevel() / 44100);
          expect(calls[0].args[1].segment.endTime).to.equal(4.0 + distance * p.zoom.getZoomLevel() / 44100);

          expect(calls[1].args[1].segment).to.be.an.instanceof(Segment);
          expect(calls[1].args[1].segment.id).to.equal('segment1');
          expect(calls[1].args[1].segment.startTime).to.equal(1.0);
          expect(calls[1].args[1].segment.endTime).to.equal(3.0 + distance * p.zoom.getZoomLevel() / 44100);
        });

        it('should move the previous segment end time', function() {
          const distance = -150;

          inputController.mouseDown({ x: 300, y: 50 });
          inputController.mouseMove({ x: 300 + distance, y: 50 });
          inputController.mouseUp({ x: 300 + distance, y: 50 });

          const previousSegment = p.segments.getSegment('segment1');

          expect(previousSegment.startTime).to.equal(1.0);
          expect(previousSegment.endTime).to.equal(3.0 + distance * p.zoom.getZoomLevel() / 44100);
        });

        it('should compress the previous segment to a minimum width', function() {
          const distance = -300;

          inputController.mouseDown({ x: 300, y: 50 });
          inputController.mouseMove({ x: 300 + distance, y: 50 });
          inputController.mouseUp({ x: 300 + distance, y: 50 });

          const previousSegment = p.segments.getSegment('segment1');

          expect(previousSegment.startTime).to.equal(1.0);
          expect(previousSegment.endTime).to.equal(1.0 + 20 * p.zoom.getZoomLevel() / 44100);
        });
      });
    });
  });
});
