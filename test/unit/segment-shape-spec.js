import Peaks from '../../src/main';
import SegmentShape from '../../src/segment-shape';
import WaveformShape from '../../src/waveform-shape';

describe('SegmentShape', function() {
  var p;

  function createPeaksInstance(segmentOptions, done) {
    var options = {
      overview: {
        container: document.getElementById('overview-container')
      },
      zoomview: {
        container: document.getElementById('zoomview-container')
      },
      mediaElement: document.getElementById('media'),
      dataUri: {
        json: 'base/test_data/sample.json'
      },
      segmentOptions: segmentOptions
    };

    Peaks.init(options, function(err, instance) {
      expect(err).to.equal(null);
      p = instance;
      done();
    });
  }

  afterEach(function() {
    if (p) {
      p.destroy();
      p = null;
    }
  });

  context('with marker style segments', function() {
    context('with editable segments', function() {
      it('should create marker handles', function(done) {
        createPeaksInstance({
          style: 'markers'
        },
        function() {
          var spy = sinon.spy(p.options, 'createSegmentMarker');

          p.segments.add({
            startTime: 0,
            endTime:   10,
            editable:  true,
            id:        'segment1'
          });

          // 2 for zoomview, as overview forces segments to be non-editable by default.
          expect(spy.callCount).to.equal(2);

          var call = spy.getCall(0);

          expect(call.args).to.have.lengthOf(1);
          expect(call.args[0].segment.startTime).to.equal(0);
          expect(call.args[0].segment.endTime).to.equal(10);
          expect(call.args[0].segment.editable).to.equal(true);
          expect(call.args[0].segment.id).to.equal('segment1');
          expect(call.args[0].draggable).to.equal(true);
          expect(call.args[0]).to.have.property('startMarker');
          expect(call.args[0].color).to.equal('#aaaaaa');
          expect(call.args[0]).to.have.property('layer');
          expect(call.args[0].view).to.equal('zoomview');
          done();
        });
      });
    });

    context('with non-editable segments', function() {
      it('should not create marker handles', function(done) {
        createPeaksInstance({
          style: 'markers'
        },
        function() {
          var spy = sinon.spy(p.options, 'createSegmentMarker');

          p.segments.add({ startTime: 0, endTime: 10, editable: false, id: 'segment1' });

          expect(spy.callCount).to.equal(0);
          done();
        });
      });
    });

    context('with no given waveform color', function() {
      it('should use the default color', function(done) {
        createPeaksInstance({
          style: 'markers'
        },
        function() {
          p.segments.add({
            startTime: 0,
            endTime:   10,
            editable:  true,
            id:        'segment1'
          });

          var zoomView = p.views.getView('zoomview');

          // eslint-disable-next-line dot-notation
          var segmentShape = zoomView._segmentsLayer._segmentShapes['segment1'];

          expect(segmentShape).to.be.an.instanceOf(SegmentShape);

          expect(segmentShape._waveformShape).to.be.an.instanceOf(WaveformShape);
          expect(segmentShape._waveformShape._color).to.equal('#0074d9');
          done();
        });
      });
    });

    context('with a given waveform color', function() {
      it('should create a waveform segment', function(done) {
        createPeaksInstance({
          style:         'markers',
          waveformColor: '#f00'
        },
        function() {
          p.segments.add({
            startTime: 0,
            endTime:   10,
            editable:  true,
            id:        'segment1',
            color:     '#0f0'
          });

          var zoomView = p.views.getView('zoomview');

          // eslint-disable-next-line dot-notation
          var segmentShape = zoomView._segmentsLayer._segmentShapes['segment1'];

          expect(segmentShape).to.be.an.instanceOf(SegmentShape);
          expect(segmentShape._waveformShape).to.be.an.instanceOf(WaveformShape);
          expect(segmentShape._waveformShape._color).to.equal('#0f0');
          done();
        });
      });
    });
  });

  context('with overlay style segments', function() {
    it('should not create marker handles', function(done) {
      createPeaksInstance({
        style: 'overlay'
      },
      function() {
        var spy = sinon.spy(p.options, 'createSegmentMarker');

        p.segments.add({
          startTime: 0,
          endTime:   10,
          editable:  true,
          id:        'segment1'
        });

        expect(spy.callCount).to.equal(0);

        done();
      });
    });

    it('should not create a waveform segment', function(done) {
      createPeaksInstance({
        style: 'overlay'
      },
      function() {
        p.segments.add({
          startTime: 0,
          endTime:   10,
          editable:  true,
          id:        'segment1'
        });

        var zoomView = p.views.getView('zoomview');

        // eslint-disable-next-line dot-notation
        var segmentShape = zoomView._segmentsLayer._segmentShapes['segment1'];

        expect(segmentShape).to.be.an.instanceOf(SegmentShape);
        expect(segmentShape._waveformShape).to.equal(undefined);
        done();
      });
    });

    it('should create an overlay with default attributes', function(done) {
      createPeaksInstance({
        style: 'overlay'
      },
      function() {
        p.segments.add({
          startTime: 0,
          endTime:   10,
          editable:  true,
          id:        'segment1'
        });

        var zoomView = p.views.getView('zoomview');

        // eslint-disable-next-line dot-notation
        var segmentShape = zoomView._segmentsLayer._segmentShapes['segment1'];

        expect(segmentShape).to.be.an.instanceOf(SegmentShape);
        expect(segmentShape._overlayRect.getStroke()).to.equal('#ff0000');
        expect(segmentShape._overlayRect.getStrokeWidth()).to.equal(2);
        expect(segmentShape._overlayRect.getFill()).to.equal('#ff0000');
        expect(segmentShape._overlayRect.getOpacity()).to.equal(0.3);
        expect(segmentShape._overlayRect.getCornerRadius()).to.equal(5);
        done();
      });
    });

    it('should create an overlay with given color', function(done) {
      createPeaksInstance({
        style: 'overlay'
      },
      function() {
        p.segments.add({
          startTime:   0,
          endTime:     10,
          editable:    true,
          id:          'segment1',
          color:       '#0000ff',
          borderColor: '#00ff00'
        });

        var zoomView = p.views.getView('zoomview');

        // eslint-disable-next-line dot-notation
        var segmentShape = zoomView._segmentsLayer._segmentShapes['segment1'];

        expect(segmentShape).to.be.an.instanceOf(SegmentShape);
        expect(segmentShape._overlayRect.getStroke()).to.equal('#00ff00');
        expect(segmentShape._overlayRect.getStrokeWidth()).to.equal(2);
        expect(segmentShape._overlayRect.getFill()).to.equal('#0000ff');
        expect(segmentShape._overlayRect.getOpacity()).to.equal(0.3);
        expect(segmentShape._overlayRect.getCornerRadius()).to.equal(5);
        done();
      });
    });
  });
});
