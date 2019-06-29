'use strict';

require('./setup');

var Peaks = require('../../src/main');
var Point = require('../../src/main/markers/point');

describe('Point', function() {
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
      p.points.add({ time: 10, editable: true, color: '#ff0000', labelText: 'A point' });

      var newLabelText = 'new label text';
      var newTime = 12;
      var point = p.points.getPoints()[0];

      point.update({
        time: newTime,
        labelText: newLabelText
      });

      expect(point.time).to.equal(newTime);
      expect(point.labelText).to.equal(newLabelText);
    });

    it('should not allow invalid updates', function() {
      p.points.add({ time: 10, editable: true, color: '#ff0000', labelText: 'A point' });

      var point = p.points.getPoints()[0];

      expect(function() {
        point.update({ time: NaN });
      }).to.throw(TypeError);

      expect(function() {
        point.update({ time: -10 });
      }).to.throw(TypeError);

      point.update({ labelText: undefined });
      expect(point.labelText).to.equal('');
    });
  });

  describe('isVisible', function() {
    it('should return false if point is before visible range', function() {
      var point = new Point({}, 'point.1', 9.0);

      expect(point.isVisible(10.0, 20.0)).to.equal(false);
    });

    it('should return false if point is after visible range', function() {
      var point = new Point({}, 'point.1', 20.0);

      expect(point.isVisible(10.0, 20.0)).to.equal(false);
    });

    it('should return true if point is within visible range', function() {
      var point = new Point({}, 'point.1', 10.0);

      expect(point.isVisible(10.0, 20.0)).to.equal(true);
    });
  });
});
