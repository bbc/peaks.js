define(['peaks'], function(Peaks){
  describe("Peaks.segments", function () {

    var p;

    /**
     * SETUP =========================================================
     */

    beforeEach(function before(done) {
      p = Peaks.init({
        container: document.getElementById('waveform-visualiser-container'),
        mediaElement: document.querySelector('audio'),
        dataUri: {
          json: 'base/test_data/sample.json'
        },
        keyboard: true,
        height: 240
      });

      p.on('segments.ready', done);
    });

    /**
     * TESTS =========================================================
     */

    describe("getSegments", function(){
      it("should return an empty array by default", function(){
        expect(p.segments.getSegments()).to.be.an('array').and.have.length.of(0);
      });

      it("should return any added segment", function(){
        p.segments.addSegment(0, 10);
        p.segments.addSegment(2, 12);

        expect(p.segments.getSegments()).to.have.length.of(2);
      });
    });

    describe("addSegment", function(){
      it("should create a segment with the mandatory values as arguments", function(){
        p.segments.addSegment(0, 10);
        var segment = p.segments.getSegments()[0];

        expect(segment.startTime).to.equal(0);
        expect(segment.endTime).to.equal(10);
        expect(segment.id).to.equal('segment0');
        expect(segment.labelText).to.equal('');
      });

      it("should throw an exception if the endTime argument is missing is missing", function(){
        expect(function(){
          p.segments.addSegment(0);
        }).to.throw(TypeError);

        expect(function(){
          p.segments.addSegment([{startTime: 0 }]);
        }).to.throw(TypeError);
      });

      it("should accept an array of segments objects", function(){
        var segments = [{ startTime: 0, endTime: 10}, { startTime: 5, endTime: 10 }];

        p.segments.addSegment(segments);

        expect(p.segments.getSegments()).to.have.length.of(2);
        expect(p.segments.getSegments()[1]).to.include.keys('startTime', 'endTime');
      });

      it("should throw an exception if arguments are not matching any previous accepted signature form", function(){
        expect(function(){ p.segments.addSegment({startTime: 0, endTime: 10}); }).to.throw(TypeError);
        expect(function(){ p.segments.addSegment(); }).to.throw(TypeError);
        expect(function(){ p.segments.addSegment(undefined); }).to.throw(TypeError);
        expect(function(){ p.segments.addSegment(null); }).to.throw(TypeError);
        expect(function(){ p.segments.addSegment(NaN, NaN); }).to.throw(TypeError);
      });
    });

    describe("remove", function(){
      beforeEach(function(){
        p.segments.add(10, 12);
      });

      it("should throw an exception if you remove a segment which does not exist", function(){
        expect(function(){ p.segments.remove({}) }).to.throw();
      });

      it("should return the deleted segment object if properly deleted", function(){
        var segment = p.segments.getSegments()[0];

        expect(p.segments.remove(segment)).to.equal(segment);
      });

      it("should remove the segment from the segments array", function(){
        var segment = p.segments.getSegments()[0];

        p.segments.remove(segment);

        expect(p.segments.getSegments()).to.not.include(segment);
      });

      it("should remove the segment from both view layers", function(){
        var segment = p.segments.getSegments()[0];

        p.segments.remove(segment);

        expect(p.waveform.waveformOverview.segmentLayer.children).to.not.include(segment.overview);
        expect(p.waveform.waveformZoomView.segmentLayer.children).to.not.include(segment.zoom);
      });
    });

    describe("removeByTime", function(){
      beforeEach(function(){
        p.segments.addSegment(10, 12);
        p.segments.addSegment(5, 12);

        p.segments.addSegment(3, 6);
        p.segments.addSegment(3, 10);
      });

      it("should not remove any segment if the startTime does not match with any segment", function(){
        p.segments.removeByTime(6);

        expect(p.segments.getSegments()).to.have.a.lengthOf(4);
      });

      it("should not remove any segment if the endTime does match the end of a segment", function(){
        p.segments.removeByTime(6, 12);

        expect(p.segments.getSegments()).to.have.a.lengthOf(4);
      });

      it("should remove the only segment matching the startTime", function(){
        p.segments.removeByTime(5);

        expect(p.segments.getSegments()).to.have.a.lengthOf(3);
      });

      it("should return the number of deleted segments", function(){
        expect(p.segments.removeByTime(3)).to.equal(2);
      });

      it("should remove the two segments matching the startTime", function(){
        p.segments.removeByTime(3);

        expect(p.segments.getSegments()).to.have.a.lengthOf(2);
      });

      it("should remove only the segment matching both starTime and endTime", function(){
        p.segments.removeByTime(3, 6);

        expect(p.segments.getSegments()).to.have.a.lengthOf(3);
      });
    });

    describe("removeAll", function(){
      beforeEach(function(){
        p.segments.addSegment(10, 12);
        p.segments.addSegment(5, 12);
      });

      it("should clear all segments objects", function(){
        p.segments.removeAll();

        expect(p.segments.getSegments()).to.be.empty;
      });

      it("should clear views groups as well", function(){
        p.segments.removeAll();

        expect(p.waveform.waveformOverview.segmentLayer.children).to.have.a.property('length', 0);
        expect(p.waveform.waveformZoomView.segmentLayer.children).to.have.a.property('length', 0);
      });
    });

  });

});
