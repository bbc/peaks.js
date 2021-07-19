import { EventEmitter } from 'eventemitter3';
import CueEmitter from './cue-emitter.js';
import WaveformPoints from './waveform-points.js';
import WaveformSegments from './waveform-segments.js';
import KeyboardHandler from './keyboard-handler.js';
import MediaElementPlayer from './mediaelement-player.js';
import Player from './player.js';
import { createSegmentMarker, createSegmentLabel, createPointMarker } from './marker-factories.js';
import ViewController from './view-controller.js';
import ZoomController from './zoom-controller.js';
import WaveformBuilder from './waveform-builder.js';
import {
  objectHasProperty,
  isHTMLElement,
  isObject,
  isFunction,
  isInAscendingOrder
} from './utils.js';

/**
 * @file
 *
 * Defines the {@link Peaks} class.
 *
 * @module main
 */

// Default Peaks options
const defaultOptions = {
  zoomLevels:              [512, 1024, 2048, 4096],

  mediaElement:            null,

  dataUri:                 null,
  dataUriDefaultFormat:    'json',
  withCredentials:         false,

  waveformData:            null,
  webAudio:                null,

  nudgeIncrement:          1.0,

  segmentStartMarkerColor: '#aaaaaa',
  segmentEndMarkerColor:   '#aaaaaa',
  randomizeSegmentColor:   true,
  segmentColor:            '#ff851b',
  pointMarkerColor:        '#39cccc',

  createSegmentMarker:     createSegmentMarker,
  createSegmentLabel:      createSegmentLabel,
  createPointMarker:       createPointMarker,

  // eslint-disable-next-line no-console
  logger:                  console.error.bind(console)
};

const defaultViewOptions = {
  playheadColor:       '#111111',
  playheadTextColor:   '#aaaaaa',
  axisGridlineColor:   '#cccccc',
  axisLabelColor:      '#aaaaaa',
  fontFamily:          'sans-serif',
  fontSize:            11,
  fontStyle:           'normal',
  timeLabelPrecision:  2
};

const defaultZoomviewOptions = {
  // showPlayheadTime:    true,
  waveformColor:       'rgba(0, 225, 128, 1)',
  wheelMode:           'none'
  // zoomAdapter:         'static'
};

const defaultOverviewOptions = {
  // showPlayheadTime:    false,
  waveformColor:       'rgba(0, 0, 0, 0.2)',
  highlightColor:      '#aaaaaa',
  highlightOffset:     11
};

/**
 * Initialises a new Peaks instance with default option settings.
 *
 * @class
 * @alias Peaks
 *
 * @param {Object} opts Configuration options
 */

export class Peaks extends EventEmitter {
  getOverviewOptions(opts) {
    var overviewOptions = {};

    if (opts.containers && opts.containers.overview) {
      overviewOptions.container = opts.containers.overview;
    }

    if (opts.overviewWaveformColor) {
      overviewOptions.waveformColor = opts.overviewWaveformColor;
    }

    if (opts.overviewHighlightOffset) {
      overviewOptions.highlightOffset = opts.overviewHighlightOffset;
    }

    if (opts.overviewHighlightColor) {
      overviewOptions.highlightColor = opts.overviewHighlightColor;
    }

    if (opts.overview && opts.overview.showPlayheadTime) {
      overviewOptions.showPlayheadTime = opts.overview.showPlayheadTime;
    }

    var optNames = [
      'container',
      'waveformColor',
      'playedWaveformColor',
      'playheadColor',
      'playheadTextColor',
      'timeLabelPrecision',
      'axisGridlineColor',
      'axisLabelColor',
      'fontFamily',
      'fontSize',
      'fontStyle',
      'highlightColor',
      'highlightOffset'
    ];

    optNames.forEach(function(optName) {
      if (opts.overview && objectHasProperty(opts.overview, optName)) {
        overviewOptions[optName] = opts.overview[optName];
      }
      else if (objectHasProperty(opts, optName)) {
        overviewOptions[optName] = opts[optName];
      }
      else if (objectHasProperty(defaultOverviewOptions, optName)) {
        overviewOptions[optName] = defaultOverviewOptions[optName];
      }
      else if (objectHasProperty(defaultViewOptions, optName)) {
        overviewOptions[optName] = defaultViewOptions[optName];
      }
    });

    return overviewOptions;
  }

