define(['m/bootstrap', 'main', 'jquery', 'underscore', 'Kinetic'], function(bootstrap, originalPeaks, $, _, Kinetic){

  describe("m/player/player", function () {

    var Peaks, sandbox;

    var fixtures = jasmine.getFixtures();
    fixtures.fixturesPath = 'base/test/';
    fixtures.preload('audioElement.html.js');

    /**
     * SETUP =========================================================
     */

    beforeEach(function(){
      sandbox = sinon.sandbox.create();
      var ready = false;

      runs(function () {
        fixtures.load('audioElement.html.js');
        $("#audioElement")[0].src = 'base/test_data/sample.wav';
      });

      waitsFor(function () {
        return $("#audioElement")[0].readyState == 4;
      }, "Audio Element should have loaded", 60000);

      runs(function () {

        Peaks = $.extend({}, originalPeaks);

        Peaks.init({
          container: document.getElementById('waveform-visualiser-container'),
          audioElement: $('#audioElement')[0],
          dataUri: 'base/test_data/sample.dat',
          keyboard: true,
          height: 240
        });

        setTimeout(function () { // Should be reworked so that Peaks emits a ready event
          ready = true;
        }, 2000);
      });

      waitsFor(function () {
        return ready;
      }, "Peaks should initialise", 4000);

    });

    /**
     * TEARDOWN ======================================================
     */

    afterEach(function () {
      Peaks = null;
      $("#audioElement")[0].src = '';

      sandbox.restore();
    });

    /**
     * TESTS =========================================================
     */

    describe("player.currentTime", function(){
      //@see https://github.com/bbcrd/peaks.js/issues/12
      //for some reason, the event is not emitted during the tests
      xit("should trigger any `waveform_seek` event when changing audio element `currentTime`", function(){
        var emitterSpy = sandbox.spy(bootstrap.pubsub, 'emit');
        var syncPlayheadSpy = sandbox.spy(peaks.waveform.waveformZoomView, 'syncPlayhead');

        runs(function(){
          peaks.player.player.currentTime = 6;
        });

        waitsFor(function(){
          return syncPlayheadSpy.called;
        }, 1000);

        runs(function(){
          expect(emitterSpy.calledWith('waveform_seek')).toBe(true);
        });
      });
    });
  });

});
