define('peaks', [
  'EventEmitter',
  'peaks/player/player',
  'peaks/waveform/waveform.core',
  'peaks/waveform/waveform.mixins',
  'peaks/player/player.keyboard'
], function (EventEmitter, AudioPlayer, Waveform, mixins, keyboard) {
  'use strict';

  var buildUi = function (container) {
    return {
      'player':   container.querySelector(".waveform"),
      'zoom':     container.querySelector(".zoom-container"),
      'overview': container.querySelector(".overview-container")
    };
  };

  var extend = function (to, from) {
    for (var key in from) {
      to[key] = from[key];
    }

    return to;
  };

  function Peaks (container) {
    this.options = {
      /**
       * Array of scale factors (samples per pixel) for the zoom levels (big >> small)
       */
      zoomLevels:            [512, 1024, 2048, 4096],
      /**
       * Data URI where to get the waveform data.
       *
       * If a string, we assume that `this.dataUriDefaultFormat` is the default `xhr.responseType` value.
       *
       * @since 0.0.1
       *
       * ```js
       * dataUri: 'url/to/data.json?waveformId=1337'
       * ```
       *
       * If an object, each key is an `xhr.responseType` which will contain its associated source URI.
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
       * Will be used as a `xhr.responseType` if `dataUri` is a string, and not an object.
       * Here for backward compatibility purpose only.
       *
       * @since 0.3.0
       */
      dataUriDefaultFormat:  'json',
      /**
       * Bind keyboard controls
       */
      keyboard:              false,
      /**
       * Keyboard nudge increment in seconds (left arrow/right arrow)
       */
      nudgeIncrement:        0.01,
      /**
       * Colour for the in marker of segments
       */
      inMarkerColor:         '#a0a0a0',
      /**
       * Colour for the out marker of segments
       */
      outMarkerColor:        '#a0a0a0',
      /**
       * Colour for the zoomed in waveform
       */
      zoomWaveformColor:     'rgba(0, 225, 128, 1)',
      /**
       * Colour for the overview waveform
       */
      overviewWaveformColor: 'rgba(0,0,0,0.2)',
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
      segmentColor:          'rgba(255, 161, 39, 1)',
      /**
       * Colour of the play head
       */
      playheadColor:         'rgba(0, 0, 0, 1)',
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
       * Related to points
       */
      pointMarkerColor:     '#FF0000', //Color for the point marker
      pointDblClickHandler: null, //Handler called when point handle double clicked.
      pointDragEndHandler:  null, // Called when the point handle has finished dragging

      /**
       * Called when the waveform has been drawn and is ready
       */
       waveFormReadyHandler: null
    };

    /**
     *
     * @type {HTMLElement}
     */
    this.container = container;

    /**
     *
     * @type {number}
     */
    this.currentZoomLevel = 0;
  }

  Peaks.init = function init (opts) {
    opts = opts || {};

    if (opts.audioElement) {
      opts.mediaElement = opts.audioElement;

      if (console && typeof console.log === 'function') {
        console.log('`audioElement` option is deprecated. Please use `mediaElement` instead.');
      }
    }

    if (!opts.mediaElement) {
      throw new Error("Please provide an audio element.");
    }

    if (!(opts.mediaElement instanceof HTMLMediaElement)) {
      throw new TypeError("[Peaks.init] The mediaElement option should be an HTMLMediaElement.");
    }

    if (!opts.container) {
      throw new Error("Please provide a container object.");
    }

    if ((opts.container.clientWidth > 0) === false) {
      throw new TypeError("Please ensure that the container has a width.");
    }

    var instance = new Peaks(opts.container);

    extend(instance.options, opts);
    extend(instance.options, {
      segmentInMarker:  mixins.defaultInMarker(instance.options),
      segmentOutMarker: mixins.defaultOutMarker(instance.options),
      segmentLabelDraw: mixins.defaultSegmentLabelDraw(instance.options),
      pointMarker:      mixins.defaultPointMarker(instance.options)
    });

    if (typeof instance.options.template === 'string') {
      instance.container.innerHTML = instance.options.template;
    }
    else if (instance.options.template instanceof HTMLElement) {
      instance.container.appendChild(instance.options.template);
    }
    else {
      throw new TypeError("Please ensure you provide an HTML string or a DOM template as `template` instance option. Provided: " + instance.options.template);
    }

    if (instance.options.keyboard) keyboard.init(instance);

    instance.player = new AudioPlayer(instance);
    instance.player.init(instance.options.mediaElement);

    instance.waveform = new Waveform(instance);
    instance.waveform.init(buildUi(instance.container));

    instance.on("waveformOverviewReady", function () {
      instance.waveform.openZoomView();

      if (instance.options.segments) { // Any initial segments to be displayed?
        instance.segments.addSegment(instance.options.segments);
      }

      if (instance.options.points) { //Any initial points to be displayed?
        instance.points.addPoint(instance.options.points);
      }

      if(instance.options.waveFormReadyHandler) {
        instance.options.waveFormReadyHandler();
      }

    });

    return instance;
  };


  Peaks.prototype = Object.create(EventEmitter.prototype, {
    segments: {
      get: function () {
        var self = this;

        function addSegment (startTime, endTime, editable, color, labelText) {
          var segments = arguments[0];

          if (typeof segments === "number") {
            segments = [
              {
                startTime: startTime,
                endTime:   endTime,
                editable:  editable,
                color:     color,
                labelText: labelText
              }
            ];
          }

          if (Array.isArray(segments)) {
            segments.forEach(function (segment) {
              self.waveform.segments.createSegment(segment.startTime, segment.endTime, segment.editable, segment.color, segment.labelText);
            });

            self.waveform.segments.render();
          }
          else {
            throw new TypeError("[Peaks.segments.addSegment] Unrecognized segment parameters.");
          }
        }

        return {
          addSegment: addSegment,
          add:        addSegment,

          remove: function (segment) {
            var index = self.waveform.segments.remove(segment);

            if (index === null) {
              throw new RangeError('Unable to find the requested segment' + String(segment));
            }

            self.waveform.segments.updateSegments();

            return self.waveform.segments.segments.splice(index, 1).pop();
          },

          removeByTime: function (startTime, endTime) {
            endTime = (typeof endTime === 'number') ? endTime : 0;
            var fnFilter;

            if (endTime > 0) {
              fnFilter = function (segment) {
                return segment.startTime === startTime && segment.endTime === endTime;
              };
            }
            else {
              fnFilter = function (segment) {
                return segment.startTime === startTime;
              };
            }

            var indexes = self.waveform.segments.segments
              .filter(fnFilter)
              .map(function (segment, i) {
                self.waveform.segments.remove(segment);

                return i;
              })
              .sort(function (a, b) {
                return b - a;
              })
              .map(function (index) {
                self.waveform.segments.segments.splice(index, 1);

                return index;
              });

            self.waveform.segments.updateSegments();

            return indexes.length;
          },

          removeAll: function () {
            self.waveform.segments.segments.forEach(function (segment) {
              self.waveform.segments.remove(segment);
            });

            self.waveform.segments.segments = [];

            self.waveform.segments.updateSegments();
          },

          getSegments: function () {
            return self.waveform.segments.segments;
          }
        };
      }
    },
    /**
     * Points API
     */
    points:   {
      get: function () {
        var self = this;
        return {
          /**
           *
           * @param timeStamp
           * @param editable
           * @param color
           * @param labelText
           */
          add: function (timestamp, editable, color, labelText) {
            var points = arguments[0];

            if (typeof points === "number") {
              points = [{
                timestamp: timestamp,
                editable:  editable,
                color:     color,
                labelText: labelText
              }];
            }

            if (Array.isArray(points)) {
              points.forEach(self.waveform.points.createPoint.bind(self.waveform.points));
              self.waveform.points.render();
            }
            else {
              throw new TypeError("[Peaks.points.addPoint] Unrecognized point parameters.");
            }
          },
          /**
           *
           * @returns {*|WaveformOverview.playheadLine.points|WaveformZoomView.zoomPlayheadLine.points|points|o.points|n.createUi.points}
           */
          getPoints: function () {
            return self.waveform.points.points;
          },
          /**
           *
           * @param id
           */
          removeByTime: function (timestamp) {
            var indexes = self.waveform.points.points
              .filter(function(point){
                return point.timestamp === timestamp;
              })
              .map(function (point, i) {
                self.waveform.points.remove(point);

                return i;
              })
              .sort(function (a, b) {
                return b - a;
              })
              .map(function (index) {
                self.waveform.points.points.splice(index, 1);

                return index;
              });

            self.waveform.points.render();

            return indexes.length;
          }
        };
      }
    },
    /**
     * Time API
     */
    time:     {
      get: function () {
        var self = this;

        return {
          /**
           * Seeks the media player to that exat time.
           * Infers the playhead position to that same time.
           *
           * ```js
           * var p = Peaks.init(…);
           * p.time.setCurrentTime(20.5);
           * ```
           *
           * @param {Number} time
           */
          setCurrentTime: function setCurrentTime (time) {
            return self.player.seekBySeconds(time);
          },
          /**
           * Returns the actual time of the media element, in seconds.
           *
           * ```js
           * var p = Peaks.init(…);
           * p.time.getCurrentTime();     // -> 0
           * ```
           *
           * @returns {Number}
           */

          getCurrentTime: function () {
            return self.player.getTime();
          }
        };
      }
    },
    /**
     * Zoom API
     */
    zoom:     {
      get: function () {
        var self = this;
        return {

          /**
           * Zoom in one level
           */
          zoomIn: function () {
            self.zoom.setZoom(self.currentZoomLevel - 1);
          },

          /**
           * Zoom out one level
           */
          zoomOut: function () {
            self.zoom.setZoom(self.currentZoomLevel + 1);
          },

          /**
           * Given a particular zoom level, triggers a resampling of the data in the zoomed view
           *
           * @param {number} zoomLevelIndex
           */
          setZoom: function (zoomLevelIndex) { // Set zoom level to index of current zoom levels
            if (zoomLevelIndex >= self.options.zoomLevels.length) {
              zoomLevelIndex = self.options.zoomLevels.length - 1;
            }

            if (zoomLevelIndex < 0) {
              zoomLevelIndex = 0;
            }

            self.currentZoomLevel = zoomLevelIndex;
            self.emit("waveform_zoom_level_changed", self.options.zoomLevels[zoomLevelIndex]);
          },

          /**
           * Returns the current zoom level
           *
           * @returns {number}
           */
          getZoom: function () {
            return self.currentZoomLevel;
          }
        };
      }
    }
  });

  return Peaks;
});