  getZoomviewOptions(opts) {
    var zoomviewOptions = {};

    if (opts.containers && opts.containers.zoomview) {
      zoomviewOptions.container = opts.containers.zoomview;
    }

    if (opts.zoomWaveformColor) {
      zoomviewOptions.waveformColor = opts.zoomWaveformColor;
    }

    if (opts.showPlayheadTime) {
      zoomviewOptions.showPlayheadTime = opts.showPlayheadTime;
    }
    else if (opts.zoomview && opts.zoomview.showPlayheadTime) {
      zoomviewOptions.showPlayheadTime = opts.zoomview.showPlayheadTime;
    }

    var optNames = [
      'container',
      'waveformColor',
      'playedWaveformColor',
      'playheadColor',
      'playheadTextColor',
      'timeLabelPrecision',
      'axisGridlineColor',
      'axisLabelColor',
      'fontFamily',
      'fontSize',
      'fontStyle',
      'wheelMode'
    ];

    optNames.forEach(function(optName) {
      if (opts.zoomview && objectHasProperty(opts.zoomview, optName)) {
        zoomviewOptions[optName] = opts.zoomview[optName];
      }
      else if (objectHasProperty(opts, optName)) {
        zoomviewOptions[optName] = opts[optName];
      }
      else if (objectHasProperty(defaultZoomviewOptions, optName)) {
        zoomviewOptions[optName] = defaultZoomviewOptions[optName];
      }
      else if (objectHasProperty(defaultViewOptions, optName)) {
        zoomviewOptions[optName] = defaultViewOptions[optName];
      }
    });

    return zoomviewOptions;
  }

  _setOptions(opts) {
    if (!isObject(opts)) {
      return new TypeError('Peaks.init(): The options parameter should be an object');
    }

    if (!opts.player) {
      if (!opts.mediaElement) {
        return new Error('Peaks.init(): Missing mediaElement option');
      }

      if (!(opts.mediaElement instanceof HTMLMediaElement)) {
        // eslint-disable-next-line max-len
        return new TypeError('Peaks.init(): The mediaElement option should be an HTMLMediaElement');
      }
    }

    if (opts.container) {
      // eslint-disable-next-line max-len
      return new Error('Peaks.init(): The container option has been removed, please use containers instead');
    }

    if (opts.logger && !isFunction(opts.logger)) {
      // eslint-disable-next-line max-len
      return new TypeError('Peaks.init(): The logger option should be a function');
    }

    if (opts.segments && !Array.isArray(opts.segments)) {
      // eslint-disable-next-line max-len
      return new TypeError('Peaks.init(): options.segments must be an array of segment objects');
    }

    if (opts.points && !Array.isArray(opts.points)) {
      // eslint-disable-next-line max-len
      return new TypeError('Peaks.init(): options.points must be an array of point objects');
    }

    this.options = Object.assign({}, defaultOptions, opts);

    this.options.overview = this.getOverviewOptions(opts);
    this.options.zoomview = this.getZoomviewOptions(opts);

    if (!Array.isArray(this.options.zoomLevels)) {
      return new TypeError('Peaks.init(): The zoomLevels option should be an array');
    }
    else if (this.options.zoomLevels.length === 0) {
      return new Error('Peaks.init(): The zoomLevels array must not be empty');
    }
    else {
      if (!isInAscendingOrder(this.options.zoomLevels)) {
        return new Error('Peaks.init(): The zoomLevels array must be sorted in ascending order');
      }
    }

    if (opts.logger) {
      this.logger = opts.logger;
    }
  }

  /**
   * Remote waveform data options for [Peaks.setSource]{@link Peaks#setSource}.
   *
   * @typedef {Object} RemoteWaveformDataOptions
   * @global
   * @property {String=} arraybuffer
   * @property {String=} json
   */

  /**
   * Local waveform data options for [Peaks.setSource]{@link Peaks#setSource}.
   *
   * @typedef {Object} LocalWaveformDataOptions
   * @global
   * @property {ArrayBuffer=} arraybuffer
   * @property {Object=} json
   */

  /**
   * Web Audio options for [Peaks.setSource]{@link Peaks#setSource}.
   *
   * @typedef {Object} WebAudioOptions
   * @global
   * @property {AudioContext} audioContext
   * @property {AudioBuffer=} audioBuffer
   * @property {Boolean=} multiChannel
   */

  /**
   * Options for [Peaks.setSource]{@link Peaks#setSource}.
   *
   * @typedef {Object} PeaksSetSourceOptions
   * @global
   * @property {String} mediaUrl
   * @property {RemoteWaveformDataOptions=} dataUri
   * @property {LocalWaveformDataOptions=} waveformData
   * @property {WebAudioOptions=} webAudio
   * @property {Boolean=} withCredentials
   * @property {Array<Number>=} zoomLevels
   */

  /**
   * Changes the audio or video media source associated with the {@link Peaks}
   * instance.
   *
   * @param {PeaksSetSourceOptions} options
   * @param {Function} callback
   */

