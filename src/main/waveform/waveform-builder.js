/**
 * @file
 *
 * Defines the {@link WaveformBuilder} class.
 *
 * @module peaks/waveform/waveform-builder
 */

 define([
  'waveform-data',
  'waveform-data/webaudio',
  'peaks/waveform/waveform.utils'
  ], function(
    WaveformData,
    webaudioBuilder,
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
   * Options for the Web Audio waveform builder.
   *
   * @typedef {Object} WaveformBuilderOptions
   * @global
   * @property {Number=} scale
   * @property {Number=} amplitudeScale
   */

  /**
   * Options for [WaveformBuilder.init]{@link WaveformBuilder#init}.
   *
   * @typedef {Object} WaveformBuilderInitOptions
   * @global
   * @property {RemoteWaveformDataOptions=} dataUri
   * @property {AudioContext=} audioContext
   * @property {WaveformBuilderOptions=} waveformBuilderOptions
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
    if (options.dataUri && options.audioContext) {
      // eslint-disable-next-line max-len
      throw new Error('Peaks.init(): You must pass an audioContext or dataUri to render waveform data, not both');
    }
    if (options.dataUri) {
      return this._getRemoteWaveformData(options, callback);
    }
    else if (options.audioContext) {
      return this._buildWaveformDataUsingWebAudio(options, callback);
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

    var xhr = self._createXHR(url, requestType, options.withCredentials, function(response) {
      if (this.readyState !== 4) {
        return;
      }

      if (this.status !== 200) {
        callback(
          new Error('Unable to fetch remote data. HTTP status ' + this.status)
        );

        return;
      }

      callback(null, WaveformData.create(response.target));
    },
    function(error) {
      callback(new Error('XHR Failed'));
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
   * @param {WaveformBuilderInitCallback} callback
   */

  WaveformBuilder.prototype._buildWaveformDataUsingWebAudio = function(options, callback) {
    var self = this;

    var audioContext = window.AudioContext || window.webkitAudioContext;

    if (!(options.audioContext instanceof audioContext)) {
      // eslint-disable-next-line max-len
      throw new TypeError('Peaks.init(): The audioContext option must be a valid AudioContext');
    }

    var waveformBuilderOptions;

    if (options.waveformBuilderOptions) {
      waveformBuilderOptions = options.waveformBuilderOptions;
    }
    else {
      waveformBuilderOptions = {
        scale: options.zoomLevels[0]
      };
    }

    if (waveformBuilderOptions.scale !== options.zoomLevels[0]) {
      waveformBuilderOptions.scale = options.zoomLevels[0];
    }

    // If the media element has already selected which source to play, its
    // currentSrc attribute will contain the source media URL. Otherwise,
    // we wait for a canplay event to tell us when the media is ready.

    var mediaSourceUrl = self._peaks.player.getCurrentSource();

    if (mediaSourceUrl) {
      self._requestAudioAndBuildWaveformData(
        mediaSourceUrl,
        options.audioContext,
        waveformBuilderOptions,
        options.withCredentials,
        callback
      );
    }
    else {
      self._peaks.once('player_canplay', function(player) {
        self._requestAudioAndBuildWaveformData(
          player.getCurrentSource(),
          options.audioContext,
          waveformBuilderOptions,
          options.withCredentials,
          callback
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
   * @param {Boolean} withCredentials
   * @param {WaveformBuilderInitCallback} callback
   */

  WaveformBuilder.prototype._requestAudioAndBuildWaveformData = function(url,
    audioContext, waveformBuilderOptions, withCredentials, callback) {
    var self = this;

    if (!url) {
      self._peaks.logger('Peaks.init(): The mediaElement src is invalid');
      return;
    }

    var xhr = self._createXHR(url, 'arraybuffer', withCredentials, function(response) {
      if (this.readyState !== 4) {
        return;
      }

      if (this.status !== 200) {
        callback(
          new Error('Unable to fetch remote data. HTTP status ' + this.status)
        );

        return;
      }

      webaudioBuilder(
        audioContext,
        response.target.response,
        waveformBuilderOptions,
        callback
      );
    },
    function(error) {
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

  WaveformBuilder.prototype._createXHR = function(url, requestType, withCredentials, onLoad, onError) {
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
