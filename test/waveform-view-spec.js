import Peaks from '../src/main';
import { Point } from '../src/point';
import { Segment } from '../src/segment';

import InputController from './helpers/input-controller';
import { getEmitCalls } from './helpers/utils';

import Konva from 'konva';

function initOptions(view, viewOptions) {
  const options = {
    mediaElement: document.getElementById('media'),
    dataUri: {
      arraybuffer: 'base/test_data/sample.dat'
    }
  };

  options[view] = viewOptions;

  return options;
}

[
  { view: 'zoomview', name: 'WaveformZoomview', container: 'zoomview-container' },
  { view: 'overview', name: 'WaveformOverview', container: 'overview-container' }
].forEach(function(test) {
  describe(test.name, function() {
    describe('playedWaveformColor option', function() {
      context('with a valid color', function() {
        it('should create a played waveform shape', function(done) {
          const options = initOptions(test.view, {
            container: document.getElementById(test.container),
            waveformColor: '#f00',
            playedWaveformColor: '#0f0'
          });

          Peaks.init(options, function(err, instance) {
            expect(err).to.equal(null);

            const view = instance.views.getView(test.view);
            expect(view).to.be.ok;

            expect(view._waveformShape._color).to.equal('#f00');
            expect(view._playedWaveformShape._color).to.equal('#0f0');

            done();
          });
        });
      });
    });

    describe('setPlayedWaveformColor', function() {
      context('with a valid color', function() {
        it('should create a played waveform shape', function(done) {
          const options = initOptions(test.view, {
            container: document.getElementById(test.container),
            waveformColor: '#f00'
          });

          Peaks.init(options, function(err, instance) {
            expect(err).to.equal(null);

            const view = instance.views.getView(test.view);
            expect(view).to.be.ok;

            view.setPlayedWaveformColor('#0f0');

            expect(view._waveformShape._color).to.equal('#f00');
            expect(view._playedWaveformShape._color).to.equal('#0f0');

            done();
          });
        });
      });

      context('with null', function() {
        it('should remove the played waveform shape', function(done) {
          const options = initOptions(test.view, {
            container: document.getElementById(test.container),
            waveformColor: '#f00',
            playedWaveformColor: '#0f0'
          });

          Peaks.init(options, function(err, instance) {
            expect(err).to.equal(null);

            const view = instance.views.getView(test.view);
            expect(view).to.be.ok;

            view.setPlayedWaveformColor(null);

            expect(view._waveformShape._color).to.equal('#f00');
            expect(view._playedWaveformShape).to.equal(null);

            done();
          });
        });
      });
    });

    describe('showPlayheadTime option', function() {
      context('with default options', function() {
        it('should not show the playhead time', function(done) {
          const options = initOptions(test.view, {
            container: document.getElementById(test.container)
          });

          Peaks.init(options, function(err, instance) {
            expect(err).to.equal(null);

            const view = instance.views.getView(test.view);
            expect(view).to.be.ok;

            expect(view._playheadLayer._playheadText).to.equal(undefined);

            done();
          });
        });
      });
      context('when the global option is true', function() {
        it('should show playhead time in the zoomview only', function(done) {
          const options = initOptions(test.view, {
            container: document.getElementById(test.container)
          });

          options.showPlayheadTime = true;

          Peaks.init(options, function(err, instance) {
            expect(err).to.equal(null);

            const view = instance.views.getView(test.view);
            expect(view).to.be.ok;

            if (test.view === 'zoomview') {
              expect(view._playheadLayer._playheadText).to.be.ok;
              expect(view._playheadLayer._playheadText.getText()).to.equal('00:00.00');
            }
            else {
              expect(view._playheadLayer._playheadText).to.equal(undefined);
            }

            done();
          });
        });
      });

      context('when the global option is false', function() {
        it('should not show playhead time', function(done) {
          const options = initOptions(test.view, {
            container: document.getElementById(test.container)
          });

          options.showPlayheadTime = false;

          Peaks.init(options, function(err, instance) {
            expect(err).to.equal(null);

            const view = instance.views.getView(test.view);
            expect(view).to.be.ok;

            expect(view._playheadLayer._playheadText).to.equal(undefined);

            done();
          });
        });
      });

      context('when the view-specific option is true', function() {
        it('should show the current playback position next to the playhead', function(done) {
          const options = initOptions(test.view, {
            container: document.getElementById(test.container),
            showPlayheadTime: true
          });

          Peaks.init(options, function(err, instance) {
            expect(err).to.equal(null);

            const view = instance.views.getView(test.view);
            expect(view).to.be.ok;

            expect(view._playheadLayer._playheadText).to.be.ok;
            expect(view._playheadLayer._playheadText.getText()).to.equal('00:00.00');

            done();
          });
        });
      });

      context('when the view-specific option is false', function() {
        it('should not show the current playback position next to the playhead', function(done) {
          const options = initOptions(test.view, {
            container: document.getElementById(test.container),
            showPlayheadTime: false
          });

          Peaks.init(options, function(err, instance) {
            expect(err).to.equal(null);

            const view = instance.views.getView(test.view);
            expect(view).to.be.ok;

            expect(view._playheadLayer._playheadText).to.equal(undefined);

            done();
          });
        });
      });
    });

    describe('showPlayheadTime', function() {
      context('when enabled', function() {
        it('should show the current playback position next to the playhead', function(done) {
          const options = initOptions(test.view, {
            container: document.getElementById(test.container),
            showPlayheadTime: false
          });

          Peaks.init(options, function(err, instance) {
            expect(err).to.equal(null);

            const view = instance.views.getView(test.view);
            expect(view).to.be.ok;

            view.showPlayheadTime(true);

            expect(view._playheadLayer._playheadText).to.be.ok;
            expect(view._playheadLayer._playheadText.getText()).to.equal('00:00.00');

            done();
          });
        });
      });

      context('when disabled', function() {
        it('should not show the current playback position next to the playhead', function(done) {
          const options = initOptions(test.view, {
            container: document.getElementById(test.container),
            showPlayheadTime: false
          });

          Peaks.init(options, function(err, instance) {
            expect(err).to.equal(null);

            const view = instance.views.getView(test.view);
            expect(view).to.be.ok;

            view.showPlayheadTime(false);

            expect(view._playheadLayer._playheadText).to.equal(undefined);

            done();
          });
        });
      });
    });

    describe('timeLabelPrecision option', function() {
      context('with default options', function() {
        it('should use 2 decimal places for the current playback time', function(done) {
          const options = initOptions(test.view, {
            container: document.getElementById(test.container),
            showPlayheadTime: true
          });

          Peaks.init(options, function(err, instance) {
            expect(err).to.equal(null);

            const view = instance.views.getView(test.view);
            expect(view).to.be.ok;

            expect(view._playheadLayer._playheadText).to.be.ok;
            expect(view._playheadLayer._playheadText.getText()).to.equal('00:00.00');

            done();
          });
        });
      });

      context('with zero', function() {
        it('should set the number of decimal places for the current playback time', function(done) {
          const options = initOptions(test.view, {
            container: document.getElementById(test.container),
            showPlayheadTime: true,
            timeLabelPrecision: 0
          });

          Peaks.init(options, function(err, instance) {
            expect(err).to.equal(null);

            const view = instance.views.getView(test.view);
            expect(view).to.be.ok;

            expect(view._playheadLayer._playheadText).to.be.ok;
            expect(view._playheadLayer._playheadText.getText()).to.equal('00:00');

            done();
          });
        });
      });

      context('with non-zero', function() {
        it('should set the number of decimal places for the current playback time', function(done) {
          const options = initOptions(test.view, {
            container: document.getElementById(test.container),
            showPlayheadTime: true,
            timeLabelPrecision: 3
          });

          Peaks.init(options, function(err, instance) {
            expect(err).to.equal(null);

            const view = instance.views.getView(test.view);
            expect(view).to.be.ok;

            expect(view._playheadLayer._playheadText).to.be.ok;
            expect(view._playheadLayer._playheadText.getText()).to.equal('00:00.000');

            done();
          });
        });
      });
    });

    describe('setTimeLabelPrecision', function() {
      context('with zero', function() {
        it('should set the number of decimal places for the current playback time', function(done) {
          const options = initOptions(test.view, {
            container: document.getElementById(test.container),
            showPlayheadTime: true
          });

          Peaks.init(options, function(err, instance) {
            expect(err).to.equal(null);

            const view = instance.views.getView(test.view);
            expect(view).to.be.ok;

            view.setTimeLabelPrecision(0);

            expect(view._playheadLayer._playheadText).to.be.ok;
            expect(view._playheadLayer._playheadText.getText()).to.equal('00:00');

            done();
          });
        });
      });

      context('with non-zero', function() {
        it('should set the number of decimal places for the current playback time', function(done) {
          const options = initOptions(test.view, {
            container: document.getElementById(test.container),
            showPlayheadTime: true
          });

          Peaks.init(options, function(err, instance) {
            expect(err).to.equal(null);

            const view = instance.views.getView(test.view);
            expect(view).to.be.ok;

            view.setTimeLabelPrecision(3);

            expect(view._playheadLayer._playheadText).to.be.ok;
            expect(view._playheadLayer._playheadText.getText()).to.equal('00:00.000');

            done();
          });
        });
      });
    });

    describe('click events', function() {
      let p = null;
      let inputController = null;

      beforeEach(function(done) {
        // TODO: Konva.js uses global state to handle double click timing.
        // Instead of adding time delays, we just reset Konva's internal
        // flag here.
        Konva._mouseInDblClickWindow = false;

        const options = initOptions(test.view, {
          container: document.getElementById(test.container)
        });

        Peaks.init(options, function(err, instance) {
          if (err) {
            done(err);
            return;
          }

          p = instance;

          inputController = new InputController(test.container);

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
        it(`should emit a ${test.view}.click event`, function() {
          const emit = sinon.spy(p, 'emit');

          const x = test.view === 'overview' ? 40 : 100;

          inputController.mouseDown({ x: x, y: 50 });
          inputController.mouseUp({ x: x, y: 50 });

          const calls = getEmitCalls(emit, new RegExp(test.view));

          expect(calls.length).to.equal(1);

          expect(calls[0].args[0]).to.equal(`${test.view}.click`);
          expect(calls[0].args[1].evt).to.be.an.instanceOf(MouseEvent);
          expect(calls[0].args[1].time).to.be.a('number');
        });

        it(`should emit a ${test.view}.dblclick event`, function() {
          const emit = sinon.spy(p, 'emit');

          const x = test.view === 'overview' ? 40 : 100;

          inputController.mouseDown({ x: x, y: 50 });
          inputController.mouseUp({ x: x, y: 50 });
          inputController.mouseDown({ x: x, y: 50 });
          inputController.mouseUp({ x: x, y: 50 });

          const calls = getEmitCalls(emit, new RegExp(test.view));

          expect(calls.length).to.equal(3);

          expect(calls[0].args[0]).to.equal(`${test.view}.click`);
          expect(calls[1].args[0]).to.equal(`${test.view}.click`);
          expect(calls[2].args[0]).to.equal(`${test.view}.dblclick`);

          expect(calls[0].args[1].evt).to.be.an.instanceOf(MouseEvent);
          expect(calls[0].args[1].time).to.be.a('number');
        });
      });

      context('when clicking on a segment', function() {
        beforeEach(function(done) {
          p.segments.add({ id: 'segment1', startTime: 1.0, endTime: 2.0, editable: true });
          setTimeout(done, 50);
        });

        it('should emit both a ' + test.view + '.click and a segments.click event', function() {
          const emit = sinon.spy(p, 'emit');

          const x = test.view === 'overview' ? 40 : 100;

          inputController.mouseDown({ x: x, y: 50 });
          inputController.mouseUp({ x: x, y: 50 });

          const calls = getEmitCalls(emit, new RegExp(`${test.view}|segments`));

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

          expect(calls[3].args[0]).to.equal(`${test.view}.click`);
          expect(calls[3].args[1].evt).to.be.an.instanceOf(MouseEvent);
          expect(calls[3].args[1].time).to.be.a('number');
        });

        it('should emit both a ' + test.view + '.dblclick and a segments.dblclick event', function() {
          const emit = sinon.spy(p, 'emit');

          const x = test.view === 'overview' ? 40 : 100;

          inputController.mouseDown({ x: x, y: 50 });
          inputController.mouseUp({ x: x, y: 50 });
          inputController.mouseDown({ x: x, y: 50 });
          inputController.mouseUp({ x: x, y: 50 });

          const calls = getEmitCalls(emit, new RegExp(`${test.view}|segments`));

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

          expect(calls[3].args[0]).to.equal(`${test.view}.click`);
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

          expect(calls[7].args[0]).to.equal(`${test.view}.click`);
          expect(calls[7].args[1].evt).to.be.an.instanceOf(MouseEvent);
          expect(calls[7].args[1].time).to.be.a('number');

          expect(calls[8].args[0]).to.equal('segments.dblclick');
          expect(calls[8].args[1].evt).to.be.an.instanceOf(MouseEvent);
          expect(calls[8].args[1].segment).to.be.an.instanceOf(Segment);
          expect(calls[8].args[1].segment.id).to.equal('segment1');

          expect(calls[9].args[0]).to.equal(`${test.view}.dblclick`);
          expect(calls[9].args[1].evt).to.be.an.instanceOf(MouseEvent);
          expect(calls[9].args[1].time).to.be.a('number');
        });

        it(`should allow the user to prevent the ${test.view}.click event`, function() {
          const emit = sinon.spy(p, 'emit');

          p.on('segments.click', function(event) {
            event.preventViewEvent();
          });

          const x = test.view === 'overview' ? 40 : 100;

          inputController.mouseDown({ x: x, y: 50 });
          inputController.mouseUp({ x: x, y: 50 });

          const calls = getEmitCalls(emit, new RegExp(`${test.view}|segments`));

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

        it(`should allow the user to prevent the ${test.view}.dblclick event`, function() {
          const emit = sinon.spy(p, 'emit');

          p.on('segments.dblclick', function(event) {
            event.preventViewEvent();
          });

          const x = test.view === 'overview' ? 40 : 100;

          inputController.mouseDown({ x: x, y: 50 });
          inputController.mouseUp({ x: x, y: 50 });
          inputController.mouseDown({ x: x, y: 50 });
          inputController.mouseUp({ x: x, y: 50 });

          const calls = getEmitCalls(emit, new RegExp(`${test.view}|segments`));

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

          expect(calls[3].args[0]).to.equal(`${test.view}.click`);
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

          expect(calls[7].args[0]).to.equal(`${test.view}.click`);
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

        it(`should emit both a ${test.view}.click and a points.click event`, function() {
          const emit = sinon.spy(p, 'emit');

          const x = test.view === 'overview' ? 30 : 86;

          inputController.mouseDown({ x: x, y: 50 });
          inputController.mouseUp({ x: x, y: 50 });

          const calls = getEmitCalls(emit, new RegExp(`${test.view}|points`));

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

          expect(calls[1].args[0]).to.equal(`${test.view}.click`);
          expect(calls[1].args[1].evt).to.be.an.instanceOf(MouseEvent);
          expect(calls[1].args[1].time).to.be.a('number');
        });

        it(`should emit both a ${test.view}.dblclick and a points.dblclick event`, function() {
          const emit = sinon.spy(p, 'emit');

          const x = test.view === 'overview' ? 30 : 86;

          inputController.mouseDown({ x: x, y: 50 });
          inputController.mouseUp({ x: x, y: 50 });
          inputController.mouseDown({ x: x, y: 50 });
          inputController.mouseUp({ x: x, y: 50 });

          const calls = getEmitCalls(emit, new RegExp(`${test.view}|points`));

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

          expect(calls[1].args[0]).to.equal(`${test.view}.click`);
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

          expect(calls[3].args[0]).to.equal(`${test.view}.click`);
          expect(calls[3].args[1].evt).to.be.an.instanceOf(MouseEvent);
          expect(calls[3].args[1].time).to.be.a('number');

          expect(calls[4].args[0]).to.equal('points.dblclick');
          expect(calls[4].args[1].evt).to.be.an.instanceOf(MouseEvent);
          expect(calls[4].args[1].point).to.be.an.instanceOf(Point);
          expect(calls[4].args[1].point.id).to.equal('point1');

          expect(calls[5].args[0]).to.equal(`${test.view}.dblclick`);
          expect(calls[5].args[1].evt).to.be.an.instanceOf(MouseEvent);
          expect(calls[5].args[1].time).to.be.a('number');
        });

        it(`should allow the user to prevent the ${test.view}.click event`, function() {
          const emit = sinon.spy(p, 'emit');

          p.on('points.click', function(event) {
            event.preventViewEvent();
          });

          const x = test.view === 'overview' ? 30 : 86;

          inputController.mouseDown({ x: x, y: 50 });
          inputController.mouseUp({ x: x, y: 50 });

          const calls = getEmitCalls(emit, new RegExp(`${test.view}|points`));

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

        it(`should allow the user to prevent the ${test.view}.dblclick event`, function() {
          const emit = sinon.spy(p, 'emit');

          p.on('points.dblclick', function(event) {
            event.preventViewEvent();
          });

          const x = test.view === 'overview' ? 30 : 86;

          inputController.mouseDown({ x: x, y: 50 });
          inputController.mouseUp({ x: x, y: 50 });
          inputController.mouseDown({ x: x, y: 50 });
          inputController.mouseUp({ x: x, y: 50 });

          const calls = getEmitCalls(emit, new RegExp(`${test.view}|points`));

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

          expect(calls[1].args[0]).to.equal(`${test.view}.click`);
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

          expect(calls[3].args[0]).to.equal(`${test.view}.click`);
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
});
