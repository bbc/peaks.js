define(['main', 'EventEmitter', 'Kinetic'], function(Peaks, EventEmitter, Kinetic){
  describe("Peaks API interface", function () {

    var p;

    /**
     * SETUP =========================================================
     */

    beforeEach(function (done) {
      loadAllFixtures();

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
      removeAllFixtures();
      setTimeout(done, 200);
    });

    /**
     * TESTS =========================================================
     */

    it("should be a prototyped object inheriting from EventEmitter", function () {
      expect(Peaks).to.be.a("function");
      expect(p).to.be.an.instanceOf(Peaks);
      expect(p).to.be.an.instanceOf(EventEmitter);
    });

    it("should be able to add and return segments", function (done) {

      var testSeg = {
        startTime: 10,
        endTime: 20,
        editable: false
      };

      p.segments.addSegment([testSeg]);

      setTimeout(function(){
        var segments = p.segments.getSegments();

        expect(segments).to.have.length.of(1);
        expect(segments[0].startTime).to.equal(testSeg.startTime);
        expect(segments[0].endTime).to.equal(testSeg.endTime);

        done();
      }, 300);
    });

  });

});
