'use strict';

var Peaks = require('../../src/main');

describe('SegmentsLayer', function() {
  var p;

  beforeEach(function(done) {
    p = Peaks.init({
      container: document.getElementById('waveform-visualiser-container'),
      mediaElement: document.querySelector('audio'),
      dataUri: {
        json: 'base/test_data/sample.json'
      },
      keyboard: true,
      height: 240
    });

    p.on('peaks.ready', done);
  });

  afterEach(function() {
    if (p) {
      p.destroy();
    }
  });

  describe('segments.add', function() {
    it('should redraw the view after adding a segment that is visible', function() {
      var spy = sinon.spy(p.waveform.waveformZoomView._segmentsLayer._layer, 'draw');

      p.segments.add({ startTime: 0, endTime: 10, editable: true, id: 'segment1' });

      expect(spy.callCount).to.equal(1);
    });

    it('should not redraw the view after adding a segment that is not visible', function() {
      var spy = sinon.spy(p.waveform.waveformZoomView._segmentsLayer._layer, 'draw');

      p.segments.add({ startTime: 28, endTime: 32, editable: true, id: 'segment2' });

      expect(spy.callCount).to.equal(0);
    });
  });
});
