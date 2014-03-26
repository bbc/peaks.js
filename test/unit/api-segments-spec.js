define(['peaks', 'Kinetic'], function(Peaks, Kinetic){
  describe("Peaks.segments", function () {

    var p, sandbox;

    /**
     * SETUP =========================================================
     */

    beforeEach(function beforeEach(done) {
      loadAllFixtures();
      sandbox = sinon.sandbox.create();

      p = Peaks.init({
        container: document.getElementById('waveform-visualiser-container'),
        mediaElement: document.querySelector('audio'),
        dataUri: 'base/test_data/sample.json',
        keyboard: true,
        height: 240
      });

      p.on('segments.ready', done);
    });

    /**
     * TEARDOWN ======================================================
     */

    afterEach(function (done) {
      sandbox.restore();
      removeAllFixtures();
      setTimeout(done, 200);
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

    describe("getNextSegment", function(){
      beforeEach(function(){
        p.segments.addSegment([
          { startTime: 10, endTime: 15, id: "first" },
          { startTime: 20, endTime: 25, id: "sparse" },
          { startTime: 12, endTime: 14, id: "contained" },
          { startTime: 30, endTime: 35, id: "sparse_last" },
          { startTime: 12, endTime: 18, id: "overlapping" }
        ]);
      });

      it('should return the first segment if the reference time is 0', function(){
        expect(p.segments.getNextSegment(0)).to.have.property('id', 'first');
      });

      it('should return the overlapping segment if the reference time is 15', function(){
        expect(p.segments.getNextSegment(15)).to.have.property('id', 'overlapping');
      });

      it('should return the sparse segment if the reference time is 18', function(){
        expect(p.segments.getNextSegment(18)).to.have.property('id', 'sparse');
      });

      it('should return the sparse_last segment if the reference time is 28', function(){
        expect(p.segments.getNextSegment(28)).to.have.property('id', 'sparse_last');
      });

      it('should return no segment if the reference time is 35', function(){
        expect(p.segments.getNextSegment(35)).to.equal(null);
      });
    });

    describe("removeSegment", function(){

    });

    xdescribe("removeAllSegments", function(){

    });

  });

});
