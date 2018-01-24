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
  'peaks/markers/waveform.points',
  'peaks/waveform/waveform.utils'
  ], function(
    WaveformData,
    webaudioBuilder,
    WaveformOverview,
    WaveformZoomView,
    WaveformSegments,
    WaveformPoints,
    Utils) {
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
   * @private
   * @param {Object} ui Container elements for the UI components. See the
   *   <code>template</code> option.
   * @param {HTMLElement} ui.player Overall container HTML element.
   * @param {HTMLElement} ui.zoom HTML element container for the zoomable
   *   waveform view.
   * @param {HTMLElement} ui.overview HTML element container for the overview
   *   waveform.
   */

  Waveform.prototype.init = function(ui) {
    this.ui = ui; // See getUiElements in main.js
    this.onResize = this.onResize.bind(this);

    this._getRemoteData(this.peaks.options);
  };

  Waveform.prototype._getRemoteData = function(options) {
    if (options.dataUri && options.audioContext) {
      // eslint-disable-next-line max-len
      throw new Error('Peaks.init(): You must pass an audioContext or dataUri to render waveform data, not both');
    }
    else if (options.dataUri) {
      return this._getRemoteWaveformData(options);
    }
    else if (options.audioContext) {
      return this._buildWaveformDataUsingWebAudio(options);
    }
    else {
      // eslint-disable-next-line max-len
      throw new Error('Peaks.init(): You must pass an audioContext or dataUri to render waveform data');
    }
  };

  /* eslint-disable max-len */

  /**
   * Fetches waveform data, based on the given options.
   *
   * @private
   * @param {Object} options
   * @param {String|Object} options.dataUri
   * @param {String} options.dataUri.arraybuffer Waveform data URL
   *   (binary format)
   * @param {String} options.dataUri.json Waveform data URL (JSON format)
   * @param {String} options.defaultUriFormat Either 'arraybuffer' (for binary
   *   data) or 'json'
   *
   * @see Refer to the <a href="https://github.com/bbc/audiowaveform/blob/master/doc/DataFormat.md">data format documentation</a>
   *   for details of the binary and JSON waveform data formats.
   */

  /* eslint-enable max-len */

  Waveform.prototype._getRemoteWaveformData = function(options) {
    var self = this;
    var dataUri = null;
    var requestType = null;
    var url;

    if (Utils.isObject(options.dataUri)) {
      dataUri = options.dataUri;
    }
    else if (Utils.isString(options.dataUri)) {
      // Backward compatibility
      dataUri = {};
      dataUri[options.dataUriDefaultFormat || 'json'] = options.dataUri;
    }
    else {
      throw new Error('Peaks.init(): The dataUri option must be an object');
    }

    ['ArrayBuffer', 'JSON'].some(function(connector) {
      if (window[connector]) {
        requestType = connector.toLowerCase();
        url = dataUri[requestType];

        return Boolean(url);
      }
    });

    if (!url) {
      // eslint-disable-next-line max-len
      throw new Error('Peaks.init(): Unable to determine a compatible dataUri format for this browser');
    }

    var xhr = self._createXHR(url, requestType, function(response) {
      if (this.readyState !== 4) {
        return;
      }

      if (this.status !== 200) {
        self._handleRemoteData(
          new Error('Unable to fetch remote data. HTTP status ' + this.status)
        );

        return;
      }

      self._handleRemoteData(null, response.target, xhr);
    });

    xhr.send();
  };

  /**
   * Creates waveform data using the Web Audio API.
   *
   * @private
   * @param {Object} options
   * @param {AudioContext} options.audioContext
   * @param {HTMLMediaElement} options.mediaElement
   */

  Waveform.prototype._buildWaveformDataUsingWebAudio = function(options) {
    var self = this;

    if (!(options.audioContext instanceof AudioContext)) {
      // eslint-disable-next-line max-len
      throw new TypeError('Peaks.init(): The audioContext option must be a valid AudioContext');
    }

    if (options.waveformBuilderOptions.scale !== options.zoomLevels[0]) {
      options.waveformBuilderOptions.scale = options.zoomLevels[0];
    }

    // If the media element has already selected which source to play, its
    // currentSrc attribute will contain the source media URL. Otherwise,
    // we wait for a canplay event to tell us when the media is ready.

    var mediaSourceUrl = self.peaks.player.getCurrentSource();

    if (mediaSourceUrl) {
      self._requestAudioAndBuildWaveformData(
        mediaSourceUrl,
        options.audioContext,
        options.waveformBuilderOptions
      );
    }
    else {
      self.peaks.on('player_canplay', function(player) {
        self._requestAudioAndBuildWaveformData(
          player.getCurrentSource(),
          options.audioContext,
          options.waveformBuilderOptions
        );
      });
    }
  };

  /**
   * Fetches the audio content, based on the given options, and creates waveform
   * data using the Web Audio API.
   *
   * @private
   * @param {url} The media source URL
   * @param {AudioContext} audioContext
   * @param {Object} waveformBuilderOptions
   */

  Waveform.prototype._requestAudioAndBuildWaveformData = function(url,
    audioContext, waveformBuilderOptions) {
    var self = this;

    if (!url) {
      self.peaks.logger('Peaks.init(): The mediaElement src is invalid');
      return;
    }

    var xhr = self._createXHR(url, 'arraybuffer', function(response) {
      if (this.readyState !== 4) {
        return;
      }

      if (this.status !== 200) {
        self._handleRemoteData(
          new Error('Unable to fetch remote data. HTTP status ' + this.status)
        );

        return;
      }

      webaudioBuilder(
        audioContext,
        response.target.response,
        waveformBuilderOptions,
        self._handleRemoteData.bind(self)
      );
    });

    xhr.send();
  };

  /**
   * @private
   * @param {String} url
   * @param {String} requestType
   * @param {Function} onLoad
   *
   * @returns {XMLHttpRequest}
   */

  Waveform.prototype._createXHR = function(url, requestType, onLoad) {
    var self = this;
    var xhr = new XMLHttpRequest();

    // open an XHR request to the data source file
    xhr.open('GET', url, true);

    if (isXhr2) {
      try {
        xhr.responseType = requestType;
      }
      catch (e) {
        // Some browsers like Safari 6 do handle XHR2 but not the json
        // response type, doing only a try/catch fails in IE9
      }
    }

    xhr.onload = onLoad;

    xhr.onerror = function(err) {
      // Allow the application to call instance.on('error') before
      // emitting the event.
      setTimeout(function() {
        self.peaks.emit('error', new Error('XHR Failed'));
      }, 0);
    };

    if (isXhr2 && this.peaks.options.withCredentials) {
      xhr.withCredentials = true;
    }

    return xhr;
  };

  /**
   *
   * @private
   * @param err {Error}
   * @param remoteData {WaveformData|ProgressEvent}
   * @param xhr {XMLHttpRequest}
   */

  Waveform.prototype._handleRemoteData = function(err, remoteData, xhr) {
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

      this.waveformZoomView = new WaveformZoomView(
        this.originalWaveformData,
        this.ui.zoom,
        this.peaks
      );

      // TODO: Deprecated, use peaks.ready instead.
      this.peaks.emit('segments.ready');

      this.peaks.emit('peaks.ready');
    }
    catch (e) {
      this.peaks.emit('error', e);
      return;
    }

    this._bindEvents();
  };

  Waveform.prototype._bindEvents = function() {
    var self = this;

    self.peaks.on('user_seek', function(time) {
      self.peaks.player.seek(time);
    });

    window.addEventListener('resize', self.onResize);
  };

  Waveform.prototype.destroy = function() {
    if (this.waveformOverview) {
      this.waveformOverview.destroy();
      this.waveformOverview = null;
    }

    if (this.waveformZoomView) {
      this.waveformZoomView.destroy();
      this.waveformZoomView = null;
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
