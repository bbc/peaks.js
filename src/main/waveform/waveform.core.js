/**
 * WAVEFORM.CORE.JS
 *
 * This module bootstraps all our waveform components and manages
 * initialisation as well as some component-wide events such as
 * viewport resizing.
 */
define([
  'waveform-data',
  'peaks/views/waveform.overview',
  'peaks/views/waveform.zoomview',
  'peaks/markers/waveform.segments',
  'peaks/markers/waveform.points'
  ], function(
    WaveformData,
    WaveformOverview,
    WaveformZoomView,
    WaveformSegments,
    WaveformPoints) {
  'use strict';

  var isXhr2 = ('withCredentials' in new XMLHttpRequest());

  /**
   * @param {Peaks} peaks
   */
  function Waveform(peaks) {
    this.peaks = peaks;
  }

  /**
   * @param {Object} ui
   */
  Waveform.prototype.init = function(ui) {
    this.ui = ui; // See getUiElements in main.js
    this.onResize = this.onResize.bind(this);

    /**
     * Handle data provided by our waveform data module after parsing the XHR request
     * @param  {Object} origWaveformData Parsed ArrayBuffer or JSON response
     */
    this.getRemoteData(this.peaks.options);
  };

  Waveform.prototype.getRemoteData = function(options) {
    var self = this;
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

      if (typeof options.dataUri === 'object') {
        ['ArrayBuffer', 'JSON'].some(function(connector) {
          if (window[connector]) {
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

    if (!uri) {
      throw new Error('Unable to determine a compatible dataUri format for this browser.');
    }

    // open an XHR request to the data source file
    xhr.open('GET', uri, true);

    if (isXhr2) {
      try {
        xhr.responseType = requestType;
      }
      catch (e) {
        // some browsers like Safari 6 do handle XHR2 but not the json
        // response type, doing only a try/catch fails in IE9
      }
    }

    xhr.onload = function(response) {
      if (this.readyState === 4) {
        if (this.status === 200) {
          if (builder) {
            WaveformData.builders[builder](
              response.target.response,
              options.waveformBuilderOptions,
              self.handleRemoteData.bind(self, null)
            );
          }
          else {
            self.handleRemoteData(null, response.target, xhr);
          }
        }
        else {
          self.handleRemoteData(
            new Error('Unable to fetch remote data. HTTP Status ' + this.status)
          );
        }
      }
    };

    xhr.onerror = function(err) {
      // Allow the application to call instance.on('error') before
      // emitting the event.
      setTimeout(function() {
        self.peaks.emit('error', new Error('XHR Failed'));
      }, 0);
    };

    xhr.send();
  };

  /**
   *
   * @param err {Error}
   * @param remoteData {WaveformData|ProgressEvent}
   * @param xhr {XMLHttpRequest}
   */
  Waveform.prototype.handleRemoteData = function(err, remoteData, xhr) {
    if (err) {
      return this.peaks.emit('error', err);
    }

    this.origWaveformData = null;

    try {
      this.origWaveformData = remoteData instanceof WaveformData ?
                              remoteData :
                              WaveformData.create(remoteData);

      var overviewWaveformData = this.origWaveformData.resample(
        this.ui.player.clientWidth
      );

      this.waveformOverview = new WaveformOverview(
        overviewWaveformData,
        this.ui.overview,
        this.peaks
      );
    }
    catch (e) {
      return this.peaks.emit('error', e);
    }

    this.peaks.emit('waveformOverviewReady', this.waveformOverview);
    this.bindResize();
  };

  Waveform.prototype.openZoomView = function() {
    this.waveformZoomView = new WaveformZoomView(
      this.origWaveformData,
      this.ui.zoom,
      this.peaks
    );

    this.segments = new WaveformSegments(this.peaks);
    this.segments.init();

    this.points = new WaveformPoints(this.peaks);
    this.points.init();

    this.peaks.emit('waveformZoomReady', this.waveformZoomView);
  };

  /**
   * Deal with window resize event over both waveform views.
   */
  Waveform.prototype.bindResize = function() {
    var self = this;

    window.addEventListener('resize', this.onResize);

    self.peaks.on('overview_resized', function() {
      self.ui.overview.removeAttribute('hidden');
    });

    self.peaks.on('zoomview_resized', function() {
      self.ui.zoom.removeAttribute('hidden');
    });

    self.peaks.on('user_seek.*', function(time) {
      self.peaks.player.seekBySeconds(time);
    });

    self.peaks.on('user_scrub.*', function(time) {
      self.peaks.player.seekBySeconds(time);
    });
  };

  Waveform.prototype.destroy = function() {
    if (this.waveformOverview) {
      this.waveformOverview.destroy();
    }

    if (this.waveformZoomView) {
      this.waveformZoomView.destroy();
    }

    window.removeEventListener('resize', this.onResize);

    if (this.resizeTimeoutId) {
      clearTimeout(this.resizeTimeoutId);
      this.resizeTimeoutId = null;
    }
  };

  Waveform.prototype.onResize = function() {
    var self = this;

    self.ui.overview.hidden = true;
    self.ui.zoom.hidden = true;

    if (self.resizeTimeoutId) {
      clearTimeout(self.resizeTimeoutId);
    }

    self.resizeTimeoutId = setTimeout(function() {
      var width = self.ui.player.clientWidth;
      var overviewWaveformData = self.origWaveformData.resample(width);

      self.peaks.emit('resizeEndOverview', width, overviewWaveformData);
      self.peaks.emit('window_resized', width, self.origWaveformData);
    }, 500);
  };

  return Waveform;
});
