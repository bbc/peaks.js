import Peaks from '../src/main';
import { Point } from '../src/point';
import { Segment } from '../src/segment';

import InputController from './helpers/input-controller';
import { getEmitCalls } from './helpers/utils';

describe('WaveformZoomView', function() {
  describe('setStartTime', function() {
    let p = null;
    let zoomview = null;

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
        }
      };

      Peaks.init(options, function(err, instance) {
        expect(err).to.equal(null);

        p = instance;
        zoomview = instance.views.getView('zoomview');
        expect(zoomview).to.be.ok;

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

    context('with a fixed zoom level', function() {
      it('should update the waveform start position', function() {
        const pointsLayerUpdate = sinon.spy(zoomview._pointsLayer, 'updatePoints');
        const segmentsLayerUpdate = sinon.spy(zoomview._segmentsLayer, 'updateSegments');

        zoomview.setStartTime(5.0);

        const startTime = zoomview.pixelsToTime(zoomview.timeToPixels(5.0));
        const endTime = zoomview.pixelsToTime(zoomview.timeToPixels(5.0) + 1000);

        expect(zoomview.getStartTime()).to.equal(startTime);

        expect(pointsLayerUpdate).to.be.calledOnceWithExactly(startTime, endTime);
        expect(segmentsLayerUpdate).to.be.calledOnceWithExactly(startTime, endTime);
      });

      it('should limit the start time to zero', function() {
        zoomview.setStartTime(-1.0);

        expect(zoomview.getStartTime()).to.equal(0.0);
      });
    });

    context('with auto zoom level', function() {
      beforeEach(function() {
        zoomview.setZoom({ seconds: 'auto' });
      });

      it('should keep the waveform start position at zero', function() {
        zoomview.setStartTime(5.0);

        expect(zoomview.getStartTime()).to.equal(0.0);
      });
    });
  });

  describe('enableSegmentDragging', function() {
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
          { id: 'segment1', startTime: 1.0,  endTime: 2.0, editable: true },
          { id: 'segment2', startTime: 3.0,  endTime: 4.0, editable: true },
          { id: 'segment3', startTime: 11.0, endTime: 12.0, editable: true },
          { id: 'segment4', startTime: 13.0, endTime: 14.0, editable: true }
        ]
      };

      Peaks.init(options, function(err, instance) {
        expect(err).to.equal(null);

        p = instance;
        zoomview = instance.views.getView('zoomview');
        expect(zoomview).to.be.ok;

        inputController = new InputController('zoomview-container');

        setTimeout(done, 50);
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

    context('when enabled', function() {
      beforeEach(function() {
        zoomview.enableSegmentDragging(true);
        zoomview.setWaveformDragMode('scroll');
      });

      context('when dragging a segment', function() {
        it('should move the segment to the right', function() {
          const distance = 50;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const view = p.views.getView('zoomview');
          const segment = p.segments.getSegment('segment1');

          expect(segment.startTime).to.equal(1.0 + view.pixelsToTime(distance));
          expect(segment.endTime).to.equal(2.0 + view.pixelsToTime(distance));
        });

        it('should move the segment to the left', function() {
          const distance = -50;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const view = p.views.getView('zoomview');
          const segment = p.segments.getSegment('segment1');

          expect(segment.startTime).to.equal(1.0 + view.pixelsToTime(distance));
          expect(segment.endTime).to.equal(2.0 + view.pixelsToTime(distance));
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
          const view = p.views.getView('zoomview');
          const emit = sinon.spy(p, 'emit');

          const distance = 50;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const calls = getEmitCalls(emit, 'segments.dragged');
          expect(calls.length).to.equal(1);

          expect(calls[0].args[1].segment).to.be.an.instanceof(Segment);
          expect(calls[0].args[1].marker).to.equal(false);
          expect(calls[0].args[1].segment.startTime).to.equal(1.0 + view.pixelsToTime(distance));
          expect(calls[0].args[1].segment.endTime).to.equal(2.0 + view.pixelsToTime(distance));
        });
      });

      context('when dragging the waveform', function() {
        it('should scroll the waveform to the right', function() {
          const distance = -50;

          inputController.mouseDown({ x: 50, y: 50 });
          inputController.mouseMove({ x: 50 + distance, y: 50 });
          inputController.mouseUp({ x: 50 + distance, y: 50 });

          const view = p.views.getView('zoomview');

          expect(zoomview.getFrameOffset()).to.equal(50);
          expect(zoomview.getStartTime()).to.equal(view.pixelsToTime(50));
        });

        it('should scroll the waveform to the left', function() {
          zoomview.updateWaveform(500);

          const distance = 100;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const view = p.views.getView('zoomview');

          expect(zoomview.getFrameOffset()).to.equal(400);
          expect(zoomview.getStartTime()).to.equal(view.pixelsToTime(400));
        });

        it('should not scroll beyond the start of the waveform', function() {
          const distance = 200;

          inputController.mouseDown({ x: 50, y: 50 });
          inputController.mouseMove({ x: 50 + distance, y: 50 });
          inputController.mouseUp({ x: 50 + distance, y: 50 });

          expect(zoomview.getFrameOffset()).to.equal(0);
          expect(zoomview.getStartTime()).to.equal(0);
        });

        it('should not scroll beyond the end of the waveform', function() {
          zoomview.setStartTime(20);

          const distance = -200;

          inputController.mouseDown({ x: 50, y: 50 });
          inputController.mouseMove({ x: 50 + distance, y: 50 });
          inputController.mouseUp({ x: 50 + distance, y: 50 });

          const view = p.views.getView('zoomview');

          expect(zoomview.getFrameOffset()).to.equal(1826);
          expect(zoomview.getStartTime()).to.equal(view.pixelsToTime(1826));
        });
      });
    });

    context('when disabled', function() {
      beforeEach(function() {
        zoomview.enableSegmentDragging(false);
      });

      context('when dragging the waveform view', function() {
        it('should scroll the waveform to the right', function() {
          const distance = 100;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 - distance, y: 50 });
          inputController.mouseUp({ x: 100 - distance, y: 50 });

          const view = p.views.getView('zoomview');

          expect(zoomview.getFrameOffset()).to.equal(100);
          expect(zoomview.getStartTime()).to.equal(view.pixelsToTime(distance));
        });

        it('should scroll the waveform to the left', function() {
          zoomview.updateWaveform(500);

          const distance = 100;

          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseMove({ x: 100 + distance, y: 50 });
          inputController.mouseUp({ x: 100 + distance, y: 50 });

          const view = p.views.getView('zoomview');

          expect(zoomview.getFrameOffset()).to.equal(400);
          expect(zoomview.getStartTime()).to.equal(view.pixelsToTime(400));
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
    [
      { name: 'with marker segments',  markers: true,  overlay: false },
      { name: 'with overlay segments', markers: false, overlay: true }
    ].forEach(function(test) {
      context(test.name, function() {
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
            segmentOptions: {
              markers: test.markers,
              overlay: test.overlay
            },
            points: [
              { id: 'point1', time: 7.0, editable: true }
            ],
            segments: [
              { id: 'segment1', startTime: 1.0,  endTime: 2.0, editable: true },
              { id: 'segment2', startTime: 3.0,  endTime: 4.0, editable: true },
              { id: 'segment3', startTime: 11.0, endTime: 12.0, editable: true },
              { id: 'segment4', startTime: 13.0, endTime: 14.0, editable: true }
            ]
          };

          Peaks.init(options, function(err, instance) {
            expect(err).to.equal(null);

            p = instance;
            zoomview = instance.views.getView('zoomview');
            expect(zoomview).to.be.ok;

            zoomview.enableSegmentDragging(true);

            inputController = new InputController('zoomview-container');

            setTimeout(done, 50);
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

        context('overlap', function() {
          beforeEach(function() {
            zoomview.setSegmentDragMode('overlap');
          });

          context('when dragging a segment over the next segment', function() {
            it('should emit a segments.dragged event', function() {
              const view = p.views.getView('zoomview');
              const emit = sinon.spy(p, 'emit');

              const distance = 150;

              inputController.mouseDown({ x: 100, y: 50 });
              inputController.mouseMove({ x: 100 + distance, y: 50 });
              inputController.mouseUp({ x: 100 + distance, y: 50 });

              const calls = getEmitCalls(emit, 'segments.dragged');
              expect(calls.length).to.equal(1);

              expect(calls[0].args[1].segment).to.be.an.instanceof(Segment);
              expect(calls[0].args[1].segment.id).to.equal('segment1');
              expect(calls[0].args[1].segment.startTime).to.equal(1.0 + view.pixelsToTime(distance));
              expect(calls[0].args[1].segment.endTime).to.equal(2.0 + view.pixelsToTime(distance));
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

          context('when dragging a segment over the previous segment', function() {
            it('should emit a segments.dragged event', function() {
              const view = p.views.getView('zoomview');
              const emit = sinon.spy(p, 'emit');

              const distance = -150;

              inputController.mouseDown({ x: 300, y: 50 });
              inputController.mouseMove({ x: 300 + distance, y: 50 });
              inputController.mouseUp({ x: 300 + distance, y: 50 });

              const calls = getEmitCalls(emit, 'segments.dragged');
              expect(calls.length).to.equal(1);

              expect(calls[0].args[1].segment).to.be.an.instanceof(Segment);
              expect(calls[0].args[1].segment.id).to.equal('segment2');
              expect(calls[0].args[1].segment.startTime).to.equal(3.0 + view.pixelsToTime(distance));
              expect(calls[0].args[1].segment.endTime).to.equal(4.0 + view.pixelsToTime(distance));
            });

            it('should not move the previous segment', function() {
              const distance = -150;

              inputController.mouseDown({ x: 300, y: 50 });
              inputController.mouseMove({ x: 300 + distance, y: 50 });
              inputController.mouseUp({ x: 300 + distance, y: 50 });

              const previousSegment = p.segments.getSegment('segment1');

              expect(previousSegment.startTime).to.equal(1.0);
              expect(previousSegment.endTime).to.equal(2.0);
            });
          });

          context('when dragging a segment start marker', function() {
            it('should not move the start marker beyond the end marker', function() {
              const clickX = 86;
              const distance = 150;

              inputController.mouseDown({ x: clickX, y: 50 });
              inputController.mouseMove({ x: clickX + distance, y: 50 });
              inputController.mouseUp({ x: clickX + distance, y: 50 });

              const segment = p.segments.getSegment('segment1');

              expect(segment.startTime).to.equal(segment.endTime);
            });

            it('should not move the start marker beyond the visible time range', function() {
              const clickX = 86;
              const distance = -150;

              inputController.mouseDown({ x: clickX, y: 50 });
              inputController.mouseMove({ x: clickX + distance, y: 50 });
              inputController.mouseUp({ x: clickX + distance, y: 50 });

              const segment = p.segments.getSegment('segment1');

              expect(segment.startTime).to.equal(0.0);
            });

            it('should not move the previous segment', function() {
              const clickX = 258;
              const distance = -150;

              inputController.mouseDown({ x: clickX, y: 50 });
              inputController.mouseMove({ x: clickX + distance, y: 50 });
              inputController.mouseUp({ x: clickX + distance, y: 50 });

              const segment = p.segments.getSegment('segment2');

              const view = p.views.getView('zoomview');

              expect(segment.startTime).to.equal(view.pixelsToTime(view.timeToPixels(3.0) + distance));
              expect(segment.endTime).to.equal(4.0);

              const previousSegment = p.segments.getSegment('segment1');

              expect(previousSegment.startTime).to.equal(1.0);
              expect(previousSegment.endTime).to.equal(2.0);
            });

            it('should not move the start marker beyond the waveform view', function() {
              const clickX = 86;
              const distance = -100;

              inputController.mouseDown({ x: clickX, y: 50 });
              inputController.mouseMove({ x: clickX + distance, y: 50 });
              inputController.mouseUp({ x: clickX + distance, y: 50 });

              const segment = p.segments.getSegment('segment1');

              expect(segment.startTime).to.equal(0);
            });

            context('and the segment overlaps the end of the waveform view', function() {
              it('should not move the start marker beyond the waveform view', function() {
                const clickX = 947;
                const distance = 100;

                inputController.mouseDown({ x: clickX, y: 50 });
                inputController.mouseMove({ x: clickX + distance, y: 50 });
                inputController.mouseUp({ x: clickX + distance, y: 50 });

                const view = p.views.getView('zoomview');
                const segment = p.segments.getSegment('segment3');

                expect(segment.startTime).to.equal(view.pixelsToTime(view.getWidth()));
              });
            });
          });

          context('when a segment start marker has been dragged over the previous segment', function() {
            it('should be possible to drag the previous segment end marker', function() {
              const firstClickX = 258;
              const firstDistance = -150;

              inputController.mouseDown({ x: firstClickX, y: 50 });
              inputController.mouseMove({ x: firstClickX + firstDistance, y: 50 });
              inputController.mouseUp({ x: firstClickX + firstDistance, y: 50 });

              const secondClickX = 172;
              const secondDistance = 150;

              inputController.mouseDown({ x: secondClickX, y: 50 });
              inputController.mouseMove({ x: secondClickX + secondDistance, y: 50 });
              inputController.mouseUp({ x: secondClickX + secondDistance, y: 50 });

              const view = p.views.getView('zoomview');
              const segment1 = p.segments.getSegment('segment1');
              const segment2 = p.segments.getSegment('segment2');

              expect(segment1.startTime).to.equal(1.0);
              expect(segment1.endTime).to.equal(view.pixelsToTime(view.timeToPixels(2.0) + secondDistance));
              expect(segment2.startTime).to.equal(view.pixelsToTime(view.timeToPixels(3.0) + firstDistance));
              expect(segment2.endTime).to.equal(4.0);
            });
          });

          context('when dragging a segment end marker', function() {
            it('should not move the end marker beyond the start marker', function() {
              const clickX = 172;
              const distance = -150;

              inputController.mouseDown({ x: clickX, y: 50 });
              inputController.mouseMove({ x: clickX + distance, y: 50 });
              inputController.mouseUp({ x: clickX + distance, y: 50 });

              const segment = p.segments.getSegment('segment1');

              expect(segment.endTime).to.equal(segment.startTime);
            });

            it('should move the end marker', function() {
              const clickX = 172;
              const distance = 150;

              inputController.mouseDown({ x: clickX, y: 50 });
              inputController.mouseMove({ x: clickX + distance, y: 50 });
              inputController.mouseUp({ x: clickX + distance, y: 50 });

              const view = p.views.getView('zoomview');
              const segment = p.segments.getSegment('segment1');

              expect(segment.startTime).to.equal(1.0);
              expect(segment.endTime).to.equal(view.pixelsToTime(clickX + distance));
            });

            it('should not move the next segment', function() {
              const clickX = 172;
              const distance = 150;

              inputController.mouseDown({ x: clickX, y: 50 });
              inputController.mouseMove({ x: clickX + distance, y: 50 });
              inputController.mouseUp({ x: clickX + distance, y: 50 });

              const nextSegment = p.segments.getSegment('segment2');

              expect(nextSegment.startTime).to.equal(3.0);
              expect(nextSegment.endTime).to.equal(4.0);
            });

            it('should not move the end marker beyond the waveform view', function() {
              const clickX = 172;
              const distance = 1000;

              inputController.mouseDown({ x: clickX, y: 50 });
              inputController.mouseMove({ x: clickX + distance, y: 50 });
              inputController.mouseUp({ x: clickX + distance, y: 50 });

              const view = p.views.getView('zoomview');
              const segment = p.segments.getSegment('segment1');

              expect(segment.endTime).to.equal(view.pixelsToTime(view.getWidth()));
            });

            context('and the segment overlaps the start of the waveform view', function() {
              beforeEach(function(done) {
                zoomview.setStartTime(1.5);
                setTimeout(done, 50);
              });

              it('should not move the end marker beyond the start of the waveform view', function() {
                const clickX = 43;
                const distance = -100;

                inputController.mouseDown({ x: clickX, y: 50 });
                inputController.mouseMove({ x: clickX + distance, y: 50 });
                inputController.mouseUp({ x: clickX + distance, y: 50 });

                const view = p.views.getView('zoomview');
                const segment = p.segments.getSegment('segment1');

                expect(segment.endTime).to.equal(view.pixelsToTime(view.getFrameOffset()));
              });
            });
          });

          context('when a segment end marker has been dragged over the next segment', function() {
            it('should be possible to drag the next segment start marker', function() {
              const firstClickX = 172;
              const firstDistance = 150;

              inputController.mouseDown({ x: firstClickX, y: 50 });
              inputController.mouseMove({ x: firstClickX + firstDistance, y: 50 });
              inputController.mouseUp({ x: firstClickX + firstDistance, y: 50 });

              const secondClickX = 258;
              const secondDistance = -150;

              inputController.mouseDown({ x: secondClickX, y: 50 });
              inputController.mouseMove({ x: secondClickX + secondDistance, y: 50 });
              inputController.mouseUp({ x: secondClickX + secondDistance, y: 50 });

              const view = p.views.getView('zoomview');
              const segment1 = p.segments.getSegment('segment1');
              const segment2 = p.segments.getSegment('segment2');

              expect(segment1.startTime).to.equal(1.0);
              expect(segment1.endTime).to.equal(view.pixelsToTime(view.timeToPixels(2.0) + firstDistance));
              expect(segment2.startTime).to.equal(view.pixelsToTime(view.timeToPixels(3.0) + secondDistance));
              expect(segment2.endTime).to.equal(4.0);
            });
          });
        });

        context('no-overlap', function() {
          beforeEach(function() {
            zoomview.setSegmentDragMode('no-overlap');
          });

          context('when dragging a segment over the next segment', function() {
            it('should move the segment adjacent to the next segment', function() {
              const emit = sinon.spy(p, 'emit');

              const distance = 150;

              inputController.mouseDown({ x: 100, y: 50 });
              inputController.mouseMove({ x: 100 + distance, y: 50 });
              inputController.mouseUp({ x: 100 + distance, y: 50 });

              const calls = getEmitCalls(emit, 'segments.dragged');
              expect(calls.length).to.equal(1);

              expect(calls[0].args[1].segment).to.be.an.instanceof(Segment);
              expect(calls[0].args[1].segment.id).to.equal('segment1');
              expect(calls[0].args[1].segment.startTime).to.equal(2.0);
              expect(calls[0].args[1].segment.endTime).to.equal(3.0);
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

          context('when dragging a segment over the previous segment', function() {
            it('should move the segment adjacent to the previous segment', function() {
              const emit = sinon.spy(p, 'emit');

              const distance = -150;

              inputController.mouseDown({ x: 300, y: 50 });
              inputController.mouseMove({ x: 300 + distance, y: 50 });
              inputController.mouseUp({ x: 300 + distance, y: 50 });

              const calls = getEmitCalls(emit, 'segments.dragged');
              expect(calls.length).to.equal(1);

              expect(calls[0].args[1].segment).to.be.an.instanceof(Segment);
              expect(calls[0].args[1].segment.id).to.equal('segment2');
              expect(calls[0].args[1].segment.startTime).to.equal(2.0);
              expect(calls[0].args[1].segment.endTime).to.equal(3.0);
            });

            it('should not move the previous segment', function() {
              const distance = -150;

              inputController.mouseDown({ x: 300, y: 50 });
              inputController.mouseMove({ x: 300 + distance, y: 50 });
              inputController.mouseUp({ x: 300 + distance, y: 50 });

              const previousSegment = p.segments.getSegment('segment1');

              expect(previousSegment.startTime).to.equal(1.0);
              expect(previousSegment.endTime).to.equal(2.0);
            });
          });

          context('when dragging a segment end marker', function() {
            context('and the end marker does not overlap the next segment', function() {
              it('should move the segment end marker', function() {
                const clickX = 172;
                const distance = 50;

                inputController.mouseDown({ x: clickX, y: 50 });
                inputController.mouseMove({ x: clickX + distance, y: 50 });
                inputController.mouseUp({ x: clickX + distance, y: 50 });

                const view = p.views.getView('zoomview');
                const segment = p.segments.getSegment('segment1');
                const nextSegment = p.segments.getSegment('segment2');

                expect(segment.startTime).to.equal(1.0);
                expect(segment.endTime).to.equal(view.pixelsToTime(view.timeToPixels(2.0) + distance));
                expect(nextSegment.startTime).to.equal(3.0);
                expect(nextSegment.endTime).to.equal(4.0);
              });
            });

            context('and the end marker overlaps the next segment', function() {
              it('should move the segment end marker adjacent to the next segment', function() {
                const clickX = 172;
                const distance = 150;

                inputController.mouseDown({ x: clickX, y: 50 });
                inputController.mouseMove({ x: clickX + distance, y: 50 });
                inputController.mouseUp({ x: clickX + distance, y: 50 });

                const segment = p.segments.getSegment('segment1');
                const nextSegment = p.segments.getSegment('segment2');

                expect(segment.startTime).to.equal(1.0);
                expect(segment.endTime).to.equal(nextSegment.startTime);
                expect(nextSegment.startTime).to.equal(3.0);
                expect(nextSegment.endTime).to.equal(4.0);
              });
            });
          });

          context('when dragging a segment start marker', function() {
            context('and the start marker does not overlap the previous segment', function() {
              it('should move the segment start marker', function() {
                const clickX = 258;
                const distance = -50;

                inputController.mouseDown({ x: clickX, y: 50 });
                inputController.mouseMove({ x: clickX + distance, y: 50 });
                inputController.mouseUp({ x: clickX + distance, y: 50 });

                const view = p.views.getView('zoomview');
                const segment = p.segments.getSegment('segment2');
                const previousSegment = p.segments.getSegment('segment1');

                expect(previousSegment.startTime).to.equal(1.0);
                expect(previousSegment.endTime).to.equal(2.0);
                expect(segment.startTime).to.equal(view.pixelsToTime(view.timeToPixels(3.0) + distance));
                expect(segment.endTime).to.equal(4.0);
              });
            });

            context('and the start marker overlaps the previous segment', function() {
              it('should move the segment start marker adjacent to the previous segment', function() {
                const clickX = 258;
                const distance = -150;

                inputController.mouseDown({ x: clickX, y: 50 });
                inputController.mouseMove({ x: clickX + distance, y: 50 });
                inputController.mouseUp({ x: clickX + distance, y: 50 });

                const segment = p.segments.getSegment('segment2');
                const previousSegment = p.segments.getSegment('segment1');

                expect(previousSegment.startTime).to.equal(1.0);
                expect(previousSegment.endTime).to.equal(2.0);
                expect(segment.startTime).to.equal(previousSegment.endTime);
                expect(segment.endTime).to.equal(4.0);
              });
            });
          });
        });

        context('compress', function() {
          beforeEach(function() {
            zoomview.setSegmentDragMode('compress');
            zoomview.setMinSegmentDragWidth(20);
          });

          context('when dragging a segment over the next segment', function() {
            context('and does not reach the minimum width of the next segment', function() {
              it('should move the next segment start time', function() {
                const view = p.views.getView('zoomview');
                const emit = sinon.spy(p, 'emit');

                const distance = 150;

                inputController.mouseDown({ x: 100, y: 50 });
                inputController.mouseMove({ x: 100 + distance, y: 50 });
                inputController.mouseUp({ x: 100 + distance, y: 50 });

                const calls = getEmitCalls(emit, 'segments.dragged');
                expect(calls.length).to.equal(2);

                expect(calls[0].args[1].segment).to.be.an.instanceof(Segment);
                expect(calls[0].args[1].segment.id).to.equal('segment1');
                expect(calls[0].args[1].segment.startTime).to.equal(1.0 + view.pixelsToTime(distance));
                expect(calls[0].args[1].segment.endTime).to.equal(2.0 + view.pixelsToTime(distance));

                expect(calls[1].args[1].segment).to.be.an.instanceof(Segment);
                expect(calls[1].args[1].segment.id).to.equal('segment2');
                expect(calls[1].args[1].segment.startTime).to.equal(2.0 + view.pixelsToTime(distance));
                expect(calls[1].args[1].segment.endTime).to.equal(4.0);
              });
            });

            context('and reaches the minimum width of the next segment', function() {
              it('should compress the next segment to a minimum width', function() {
                const view = p.views.getView('zoomview');
                const emit = sinon.spy(p, 'emit');

                const distance = 300;

                inputController.mouseDown({ x: 100, y: 50 });
                inputController.mouseMove({ x: 100 + distance, y: 50 });
                inputController.mouseUp({ x: 100 + distance, y: 50 });

                const calls = getEmitCalls(emit, 'segments.dragged');
                expect(calls.length).to.equal(2);

                expect(calls[0].args[1].segment).to.be.an.instanceof(Segment);
                expect(calls[0].args[1].segment.id).to.equal('segment1');
                expect(calls[0].args[1].segment.startTime).to.equal(3.0 - view.pixelsToTime(20));
                expect(calls[0].args[1].segment.endTime).to.equal(4.0 - view.pixelsToTime(20));

                expect(calls[1].args[1].segment).to.be.an.instanceof(Segment);
                expect(calls[1].args[1].segment.id).to.equal('segment2');
                expect(calls[1].args[1].segment.startTime).to.equal(4.0 - view.pixelsToTime(20));
                expect(calls[1].args[1].segment.endTime).to.equal(4.0);
              });
            });
          });

          context('when dragging a segment over the previous segment', function() {
            context('and does not reach the minimum width of the previous segment', function() {
              it('should move the previous segment end time', function() {
                const view = p.views.getView('zoomview');
                const emit = sinon.spy(p, 'emit');

                const distance = -150;

                inputController.mouseDown({ x: 300, y: 50 });
                inputController.mouseMove({ x: 300 + distance, y: 50 });
                inputController.mouseUp({ x: 300 + distance, y: 50 });

                const calls = getEmitCalls(emit, 'segments.dragged');
                expect(calls.length).to.equal(2);

                expect(calls[0].args[1].segment).to.be.an.instanceof(Segment);
                expect(calls[0].args[1].segment.id).to.equal('segment2');
                expect(calls[0].args[1].segment.startTime).to.equal(3.0 + view.pixelsToTime(distance));
                expect(calls[0].args[1].segment.endTime).to.equal(4.0 + view.pixelsToTime(distance));

                expect(calls[1].args[1].segment).to.be.an.instanceof(Segment);
                expect(calls[1].args[1].segment.id).to.equal('segment1');
                expect(calls[1].args[1].segment.startTime).to.equal(1.0);
                expect(calls[1].args[1].segment.endTime).to.equal(3.0 + view.pixelsToTime(distance));
              });
            });

            context('and reaches the minimum width of the previous segment', function() {
              it('should compress the previous segment to a minimum width', function() {
                const view = p.views.getView('zoomview');
                const emit = sinon.spy(p, 'emit');

                const distance = -300;

                inputController.mouseDown({ x: 300, y: 50 });
                inputController.mouseMove({ x: 300 + distance, y: 50 });
                inputController.mouseUp({ x: 300 + distance, y: 50 });

                const calls = getEmitCalls(emit, 'segments.dragged');
                expect(calls.length).to.equal(2);

                expect(calls[0].args[1].segment).to.be.an.instanceof(Segment);
                expect(calls[0].args[1].segment.id).to.equal('segment2');
                expect(calls[0].args[1].segment.startTime).to.equal(1.0 + view.pixelsToTime(20));
                expect(calls[0].args[1].segment.endTime).to.be.closeTo(2.0 + view.pixelsToTime(20), 1e-15); // TODO

                expect(calls[1].args[1].segment).to.be.an.instanceof(Segment);
                expect(calls[1].args[1].segment.id).to.equal('segment1');
                expect(calls[1].args[1].segment.startTime).to.equal(1.0);
                expect(calls[1].args[1].segment.endTime).to.equal(1.0 + view.pixelsToTime(20));
              });
            });
          });

          context('when dragging a segment end marker over the next segment', function() {
            context('and does not reach the minimum width of the next segment', function() {
              it('should move the next segment start time', function() {
                const clickX = 172;
                const distance = 100;

                inputController.mouseDown({ x: clickX, y: 50 });
                inputController.mouseMove({ x: clickX + distance, y: 50 });
                inputController.mouseUp({ x: clickX + distance, y: 50 });

                const view = p.views.getView('zoomview');
                const segment = p.segments.getSegment('segment1');
                const nextSegment = p.segments.getSegment('segment2');

                expect(segment.startTime).to.equal(1.0);
                expect(segment.endTime).to.equal(view.pixelsToTime(view.timeToPixels(2.0) + distance));
                expect(nextSegment.startTime).to.equal(segment.endTime);
                expect(nextSegment.endTime).to.equal(4.0);
              });
            });

            context('and reaches the minimum width of the next segment', function() {
              it('should compress the next segment to a minimum width', function() {
                const clickX = 172;
                const distance = 200;

                inputController.mouseDown({ x: clickX, y: 50 });
                inputController.mouseMove({ x: clickX + distance, y: 50 });
                inputController.mouseUp({ x: clickX + distance, y: 50 });

                const view = p.views.getView('zoomview');
                const segment = p.segments.getSegment('segment1');
                const nextSegment = p.segments.getSegment('segment2');

                expect(segment.startTime).to.equal(1.0);
                expect(segment.endTime).to.equal(view.pixelsToTime(view.timeToPixels(4.0) - 50));
                expect(nextSegment.startTime).to.equal(segment.endTime);
                expect(nextSegment.endTime).to.equal(4.0);
              });
            });
          });

          context('when dragging a segment start marker over the previous segment', function() {
            context('and does not reach the minimum width of the previous segment', function() {
              it('should move the previous segment end time', function() {
                const clickX = 254;
                const distance = -100;

                inputController.mouseDown({ x: clickX, y: 50 });
                inputController.mouseMove({ x: clickX + distance, y: 50 });
                inputController.mouseUp({ x: clickX + distance, y: 50 });

                const view = p.views.getView('zoomview');
                const segment = p.segments.getSegment('segment2');
                const previousSegment = p.segments.getSegment('segment1');

                expect(segment.startTime).to.equal(view.pixelsToTime(view.timeToPixels(3.0) + distance));
                expect(segment.endTime).to.equal(4.0);
                expect(previousSegment.startTime).to.equal(1.0);
                expect(previousSegment.endTime).to.equal(segment.startTime);
              });
            });

            context('and reaches the minimum width of the previous segment', function() {
              it('should compress the previous segment to the minimum width', function() {
                const clickX = 254;
                const distance = -200;

                inputController.mouseDown({ x: clickX, y: 50 });
                inputController.mouseMove({ x: clickX + distance, y: 50 });
                inputController.mouseUp({ x: clickX + distance, y: 50 });

                const view = p.views.getView('zoomview');
                const segment = p.segments.getSegment('segment2');
                const previousSegment = p.segments.getSegment('segment1');

                expect(segment.startTime).to.equal(view.pixelsToTime(view.timeToPixels(1.0) + 50));
                expect(segment.endTime).to.equal(4.0);
                expect(previousSegment.startTime).to.equal(1.0);
                expect(previousSegment.endTime).to.equal(segment.startTime);
              });
            });
          });
        });
      });
    });
  });

  describe('setWaveformDragMode', function() {
    describe('insert-segment', function() {
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
          points: [
            { id: 'point1', time: 7.0, editable: true }
          ],
          segments: [
            { id: 'segment1', startTime: 1.0,  endTime: 2.0, editable: true },
            { id: 'segment2', startTime: 3.0,  endTime: 4.0, editable: true },
            { id: 'segment3', startTime: 11.0, endTime: 12.0, editable: true },
            { id: 'segment4', startTime: 13.0, endTime: 14.0, editable: true }
          ]
        };

        Peaks.init(options, function(err, instance) {
          expect(err).to.equal(null);

          p = instance;
          zoomview = instance.views.getView('zoomview');
          expect(zoomview).to.be.ok;

          zoomview.enableSegmentDragging(true);
          zoomview.setWaveformDragMode('insert-segment');

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

      context('when dragging the waveform to the right', function() {
        it('should insert a new segment', function() {
          const clickX = 430;
          const distance = 172;

          const segments = p.segments.getSegments();
          expect(segments.length).to.equal(4);

          inputController.mouseDown({ x: clickX, y: 50 });
          inputController.mouseMove({ x: clickX + distance, y: 50 });
          inputController.mouseUp({ x: clickX + distance, y: 50 });

          const view = p.views.getView('zoomview');

          expect(segments.length).to.equal(5);

          const segment = p.segments.getSegment('peaks.segment.0');

          expect(segment.startTime).to.equal(view.pixelsToTime(430));
          expect(segment.endTime).to.equal(view.pixelsToTime(430 + 172));
        });

        it('should emit a segments.add event when the segment is added', function(done) {
          const clickX = 430;
          const distance = 172;

          const segments = p.segments.getSegments();
          expect(segments.length).to.equal(4);

          p.on('segments.add', function(event) {
            const view = p.views.getView('zoomview');

            expect(event.insert).to.equal(true);
            expect(event.segments[0]).to.be.an.instanceOf(Segment);
            expect(event.segments[0].startTime).to.equal(view.pixelsToTime(430));
            expect(event.segments[0].endTime).to.equal(view.pixelsToTime(430));
            done();
          });

          inputController.mouseDown({ x: clickX, y: 50 });
          inputController.mouseMove({ x: clickX + distance, y: 50 });
          inputController.mouseUp({ x: clickX + distance, y: 50 });
        });

        it('should emit a segments.insert event when the drag operation ends', function(done) {
          const clickX = 430;
          const distance = 172;

          const segments = p.segments.getSegments();
          expect(segments.length).to.equal(4);

          p.on('segments.insert', function(event) {
            const view = p.views.getView('zoomview');

            expect(event.segment).to.be.an.instanceOf(Segment);
            expect(event.segment.startTime).to.equal(view.pixelsToTime(430));
            expect(event.segment.endTime).to.equal(view.pixelsToTime(430 + 172));
            done();
          });

          inputController.mouseDown({ x: clickX, y: 50 });
          inputController.mouseMove({ x: clickX + distance, y: 50 });
          inputController.mouseUp({ x: clickX + distance, y: 50 });
        });
      });

      context('when dragging the waveform over an existing segment', function() {
        it('should insert a new segment', function() {
          const clickX = 129; // Click within segment1
          const distance = 172;

          const segments = p.segments.getSegments();
          expect(segments.length).to.equal(4);

          inputController.mouseDown({ x: clickX, y: 50 });
          inputController.mouseMove({ x: clickX + distance, y: 50 });
          inputController.mouseUp({ x: clickX + distance, y: 50 });

          const view = p.views.getView('zoomview');

          expect(segments.length).to.equal(5);

          const segment = p.segments.getSegment('peaks.segment.0');

          expect(segment.startTime).to.equal(view.pixelsToTime(129));
          expect(segment.endTime).to.equal(view.pixelsToTime(129 + 172));
        });

        it('should not move the existing segment', function() {
          const clickX = 129; // Click within segment1
          const distance = 172;

          const segments = p.segments.getSegments();
          expect(segments.length).to.equal(4);

          inputController.mouseDown({ x: clickX, y: 50 });
          inputController.mouseMove({ x: clickX + distance, y: 50 });
          inputController.mouseUp({ x: clickX + distance, y: 50 });

          const segment = p.segments.getSegment('segment1');

          expect(segment.startTime).to.equal(1.0);
          expect(segment.endTime).to.equal(2.0);
        });
      });

      context('when dragging the waveform from to the left', function() {
        it('should insert a new segment with zero width', function() {
          const clickX = 430;
          const distance = -172;

          const segments = p.segments.getSegments();
          expect(segments.length).to.equal(4);

          inputController.mouseDown({ x: clickX, y: 50 });
          inputController.mouseMove({ x: clickX + distance, y: 50 });
          inputController.mouseUp({ x: clickX + distance, y: 50 });

          const view = p.views.getView('zoomview');

          expect(segments.length).to.equal(5);

          const segment = p.segments.getSegments()[4];

          expect(segment.startTime).to.equal(view.pixelsToTime(clickX));
          expect(segment.endTime).to.equal(segment.startTime);
        });
      });
    });
  });

  describe('enableSeek', function() {
    let p = null;
    let inputController = null;

    beforeEach(function(done) {
      const options = {
        zoomview: {
          container: document.getElementById('zoomview-container')
        },
        mediaElement: document.getElementById('media'),
        dataUri: { arraybuffer: '/base/test_data/sample.dat' },
        segments: [
          { id: 'segment1', startTime: 1.0, endTime: 2.0, editable: true },
          { id: 'segment2', startTime: 3.0, endTime: 4.0, editable: false }
        ]
      };

      Peaks.init(options, function(err, instance) {
        if (err) {
          done(err);
          return;
        }

        p = instance;

        inputController = new InputController('zoomview-container');

        done();
      });
    });

    afterEach(function() {
      if (p) {
        p.destroy();
        p = null;
        inputController = null;
      }
    });

    context('when enabled', function() {
      context('when clicking on the waveform', function() {
        it('should set the playback position', function() {
          inputController.mouseDown({ x: 100, y: 50 });
          inputController.mouseUp({ x: 100, y: 50 });

          const view = p.views.getView('zoomview');

          expect(p.player.getCurrentTime()).to.be.closeTo(view.pixelsToTime(100), 0.01);
        });
      });

      context('when dragging the playhead', function() {
        beforeEach(function() {
          const view = p.views.getView('zoomview');
          view.enableSegmentDragging(true);
        });

        context('when the playhead is not over a segment', function() {
          it('should set the playback position', function(done) {
            const view = p.views.getView('zoomview');

            p.once('player.timeupdate', function() {
              const x = view.timeToPixels(2.5);
              const distance = 100;

              inputController.mouseDown({ x: x, y: 50 });
              inputController.mouseMove({ x: x + distance, y: 50 });
              inputController.mouseUp({ x: x + distance, y: 50 });

              expect(p.player.getCurrentTime()).to.be.closeTo(view.pixelsToTime(x + distance), 0.01);
              done();
            });

            p.player.seek(2.5);
          });
        });

        context('when the playhead is over a draggable segment', function() {
          it('should set the playback position and not move the segment', function(done) {
            const view = p.views.getView('zoomview');

            p.once('player.timeupdate', function() {
              const x = view.timeToPixels(1.5);
              const distance = 100;

              inputController.mouseDown({ x: x, y: 50 });
              inputController.mouseMove({ x: x + distance, y: 50 });
              inputController.mouseUp({ x: x + distance, y: 50 });

              expect(p.player.getCurrentTime()).to.be.closeTo(view.pixelsToTime(x + distance), 0.01);

              const segment = p.segments.getSegment('segment1');

              expect(segment.startTime).to.equal(1.0);
              expect(segment.endTime).to.equal(2.0);

              done();
            });

            p.player.seek(1.5);
          });
        });

        context('when the playhead is over a non-draggable segment', function() {
          it('should set the playback position and not move the segment', function(done) {
            const view = p.views.getView('zoomview');

            p.once('player.timeupdate', function() {
              const x = view.timeToPixels(3.5);
              const distance = 100;

              inputController.mouseDown({ x: x, y: 50 });
              inputController.mouseMove({ x: x + distance, y: 50 });
              inputController.mouseUp({ x: x + distance, y: 50 });

              expect(p.player.getCurrentTime()).to.be.closeTo(view.pixelsToTime(x + distance), 0.01);

              const segment = p.segments.getSegment('segment2');

              expect(segment.startTime).to.equal(3.0);
              expect(segment.endTime).to.equal(4.0);

              done();
            });

            p.player.seek(3.5);
          });
        });
      });
    });

    context('when disabled', function() {
      beforeEach(function() {
        const view = p.views.getView('zoomview');
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
    });
  });

  context('when dragging a point', function() {
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
        points: [
          { id: 'point1', time: 7.0, editable: true }
        ],
        segments: [
          { id: 'segment1', startTime: 1.0,  endTime: 2.0, editable: true },
          { id: 'segment2', startTime: 3.0,  endTime: 4.0, editable: true },
          { id: 'segment3', startTime: 11.0, endTime: 12.0, editable: true },
          { id: 'segment4', startTime: 13.0, endTime: 14.0, editable: true }
        ]
      };

      Peaks.init(options, function(err, instance) {
        expect(err).to.equal(null);

        p = instance;
        zoomview = instance.views.getView('zoomview');
        expect(zoomview).to.be.ok;

        inputController = new InputController('zoomview-container');

        setTimeout(done, 0);
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

    it('should move the point', function() {
      const view = p.views.getView('zoomview');
      view.enableSeek(false);

      const x = view.timeToPixels(7.0);
      const distance = 100;

      inputController.mouseDown({ x: x, y: 50 });
      inputController.mouseMove({ x: x + distance, y: 50 });
      inputController.mouseUp({ x: x + distance, y: 50 });

      const point = p.points.getPoint('point1');

      expect(point.time).to.equal(view.pixelsToTime(x + distance));
    });

    it('should emit point drag events', function() {
      const emit = sinon.spy(p, 'emit');

      const view = p.views.getView('zoomview');
      view.enableSeek(false);
      const x = view.timeToPixels(7.0);
      const distance = 100;

      inputController.mouseDown({ x: x, y: 50 });
      inputController.mouseMove({ x: x + distance, y: 50 });
      inputController.mouseUp({ x: x + distance, y: 50 });

      const calls = getEmitCalls(emit, /points/);

      expect(calls.length).to.equal(3);

      expect(calls[0].args[0]).to.equal('points.dragstart');
      expect(calls[0].args[1].point).to.be.an.instanceOf(Point);
      expect(calls[0].args[1].point.id).to.equal('point1');

      expect(calls[1].args[0]).to.equal('points.dragmove');
      expect(calls[1].args[1].point).to.be.an.instanceOf(Point);
      expect(calls[1].args[1].point.id).to.equal('point1');

      expect(calls[2].args[0]).to.equal('points.dragend');
      expect(calls[2].args[1].point).to.be.an.instanceOf(Point);
      expect(calls[2].args[1].point.id).to.equal('point1');
    });
  });
});
