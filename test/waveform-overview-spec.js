import Peaks from '../src/main';
import { Point } from '../src/point';
import { Segment } from '../src/segment';

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

    context('when clicking on the waveform', function() {
      it('should emit a overview.click event', function() {
        const emit = sinon.spy(p, 'emit');

        inputController.mouseDown({ x: 100, y: 50 });
        inputController.mouseUp({ x: 100, y: 50 });

        const calls = getEmitCalls(emit, /overview/);

        expect(calls.length).to.equal(1);

        expect(calls[0].args[0]).to.equal('overview.click');
        expect(calls[0].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[0].args[1].time).to.be.a('number');
      });

      it('should emit a overview.dblclick event', function() {
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

    context('when clicking on a segment', function() {
      beforeEach(function(done) {
        p.segments.add({ id: 'segment1', startTime: 1.0, endTime: 2.0, editable: true });
        setTimeout(done, 50);
      });

      it('should emit both an overview.click and a segments.click event', function() {
        const emit = sinon.spy(p, 'emit');

        inputController.mouseDown({ x: 40, y: 50 });
        inputController.mouseUp({ x: 40, y: 50 });

        const calls = getEmitCalls(emit, /overview|segments/);

        expect(calls.length).to.equal(4);

        expect(calls[0].args[0]).to.equal('segments.mousedown');
        expect(calls[0].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[0].args[1].segment).to.be.an.instanceOf(Segment);
        expect(calls[0].args[1].segment.id).to.equal('segment1');

        expect(calls[1].args[0]).to.equal('segments.mouseup');
        expect(calls[1].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[1].args[1].segment).to.be.an.instanceOf(Segment);
        expect(calls[1].args[1].segment.id).to.equal('segment1');

        expect(calls[2].args[0]).to.equal('segments.click');
        expect(calls[2].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[2].args[1].segment).to.be.an.instanceOf(Segment);
        expect(calls[2].args[1].segment.id).to.equal('segment1');

        expect(calls[3].args[0]).to.equal('overview.click');
        expect(calls[3].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[3].args[1].time).to.be.a('number');
      });

      it('should emit both an overview.dblclick and a segments.dblclick event', function() {
        const emit = sinon.spy(p, 'emit');

        inputController.mouseDown({ x: 40, y: 50 });
        inputController.mouseUp({ x: 40, y: 50 });
        inputController.mouseDown({ x: 40, y: 50 });
        inputController.mouseUp({ x: 40, y: 50 });

        const calls = getEmitCalls(emit, /overview|segments/);

        expect(calls.length).to.equal(10);

        expect(calls[0].args[0]).to.equal('segments.mousedown');
        expect(calls[0].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[0].args[1].segment).to.be.an.instanceOf(Segment);
        expect(calls[0].args[1].segment.id).to.equal('segment1');

        expect(calls[1].args[0]).to.equal('segments.mouseup');
        expect(calls[1].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[1].args[1].segment).to.be.an.instanceOf(Segment);
        expect(calls[1].args[1].segment.id).to.equal('segment1');

        expect(calls[2].args[0]).to.equal('segments.click');
        expect(calls[2].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[2].args[1].segment).to.be.an.instanceOf(Segment);
        expect(calls[2].args[1].segment.id).to.equal('segment1');

        expect(calls[3].args[0]).to.equal('overview.click');
        expect(calls[3].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[3].args[1].time).to.be.a('number');

        expect(calls[4].args[0]).to.equal('segments.mousedown');
        expect(calls[4].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[4].args[1].segment).to.be.an.instanceOf(Segment);
        expect(calls[4].args[1].segment.id).to.equal('segment1');

        expect(calls[5].args[0]).to.equal('segments.mouseup');
        expect(calls[5].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[5].args[1].segment).to.be.an.instanceOf(Segment);
        expect(calls[5].args[1].segment.id).to.equal('segment1');

        expect(calls[6].args[0]).to.equal('segments.click');
        expect(calls[6].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[6].args[1].segment).to.be.an.instanceOf(Segment);
        expect(calls[6].args[1].segment.id).to.equal('segment1');

        expect(calls[7].args[0]).to.equal('overview.click');
        expect(calls[7].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[7].args[1].time).to.be.a('number');

        expect(calls[8].args[0]).to.equal('segments.dblclick');
        expect(calls[8].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[8].args[1].segment).to.be.an.instanceOf(Segment);
        expect(calls[8].args[1].segment.id).to.equal('segment1');

        expect(calls[9].args[0]).to.equal('overview.dblclick');
        expect(calls[9].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[9].args[1].time).to.be.a('number');
      });

      it('should allow the user to prevent the overview.click event', function() {
        const emit = sinon.spy(p, 'emit');

        p.on('segments.click', function(event) {
          event.preventViewEvent();
        });

        inputController.mouseDown({ x: 40, y: 50 });
        inputController.mouseUp({ x: 40, y: 50 });

        const calls = getEmitCalls(emit, /overview|segments/);

        expect(calls.length).to.equal(3);

        expect(calls[0].args[0]).to.equal('segments.mousedown');
        expect(calls[0].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[0].args[1].segment).to.be.an.instanceOf(Segment);
        expect(calls[0].args[1].segment.id).to.equal('segment1');

        expect(calls[1].args[0]).to.equal('segments.mouseup');
        expect(calls[1].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[1].args[1].segment).to.be.an.instanceOf(Segment);
        expect(calls[1].args[1].segment.id).to.equal('segment1');

        expect(calls[2].args[0]).to.equal('segments.click');
        expect(calls[2].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[2].args[1].segment).to.be.an.instanceOf(Segment);
        expect(calls[2].args[1].segment.id).to.equal('segment1');
      });

      it('should allow the user to prevent the overview.dblclick event', function() {
        const emit = sinon.spy(p, 'emit');

        p.on('segments.dblclick', function(event) {
          event.preventViewEvent();
        });

        inputController.mouseDown({ x: 40, y: 50 });
        inputController.mouseUp({ x: 40, y: 50 });
        inputController.mouseDown({ x: 40, y: 50 });
        inputController.mouseUp({ x: 40, y: 50 });

        const calls = getEmitCalls(emit, /overview|segments/);

        expect(calls.length).to.equal(9);

        expect(calls[0].args[0]).to.equal('segments.mousedown');
        expect(calls[0].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[0].args[1].segment).to.be.an.instanceOf(Segment);
        expect(calls[0].args[1].segment.id).to.equal('segment1');

        expect(calls[1].args[0]).to.equal('segments.mouseup');
        expect(calls[1].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[1].args[1].segment).to.be.an.instanceOf(Segment);
        expect(calls[1].args[1].segment.id).to.equal('segment1');

        expect(calls[2].args[0]).to.equal('segments.click');
        expect(calls[2].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[2].args[1].segment).to.be.an.instanceOf(Segment);
        expect(calls[2].args[1].segment.id).to.equal('segment1');

        expect(calls[3].args[0]).to.equal('overview.click');
        expect(calls[3].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[3].args[1].time).to.be.a('number');

        expect(calls[4].args[0]).to.equal('segments.mousedown');
        expect(calls[4].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[4].args[1].segment).to.be.an.instanceOf(Segment);
        expect(calls[4].args[1].segment.id).to.equal('segment1');

        expect(calls[5].args[0]).to.equal('segments.mouseup');
        expect(calls[5].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[5].args[1].segment).to.be.an.instanceOf(Segment);
        expect(calls[5].args[1].segment.id).to.equal('segment1');

        expect(calls[6].args[0]).to.equal('segments.click');
        expect(calls[6].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[6].args[1].segment).to.be.an.instanceOf(Segment);
        expect(calls[6].args[1].segment.id).to.equal('segment1');

        expect(calls[7].args[0]).to.equal('overview.click');
        expect(calls[7].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[7].args[1].time).to.be.a('number');

        expect(calls[8].args[0]).to.equal('segments.dblclick');
        expect(calls[8].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[8].args[1].segment).to.be.an.instanceOf(Segment);
        expect(calls[8].args[1].segment.id).to.equal('segment1');
      });
    });

    context('when clicking on a point', function() {
      beforeEach(function(done) {
        p.points.add({ id: 'point1', time: 1.0, editable: true });
        setTimeout(done, 50);
      });

      it('should emit both an overview.click and a points.click event', function() {
        const emit = sinon.spy(p, 'emit');

        inputController.mouseDown({ x: 30, y: 50 });
        inputController.mouseUp({ x: 30, y: 50 });

        const calls = getEmitCalls(emit, /overview|points/);

        expect(calls.length).to.equal(2);

        // expect(calls[0].args[0]).to.equal('points.mousedown');
        // expect(calls[0].args[1].evt).to.be.an.instanceOf(MouseEvent);
        // expect(calls[0].args[1].point).to.be.an.instanceOf(Point);
        // expect(calls[0].args[1].point.id).to.equal('point1');

        // expect(calls[1].args[0]).to.equal('points.mouseup');
        // expect(calls[1].args[1].evt).to.be.an.instanceOf(MouseEvent);
        // expect(calls[1].args[1].point).to.be.an.instanceOf(Point);
        // expect(calls[1].args[1].point.id).to.equal('point1');

        expect(calls[0].args[0]).to.equal('points.click');
        expect(calls[0].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[0].args[1].point).to.be.an.instanceOf(Point);
        expect(calls[0].args[1].point.id).to.equal('point1');

        expect(calls[1].args[0]).to.equal('overview.click');
        expect(calls[1].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[1].args[1].time).to.be.a('number');
      });

      it('should emit both an overview.dblclick and a points.dblclick event', function() {
        const emit = sinon.spy(p, 'emit');

        inputController.mouseDown({ x: 30, y: 50 });
        inputController.mouseUp({ x: 30, y: 50 });
        inputController.mouseDown({ x: 30, y: 50 });
        inputController.mouseUp({ x: 30, y: 50 });

        const calls = getEmitCalls(emit, /overview|points/);

        expect(calls.length).to.equal(6);

        // expect(calls[0].args[0]).to.equal('points.mousedown');
        // expect(calls[0].args[1].evt).to.be.an.instanceOf(MouseEvent);
        // expect(calls[0].args[1].point).to.be.an.instanceOf(Point);
        // expect(calls[0].args[1].point.id).to.equal('segment1');

        // expect(calls[1].args[0]).to.equal('points.mouseup');
        // expect(calls[1].args[1].evt).to.be.an.instanceOf(MouseEvent);
        // expect(calls[1].args[1].point).to.be.an.instanceOf(Point);
        // expect(calls[1].args[1].point.id).to.equal('segment1');

        expect(calls[0].args[0]).to.equal('points.click');
        expect(calls[0].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[0].args[1].point).to.be.an.instanceOf(Point);
        expect(calls[0].args[1].point.id).to.equal('point1');

        expect(calls[1].args[0]).to.equal('overview.click');
        expect(calls[1].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[1].args[1].time).to.be.a('number');

        // expect(calls[4].args[0]).to.equal('points.mousedown');
        // expect(calls[4].args[1].evt).to.be.an.instanceOf(MouseEvent);
        // expect(calls[4].args[1].point).to.be.an.instanceOf(Point);
        // expect(calls[4].args[1].point.id).to.equal('point1');

        // expect(calls[5].args[0]).to.equal('points.mouseup');
        // expect(calls[5].args[1].evt).to.be.an.instanceOf(MouseEvent);
        // expect(calls[5].args[1].point).to.be.an.instanceOf(Point);
        // expect(calls[5].args[1].point.id).to.equal('point1');

        expect(calls[2].args[0]).to.equal('points.click');
        expect(calls[2].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[2].args[1].point).to.be.an.instanceOf(Point);
        expect(calls[2].args[1].point.id).to.equal('point1');

        expect(calls[3].args[0]).to.equal('overview.click');
        expect(calls[3].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[3].args[1].time).to.be.a('number');

        expect(calls[4].args[0]).to.equal('points.dblclick');
        expect(calls[4].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[4].args[1].point).to.be.an.instanceOf(Point);
        expect(calls[4].args[1].point.id).to.equal('point1');

        expect(calls[5].args[0]).to.equal('overview.dblclick');
        expect(calls[5].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[5].args[1].time).to.be.a('number');
      });

      it('should allow the user to prevent the overview.click event', function() {
        const emit = sinon.spy(p, 'emit');

        p.on('points.click', function(event) {
          event.preventViewEvent();
        });

        inputController.mouseDown({ x: 30, y: 50 });
        inputController.mouseUp({ x: 30, y: 50 });

        const calls = getEmitCalls(emit, /overview|points/);

        expect(calls.length).to.equal(1);

        // expect(calls[0].args[0]).to.equal('points.mousedown');
        // expect(calls[0].args[1].evt).to.be.an.instanceOf(MouseEvent);
        // expect(calls[0].args[1].point).to.be.an.instanceOf(Point);
        // expect(calls[0].args[1].point.id).to.equal('point1');

        // expect(calls[1].args[0]).to.equal('points.mouseup');
        // expect(calls[1].args[1].evt).to.be.an.instanceOf(MouseEvent);
        // expect(calls[1].args[1].point).to.be.an.instanceOf(Point);
        // expect(calls[1].args[1].point.id).to.equal('point1');

        expect(calls[0].args[0]).to.equal('points.click');
        expect(calls[0].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[0].args[1].point).to.be.an.instanceOf(Point);
        expect(calls[0].args[1].point.id).to.equal('point1');
      });

      it('should allow the user to prevent the overview.dblclick event', function() {
        const emit = sinon.spy(p, 'emit');

        p.on('points.dblclick', function(event) {
          event.preventViewEvent();
        });

        inputController.mouseDown({ x: 30, y: 50 });
        inputController.mouseUp({ x: 30, y: 50 });
        inputController.mouseDown({ x: 30, y: 50 });
        inputController.mouseUp({ x: 30, y: 50 });

        const calls = getEmitCalls(emit, /overview|points/);

        expect(calls.length).to.equal(5);

        // expect(calls[0].args[0]).to.equal('points.mousedown');
        // expect(calls[0].args[1].evt).to.be.an.instanceOf(MouseEvent);
        // expect(calls[0].args[1].point).to.be.an.instanceOf(Point);
        // expect(calls[0].args[1].point.id).to.equal('point1');

        // expect(calls[1].args[0]).to.equal('points.mouseup');
        // expect(calls[1].args[1].evt).to.be.an.instanceOf(MouseEvent);
        // expect(calls[1].args[1].point).to.be.an.instanceOf(Point);
        // expect(calls[1].args[1].point.id).to.equal('point1');

        expect(calls[0].args[0]).to.equal('points.click');
        expect(calls[0].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[0].args[1].point).to.be.an.instanceOf(Point);
        expect(calls[0].args[1].point.id).to.equal('point1');

        expect(calls[1].args[0]).to.equal('overview.click');
        expect(calls[1].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[1].args[1].time).to.be.a('number');

        // expect(calls[4].args[0]).to.equal('points.mousedown');
        // expect(calls[4].args[1].evt).to.be.an.instanceOf(MouseEvent);
        // expect(calls[4].args[1].point).to.be.an.instanceOf(Point);
        // expect(calls[4].args[1].point.id).to.equal('point1');

        // expect(calls[5].args[0]).to.equal('points.mouseup');
        // expect(calls[5].args[1].evt).to.be.an.instanceOf(MouseEvent);
        // expect(calls[5].args[1].point).to.be.an.instanceOf(Point);
        // expect(calls[5].args[1].point.id).to.equal('point1');

        expect(calls[2].args[0]).to.equal('points.click');
        expect(calls[2].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[2].args[1].point).to.be.an.instanceOf(Point);
        expect(calls[2].args[1].point.id).to.equal('point1');

        expect(calls[3].args[0]).to.equal('overview.click');
        expect(calls[3].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[3].args[1].time).to.be.a('number');

        expect(calls[4].args[0]).to.equal('points.dblclick');
        expect(calls[4].args[1].evt).to.be.an.instanceOf(MouseEvent);
        expect(calls[4].args[1].point).to.be.an.instanceOf(Point);
        expect(calls[4].args[1].point.id).to.equal('point1');
      });
    });
  });
});
