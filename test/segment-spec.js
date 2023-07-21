import Peaks from '../src/main';
import { Segment } from '../src/segment';

describe('Segment', function() {
  describe('update', function() {
    let p;

    beforeEach(function(done) {
      const options = {
        overview: {
          container: document.getElementById('overview-container')
        },
        zoomview: {
          container: document.getElementById('zoomview-container')
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
      p.segments.add({
        startTime: 0,
        endTime: 10,
        labelText: 'label text',
        color: '#ff0000',
        borderColor: '#00ff00',
        editable: true
      });

      const emit = sinon.spy(p, 'emit');

      const segment = p.segments.getSegments()[0];

      segment.update({
        startTime: 2,
        endTime: 9,
        labelText: 'new label text',
        color: '#800000',
        borderColor: '#008000',
        editable: false
      });

      expect(segment.startTime).to.equal(2);
      expect(segment.endTime).to.equal(9);
      expect(segment.editable).to.equal(false);
      expect(segment.color).to.equal('#800000');
      expect(segment.borderColor).to.equal('#008000');
      expect(segment.labelText).to.equal('new label text');

      expect(emit.callCount).to.equal(1);
      expect(emit).to.have.been.calledWith('segments.update', segment);
    });

    it('should not allow startTime to be greater than endTime', function() {
      p.segments.add({ startTime: 0, endTime: 10, labelText: 'test' });

      const segment = p.segments.getSegments()[0];

      expect(function() {
        segment.update({ startTime: 8, endTime: 3 });
      }).to.throw(RangeError);
    });

    it('should not allow startTime to be invalid', function() {
      p.segments.add({ startTime: 0, endTime: 10, labelText: 'test' });

      const segment = p.segments.getSegments()[0];

      expect(function() {
        segment.update({ startTime: NaN });
      }).to.throw(TypeError);
    });

    it('should not allow endTime to be invalid', function() {
      p.segments.add({ startTime: 0, endTime: 10, labelText: 'test' });

      const segment = p.segments.getSegments()[0];

      expect(function() {
        segment.update({ endTime: NaN });
      }).to.throw(TypeError);
    });

    it('should not allow id to be null', function() {
      p.segments.add({ startTime: 0, endTime: 10, labelText: 'test' });

      const segment = p.segments.getSegments()[0];

      expect(function() {
        segment.update({ id: null });
      }).to.throw(TypeError);
    });

    it('should not allow id to be undefined', function() {
      p.segments.add({ startTime: 0, endTime: 10, labelText: 'test' });

      const segment = p.segments.getSegments()[0];

      expect(function() {
        segment.update({ id: undefined });
      }).to.throw(TypeError);
    });

    it('should not update any attributes if invalid', function() {
      p.segments.add({
        startTime: 0,
        endTime: 10,
        editable: true,
        color: '#ff0000',
        borderColor: '#00ff00',
        labelText: 'A segment'
      });

      const emit = sinon.spy(p, 'emit');

      const segment = p.segments.getSegments()[0];

      expect(function() {
        segment.update({
          startTime: 10,
          endTime: 0,
          editable: false,
          color: '#000000',
          borderColor: '#0000ff',
          labelText: 'Updated'
        });
      }).to.throw(RangeError);

      expect(segment.startTime).to.equal(0);
      expect(segment.endTime).to.equal(10);
      expect(segment.editable).to.equal(true);
      expect(segment.color).to.equal('#ff0000');
      expect(segment.borderColor).to.equal('#00ff00');
      expect(segment.labelText).to.equal('A segment');

      expect(emit.callCount).to.equal(0);
    });

    it('should allow the segment id to be updated', function() {
      const segment = p.segments.add({
        id: 'segment1',
        startTime: 0,
        endTime: 10,
        labelText: 'label text',
        color: '#ff0000',
        borderColor: '#00ff00',
        editable: true
      });

      expect(p.segments.getSegment('segment1')).to.be.ok;
      expect(p.segments.getSegment('segment2')).to.equal(undefined);

      segment.update({
        id: 'segment2'
      });

      expect(p.segments.getSegment('segment1')).to.equal(undefined);
      expect(p.segments.getSegment('segment2')).to.be.ok;
    });

    it('should not allow the segment id to be updated to be a duplicate', function() {
      const segment = p.segments.add({
        id: 'segment1',
        startTime: 0,
        endTime: 10,
        labelText: 'label text',
        color: '#ff0000',
        borderColor: '#00ff00',
        editable: true
      });

      p.segments.add({
        id: 'segment2',
        startTime: 10,
        endTime: 20,
        labelText: 'label text',
        color: '#ff0000',
        borderColor: '#00ff00',
        editable: true
      });

      expect(function() {
        segment.update({
          id: 'segment2'
        });
      }).to.throw(Error);
    });

    it('should allow a user data attribute to be created', function() {
      const peaks = { emit: function() {} };
      const pid = 0;

      const segment = new Segment(peaks, pid, {
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
      const peaks = { emit: function() {} };
      const pid = 0;

      const segment = new Segment(peaks, pid, {
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

    [
      'update',
      'isVisible',
      'peaks',
      'pid',
      '_id',
      '_pid',
      '_startTime',
      '_endTime',
      '_labelText',
      '_color',
      '_borderColor',
      '_editable'
    ].forEach(function(name) {
      it('should not allow an invalid user data attribute name: ' + name, function() {
        expect(function() {
          const peaks = { emit: function() {} };
          const pid = 0;

          const segment = new Segment(peaks, pid, {
            id: 'segment.1',
            startTime: 0.0,
            endTime: 10.0,
            labelText: '',
            editable: true
          });

          const attributes = {};

          attributes[name] = 'test';

          segment.update(attributes);
        }).to.throw(Error);
      });
    });
  });

  describe('isVisible', function() {
    it('should return false if segment is before visible range', function() {
      const peaks = { emit: function() {} };
      const pid = 0;

      const segment = new Segment(peaks, pid, {
        id: 'segment.1',
        labelText: '',
        editable: true,
        startTime: 0.0,
        endTime: 10.0
      });

      expect(segment.isVisible(10.0, 20.0)).to.equal(false);
    });

    it('should return false if segment is after visible range', function() {
      const peaks = { emit: function() {} };
      const pid = 0;

      const segment = new Segment(peaks, pid, {
        id: 'segment.1',
        labelText: '',
        editable: true,
        startTime: 20.0,
        endTime: 30.0
      });

      expect(segment.isVisible(10.0, 20.0)).to.equal(false);
    });

    it('should return true if segment is within visible range', function() {
      const peaks = { emit: function() {} };
      const pid = 0;

      const segment = new Segment(peaks, pid, {
        id: 'segment.1',
        labelText: '',
        editable: true,
        startTime: 12.0,
        endTime: 18.0
      });

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });

    it('should return true if segment starts before and ends within visible range', function() {
      const peaks = { emit: function() {} };
      const pid = 0;

      const segment = new Segment(peaks, pid, {
        id: 'segment.1',
        labelText: '',
        editable: true,
        startTime: 9.0,
        endTime: 19.0
      });

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });

    it('should return true if segment starts before and ends at end of visible range', function() {
      const peaks = { emit: function() {} };
      const pid = 0;

      const segment = new Segment(peaks, pid, {
        id: 'segment.1',
        labelText: '',
        editable: true,
        startTime: 9.0,
        endTime: 20.0
      });

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });

    it('should return true if segment starts after and ends after visible range', function() {
      const peaks = { emit: function() {} };
      const pid = 0;

      const segment = new Segment(peaks, pid, {
        id: 'segment.1',
        labelText: '',
        editable: true,
        startTime: 11.0,
        endTime: 21.0
      });

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });

    it('should return true if segment starts after and ends at the end of visible range', function() {
      const peaks = { emit: function() {} };
      const pid = 0;

      const segment = new Segment(peaks, pid, {
        id: 'segment.1',
        labelText: '',
        editable: true,
        startTime: 11.0,
        endTime: 20.0
      });

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });

    it('should return true if segment is same as visible range', function() {
      const peaks = { emit: function() {} };
      const pid = 0;

      const segment = new Segment(peaks, pid, {
        id: 'segment.1',
        labelText: '',
        editable: true,
        startTime: 10.0,
        endTime: 20.0
      });

      expect(segment.isVisible(10.0, 20.0)).to.equal(true);
    });

    it('should return true if segment contains visible range', function() {
      const peaks = { emit: function() {} };
      const pid = 0;

      const segment = new Segment(peaks, pid, {
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
