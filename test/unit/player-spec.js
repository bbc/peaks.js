define(['main', 'Kinetic'], function(Peaks, Kinetic){

  describe("m/player/player", function () {

    var sandbox, fixtures, p;

    beforeEach(function (done) {
      fixtures = loadFixtures('waveformContainer');
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
      document.body.removeChild(fixtures);
      sandbox.restore();
    });

    describe("player.currentTime", function(){
      //@see https://github.com/bbcrd/peaks.js/issues/9
      //@see https://github.com/bbcrd/peaks.js/issues/12
      //for some reason, the event is not emitted during the tests
      xit("should trigger any `waveform_seek` event when changing audio element `currentTime`", function(done){
        var emitterSpy = sandbox.spy(p, 'emit');
        var syncPlayheadSpy = sandbox.spy(p.waveform.waveformZoomView, 'syncPlayhead');

        p.player.player.currentTime = 6;

        setTimeout(function(){
          expect(emitterSpy.calledWith('waveform_seek')).to.equal(true);
          done();
        }, 50);
      });
    });
  });

});
