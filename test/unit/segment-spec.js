'use strict';

var Segment = require('../../src/main/markers/segment');

describe('Segment', function() {
  describe('isVisible', function() {
    it('should return false if segment is before visible range', function() {
      var segment = new Segment('segment.1', 0.0, 10.0);

      expect(segment.isVisible(10.0, 20.0)).to.equal(false);
    });

    it('should return false if segment is after visible range', function() {
      var segment = new Segment('segment.1', 20.0, 30.0);

      expect(segment.isVisible(10.0, 20.0)).to.equal(false);
    });

    it('should return true if segment is within visible range', function() {
      var segment = new Segment('segment.1', 12.0, 18.0);

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });

    it('should return true if segment starts before and ends within visible range', function() {
      var segment = new Segment('segment.1', 9.0, 19.0);

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });

    it('should return true if segment starts before and ends at end of visible range', function() {
      var segment = new Segment('segment.1', 9.0, 20.0);

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });

    it('should return true if segment starts after and ends after visible range', function() {
      var segment = new Segment('segment.1', 11.0, 21.0);

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });

    it('should return true if segment starts after and ends at the end of visible range', function() {
      var segment = new Segment('segment.1', 11.0, 20.0);

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });

    it('should return true if segment is same as visible range', function() {
      var segment = new Segment('segment.1', 10.0, 20.0);

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });

    it('should return true if segment contains visible range', function() {
      var segment = new Segment('segment.1', 9.0, 21.0);

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });
  });
});
