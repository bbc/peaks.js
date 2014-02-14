require.config({
  paths: {
    'm': "waveform_viewer"
  }
});

define([
  'EventEmitter',
  'm/player/player',
  'm/player/waveform/waveform.core',
  'm/player/waveform/waveform.mixins',
  'm/player/player.keyboard'
], function (EventEmitter, AudioPlayer, Waveform, mixins, keyboard) {

  var buildUi = function (container) {
    return {
      'player': container.querySelector(".waveform"),
      'zoom': container.querySelector(".zoom-container"),
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
      zoomLevels: [512, 1024, 2048, 4096],
      /**
       * Bind keyboard controls
       */
      keyboard: false,
      /**
       * Keyboard nudge increment in seconds (left arrow/right arrow)
       */
      nudgeIncrement: 0.01,
      /**
       * Colour for the in marker of segments
       */
      inMarkerColor: '#a0a0a0',
      /**
       * Colour for the out marker of segments
       */
      outMarkerColor: '#a0a0a0',
      /**
       * Colour for the zoomed in waveform
       */
      zoomWaveformColor: 'rgba(0, 225, 128, 1)',
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
      height: 200,
      /**
       * Colour for segments on the waveform
       */
      segmentColor: 'rgba(255, 161, 39, 1)',
      /**
       *
       */
      template: [
        '<div class="waveform">',
        '<div class="zoom-container"></div>',
        '<div class="overview-container"></div>',
        '</div>'
      ].join('')
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

    if (!opts.audioElement) {
      throw new Error("Please provide an audio element.");
    }

    if (!opts.container) {
      throw new Error("Please provide a container object.");
    }

    if (opts.container.width < 1 || opts.container.height < 1) {
      throw new Error("Please ensure that the container has a defined width and height.");
    }

    var instance = new Peaks(opts.container);

    extend(instance.options, opts);
    extend(instance.options, {
      segmentInMarker: mixins.defaultInMarker(instance.options),
      segmentOutMarker: mixins.defaultOutMarker(instance.options),
      segmentLabelDraw: mixins.defaultSegmentLabelDraw(instance.options)
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
    instance.player.init(instance.options.audioElement);

    instance.waveform = new Waveform(instance);
    instance.waveform.init(buildUi(instance.container));

    instance.on("waveformOverviewReady", function () {
      instance.waveform.openZoomView();

      if (instance.options.segments) { // Any initial segments to be displayed?
        instance.segments.addSegment(instance.options.segments);
      }
    });

    return instance;
  };


  Peaks.prototype = Object.create(EventEmitter.prototype, {
    segments: {
      get: function () {
        var self = this;

        return {
          addSegment: function (startTime, endTime, editable, color, labelText) {
            var segments = arguments[0];

            if (typeof segments === "number") {
              segments = [{
                startTime: startTime,
                endTime: endTime,
                editable: editable,
                color: color,
                labelText: labelText
              }];
            }

            if (Array.isArray(segments)){
              segments.forEach(function(segment){
                self.waveform.segments.createSegment(segment.startTime, segment.endTime, segment.editable, segment.color, segment.labelText);
              });

              self.waveform.segments.render();
            }
            else {
              throw new TypeError("[Peaks.segments.addSegment] Unrecognized segment parameters.");
            }
          },

          // removeSegment: function (segment) {

          // },

          // clearSegments : function () { // Remove all segments

          // },

          getSegments: function () {
            return self.waveform.segments.segments;
          }
        };
      }
    },
    time: {
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
    zoom: {
      get: function () {
        var self = this;
        return { // namepsace for zooming related methods

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
