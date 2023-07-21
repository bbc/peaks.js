import Peaks from '../src/main';
import SegmentShape from '../src/segment-shape';
import { extend } from '../src/utils';
import WaveformShape from '../src/waveform-shape';

describe('SegmentShape', function() {
  let p;

  function createPeaksInstance(options, done) {
    const opts = {
      overview: {
        container: document.getElementById('overview-container'),
        segmentOptions: {}
      },
      zoomview: {
        container: document.getElementById('zoomview-container'),
        segmentOptions: {}
      },
      mediaElement: document.getElementById('media'),
      dataUri: {
        json: 'base/test_data/sample.json'
      },
      segmentOptions: {}
    };

    extend(opts.segmentOptions, options.segmentOptions);

    if (options.overview) {
      extend(opts.overview.segmentOptions, options.overview.segmentOptions);
    }

    if (options.zoomview) {
      extend(opts.zoomview.segmentOptions, options.zoomview.segmentOptions);
    }

    Peaks.init(opts, function(err, instance) {
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
    [
      { name: 'editable',     editable: true  },
      { name: 'non-editable', editable: false }
    ].forEach(function(test) {
      context(`with ${test.name} segments`, function() {
        it('should create marker handles', function(done) {
          createPeaksInstance({
            segmentOptions: {
              markers: true,
              overlay: false
            }
          },
          function() {
            const spy = sinon.spy(p.options, 'createSegmentMarker');

            p.segments.add({
              startTime: 0,
              endTime:   10,
              editable:  test.editable,
              id:        'segment1'
            });

            // Two markers in both zoomview and overview
            expect(spy.callCount).to.equal(4);

            let call = spy.getCall(0);

            expect(call.args).to.have.lengthOf(1);
            expect(call.args[0].segment.startTime).to.equal(0);
            expect(call.args[0].segment.endTime).to.equal(10);
            expect(call.args[0].segment.editable).to.equal(test.editable);
            expect(call.args[0].segment.id).to.equal('segment1');
            expect(call.args[0].editable).to.equal(false);
            expect(call.args[0]).to.have.property('startMarker');
            expect(call.args[0].color).to.equal('#aaaaaa');
            expect(call.args[0]).to.have.property('layer');
            expect(call.args[0].view).to.equal('overview');

            call = spy.getCall(2);

            expect(call.args).to.have.lengthOf(1);
            expect(call.args[0].segment.startTime).to.equal(0);
            expect(call.args[0].segment.endTime).to.equal(10);
            expect(call.args[0].segment.editable).to.equal(test.editable);
            expect(call.args[0].segment.id).to.equal('segment1');
            expect(call.args[0].editable).to.equal(test.editable);
            expect(call.args[0]).to.have.property('startMarker');
            expect(call.args[0].color).to.equal('#aaaaaa');
            expect(call.args[0]).to.have.property('layer');
            expect(call.args[0].view).to.equal('zoomview');
            done();
          });
        });
      });
    });

    context('with no given waveform color', function() {
      it('should use the default color', function(done) {
        createPeaksInstance({
          segmentOptions: {
            markers: true,
            overlay: false
          }
        },
        function() {
          const segment = p.segments.add({
            startTime: 0,
            endTime:   10,
            editable:  true,
            id:        'segment1'
          });

          const zoomview = p.views.getView('zoomview');

          const segmentShape = zoomview._segmentsLayer.getSegmentShape(segment);

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
          segmentOptions: {
            markers:       true,
            overlay:       false,
            waveformColor: '#f00'
          }
        },
        function() {
          const segment = p.segments.add({
            startTime: 0,
            endTime:   10,
            editable:  true,
            id:        'segment1',
            color:     '#0f0'
          });

          const zoomview = p.views.getView('zoomview');

          const segmentShape = zoomview._segmentsLayer.getSegmentShape(segment);

          expect(segmentShape).to.be.an.instanceOf(SegmentShape);
          expect(segmentShape._waveformShape).to.be.an.instanceOf(WaveformShape);
          expect(segmentShape._waveformShape._color).to.equal('#0f0');
          done();
        });
      });
    });

    it('should use view specific segment options', function(done) {
      createPeaksInstance({
        segmentOptions: {
          markers: true,
          overlay: false
        },
        zoomview: {
          segmentOptions: {
            startMarkerColor: '#0f0',
            endMarkerColor: '#080'
          }
        }
      },
      function() {
        const segment = p.segments.add({
          startTime: 0,
          endTime:   10,
          editable:  true,
          id:        'segment1'
        });

        const zoomview = p.views.getView('zoomview');

        const segmentShape = zoomview._segmentsLayer.getSegmentShape(segment);

        expect(segmentShape).to.be.an.instanceOf(SegmentShape);
        expect(segmentShape._startMarker._marker._options.color).to.equal('#0f0');
        expect(segmentShape._endMarker._marker._options.color).to.equal('#080');

        // Note: We don't test overview-specific options here, as marker style
        // segments in the overview waveform aren't editable, so don't have handles
        done();
      });
    });
  });

  context('with overlay style segments', function() {
    it('should not create marker handles', function(done) {
      createPeaksInstance({
        segmentOptions: {
          markers: false,
          overlay: true
        }
      },
      function() {
        const spy = sinon.spy(p.options, 'createSegmentMarker');

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
        segmentOptions: {
          markers: false,
          overlay: true
        }
      },
      function() {
        const segment = p.segments.add({
          startTime: 0,
          endTime:   10,
          editable:  true,
          id:        'segment1'
        });

        const zoomview = p.views.getView('zoomview');

        const segmentShape = zoomview._segmentsLayer.getSegmentShape(segment);

        expect(segmentShape).to.be.an.instanceOf(SegmentShape);
        expect(segmentShape._waveformShape).to.equal(undefined);
        done();
      });
    });

    it('should create an overlay with default attributes', function(done) {
      createPeaksInstance({
        segmentOptions: {
          markers: false,
          overlay: true
        }
      },
      function() {
        const segment = p.segments.add({
          startTime: 0,
          endTime:   10,
          editable:  true,
          id:        'segment1'
        });

        const zoomview = p.views.getView('zoomview');

        const segmentShape = zoomview._segmentsLayer.getSegmentShape(segment);

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
        segmentOptions: {
          markers: false,
          overlay: true
        }
      },
      function() {
        const segment = p.segments.add({
          startTime:   0,
          endTime:     10,
          editable:    true,
          id:          'segment1',
          color:       '#0000ff',
          borderColor: '#00ff00'
        });

        const zoomview = p.views.getView('zoomview');

        const segmentShape = zoomview._segmentsLayer.getSegmentShape(segment);

        expect(segmentShape).to.be.an.instanceOf(SegmentShape);
        expect(segmentShape._overlayRect.getStroke()).to.equal('#00ff00');
        expect(segmentShape._overlayRect.getStrokeWidth()).to.equal(2);
        expect(segmentShape._overlayRect.getFill()).to.equal('#0000ff');
        expect(segmentShape._overlayRect.getOpacity()).to.equal(0.3);
        expect(segmentShape._overlayRect.getCornerRadius()).to.equal(5);
        done();
      });
    });

    it('should use view specific segment options', function(done) {
      createPeaksInstance({
        segmentOptions: {
          markers: false,
          overlay: true
        },
        overview: {
          segmentOptions: {
            overlayOffset: 10
          }
        },
        zoomview: {
          segmentOptions: {
            overlayOffset: 20
          }
        }
      },
      function() {
        const segment = p.segments.add({
          startTime: 0,
          endTime:   10,
          editable:  true,
          id:        'segment1'
        });

        const zoomview = p.views.getView('zoomview');
        const overview = p.views.getView('overview');

        let segmentShape = zoomview._segmentsLayer.getSegmentShape(segment);

        expect(segmentShape).to.be.an.instanceOf(SegmentShape);
        expect(segmentShape._overlayOffset).to.equal(20);

        segmentShape = overview._segmentsLayer.getSegmentShape(segment);

        expect(segmentShape).to.be.an.instanceOf(SegmentShape);
        expect(segmentShape._overlayOffset).to.equal(10);
        done();
      });
    });

    it('should use global color and border color options', function(done) {
      createPeaksInstance({
        segmentOptions: {
          markers:            false,
          overlay:            true,
          overlayColor:       '#444',
          overlayBorderColor: '#222'
        },
        overview: {
          segmentOptions: {
            overlayColor:       '#888',
            overlayBorderColor: '#aaa'
          }
        },
        zoomview: {
          segmentOptions: {
            overlayColor:       '#888',
            overlayBorderColor: '#aaa'
          }
        }
      },
      function() {
        const segment = p.segments.add({
          startTime: 0,
          endTime:   10,
          editable:  true,
          id:        'segment1'
        });

        const zoomview = p.views.getView('zoomview');
        const overview = p.views.getView('overview');

        let segmentShape = zoomview._segmentsLayer.getSegmentShape(segment);

        expect(segmentShape).to.be.an.instanceOf(SegmentShape);
        expect(segmentShape._overlayRect.getStroke()).to.equal('#222');
        expect(segmentShape._overlayRect.getFill()).to.equal('#444');

        segmentShape = overview._segmentsLayer.getSegmentShape(segment);

        expect(segmentShape).to.be.an.instanceOf(SegmentShape);
        expect(segmentShape._overlayRect.getStroke()).to.equal('#222');
        expect(segmentShape._overlayRect.getFill()).to.equal('#444');
        done();
      });
    });
  });
});
