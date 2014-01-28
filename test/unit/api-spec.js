define(['main', 'jquery', 'underscore', 'Kinetic'], function(originalPeaks, $, _, Kinetic){

  describe("Peaks API interface", function () {

    var Peaks, fixtures;

    /**
     * SETUP =========================================================
     */

    beforeEach(function () {

      var ready = false, audioEl;

        fixtures = document.createElement('div');
        fixtures.id = 'karma-fixtures';
        fixtures.innerHTML = window.__html__['test/audioElement.html'];
        document.body.appendChild(fixtures);


        Peaks = $.extend({}, originalPeaks);

        Peaks.init({
                  container: document.getElementById('waveform-visualiser-container'),
                  audioElement: $('#audioElement')[0],
                  dataUri: 'base/test_data/sample.dat',
                  keyboard: true,
                  height: 240
                });

    });

    /**
     * TEARDOWN ======================================================
     */

    afterEach(function () {
      Peaks = null;
      document.body.removeChild(fixtures);
    });

    /**
     * TESTS =========================================================
     */

    it("should load the API", function () {
      expect(typeof Peaks).toEqual("object");
    });

    it("should return the correct time for time.getCurrentTime()", function () {
      Peaks.player.player.currentTime = 6;

      expect(Peaks.time.getCurrentTime()).toEqual(6);
    });

    it("should be able to set and return the zoom level", function () {

      /**
       * TODO: Image test zooming functionality
       */

      expect(Peaks.zoom.getZoom()).toEqual(0);

      var zoomed = false;

      runs(function () {
        Peaks.zoom.setZoom(3);
        setTimeout(function () {
          zoomed = true;
        }, 1000);
      });

      waitsFor(function () {
        return zoomed;
      }, "Should have time to emit async zoom event", 20000);

      runs(function () {
        expect(Peaks.zoom.getZoom()).toEqual(3);
      });

    });

    it("should be able to add and return segments", function () {

      var testSeg = {
        startTime: 10,
        endTime: 20,
        editable: false
      };

      runs(function () {
        Peaks.segments.addSegment(testSeg.startTime, testSeg.endTime, testSeg.editable);
      });

      waitsFor(function () {
        return Peaks.segments.getSegments().length > 0;
      }, "wait for segments to be returned", 3000);

      runs(function () {
        var segments = Peaks.segments.getSegments();
        expect(segments.length).toEqual(1);
        expect(segments[0].startTime).toEqual(testSeg.startTime);
        expect(segments[0].endTime).toEqual(testSeg.endTime);
      });

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
