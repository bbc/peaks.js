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
  'peaks/views/waveform.timecontroller',
  'peaks/views/waveform.zoomcontroller',
  'peaks/waveform/waveform.core',
  'peaks/waveform/waveform.mixins',
  'peaks/waveform/waveform.utils',
  'peaks/player/player.keyboard'
  ], function(
    Colors,
    EventEmitter,
    WaveformPoints,
    WaveformSegments,
    Player,
    TimeController,
    ZoomController,
    Waveform,
    mixins,
    Utils,
    KeyboardHandler) {
  'use strict';

  function buildUi(container) {
    return {
      player:   container.querySelector('.waveform'),
      zoom:     container.querySelector('.zoom-container'),
      overview: container.querySelector('.overview-container')
    };
  }

  /**
   * Creates a new Peaks.js object.
   *
   * @class
   * @alias Peaks
   *
   * @param {HTMLElement} container An HTML element to contain the Peaks.js
   *  user interface elements.
   */

  function Peaks(container) {
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
      zoomAdapter: 'static'
    };

    /**
     *
     * @type {HTMLElement}
     */
    this.container = container;

    /**
     * Asynchronous errors logger.
     *
     * @type {Function}
     */
    // eslint-disable-next-line no-console
    this.logger = console.error.bind(console);
  }

  /**
   * Creates and initialises a new Peaks instance with the given options.
   *
   * @param {Object} opts Configuration options
   *
   * @return {Peaks}
   */

  Peaks.init = function init(opts) {
    opts = opts || {};

    // eslint-disable-next-line no-console
    opts.deprecationLogger = opts.deprecationLogger || console.log.bind(console);

    if (opts.audioElement) {
      opts.mediaElement = opts.audioElement;
        // eslint-disable-next-line max-len
      opts.deprecationLogger('Peaks.init(): the audioElement option is deprecated, please use mediaElement instead');
    }

    if (!opts.mediaElement) {
      throw new Error('Peaks.init(): Missing mediaElement option');
    }

    if (!(opts.mediaElement instanceof HTMLMediaElement)) {
      // eslint-disable-next-line max-len
      throw new TypeError('Peaks.init(): The mediaElement option should be an HTMLMediaElement');
    }

    if (!opts.container) {
      throw new Error('Peaks.init(): Missing container option');
    }

    if ((opts.container.clientWidth > 0) === false) {
      // eslint-disable-next-line max-len
      throw new TypeError('Peaks.init(): Please ensure that the container has a width');
    }

    if (opts.logger && !Utils.isFunction(opts.logger)) {
      // eslint-disable-next-line max-len
      throw new TypeError('Peaks.init(): The logger option should be a function');
    }

    var instance = new Peaks(opts.container);

    Utils.extend(instance.options, opts);
    Utils.extend(instance.options, {
      createSegmentMarker: mixins.createSegmentMarker,
      createSegmentLabel:  mixins.createSegmentLabel,
      createPointMarker:   mixins.createPointMarker
    });

    if (!Array.isArray(instance.options.zoomLevels)) {
      throw new TypeError('Peaks.init(): The zoomLevels option should be an array');
    }
    else if (instance.options.zoomLevels.length === 0) {
      throw new Error('Peaks.init(): The zoomLevels array must not be empty');
    }
    else {
      if (!Utils.isInAscendingOrder(instance.options.zoomLevels)) {
        throw new Error('Peaks.init(): The zoomLevels array must be sorted in ascending order');
      }
    }

    /*
     Setup the logger
     */
    if (opts.logger) {
      instance.logger = opts.logger;
    }

    instance.on('error', instance.logger.bind(null));

    /*
     Setup the layout
     */
    if (typeof instance.options.template === 'string') {
      instance.container.innerHTML = instance.options.template;
    }
    else if (instance.options.template instanceof HTMLElement) {
      instance.container.appendChild(instance.options.template);
    }
    else {
      // eslint-disable-next-line max-len
      throw new TypeError('Peaks.init(): The template option must be a valid HTML string or a DOM object');
    }

    if (instance.options.keyboard) {
      instance.keyboardHandler = new KeyboardHandler(instance);
    }

    instance.player = new Player(instance, instance.options.mediaElement);

    instance.segments = new WaveformSegments(instance);
    instance.points = new WaveformPoints(instance);

    /*
     Setup the UI components
     */
    instance.waveform = new Waveform(instance);
    instance.waveform.init(buildUi(instance.container));

    instance.zoom = new ZoomController(instance, instance.options.zoomLevels);
    instance.time = new TimeController(instance);

    instance.on('peaks.ready', function() {
      if (instance.options.segments) {
        if (!Array.isArray(instance.options.segments)) {
          // eslint-disable-next-line max-len
          throw new TypeError('Peaks.init(): options.segments must be an array of segment objects');
        }

        instance.segments.add(instance.options.segments);
      }

      if (instance.options.points) {
        if (!Array.isArray(instance.options.points)) {
          // eslint-disable-next-line max-len
          throw new TypeError('Peaks.init(): options.points must be an array of point objects');
        }

        instance.points.add(instance.options.points);
      }
    });

    return instance;
  };

  Peaks.prototype = Object.create(EventEmitter.prototype);

  /**
   * Cleans up a Peaks instance after use.
   */

  Peaks.prototype.destroy = function() {
    this.removeAllListeners();
    this.waveform.destroy();
    this.player.destroy();
  };

  return Peaks;
});
