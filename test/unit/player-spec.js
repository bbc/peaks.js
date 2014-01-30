define(['m/bootstrap', 'main', 'jquery', 'underscore', 'Kinetic'], function(bootstrap, originalPeaks, $, _, Kinetic){

  describe("m/player/player", function () {

    var Peaks, sandbox, fixtures;

    beforeEach(function (done) {
      fixtures = loadFixtures('waveformContainer');
      Peaks = $.extend({}, originalPeaks);
      sandbox = sinon.sandbox.create();

      Peaks.init({
        container: document.getElementById('waveform-visualiser-container'),
        audioElement: document.querySelector('audio'),
        dataUri: 'base/test_data/sample.dat',
        keyboard: true,
        height: 240
      });

      setTimeout(done, 500);
    });

    afterEach(function () {
      Peaks = null;

      document.body.removeChild(fixtures);
      sandbox.restore();
    });

    describe("player.currentTime", function(){
      //@see https://github.com/bbcrd/peaks.js/issues/9
      //@see https://github.com/bbcrd/peaks.js/issues/12
      //for some reason, the event is not emitted during the tests
      it("should trigger any `waveform_seek` event when changing audio element `currentTime`", function(done){
        var emitterSpy = sandbox.spy(bootstrap.pubsub, 'emit');

        Peaks.player.player.currentTime = 6;

        setTimeout(function(){
          expect(emitterSpy.calledWith('waveform_seek')).to.equal(true);
          done();
        }, 50);
      });
    });
  });

});
