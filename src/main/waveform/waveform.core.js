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

        var uri = null,
            requestType = null;

        // try to use arraybuffer first, then fallback to json
        if(options.dataUri.arraybuffer) {
          uri =  options.dataUri.arraybuffer;
          requestType =  "arraybuffer";
        } else if(options.dataUri.json) {
          uri =  options.dataUri.json;
          requestType = "json";
        }

        if(!uri && !requestType) {
          if(console && console.error) {
            console.error("Please provide json or arraybuffer uri to dataUri");
          }          
          return;
        }

        // If we have arraybuffer and this is not xhr2 fallback to json
        var isXhr2 = ('withCredentials' in xhr);
        if (!isXhr2 && requestType == "arraybuffer") {
          if (console && console.info && !isXhr2) {
            console.info("Changing request type to .json as browser does not support ArrayBuffer");
          }

          uri = options.dataUri.json;
          requestType = 'json';
        }

        // open an XHR request to the data soure file
        xhr.open('GET', uri, true);

        if(isXhr2) {
          try {
            xhr.responseType = requestType;
          }
          // some browsers like Safari 6 do handle XHR2 but not the json response type
          // doing only a try/catch fails in IE9
          catch (e){}          
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
