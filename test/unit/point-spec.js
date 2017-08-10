'use strict';

var Point = require('../../src/main/markers/point');

describe('Point', function() {
  describe('isVisible', function() {
    it('should return false if point is before visible range', function() {
      var point = new Point('point.1', 9.0);

      expect(point.isVisible(10.0, 20.0)).to.equal(false);
    });

    it('should return false if point is after visible range', function() {
      var point = new Point('point.1', 20.0);

      expect(point.isVisible(10.0, 20.0)).to.equal(false);
    });

    it('should return true if point is within visible range', function() {
      var point = new Point('point.1', 10.0);

      expect(point.isVisible(10.0, 20.0)).to.equal(true);
    });
  });
});
