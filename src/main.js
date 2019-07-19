/**
 * @file
 *
 * Defines the {@link Peaks} class.
 *
 * @module peaks/main
 */

define('peaks', [
  'colors.css',
  'EventEmitter',
  'peaks/markers/waveform.points',
  'peaks/markers/waveform.segments',
  'peaks/player/player',
  'peaks/views/view-controller',
  'peaks/views/waveform.timecontroller',
  'peaks/views/waveform.zoomcontroller',
  'peaks/waveform/waveform-builder',
  'peaks/waveform/waveform.mixins',
  'peaks/waveform/waveform.utils',
  'peaks/player/player.keyboard',
  'peaks/cues/cue-emitter'
  ], function(
    Colors,
    EventEmitter,
    WaveformPoints,
    WaveformSegments,
    Player,
    ViewController,
    TimeController,
    ZoomController,
    WaveformBuilder,
    mixins,
    Utils,
    KeyboardHandler,
    CueEmitter) {
  'use strict';

  function buildUi(container) {
    return {
      player:   container.querySelector('.waveform'),
      zoomview: container.querySelector('.zoom-container'),
      overview: container.querySelector('.overview-container')
    };
  }

  /**
   * Initialises a new Peaks instance with default option settings.
   *
   * @class
   * @alias Peaks
   *
   * @param {Object} opts Configuration options
   */

  function Peaks() {
    EventEmitter.call(this, { wildcard: true });

    this.options = {

      /**
       * Array of scale factors (samples per pixel) for the zoom levels
       * (big >> small)
       */
      zoomLevels:            [512, 1024, 2048, 4096],

      /**
       * Data URI where to get the waveform data.
       *
       * If a string, we assume that `this.dataUriDefaultFormat` is the default
       * `xhr.responseType` value.
       *
       * @since 0.0.1
       *
       * ```js
       * dataUri: 'url/to/data.json?waveformId=1337'
       * ```
       *
       * If an object, each key is an `xhr.responseType` which will contain its
       * associated source URI.
       *
       * @since 0.3.0
       *
       * ```js
       * dataUri: {
       *   arraybuffer: 'url/to/data.dat',
       *   json: 'url/to/data.json'
       * }
       * ```
       */
      dataUri:               null,

      /**
       * Will be used as a `xhr.responseType` if `dataUri` is a string, and not
       * an object. Here for backward compatibility purpose only.
       *
       * @since 0.3.0
       */
      dataUriDefaultFormat:  'json',

      /**
       * If true, all ajax requests (e.g. to fetch waveform data) will be made
       * with credentials (i.e. browser-controlled cookies).
       *
       * @type {Boolean}
       */
      withCredentials: false,

      /**
       * Will report errors to that function
       *
       * @type {Function=}
       * @since 0.4.4
       */
      logger:                null,

      /**
       * Deprecation messages logger.
       *
       * @type {Function}
       * @since 0.4.8
       */
      // eslint-disable-next-line no-console
      deprecationLogger:     console.log.bind(console),

      /**
       * Bind keyboard controls
       */
      keyboard:              false,

      /**
       * Keyboard nudge increment in seconds (left arrow/right arrow)
       */
      nudgeIncrement: 1.0,

      /**
       * Colour for the in marker of segments
       */
      inMarkerColor:         Colors.gray,

      /**
       * Colour for the out marker of segments
       */
      outMarkerColor:        Colors.gray,

      /**
       * Colour for the zoomed in waveform
       */
      zoomWaveformColor:     'rgba(0, 225, 128, 1)',

      /**
       * Colour for the overview waveform
       */
      overviewWaveformColor: 'rgba(0,0,0,0.2)',

      /**
       * Colour for the overview waveform highlight rectangle, which shows
       * you what you see in the zoom view.
       */
      overviewHighlightRectangleColor: 'grey',

      /**
       * Random colour per segment (overrides segmentColor)
       */
      randomizeSegmentColor: true,

      /**
       * Height of the waveform canvases in pixels
       */
      height:                200,

      /**
       * Colour for segments on the waveform
       */
      segmentColor:          Colors.orange,

      /**
       * Colour of the play head
       */
      playheadColor:         Colors.black,

      /**
       * Colour of the play head text
       */
      playheadTextColor:     Colors.gray,

      /**
       * Show current time position by the play head marker
       * (zoom view only)
       */
      showPlayheadTime:      false,

      /**
       * Colour of the axis gridlines
       */
      axisGridlineColor:     '#ccc',

      /**
       * Colour of the axis labels
       */
      axisLabelColor:        Colors.gray,

      /**
       *
       */
      template:              [
                               '<div class="waveform">',
                               '<div class="zoom-container"></div>',
                               '<div class="overview-container"></div>',
                               '</div>'
                             ].join(''),

      /**
       * Color for point markers
       */
      pointMarkerColor:     Colors.teal,

      /**
       * Handler function called when point handle double clicked
       */
      pointDblClickHandler: null,

      /*
       * Handler function called when the point handle has finished dragging
       */
      pointDragEndHandler:  null,

      /**
       * An AudioContext, used when creating waveform data using the Web Audio API
       */
      audioContext: null,

      /**
       * WaveformData WebAudio Decoder Options
       *
       * You mostly want to play with the 'scale' option.
       *
       * @see https://github.com/bbc/waveform-data.js/blob/master/lib/builders/webaudio.js
       */
      waveformBuilderOptions: {
        scale: 512,
        amplitude_scale: 1.0
      },

      /**
       * Use animation on zoom
       */
      zoomAdapter: 'static',

      /**
       * Emit cue events
       */
      emitCueEvents: false
    };

    /**
     * Asynchronous errors logger.
     *
     * @type {Function}
     */
    // eslint-disable-next-line no-console
    this.logger = console.error.bind(console);

    return this;
  }

  Peaks.prototype = Object.create(EventEmitter.prototype);

  /**
   * Creates and initialises a new Peaks instance with the given options.
   *
   * @param {Object} opts Configuration options
   *
   * @return {Peaks}
   */

  Peaks.init = function(opts, callback) {
    var instance = new Peaks();

    opts = opts || {};

    instance._setOptions(opts);

    /*
     Setup the layout
     */

    var containers = null;

    if (typeof instance.options.template === 'string') {
      opts.container.innerHTML = instance.options.template;

      containers = buildUi(instance.options.container);
    }
    else if (Utils.isHTMLElement(instance.options.template)) {
      this.container.appendChild(instance.options.template);

      containers = buildUi(instance.options.container);
    }
    else if (instance.options.containers) {
      containers = instance.options.containers;
    }
    else {
      // eslint-disable-next-line max-len
      throw new TypeError('Peaks.init(): The template option must be a valid HTML string or a DOM object');
    }

    var zoomviewContainer = containers.zoomview || containers.zoom;

    if (!Utils.isHTMLElement(zoomviewContainer) &&
        !Utils.isHTMLElement(containers.overview)) {
      // eslint-disable-next-line max-len
      throw new TypeError('Peaks.init(): The containers.zoomview and/or containers.overview options must be valid HTML elements');
    }

    if (zoomviewContainer && zoomviewContainer.clientWidth <= 0) {
      // eslint-disable-next-line max-len
      throw new TypeError('Peaks.init(): Please ensure that the zoomview container is visible and has non-zero width');
    }

    if (containers.overview && containers.overview.clientWidth <= 0) {
      // eslint-disable-next-line max-len
      throw new TypeError('Peaks.init(): Please ensure that the overview container is visible and has non-zero width');
    }

    if (instance.options.keyboard) {
      instance.keyboardHandler = new KeyboardHandler(instance);
    }

    instance.player = new Player(instance, instance.options.mediaElement);
    instance.segments = new WaveformSegments(instance);
    instance.points = new WaveformPoints(instance);
    instance.zoom = new ZoomController(instance, instance.options.zoomLevels);
    instance.time = new TimeController(instance);
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

      if (containers.overview) {
        instance.views.createOverview(containers.overview);
      }

      if (zoomviewContainer) {
        instance.views.createZoomview(zoomviewContainer);
      }

      instance._addWindowResizeHandler();

      if (instance.options.segments) {
        instance.segments.add(instance.options.segments);
      }

      if (instance.options.points) {
        instance.points.add(instance.options.points);
      }

      if (instance.options.emitCueEvents) {
        instance._cueEmitter = new CueEmitter(instance);
      }

      // TODO: Deprecated, use peaks.ready instead.
      instance.emit('segments.ready');

      instance.emit('peaks.ready');

      if (callback) {
        callback(null, instance);
      }
    });

    return instance;
  };

  Peaks.prototype._setOptions = function(opts) {
    // eslint-disable-next-line no-console
    opts.deprecationLogger = opts.deprecationLogger || console.log.bind(console);

    if (opts.audioElement) {
      opts.mediaElement = opts.audioElement;
        // eslint-disable-next-line max-len
      opts.deprecationLogger('Peaks.init(): The audioElement option is deprecated, please use mediaElement instead');
    }

    if (!opts.mediaElement) {
      throw new Error('Peaks.init(): Missing mediaElement option');
    }

    if (!(opts.mediaElement instanceof HTMLMediaElement)) {
      // eslint-disable-next-line max-len
      throw new TypeError('Peaks.init(): The mediaElement option should be an HTMLMediaElement');
    }

    if (!opts.container && !opts.containers) {
      throw new Error('Peaks.init(): Please specify either a container or containers option');
    }
    else if (Boolean(opts.container) === Boolean(opts.containers)) {
      throw new Error('Peaks.init(): Please specify either a container or containers option, but not both');
    }

    if (opts.template && opts.containers) {
      throw new Error('Peaks.init(): Please specify either a template or a containers option, but not both');
    }

    // The 'containers' option overrides 'template'.
    if (opts.containers) {
      opts.template = null;
    }

    if (opts.logger && !Utils.isFunction(opts.logger)) {
      // eslint-disable-next-line max-len
      throw new TypeError('Peaks.init(): The logger option should be a function');
    }

    if (opts.segments && !Array.isArray(opts.segments)) {
      // eslint-disable-next-line max-len
      throw new TypeError('Peaks.init(): options.segments must be an array of segment objects');
    }

    if (opts.points && !Array.isArray(opts.points)) {
      // eslint-disable-next-line max-len
      throw new TypeError('Peaks.init(): options.points must be an array of point objects');
    }

    Utils.extend(this.options, opts);
    Utils.extend(this.options, {
      createSegmentMarker: mixins.createSegmentMarker,
      createSegmentLabel:  mixins.createSegmentLabel,
      createPointMarker:   mixins.createPointMarker
    });

    if (!Array.isArray(this.options.zoomLevels)) {
      throw new TypeError('Peaks.init(): The zoomLevels option should be an array');
    }
    else if (this.options.zoomLevels.length === 0) {
      throw new Error('Peaks.init(): The zoomLevels array must not be empty');
    }
    else {
      if (!Utils.isInAscendingOrder(this.options.zoomLevels)) {
        throw new Error('Peaks.init(): The zoomLevels array must be sorted in ascending order');
      }
    }

    if (this.options.pointDblClickHandler) {
      opts.deprecationLogger('Peaks.init(): The pointDblClickHandler option is deprecated, please use the points.dblclick event instead');
      this.on('points.dblclick', this.options.pointDblClickHandler);
    }

    if (this.options.pointDragEndHandler) {
      opts.deprecationLogger('Peaks.init(): The pointDragEndHandler option is deprecated, please use the points.dragend event instead');
      this.on('points.dragend', this.options.pointDragEndHandler);
    }

    /*
     Setup the logger
     */
    if (opts.logger) {
      this.logger = opts.logger;
    }
  };

  Peaks.prototype.getWaveformData = function() {
    return this._waveformData;
  };

  Peaks.prototype._addWindowResizeHandler = function() {
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
  };

  Peaks.prototype._onResize = function() {
    this.emit('window_resize');
  };

  Peaks.prototype._removeWindowResizeHandler = function() {
    window.removeEventListener('resize', this._onResize);
  };

  /**
   * Cleans up a Peaks instance after use.
   */

  Peaks.prototype.destroy = function() {
    this._removeWindowResizeHandler();

    if (this.views) {
      this.views.destroy();
    }

    if (this.player) {
      this.player.destroy();
    }

    if (this._cueEmitter) {
      this._cueEmitter.destroy();
    }
  };

  return Peaks;
});
