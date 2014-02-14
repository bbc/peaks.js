define(['main', 'Kinetic'], function(Peaks, Kinetic){
  describe("Peaks.zoom", function () {

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

    describe("getZoom", function(){
      it("should be able to get the initial zoom level value, which is 0", function(){
        expect(p.zoom.getZoom()).to.equal(0);
      });
    });

    describe("setZoom", function(){
      it("should update the zoom level value", function (){
        p.zoom.setZoom(1);

        expect(p.zoom.getZoom()).to.equal(1);
      });

      it("should dispatch waveform_zoom_level_changed with the value associated to the zoom level", function (){
        var spy = sandbox.spy();

        p.on("waveform_zoom_level_changed", spy);
        p.zoom.setZoom(1);

        expect(spy.calledWith(1024)).to.equal(true);
      });

      it("should be inefficient if the zoom level index is a negative value", function (){
        p.zoom.setZoom(-1);

        expect(p.zoom.getZoom()).to.equal(0);
      });

      it("should be inefficient if the zoom level index is an inexisting index", function (){
        p.options.zoomLevels = [512, 1024];

        p.zoom.setZoom(2);

        expect(p.zoom.getZoom()).to.equal(1);
      });

      it("should throw a RangeError if an existing zoom level does not have sufficient data", function (){
        expect(function(){
          p.zoom.setZoom(2);
        }).to.throw(RangeError);
      });
    });

    describe("zoomOut", function(){
      it("should call setZoom with a bigger zoom level", function(){
        var spy = sandbox.spy();
        var zoomLevel = p.currentZoomLevel;

        p.on("waveform_zoom_level_changed", spy);
        p.zoom.zoomOut();

        expect(spy.getCall(0).args).to.deep.equal([ p.options.zoomLevels[zoomLevel + 1] ]);
      });
    });

    describe("zoomIn", function(){
      it("should call setZoom with a smaller zoom level", function(){
        p.zoom.setZoom(1);

        var spy = sandbox.spy();
        var zoomLevel = p.currentZoomLevel;

        p.on("waveform_zoom_level_changed", spy);
        p.zoom.zoomIn();

        expect(spy.getCall(0).args).to.deep.equal([ p.options.zoomLevels[zoomLevel - 1] ]);
      });
    });

  });

});
