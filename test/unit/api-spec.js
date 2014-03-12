define(['peaks', 'EventEmitter', 'Kinetic'], function(Peaks, EventEmitter, Kinetic){
  describe("Peaks API interface", function () {

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

    describe("create", function(){
      it("should throw an exception if no mediaElement is provided", function(){
        expect(function(){
          Peaks.init({
            container: document.getElementById('waveform-visualiser-container'),
            dataUri: 'base/test_data/sample.dat'
          });
        }).to.throw(/provide an audio element/);
      });

      it("should throw an exception if mediaElement is not an HTMLMediaElement", function(){
        expect(function(){
          Peaks.init({
            container: document.getElementById('waveform-visualiser-container'),
            mediaElement: document.createElement('div'),
            dataUri: 'base/test_data/sample.dat'
          });
        }).to.throw(/HTMLMediaElement/);
      });

      it("should throw an exception if no dataUri is provided", function(){
        expect(function(){
          Peaks.init({
            container: document.getElementById('waveform-visualiser-container'),
            mediaElement: document.querySelector('audio')
          });
        }).to.throw(/dataUri/);
      });

      it("should thrown an exception if no container is provided", function(){
        expect(function(){
          Peaks.init({
            mediaElement: document.querySelector('audio'),
            dataUri: 'base/test_data/sample.dat'
          });
        }).to.throw(/provide a container/);
      });

      it("should thrown an exception if the container has no layout", function(){
        expect(function(){
          Peaks.init({
            mediaElement: document.querySelector('audio'),
            container: document.createElement('div'),
            dataUri: 'base/test_data/sample.dat'
          });
        }).to.throw(/width/);
      });
    });

  });

});
