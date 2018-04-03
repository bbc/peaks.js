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
   * Creates and initialises a new Peaks instance with the given options.
   *
   * @class
   * @alias Peaks
   *
   * @param {Object} opts Configuration options
   */

  function Peaks(opts) {
    EventEmitter.call(this, { wildcard: true });

    opts = opts || {};

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
    this.container = opts.container;

    /**
     * Asynchronous errors logger.
     *
     * @type {Function}
     */
    // eslint-disable-next-line no-console
    this.logger = console.error.bind(console);

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

    this.on('error', this.logger.bind(null));

    /*
     Setup the layout
     */
    if (typeof this.options.template === 'string') {
      this.container.innerHTML = this.options.template;
    }
    else if (this.options.template instanceof HTMLElement) {
      this.container.appendChild(this.options.template);
    }
    else {
      // eslint-disable-next-line max-len
      throw new TypeError('Peaks.init(): The template option must be a valid HTML string or a DOM object');
    }

    if (this.options.keyboard) {
      this.keyboardHandler = new KeyboardHandler(this);
    }

    this.player = new Player(this, this.options.mediaElement);

    this.segments = new WaveformSegments(this);
    this.points = new WaveformPoints(this);

    /*
     Setup the UI components
     */
    this.waveform = new Waveform(this);
    this.waveform.init(buildUi(this.container));

    this.zoom = new ZoomController(this, this.options.zoomLevels);
    this.time = new TimeController(this);

    var self = this;

    this.on('peaks.ready', function() {
      if (self.options.segments) {
        if (!Array.isArray(self.options.segments)) {
          // eslint-disable-next-line max-len
          throw new TypeError('Peaks.init(): options.segments must be an array of segment objects');
        }

        self.segments.add(self.options.segments);
      }

      if (self.options.points) {
        if (!Array.isArray(self.options.points)) {
          // eslint-disable-next-line max-len
          throw new TypeError('Peaks.init(): options.points must be an array of point objects');
        }

        self.points.add(self.options.points);
      }
    });

    return this;
  }

  /**
   * Creates and initialises a new Peaks instance with the given options.
   *
   * @param {Object} opts Configuration options
   *
   * @return {Peaks}
   */

  Peaks.init = function(opts) {
    return new Peaks(opts);
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
