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
  "peaks/waveform/waveform.segments",
  "peaks/waveform/waveform.points"
  ], function (WaveformData, WaveformOverview, WaveformZoomView, WaveformSegments, WaveformPoints) {

  'use strict';

  var isXhr2 = ('withCredentials' in new XMLHttpRequest());

  return function (peaks) {
    return {
      init: function (ui) {
        this.ui = ui; // See buildUi in main.js
        var that = this;

        /**
         * Handle data provided by our waveform data module after parsing the XHR request
         * @param  {Object} origWaveformData Parsed ArrayBuffer or JSON response
         */
        that.getRemoteData(peaks.options);
      },

      getRemoteData: function(options){
        var that = this;
        var xhr = new XMLHttpRequest();
        var uri = null;
        var requestType = null;
        var builder = null;

        // Backward compatibility
        if (options.dataUri) {
          if (typeof options.dataUri === 'string') {
            var dataUri = {};

            dataUri[options.dataUriDefaultFormat || 'json'] = options.dataUri;
            options.dataUri = dataUri;
          }

          if(typeof options.dataUri === 'object'){
            ['ArrayBuffer', 'JSON'].some(function(connector){
              if (window[connector]){
                requestType = connector.toLowerCase();
                uri = options.dataUri[requestType];

                return Boolean(uri);
              }
            });
          }
        }

        // WebAudio Builder
        if (!options.dataUri && WaveformData.builders.webaudio.getAudioContext()) {
          requestType = 'arraybuffer';
          uri = options.mediaElement.currentSrc || options.mediaElement.src;
          builder = 'webaudio';
        }

        if(!uri && !requestType) {
          throw new Error("Unable to determine a compatible dataUri format for this browser.");
        }

        // open an XHR request to the data source file
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
          if (this.readyState === 4 && this.status === 200) {
            if (builder){
              WaveformData.builders[builder](response.target.response, that.handleRemoteData.bind(that));
            }
            else {
              that.handleRemoteData(response.target, xhr);
            }
          }
        };

        xhr.send();
      },

      /**
       *
       * @param remoteData {WaveformData|ProgressEvent}
       * @param xhr {XMLHttpRequest}
       */
      handleRemoteData: function (remoteData, xhr) {
        this.origWaveformData = remoteData instanceof WaveformData ? remoteData : WaveformData.create(remoteData);
        var overviewWaveformData = this.origWaveformData.resample(this.ui.player.clientWidth);

        this.waveformOverview = new WaveformOverview(overviewWaveformData, this.ui.overview, peaks);

        peaks.emit("waveformOverviewReady");
        this.bindResize();
      },

      openZoomView: function () {
        var that = this;

        that.waveformZoomView = new WaveformZoomView(that.origWaveformData, that.ui.zoom, peaks);

        peaks.emit("waveform_zoom_start");

        that.segments = new WaveformSegments(peaks);
        that.segments.init();

        that.points = new WaveformPoints(peaks);
        that.points.init();
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