  setSource(options, callback) {
    var self = this;

    if (this.options.mediaElement && !options.mediaUrl) {
      // eslint-disable-next-line max-len
      callback(new Error('peaks.setSource(): options must contain a mediaUrl when using mediaElement'));
      return;
    }

    function reset() {
      self.removeAllListeners('player.canplay');
      self.removeAllListeners('player.error');
    }

    function playerErrorHandler(err) {
      reset();

      // Return the MediaError object from the media element
      callback(err);
    }

    function playerCanPlayHandler() {
      reset();

      if (!options.zoomLevels) {
        options.zoomLevels = self.options.zoomLevels;
      }

      var waveformBuilder = new WaveformBuilder(self);

      waveformBuilder.init(options, function(err, waveformData) {
        if (err) {
          callback(err);
          return;
        }

        self._waveformData = waveformData;

        ['overview', 'zoomview'].forEach(function(viewName) {
          var view = self.views.getView(viewName);

          if (view) {
            view.setWaveformData(waveformData);
          }
        });

        self.zoom.setZoomLevels(options.zoomLevels);

        callback();
      });
    }

    self.once('player.canplay', playerCanPlayHandler);
    self.once('player.error', playerErrorHandler);

    if (this.options.mediaElement) {
      self.options.mediaElement.setAttribute('src', options.mediaUrl);
    }
    else {
      playerCanPlayHandler();
    }
  }

  getWaveformData() {
    return this._waveformData;
  }

  _addWindowResizeHandler() {
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  _onResize() {
    this.emit('window_resize');
  }

  _removeWindowResizeHandler() {
    window.removeEventListener('resize', this._onResize);
  }

  /**
   * Cleans up a Peaks instance after use.
   */

  destroy() {
    this._removeWindowResizeHandler();

    if (this._keyboardHandler) {
      this._keyboardHandler.destroy();
    }

    if (this.views) {
      this.views.destroy();
    }

    if (this.player) {
      this.player.destroy();
    }

    if (this._cueEmitter) {
      this._cueEmitter.destroy();
    }
  }
}

/**
 * Creates and initialises a new Peaks instance with the given options.
 *
 * @param {Object} opts Configuration options
 *
 * @return {Peaks}
 */

export function init(opts, callback) {
  var instance = new Peaks();

  var err = instance._setOptions(opts);

  if (err) {
    callback(err);
    return;
  }

  var zoomviewContainer = instance.options.zoomview.container;
  var overviewContainer = instance.options.overview.container;

  if (!isHTMLElement(zoomviewContainer) &&
      !isHTMLElement(overviewContainer)) {
    // eslint-disable-next-line max-len
    callback(new TypeError('Peaks.init(): The zoomview and/or overview container options must be valid HTML elements'));
    return;
  }

  if (zoomviewContainer && zoomviewContainer.clientWidth <= 0) {
    // eslint-disable-next-line max-len
    callback(new TypeError('Peaks.init(): Please ensure that the zoomview container is visible and has non-zero width'));
    return;
  }

  if (overviewContainer && overviewContainer.clientWidth <= 0) {
    // eslint-disable-next-line max-len
    callback(new TypeError('Peaks.init(): Please ensure that the overview container is visible and has non-zero width'));
    return;
  }

  if (opts.keyboard) {
    instance._keyboardHandler = new KeyboardHandler(instance);
  }

  var player = opts.player ?
    opts.player :
    new MediaElementPlayer(instance, instance.options.mediaElement);

  instance.player = new Player(instance, player);
  instance.segments = new WaveformSegments(instance);
  instance.points = new WaveformPoints(instance);
  instance.zoom = new ZoomController(instance, instance.options.zoomLevels);
  instance.views = new ViewController(instance);

  // Setup the UI components
  var waveformBuilder = new WaveformBuilder(instance);

  waveformBuilder.init(instance.options, function(err, waveformData) {
    if (err) {
      if (callback) {
        callback(err);
      }

      return;
    }

    instance._waveformData = waveformData;

    if (overviewContainer) {
      instance.views.createOverview(overviewContainer);
    }

    if (zoomviewContainer) {
      instance.views.createZoomview(zoomviewContainer);
    }

    instance._addWindowResizeHandler();

    if (opts.segments) {
      instance.segments.add(opts.segments);
    }

    if (opts.points) {
      instance.points.add(opts.points);
    }

    if (opts.emitCueEvents) {
      instance._cueEmitter = new CueEmitter(instance);
    }

    // Allow applications to attach event handlers before emitting events,
    // when initialising with local waveform data.

    setTimeout(() => instance.emit('peaks.ready'), 0);

    callback(null, instance);
  });
}
