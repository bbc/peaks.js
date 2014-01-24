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
        var xhr, that = this;

        // Detect if we can support standard XHR of fall back to IE XDR
        if ('withCredentials' in new XMLHttpRequest()) {
          /* supports cross-domain requests */
          xhr = new XMLHttpRequest();
        } else if(typeof XDomainRequest !== "undefined"){
          // Use IE-specific "CORS" code with XDR
          xhr = new XDomainRequest();
        }

        var fileEx = new RegExp(/\.[^.]*$/);
        var extension = that.options.dataUri.match(fileEx);

        // open an XHR request to the data soure file
        xhr.open('GET', that.options.dataUri, true);

        if (extension && (extension[0] === ".dat" || extension[0] === ".DAT" ) ) {
          // Detect if we can support ArrayBuffer for byte data or fall back to JSON
          if (typeof Uint8Array !== "undefined") {
            xhr.responseType = 'arraybuffer';
          } else {
            that.options.dataUri.replace(fileEx, ".json");
            if (console && console.info) console.info("Changing request type to .json as browser does not support ArrayBuffer");
          }
        }

        xhr.onload = function(response) {
          //xhr object, supposedly ArrayBuffer
          //XDomainRequest object (always in JSON)
          if ('XDomainRequest' in window || ('readyState' in this && (this.readyState === 4 && this.status === 200))){
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
