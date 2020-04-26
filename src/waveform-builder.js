/**
 * @file
 *
 * Defines the {@link WaveformBuilder} class.
 *
 * @module waveform-builder
 */

define([
  'waveform-data',
  './utils'
], function(
    WaveformData,
    Utils) {
  'use strict';

  var isXhr2 = ('withCredentials' in new XMLHttpRequest());

  /**
   * Creates and returns a WaveformData object, either by requesting the
   * waveform data from the server, or by creating the waveform data using the
   * Web Audio API.
   *
   * @class
   * @alias WaveformBuilder
   *
   * @param {Peaks} peaks
   */

  function WaveformBuilder(peaks) {
    this._peaks = peaks;
  }

  /**
   * Options for requesting remote waveform data.
   *
   * @typedef {Object} RemoteWaveformDataOptions
   * @global
   * @property {String=} arraybuffer
   * @property {String=} json
   */

  /**
   * Options for supplying local waveform data.
   *
   * @typedef {Object} LocalWaveformDataOptions
   * @global
   * @property {ArrayBuffer=} arraybuffer
   * @property {Object=} json
   */

  /**
   * Options for the Web Audio waveform builder.
   *
   * @typedef {Object} WaveformBuilderWebAudioOptions
   * @global
   * @property {AudioContext} audioContext
   * @property {AudioBuffer=} audioBuffer
   * @property {Number=} scale
   * @property {Boolean=} multiChannel
   */

  /**
   * Options for [WaveformBuilder.init]{@link WaveformBuilder#init}.
   *
   * @typedef {Object} WaveformBuilderInitOptions
   * @global
   * @property {RemoteWaveformDataOptions=} dataUri
   * @property {LocalWaveformDataOptions=} waveformData
   * @property {WaveformBuilderWebAudioOptions=} webAudio
   * @property {Boolean=} withCredentials
   * @property {Array<Number>=} zoomLevels
   */

  /**
   * Callback for receiving the waveform data.
   *
   * @callback WaveformBuilderInitCallback
   * @global
   * @param {Error} error
   * @param {WaveformData} waveformData
   */

  /**
   * Loads or creates the waveform data.
   *
   * @private
   * @param {WaveformBuilderInitOptions} options
   * @param {WaveformBuilderInitCallback} callback
   */

  WaveformBuilder.prototype.init = function(options, callback) {
    if ((options.dataUri && (options.webAudio || options.audioContext)) ||
        (options.waveformData && (options.webAudio || options.audioContext)) ||
        (options.dataUri && options.waveformData)) {
      // eslint-disable-next-line max-len
      callback(new TypeError('Peaks.init(): You may only pass one source (webAudio, dataUri, or waveformData) to render waveform data.'));
      return;
    }

    if (options.audioContext) {
      // eslint-disable-next-line max-len
      this._peaks.options.deprecationLogger('Peaks.init(): The audioContext option is deprecated, please pass a webAudio object instead');

      options.webAudio = {
        audioContext: options.audioContext
      };
    }

    if (options.dataUri) {
      return this._getRemoteWaveformData(options, callback);
    }
    else if (options.waveformData) {
      return this._buildWaveformFromLocalData(options, callback);
    }
    else if (options.webAudio) {
      if (options.webAudio.audioBuffer) {
        return this._buildWaveformDataFromAudioBuffer(options, callback);
      }
      else {
        return this._buildWaveformDataUsingWebAudio(options, callback);
      }
    }
    else {
      // eslint-disable-next-line max-len
      callback(new Error('Peaks.init(): You must pass an audioContext, or dataUri, or waveformData to render waveform data'));
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
   * @param {WaveformBuilderInitCallback} callback
   *
   * @see Refer to the <a href="https://github.com/bbc/audiowaveform/blob/master/doc/DataFormat.md">data format documentation</a>
   *   for details of the binary and JSON waveform data formats.
   */

  /* eslint-enable max-len */

  WaveformBuilder.prototype._getRemoteWaveformData = function(options, callback) {
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
      callback(new TypeError('Peaks.init(): The dataUri option must be an object'));
      return;
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
      callback(new Error('Peaks.init(): Unable to determine a compatible dataUri format for this browser'));
      return;
    }

    var xhr = self._createXHR(url, requestType, options.withCredentials, function(event) {
      if (this.readyState !== 4) {
        return;
      }

      if (this.status !== 200) {
        callback(
          new Error('Unable to fetch remote data. HTTP status ' + this.status)
        );

        return;
      }

      var waveformData = WaveformData.create(event.target.response);

      if (waveformData.channels !== 1 && waveformData.channels !== 2) {
        callback(new Error('Peaks.init(): Only mono or stereo waveforms are currently supported'));
        return;
      }

      callback(null, waveformData);
    },
    function() {
      callback(new Error('XHR Failed'));
    });

    xhr.send();
  };

  /* eslint-disable max-len */

  /**
   * Creates a waveform from given data, based on the given options.
   *
   * @private
   * @param {Object} options
   * @param {Object} options.waveformData
   * @param {ArrayBuffer} options.waveformData.arraybuffer Waveform data (binary format)
   * @param {Object} options.waveformData.json Waveform data (JSON format)
   * @param {WaveformBuilderInitCallback} callback
   *
   * @see Refer to the <a href="https://github.com/bbc/audiowaveform/blob/master/doc/DataFormat.md">data format documentation</a>
   *   for details of the binary and JSON waveform data formats.
   */

  /* eslint-enable max-len */

  WaveformBuilder.prototype._buildWaveformFromLocalData = function(options, callback) {
    var waveformData = null;
    var data = null;

    if (Utils.isObject(options.waveformData)) {
      waveformData = options.waveformData;
    }
    else {
      callback(new Error('Peaks.init(): The waveformData option must be an object'));
      return;
    }

    if (Utils.isObject(waveformData.json)) {
      data = waveformData.json;
    }
    else if (Utils.isArrayBuffer(waveformData.arraybuffer)) {
      data = waveformData.arraybuffer;
    }

    if (!data) {
      // eslint-disable-next-line max-len
      callback(new Error('Peaks.init(): Unable to determine a compatible waveformData format'));
      return;
    }

    try {
      var createdWaveformData = WaveformData.create(data);

      if (createdWaveformData.channels !== 1 && createdWaveformData.channels !== 2) {
        callback(new Error('Peaks.init(): Only mono or stereo waveforms are currently supported'));
        return;
      }

      callback(null, createdWaveformData);
    }
    catch (err) {
      callback(err);
    }
  };

  /**
   * Creates waveform data using the Web Audio API.
   *
   * @private
   * @param {Object} options
   * @param {AudioContext} options.audioContext
   * @param {HTMLMediaElement} options.mediaElement
   * @param {WaveformBuilderInitCallback} callback
   */

  WaveformBuilder.prototype._buildWaveformDataUsingWebAudio = function(options, callback) {
    var self = this;

    var audioContext = window.AudioContext || window.webkitAudioContext;

    if (!(options.webAudio.audioContext instanceof audioContext)) {
      // eslint-disable-next-line max-len
      callback(new TypeError('Peaks.init(): The webAudio.audioContext option must be a valid AudioContext'));
      return;
    }

    var webAudioOptions = options.webAudio;

    if (webAudioOptions.scale !== options.zoomLevels[0]) {
      webAudioOptions.scale = options.zoomLevels[0];
    }

    // If the media element has already selected which source to play, its
    // currentSrc attribute will contain the source media URL. Otherwise,
    // we wait for a canplay event to tell us when the media is ready.

    var mediaSourceUrl = self._peaks.options.mediaElement.currentSrc;

    if (mediaSourceUrl) {
      self._requestAudioAndBuildWaveformData(
        mediaSourceUrl,
        webAudioOptions,
        options.withCredentials,
        callback
      );
    }
    else {
      self._peaks.once('player.canplay', function() {
        self._requestAudioAndBuildWaveformData(
          self._peaks.options.mediaElement.currentSrc,
          webAudioOptions,
          options.withCredentials,
          callback
        );
      });
    }
  };

  WaveformBuilder.prototype._buildWaveformDataFromAudioBuffer = function(options, callback) {
    var webAudioOptions = options.webAudio;

    if (webAudioOptions.scale !== options.zoomLevels[0]) {
      webAudioOptions.scale = options.zoomLevels[0];
    }

    var webAudioBuilderOptions = {
      audio_buffer: webAudioOptions.audioBuffer,
      split_channels: webAudioOptions.multiChannel,
      scale: webAudioOptions.scale
    };

    WaveformData.createFromAudio(webAudioBuilderOptions, callback);
  };

  /**
   * Fetches the audio content, based on the given options, and creates waveform
   * data using the Web Audio API.
   *
   * @private
   * @param {url} The media source URL
   * @param {WaveformBuilderWebAudioOptions} webAudio
   * @param {Boolean} withCredentials
   * @param {WaveformBuilderInitCallback} callback
   */

  WaveformBuilder.prototype._requestAudioAndBuildWaveformData = function(url,
      webAudio, withCredentials, callback) {
    var self = this;

    if (!url) {
      self._peaks.logger('Peaks.init(): The mediaElement src is invalid');
      return;
    }

    var xhr = self._createXHR(url, 'arraybuffer', withCredentials, function(event) {
      if (this.readyState !== 4) {
        return;
      }

      if (this.status !== 200) {
        callback(
          new Error('Unable to fetch remote data. HTTP status ' + this.status)
        );

        return;
      }

      var webAudioBuilderOptions = {
        audio_context: webAudio.audioContext,
        array_buffer: event.target.response,
        split_channels: webAudio.multiChannel,
        scale: webAudio.scale
      };

      WaveformData.createFromAudio(webAudioBuilderOptions, callback);
    },
    function() {
      callback(new Error('XHR Failed'));
    });

    xhr.send();
  };

  /**
   * @private
   * @param {String} url
   * @param {String} requestType
   * @param {Boolean} withCredentials
   * @param {Function} onLoad
   * @param {Function} onError
   *
   * @returns {XMLHttpRequest}
   */

  WaveformBuilder.prototype._createXHR = function(url, requestType,
      withCredentials, onLoad, onError) {
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
    xhr.onerror = onError;

    if (isXhr2 && withCredentials) {
      xhr.withCredentials = true;
    }

    return xhr;
  };

  return WaveformBuilder;
});
