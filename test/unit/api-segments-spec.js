define(['main', 'EventEmitter', 'underscore', 'Kinetic'], function(Peaks, EventEmitter, _, Kinetic){
  describe("Peaks.segments", function () {

    var p, sandbox;

    /**
     * SETUP =========================================================
     */

    beforeEach(function (done) {
      loadAllFixtures();
      sandbox = sinon.sandbox.create();

      p = Peaks.init({
        container: document.getElementById('waveform-visualiser-container'),
        audioElement: document.querySelector('audio'),
        dataUri: 'base/test_data/sample.dat',
        keyboard: true,
        height: 240
      });

      setTimeout(done, 500);
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

    describe("removeSegment", function(){

    });

    xdescribe("removeAllSegments", function(){

    });

  });

});
