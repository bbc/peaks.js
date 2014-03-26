define(['peaks', 'EventEmitter', 'Kinetic'], function(Peaks, EventEmitter, Kinetic){
  describe("peaks.player interface", function () {

    var p;

    /**
     * SETUP =========================================================
     */

    beforeEach(function beforeEach(done) {
      loadAllFixtures();

      p = Peaks.init({
        container: document.getElementById('waveform-visualiser-container'),
        mediaElement: document.querySelector('audio'),
        dataUri: 'base/test_data/sample.json',
        keyboard: true,
        height: 240
      });

      p.on('segments.ready', done);
    });

    afterEach(function (done) {
      removeAllFixtures();
      setTimeout(done, 200);
    });

    /**
     * TESTS =========================================================
     */

    describe('playFrom', function(){
      it('should raise an error if the end time is further than the duration', function(){
        expect(function(){
          p.playFrom(1000, 1200);
        }).to.throw(RangeError);
      });

      it('should raise an error if the startTime is not a valid time value', function (){
        expect(function(){
          p.playFrom(NaN);
        }).to.throw(/HTMLMediaElement time value/);
      });
    });

  });

});
