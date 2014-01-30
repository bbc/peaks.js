/**
 * WAVEFORM.CORE.JS
 *
 * This module bootstraps all our waveform components and manages
 * initialisation as well as some component-wide events such as
 * viewport resizing.
 */
define([
  "m/bootstrap",
  "waveform-data",
  "m/player/waveform/waveform.overview",
  "m/player/waveform/waveform.zoomview",
  "m/player/waveform/waveform.segments"
  ], function (bootstrap, WaveformData, WaveformOverview, WaveformZoomView, WaveformSegments) {

  return function () {
    return {
      init: function (options, ui) {
        this.ui = ui; // See buildUi in main.js
        this.options = options;

        var that = this;
        var xhr = new XMLHttpRequest();
        var isXhr2 = ('withCredentials' in xhr);

        if (!isXhr2) {
          if (console && console.info) console.info("Changing request type to .json as browser does not support ArrayBuffer");
          that.options.dataUri = that.options.dataUri.replace(/\.dat$/i, ".json");
        }

        // open an XHR request to the data soure file
        xhr.open('GET', that.options.dataUri, true);

        if (that.options.dataUri.match(/\.json$/i)) {
          if (isXhr2){
            xhr.responseType = 'json';
          }
        }
        else {
          xhr.responseType = 'arraybuffer';
        }

        xhr.onload = function(response) {
          if (this.readyState === 4 && this.status === 200){
            handleData(WaveformData.create(response.target));
          }
        };
        xhr.send(); // Look at it go!

        /**
         * Handle data provided by our waveform data module after parsing the XHR request
         * @param  {Object} origWaveformData Parsed ArrayBuffer or JSON response
         */
        var handleData = function (origWaveformData) {
          that.origWaveformData = origWaveformData;

          var overviewWaveformData = that.origWaveformData.resample(that.ui.$player.width());

          that.waveformOverview = new WaveformOverview(overviewWaveformData, that.ui.$overview, that.options);

          bootstrap.pubsub.emit("waveformOverviewReady");
          that.bindResize();
        };
      },

      openZoomView: function () {
        var that = this;
        $("#waveformZoomContainer").show();

        that.waveformZoomView = new WaveformZoomView(that.origWaveformData, that.ui.$zoom, that.options);

        bootstrap.pubsub.emit("waveform_zoom_start");

        that.segments = new WaveformSegments(that, that.options);
        that.segments.init();
      },

      /**
       * Deal with window resize event over both waveform views.
       */
      bindResize: function () {
        var that = this;
        $(window).on("resize", function () {
          that.ui.$overview.hide();
          that.ui.$zoom.hide();
          if (this.resizeTimeoutId) clearTimeout(this.resizeTimeoutId);
          this.resizeTimeoutId = setTimeout(function(){
            var w = that.ui.$player.width();
            var overviewWaveformData = that.origWaveformData.resample(w);
            bootstrap.pubsub.emit("resizeEndOverview", w, overviewWaveformData);
            bootstrap.pubsub.emit("window_resized", w, that.origWaveformData);
          }, 500);
        });

        bootstrap.pubsub.on("overview_resized", function () {
          that.ui.$overview.fadeIn(200);
        });

        bootstrap.pubsub.on("zoomview_resized", function () {
          that.ui.$zoom.fadeIn(200);
        });
      }
    };
  };
});
