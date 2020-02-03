'use strict';

require('./setup');

var Peaks = require('../../src/main');
var Segment = require('../../src/segment');

describe('Segment', function() {
  describe('update()', function() {
    var p;

    beforeEach(function(done) {
      p = Peaks.init({
        container: document.getElementById('container'),
        mediaElement: document.getElementById('media'),
        dataUri: { arraybuffer: 'base/test_data/sample.dat' }
      });

      p.on('peaks.ready', done);
    });

    afterEach(function() {
      if (p) {
        p.destroy();
      }
    });

    it('should be possible to update all properties programatically', function() {
      p.segments.add({ startTime: 0, endTime: 10, labelText: 'label text' });

      var newLabelText = 'new label text';
      var newStartTime = 2;
      var newEndTime = 9;
      var segment = p.segments.getSegments()[0];

      segment.update({
        startTime: newStartTime,
        endTime: newEndTime,
        labelText: newLabelText
      });
      expect(segment.startTime).to.equal(newStartTime);
      expect(segment.endTime).to.equal(newEndTime);
      expect(segment.labelText).to.equal(newLabelText);
    });

    it('should not allow invalid updates', function() {
      p.segments.add({ startTime: 0, endTime: 10 });

      var segment = p.segments.getSegments()[0];

      expect(function() {
        segment.update({ startTime: NaN });
      }).to.throw(TypeError);

      expect(function() {
        segment.update({ endTime: NaN });
      }).to.throw(TypeError);

      expect(function() {
        segment.update({ startTime: 8, endTime: 3 });
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
