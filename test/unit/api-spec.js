define(['main', 'EventEmitter', 'underscore', 'Kinetic'], function(Peaks, EventEmitter, _, Kinetic){
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

    //@see https://github.com/bbcrd/peaks.js/issues/9
    xit("should return the correct time for time.getCurrentTime()", function (done) {
      //Peaks.player.player.currentTime = 6;
      document.querySelector('audio').currentTime = 6;

      setTimeout(function(){
        expect(p.time.getCurrentTime()).to.equal(6);
        done();
      }, 500);
    });

    it("should be able to set and return the zoom level", function () {
      expect(p.zoom.getZoom()).to.equal(0);

      p.zoom.setZoom(1);

      expect(p.zoom.getZoom()).to.equal(1);
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

    xit("should display the correct waveform for the test data", function () {

      var zoomCanvas, sourceImageData, testImgOne, testImgTwo;

      /**
       * We've copied this from imagediff.js in
       * https://github.com/HumbleSoftware/js-imagediff and modified
       * it to return a percentage that can then be used to test
       * against. This is due to the fact that there seem to be
       * rounding errors between the results of .toDataURL and
       * .toImageData() for HTML5 canvas element, this prevented us
       * from using the standard imagediff framework.
       */
      var imageDataEqual = function (a, b, tolerance) {
        var helpers = {
          equalWidth: function (a, b) {
            return a.width === b.width;
          },
          equalHeight: function (a, b) {
            return a.height === b.height;
          },
          equalDimensions: function (a, b) {
            return helpers.equalHeight(a, b) && helpers.equalWidth(a, b);
          }
        };
        var aData     = a.data,
            bData     = b.data,
            length    = aData.length,
            different = 0,
            i;
        tolerance = tolerance || 0;
        if (!helpers.equalDimensions(a, b)) return false;
        for (i = length; i--;) {
          if (aData[i] !== bData[i]) {
            different++;
          }
        }
        if (different > 0 && (different/length) > tolerance) return false;
        return true;
      };

      var getImageDataFromCanvas = function (canvas) {
        return canvas.getContext("2d").getImageData(0,0,canvas.width,canvas.height);
      };

      var getExpectedImageData = function (image) {
        var expectedCanvas = document.createElement("canvas");
        expectedCanvas.width = zoomCanvas.width;
        expectedCanvas.height = zoomCanvas.height;
        expectedCanvas.getContext("2d").drawImage(image, 0, 0);
        return getImageDataFromCanvas(expectedCanvas);
      };

      var getSourceImageData = function () {
        return getImageDataFromCanvas(zoomCanvas);
      };

      // Load up images and source data
      runs(function () {
        zoomCanvas = $("#zoom-container canvas").first()[0];

        window.peaks.waveform.waveformZoomView.updateZoomWaveform(0); // Ensure waveform offset is set to 0
        sourceImageData = getSourceImageData();

        testImgZeroOffset = new Image();
        testImgZeroOffset.src = "base/test/test_img/zoom_0_offset.png";
        testImgTenThouOffset = new Image();
        testImgTenThouOffset.src = "base/test/test_img/zoom_10000_offset.png";
      });

      // Wait for images to load
      waitsFor(function () {
        return testImgZeroOffset.complete && testImgTenThouOffset.complete;
      }, "Image(s) not loaded", 2000);

      // Compare expected images against generated waveform
      runs(function () {
        // Test waveform at 0 offset
        expect(
          imageDataEqual(getExpectedImageData(testImgZeroOffset), sourceImageData, 0.01)
        ).toBe(true);

        // Set to 10000 offset
        window.peaks.waveform.waveformZoomView.updateZoomWaveform(10000);
        sourceImageData = getSourceImageData(); // Reload imageData at new offset

        // Test waveform at 10000 offset
        expect(
          imageDataEqual(getExpectedImageData(testImgTenThouOffset), sourceImageData, 0.01)
        ).toBe(true);
      });

    });

  });

});
