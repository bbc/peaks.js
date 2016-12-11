/**
 * @file
 *
 * Defines the {@link Waveform} class.
 *
 * @module peaks/waveform/waveform.core
 */
 define([
  'waveform-data',
  'waveform-data/webaudio',
  'peaks/views/waveform.overview',
  'peaks/views/waveform.zoomview',
  'peaks/markers/waveform.segments',
  'peaks/markers/waveform.points'
  ], function(
    WaveformData,
    webaudioBuilder,
    WaveformOverview,
    WaveformZoomView,
    WaveformSegments,
    WaveformPoints) {
  'use strict';

  var isXhr2 = ('withCredentials' in new XMLHttpRequest());

  /**
   * Bootstraps all our waveform components and manages initialisation as well
   * as some component-wide events such as viewport resizing.
   *
   * @class
   * @alias Waveform
   *
   * @param {Peaks} peaks
   */
  function Waveform(peaks) {
    this.peaks = peaks;
  }

  /**
   * Loads the waveform data and creates the overview and zoom view waveform UI
   * components.
   *
   * @param {Object} ui Container elements for the UI components. See the
   * <code>template</code> option.
   * @param {HTMLElement} ui.player Overall container HTML element.
   * @param {HTMLElement} ui.zoom HTML element container for the zoomable
   * waveform view.
   * @param {HTMLElement} ui.overview HTML element container for the overview
   * waveform.
   */

  Waveform.prototype.init = function(ui) {
    this.ui = ui; // See getUiElements in main.js
    this.onResize = this.onResize.bind(this);

    this.getRemoteData(this.peaks.options);
  };

  /* eslint-disable max-len */
  /**
   * Fetches waveform data, based on the given options.
   *
   * @param {Object} options
   * @param {String|Object} options.dataUri
   * @param {String} options.dataUri.arraybuffer Waveform data URL
   * (binary format)
   * @param {String} options.dataUri.json Waveform data URL (JSON format)
   * @param {String} options.defaultUriFormat Either 'arraybuffer' (for binary
   * data) or 'json'
   * @param {HTMLMediaElement} options.mediaElement
   *
   * @see Refer to the <a href="https://github.com/bbc/audiowaveform/blob/master/doc/DataFormat.md">data format documentation</a>
   * for details of the binary and JSON waveform data formats.
   */
   /* eslint-enable max-len */
  Waveform.prototype.getRemoteData = function(options) {
    var self = this;
    var xhr = new XMLHttpRequest();
    var uri = null;
    var requestType = null;
    var builder = null;

    if (options.dataUri) {
      // Backward compatibility
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
    if (!options.dataUri && options.audioContext) {
      requestType = 'arraybuffer';
      uri = options.mediaElement.currentSrc || options.mediaElement.src;
      builder = webaudioBuilder;
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
        // Some browsers like Safari 6 do handle XHR2 but not the json
        // response type, doing only a try/catch fails in IE9
      }
    }

    xhr.onload = function(response) {
      if (this.readyState !== 4) {
        return;
      }

      if (this.status !== 200) {
        self.handleRemoteData(
          new Error('Unable to fetch remote data. HTTP Status ' + this.status)
        );

        return;
      }

      if (builder) {
        webaudioBuilder(
          options.audioContext,
          response.target.response,
          options.waveformBuilderOptions,
          self.handleRemoteData.bind(self)
        );
      }
      else {
        self.handleRemoteData(null, response.target, xhr);
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
   * @private
   */
  Waveform.prototype.handleRemoteData = function(err, remoteData, xhr) {
    if (err) {
      this.peaks.emit('error', err);
      return;
    }

    this.originalWaveformData = null;

    try {
      this.originalWaveformData = remoteData instanceof WaveformData ?
                                  remoteData :
                                  WaveformData.create(remoteData);

      this.waveformOverview = new WaveformOverview(
        this.originalWaveformData,
        this.ui.overview,
        this.peaks
      );

      this.peaks.emit('waveform_ready.overview', this.waveformOverview);
    }
    catch (e) {
      this.peaks.emit('error', e);
      return;
    }

    this._bindEvents();
  };

  Waveform.prototype._bindEvents = function() {
    var self = this;

    self.peaks.on('user_seek.*', function(time) {
      self.peaks.player.seekBySeconds(time);
    });

    window.addEventListener('resize', self.onResize);
  };

  Waveform.prototype.openZoomView = function() {
    this.waveformZoomView = new WaveformZoomView(
      this.originalWaveformData,
      this.ui.zoom,
      this.peaks
    );

    this.segments = new WaveformSegments(this.peaks);
    this.segments.init();

    this.points = new WaveformPoints(this.peaks);
    this.points.init();

    this.peaks.emit('waveform_ready.zoomview', this.waveformZoomView);
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

    self.peaks.emit('window_resize');

    if (self.resizeTimeoutId) {
      clearTimeout(self.resizeTimeoutId);
    }

    self.resizeTimeoutId = setTimeout(function() {
      var width = self.ui.player.clientWidth;

      self.peaks.emit('window_resize_complete', width);
    }, 500);
  };

  return Waveform;
});
