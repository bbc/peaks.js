'use strict';

require('./setup');

var Peaks = require('../../src/main');
var Point = require('../../src/point');

describe('Point', function() {
  describe('update', function() {
    var p;

    beforeEach(function(done) {
      var options = {
        containers: {
          overview: document.getElementById('overview-container'),
          zoomview: document.getElementById('zoomview-container')
        },
        mediaElement: document.getElementById('media'),
        dataUri: { arraybuffer: 'base/test_data/sample.dat' }
      };

      Peaks.init(options, function(err, instance) {
        expect(err).to.equal(null);
        p = instance;
        done();
      });
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
      p.points.add({
        time: 10,
        editable: true,
        color: '#ff0000',
        labelText: 'A point'
      });

      var point = p.points.getPoints()[0];

      expect(function() {
        point.update({ time: NaN });
      }).to.throw(TypeError);

      expect(function() {
        point.update({ time: -10 });
      }).to.throw(RangeError);

      point.update({ labelText: undefined });
      expect(point.labelText).to.equal('');
    });

    it('should not update any attributes if invalid', function() {
      p.points.add({
        time: 10,
        editable: true,
        color: '#ff0000',
        labelText: 'A point'
      });

      var point = p.points.getPoints()[0];

      expect(function() {
        point.update({
          time: NaN,
          editable: false,
          color: '#000000',
          labelText: 'Updated'
        });
      }).to.throw(TypeError);

      expect(point.time).to.equal(10);
      expect(point.editable).to.equal(true);
      expect(point.color).to.equal('#ff0000');
      expect(point.labelText).to.equal('A point');
    });

    it('should allow a user data attribute to be created', function() {
      var peaks = { emit: function() {} };
      var point = new Point({
        peaks: peaks,
        id: 'point.1',
        time: 0.0,
        editable: false,
        color: '#000000',
        labelText: ''
      });

      point.update({ data: 'test' });

      expect(point.data).to.equal('test');
    });

    it('should allow a user data attribute to be updated', function() {
      var peaks = { emit: function() {} };
      var point = new Point({
        peaks: peaks,
        id: 'point.1',
        time: 0.0,
        editable: false,
        color: '#000000',
        labelText: '',
        data: 'test'
      });

      point.update({ data: 'updated' });

      expect(point.data).to.equal('updated');
    });
  });

  describe('isVisible', function() {
    it('should return false if point is before visible range', function() {
      var point = new Point({
        peaks: null,
        id: 'point.1',
        labelText: '',
        editable: true,
        time: 9.0
      });

      expect(point.isVisible(10.0, 20.0)).to.equal(false);
    });

    it('should return false if point is after visible range', function() {
      var point = new Point({
        peaks: null,
        id: 'point.1',
        labelText: '',
        editable: true,
        time: 20.0
      });

      expect(point.isVisible(10.0, 20.0)).to.equal(false);
    });

    it('should return true if point is within visible range', function() {
      var point = new Point({
        peaks: null,
        id: 'point.1',
        labelText: '',
        editable: true,
        time: 10.0
      });

      expect(point.isVisible(10.0, 20.0)).to.equal(true);
    });
  });
});
