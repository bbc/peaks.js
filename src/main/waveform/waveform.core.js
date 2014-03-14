/**
 * WAVEFORM.CORE.JS
 *
 * This module bootstraps all our waveform components and manages
 * initialisation as well as some component-wide events such as
 * viewport resizing.
 */
define([
  "waveform-data",
  "peaks/waveform/waveform.overview",
  "peaks/waveform/waveform.zoomview",
  "peaks/waveform/waveform.segments"
  ], function (WaveformData, WaveformOverview, WaveformZoomView, WaveformSegments) {
  'use strict';

  return function (peaks) {
    return {
      init: function (ui) {
        var options = peaks.options;
        this.ui = ui; // See buildUi in main.js

        var that = this;
        var xhr = new XMLHttpRequest();
        var isXhr2 = ('withCredentials' in xhr);

        if (!isXhr2) {
          if (console && console.info) console.info("Changing request type to .json as browser does not support ArrayBuffer");
          options.dataUri = options.dataUri.replace(/\.dat$/i, ".json");
        }

        // open an XHR request to the data soure file
        xhr.open('GET', options.dataUri, true);

        if (options.dataUri.match(/\.json$/i)) {
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

          var overviewWaveformData = that.origWaveformData.resample(that.ui.player.clientWidth);

          that.waveformOverview = new WaveformOverview(overviewWaveformData, that.ui.overview, peaks);

          peaks.emit("waveformOverviewReady");
          that.bindResize();
        };
      },

      openZoomView: function () {
        var that = this;

        that.waveformZoomView = new WaveformZoomView(that.origWaveformData, that.ui.zoom, peaks);

        peaks.emit("waveform_zoom_start");

        that.segments = new WaveformSegments(peaks);
        that.segments.init();
      },

      /**
       * Deal with window resize event over both waveform views.
       */
      bindResize: function () {
        var that = this;

        window.addEventListener("resize", function () {
          that.ui.overview.hidden = true;
          that.ui.zoom.hidden = true;

          if (that.resizeTimeoutId) clearTimeout(that.resizeTimeoutId);
          that.resizeTimeoutId = setTimeout(function(){
            var w = that.ui.player.clientWidth;
            var overviewWaveformData = that.origWaveformData.resample(w);
            peaks.emit("resizeEndOverview", w, overviewWaveformData);
            peaks.emit("window_resized", w, that.origWaveformData);
            peaks.emit("player_time_update", peaks.player.getTime());
          }, 500);
        });

        peaks.on("overview_resized", function () {
          that.ui.overview.removeAttribute('hidden');
        });

        peaks.on("zoomview_resized", function () {
          that.ui.zoom.removeAttribute('hidden');
        });
      }
    };
  };
});
