'use strict';

var Peaks = require('../../src/main');
var Segment = require('../../src/main/markers/segment');

describe('Segment', function() {
  var p, deprecationLogger;

  beforeEach(function(done) {
    deprecationLogger = sinon.spy();
    p = Peaks.init({
      container: document.getElementById('waveform-visualiser-container'),
      mediaElement: document.querySelector('audio'),
      dataUri: {
        json: 'base/test_data/sample.json'
      },
      keyboard: true,
      height: 240,
      deprecationLogger: deprecationLogger
    });
    p.on('peaks.ready', done);
  });

  afterEach(function() {
    if (p) {
      p.destroy();
    }
  });

  describe('labelText', function() {
    it('should be possible to update programatically', function() {
      p.segments.add({ startTime: 0, endTime: 10, labelText: 'label text' });

      var newLabelText = 'new label text';
      var segment = p.segments.getSegments()[0];

      segment.labelText = newLabelText;
      expect(segment.labelText).to.equal(newLabelText);
    });
  });

  describe('time', function() {
    it('should be possible to update programatically', function() {
      p.segments.add({ startTime: 0, endTime: 10 });

      var segment = p.segments.getSegments()[0];

      segment.updateTime(2, 4);
      expect(segment.startTime).to.equal(2);
      expect(segment.endTime).to.equal(4);
    });

    it('should not allow invalid updates', function() {
      p.segments.add({ startTime: 0, endTime: 10 });

      var segment = p.segments.getSegments()[0];

      expect(function() {
        segment.updateTime(NaN, 10);
      }).to.throw(TypeError);
      expect(function() {
        segment.updateTime(0, NaN);
      }).to.throw(TypeError);
      expect(function() {
        segment.updateTime(8, 3);
      }).to.throw(RangeError);
    });
  });

  describe('isVisible', function() {
    it('should return false if segment is before visible range', function() {
      var segment = new Segment({}, 'segment.1', 0.0, 10.0);

      expect(segment.isVisible(10.0, 20.0)).to.equal(false);
    });

    it('should return false if segment is after visible range', function() {
      var segment = new Segment({}, 'segment.1', 20.0, 30.0);

      expect(segment.isVisible(10.0, 20.0)).to.equal(false);
    });

    it('should return true if segment is within visible range', function() {
      var segment = new Segment({}, 'segment.1', 12.0, 18.0);

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });

    it('should return true if segment starts before and ends within visible range', function() {
      var segment = new Segment({}, 'segment.1', 9.0, 19.0);

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });

    it('should return true if segment starts before and ends at end of visible range', function() {
      var segment = new Segment({}, 'segment.1', 9.0, 20.0);

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });

    it('should return true if segment starts after and ends after visible range', function() {
      var segment = new Segment({}, 'segment.1', 11.0, 21.0);

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });

    it('should return true if segment starts after and ends at the end of visible range', function() {
      var segment = new Segment({}, 'segment.1', 11.0, 20.0);

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });

    it('should return true if segment is same as visible range', function() {
      var segment = new Segment({}, 'segment.1', 10.0, 20.0);

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });

    it('should return true if segment contains visible range', function() {
      var segment = new Segment({}, 'segment.1', 9.0, 21.0);

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });
  });
});
