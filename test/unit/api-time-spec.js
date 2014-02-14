define(['main', 'Kinetic'], function(Peaks, Kinetic){

  describe("Peaks.time", function () {

    var sandbox, p;

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

    afterEach(function () {
      removeAllFixtures();
      sandbox.restore();
    });

    describe("getCurrentTime", function(){
      it("should return the actual value of the audio element", function(){
        expect(p.time.getCurrentTime()).to.equal(document.querySelector('audio').currentTime);
      });

      //@see https://github.com/bbcrd/peaks.js/issues/9
      //@see https://github.com/bbcrd/peaks.js/issues/12
      //for some reason, the event is not emitted during the tests
      it("should return an updated time if it has been modified through the audio element", function(done){
        var newTime = 6.0;

        p.on('waveform_seek', function(currentTime){
          expect(p.time.getCurrentTime()).to.equal(newTime);
          expect(currentTime).to.equal(newTime);
          done();
        });

        document.querySelector('audio').currentTime = newTime;
      });
    });

    describe("setCurrentTime", function(){
      it("should alter the currentTime value of the audio element", function(){
        var newTime = 6.0;
        this.timeout(3000);

        p.time.setCurrentTime(newTime);

        expect(p.time.getCurrentTime()).to.equal(newTime);
      });
    });
  });

});
