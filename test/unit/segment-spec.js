'use strict';

require('./setup');

var Peaks = require('../../src/main');
var Segment = require('../../src/segment');

describe('Segment', function() {
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

    it('should not update any attributes if invalid', function() {
      p.segments.add({
        startTime: 0,
        endTime: 10,
        editable: true,
        color: '#ff0000',
        labelText: 'A segment'
      });

      var segment = p.segments.getSegments()[0];

      expect(function() {
        segment.update({
          startTime: 10,
          endTime: 0,
          editable: false,
          color: '#000000',
          labelText: 'Updated'
        });
      }).to.throw(RangeError);

      expect(segment.startTime).to.equal(0);
      expect(segment.endTime).to.equal(10);
      expect(segment.editable).to.equal(true);
      expect(segment.color).to.equal('#ff0000');
      expect(segment.labelText).to.equal('A segment');
    });

    it('should allow a user data attribute to be created', function() {
      var peaks = { emit: function() {} };
      var segment = new Segment({
        peaks: peaks,
        id: 'segment.1',
        startTime: 0.0,
        endTime: 10.0,
        labelText: '',
        editable: true
      });

      segment.update({ data: 'test' });

      expect(segment.data).to.equal('test');
    });

    it('should allow a user data attribute to be updated', function() {
      var peaks = { emit: function() {} };
      var segment = new Segment({
        peaks: peaks,
        id: 'segment.1',
        startTime: 0.0,
        endTime: 10.0,
        labelText: '',
        editable: true,
        data: 'test'
      });

      segment.update({ data: 'updated' });

      expect(segment.data).to.equal('updated');
    });
  });

  describe('isVisible', function() {
    it('should return false if segment is before visible range', function() {
      var segment = new Segment({
        peaks: null,
        id: 'segment.1',
        labelText: '',
        editable: true,
        startTime: 0.0,
        endTime: 10.0
      });

      expect(segment.isVisible(10.0, 20.0)).to.equal(false);
    });

    it('should return false if segment is after visible range', function() {
      var segment = new Segment({
        peaks: null,
        id: 'segment.1',
        labelText: '',
        editable: true,
        startTime: 20.0,
        endTime: 30.0
      });

      expect(segment.isVisible(10.0, 20.0)).to.equal(false);
    });

    it('should return true if segment is within visible range', function() {
      var segment = new Segment({
        peaks: null,
        id: 'segment.1',
        labelText: '',
        editable: true,
        startTime: 12.0,
        endTime: 18.0
      });

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });

    it('should return true if segment starts before and ends within visible range', function() {
      var segment = new Segment({
        peaks: null,
        id: 'segment.1',
        labelText: '',
        editable: true,
        startTime: 9.0,
        endTime: 19.0
      });

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });

    it('should return true if segment starts before and ends at end of visible range', function() {
      var segment = new Segment({
        peaks: null,
        id: 'segment.1',
        labelText: '',
        editable: true,
        startTime: 9.0,
        endTime: 20.0
      });

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });

    it('should return true if segment starts after and ends after visible range', function() {
      var segment = new Segment({
        peaks: null,
        id: 'segment.1',
        labelText: '',
        editable: true,
        startTime: 11.0,
        endTime: 21.0
      });

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });

    it('should return true if segment starts after and ends at the end of visible range', function() {
      var segment = new Segment({
        peaks: null,
        id: 'segment.1',
        labelText: '',
        editable: true,
        startTime: 11.0,
        endTime: 20.0
      });

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });

    it('should return true if segment is same as visible range', function() {
      var segment = new Segment({
        peaks: null,
        id: 'segment.1',
        labelText: '',
        editable: true,
        startTime: 10.0,
        endTime: 20.0
      });

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });

    it('should return true if segment contains visible range', function() {
      var segment = new Segment({
        peaks: null,
        id: 'segment.1',
        labelText: '',
        editable: true,
        startTime: 9.0,
        endTime: 21.0
      });

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });
  });
});
