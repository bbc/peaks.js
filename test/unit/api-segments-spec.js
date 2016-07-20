(function(Peaks) {
  describe('Peaks.segments', function() {
    var p, deprecationLogger;

    /**
     * SETUP =========================================================
     */

    beforeEach(function before(done) {
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

      p.on('segments.ready', done);
    });
    afterEach(function () {
      p.destroy();
    })

    /**
     * TESTS =========================================================
     */

    describe('getSegments', function() {
      it('should return an empty array by default', function() {
        expect(p.segments.getSegments()).to.be.an('array').and.have.length.of(0);
      });

      it('should return any added segment', function() {
        p.segments.add({ startTime: 0, endTime: 10 });
        p.segments.add({ startTime: 2, endTime: 12 });

        expect(p.segments.getSegments()).to.have.length.of(2);
      });
    });

    describe('add', function() {
      it('should accept a single segment object', function() {
        p.segments.add({ startTime: 0, endTime: 10 });

        expect(p.segments.getSegments()).to.have.length.of(1);
        expect(p.segments.getSegments()[0]).to.include.keys('startTime', 'endTime');
        expect(p.segments.getSegments()[0].startTime).to.equal(0);
        expect(p.segments.getSegments()[0].endTime).to.equal(10);

        expect(deprecationLogger).to.not.have.been.called;
      });

      it('should accept a list of properties for a single segment (deprecated)', function() {
        p.segments.add(0, 10);

        expect(p.segments.getSegments()).to.have.length.of(1);
        expect(p.segments.getSegments()[0]).to.include.keys('startTime', 'endTime');
        expect(p.segments.getSegments()[0].startTime).to.equal(0);
        expect(p.segments.getSegments()[0].endTime).to.equal(10);

        expect(deprecationLogger).to.have.been.calledOnce;
      });

      it('should throw an exception if the startTime argument is missing', function() {
        expect(function() {
          p.segments.add({ endTime: 10 });
        }).to.throw(TypeError);
      });

      it('should throw an exception if the endTime argument is missing', function() {
        expect(function() {
          p.segments.add({ startTime: 0 });
        }).to.throw(TypeError);
      });

      it('should accept an optional id for each segment', function() {
        p.segments.add({ startTime: 0, endTime: 10, id: 123 });

        expect(p.segments.getSegments()[0].id).to.equal(123);
      });

      it('should allow 0 for a segment id', function() {
        p.segments.add({ startTime: 0, endTime: 10, id: 0 });

        expect(p.segments.getSegments()[0].id).to.equal(0);
      });

      it('should assign a default id if not specified', function() {
        p.segments.add({ startTime: 0, endTime: 10 });

        expect(p.segments.getSegments()[0].id).to.equal('peaks.segment.0');
      });

      it('should accept an optional segment color', function() {
        p.segments.add({ startTime: 0, endTime: 10, color: '#888' });

        expect(p.segments.getSegments()[0].color).to.equal('#888');
      });

      it('should assign a default (random) color if not specified', function() {
        p.segments.add({ startTime: 0, endTime: 10 });

        expect(p.segments.getSegments()[0].color).to.match(/rgba\(\d+, \d+, \d+, 1\)/);
      });

      it('should accept an optional label text', function() {
        p.segments.add({ startTime: 0, endTime: 10, labelText: 'test' });

        expect(p.segments.getSegments()[0].labelText).to.equal('test');
      });

      it('should assign a default label text if not specified', function() {
        p.segments.add({ startTime: 0, endTime: 10 });

        expect(p.segments.getSegments()[0].labelText).to.equal('');
      });

      it('should accept an array of segment objects', function() {
        var segments = [{ startTime: 0, endTime: 10 }, { startTime: 5, endTime: 10 }];

        p.segments.add(segments);

        expect(p.segments.getSegments()).to.have.length.of(2);
        expect(p.segments.getSegments()[0]).to.include.keys('startTime', 'endTime');
        expect(p.segments.getSegments()[1]).to.include.keys('startTime', 'endTime');
      });

      it('should throw an exception if arguments are not matching any previous accepted signature form', function() {
        expect(function() { p.segments.add({}); }).to.throw(TypeError);
        expect(function() { p.segments.add(undefined); }).to.throw(TypeError);
        expect(function() { p.segments.add(null); }).to.throw(TypeError);
        expect(function() { p.segments.add(NaN, NaN); }).to.throw(TypeError);
      });

      it('should throw an exception if the startTime is NaN', function() {
        expect(function() {
          p.points.add({ startTime: NaN, endTime: 1.0 });
        }).to.throw(TypeError);
      });

      it('should throw an exception if the endTime is NaN', function() {
        expect(function() {
          p.segments.add({ startTime: 1.0, endTime: NaN });
        }).to.throw(TypeError);
      });
    });

    describe('remove', function() {
      beforeEach(function() {
        p.segments.add({ startTime: 10, endTime: 12 });
      });

      it('should throw an exception if you remove a segment which does not exist', function() {
        expect(function() { p.segments.remove({}); }).to.throw();
      });

      it('should return the deleted segment object if properly deleted', function() {
        var segment = p.segments.getSegments()[0];

        expect(p.segments.remove(segment)).to.equal(segment);
      });

      it('should remove the segment from the segments array', function() {
        var segment = p.segments.getSegments()[0];

        p.segments.remove(segment);

        expect(p.segments.getSegments()).to.not.include(segment);
      });

      it('should remove the segment from both view layers', function() {
        var segment = p.segments.getSegments()[0];

        p.segments.remove(segment);

        expect(p.waveform.waveformOverview.segmentLayer.children).to.not.include(segment.overview);
        expect(p.waveform.waveformZoomView.segmentLayer.children).to.not.include(segment.zoom);
      });
    });

    describe('removeByTime', function() {
      beforeEach(function() {
        p.segments.add({ startTime: 10, endTime: 12 });
        p.segments.add({ startTime: 5,  endTime: 12 });

        p.segments.add({ startTime: 3,  endTime: 6  });
        p.segments.add({ startTime: 3,  endTime: 10 });
      });

      it('should not remove any segment if the startTime does not match with any segment', function() {
        p.segments.removeByTime(6);

        expect(p.segments.getSegments()).to.have.a.lengthOf(4);
      });

      it('should not remove any segment if only the endTime matches the end of a segment', function() {
        p.segments.removeByTime(6, 12);

        expect(p.segments.getSegments()).to.have.a.lengthOf(4);
      });

      it('should remove the only segment matching the startTime', function() {
        p.segments.removeByTime(5);

        expect(p.segments.getSegments()).to.have.a.lengthOf(3);
        expect(p.segments.getSegments()[0].startTime).to.equal(10);
        expect(p.segments.getSegments()[1].startTime).to.equal(3);
        expect(p.segments.getSegments()[2].startTime).to.equal(3);
      });

      it('should return the number of deleted segments', function() {
        expect(p.segments.removeByTime(3)).to.equal(2);
      });

      it('should remove the two segments matching the startTime', function() {
        p.segments.removeByTime(3);

        expect(p.segments.getSegments()).to.have.a.lengthOf(2);
      });

      it('should remove only the segment matching both starTime and endTime', function() {
        p.segments.removeByTime(3, 6);

        expect(p.segments.getSegments()).to.have.a.lengthOf(3);
      });
    });

    describe('removeById', function() {
      it('should remove the segment by matching id', function() {
        p.segments.add([
          { startTime: 0,  endTime: 10, id: 123 },
          { startTime: 15, endTime: 25, id: 456 }
        ]);

        p.segments.removeById(123);
        expect(p.segments.getSegments()).to.have.a.lengthOf(1);
        expect(p.segments.getSegments()[0].id).to.eq(456);
      });

      it('should remove all segments with matching id', function() {
        p.segments.add([
          { startTime: 0,  endTime: 10, id: 123 },
          { startTime: 15, endTime: 25, id: 456 },
          { startTime: 30, endTime: 40, id: 456 }
        ]);

        p.segments.removeById(456);
        expect(p.segments.getSegments()).to.have.a.lengthOf(1);
        expect(p.segments.getSegments()[0].id).to.eq(123);
      });
    });

    describe('removeAll', function() {
      beforeEach(function() {
        p.segments.add({ startTime: 10, endTime: 12 });
        p.segments.add({ startTime: 5,  endTime: 12 });
      });

      it('should clear all segments objects', function() {
        p.segments.removeAll();

        expect(p.segments.getSegments()).to.be.empty;
      });

      it('should clear views groups as well', function() {
        p.segments.removeAll();

        expect(p.waveform.waveformOverview.segmentLayer.children).to.have.a.property('length', 0);
        expect(p.waveform.waveformZoomView.segmentLayer.children).to.have.a.property('length', 0);
      });
    });
  });
})(peaks);
