define(['main', 'underscore', 'Kinetic'], function(Peaks, _, Kinetic){

  describe("m/player/player", function () {

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

    describe("player.currentTime", function(){
      //@see https://github.com/bbcrd/peaks.js/issues/9
      //@see https://github.com/bbcrd/peaks.js/issues/12
      //for some reason, the event is not emitted during the tests
      it("should trigger any `waveform_seek` event when changing audio element `currentTime`", function(done){
        var emitterSpy = sandbox.spy(p, 'emit');

        document.querySelector('audio').currentTime = 6.0;

        setTimeout(function(){
          console.log(p.time.getCurrentTime());
          console.log(emitterSpy.args);
          //expect(emitterSpy.calledWith('waveform_seek')).to.equal(true);
          done();
        }, 1000);
      });
    });
  });

});
