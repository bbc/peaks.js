require.config({
  paths: {
    'm': "waveform_viewer"
  }
});

define([
  'm/bootstrap',
  'm/player/player',
  'm/player/waveform/waveform.core',
  'm/player/waveform/waveform.mixins',
  'templates/main',
  'm/player/player.keyboard'
  ], function(bootstrap, AudioPlayer, Waveform, mixins, JST, keyboard){

  var buildUi = function () {
    return {
      player: document.getElementById("waveform"),
      zoom: document.getElementById("zoom-container"),
      overview: document.getElementById("overview-container")
    };
  };

  var extend = function (to, from) {
    for (var key in from){
      if (!(key in to)){
        to[key] = from[key];
      }
    }

    return to;
  };

  var api = { // PUBLIC API
    init: function (opts) {

      if (!opts.audioElement) {
        throw new Error("Please provide an audio element.");
      } else if (!opts.container) {
        throw new Error("Please provide a container object.");
      } else if (opts.container.width < 1 || opts.container.height < 1) {
        throw new Error("Please ensure that the container has a defined width and height.");
      }

      api.options = {
        zoomLevels: [512, 1024, 2048, 4096], // Array of scale factors (samples per pixel) for the zoom levels (big >> small)
        keyboard: false, // Bind keyboard controls
        nudgeIncrement: 0.01, // Keyboard nudge increment in seconds (left arrow/right arrow)
        inMarkerColor: '#a0a0a0', // Colour for the in marker of segments
        outMarkerColor: '#a0a0a0', // Colour for the out marker of segments
        zoomWaveformColor: 'rgba(0, 225, 128, 1)', // Colour for the zoomed in waveform
        overviewWaveformColor: 'rgba(0,0,0,0.2)', // Colour for the overview waveform
        randomizeSegmentColor: true, // Random colour per segment (overrides segmentColor)
        height: 200, // height of the waveform canvases in pixels
        segmentColor: 'rgba(255, 161, 39, 1)' // Colour for segments on the waveform,
      };

      extend(api.options, opts);
      extend(api.options, {
        segmentInMarker: mixins.defaultInMarker(api.options),
        segmentOutMarker: mixins.defaultOutMarker(api.options),
        segmentLabelDraw: mixins.defaultSegmentLabelDraw(api.options)
      });

      api.currentZoomLevel = 0;

      $(api.options.container).html(JST.main).promise().done(function () {

        if (api.options.keyboard) keyboard.init();

        api.player = new AudioPlayer();
        api.player.init(api.options.audioElement);

        api.waveform = new Waveform();
        api.waveform.init(api.options, buildUi());

        window.peaks = api; // Attach to window object for simple external calls
      });

      bootstrap.pubsub.on("waveformOverviewReady", function () {
        api.waveform.openZoomView();
        if (api.options.segments) { // Any initial segments to be displayed?
          api.segments.addSegment(api.options.segments);
        }
      });
    },

    segments: {
      addSegment: function (startTime, endTime, segmentEditable, color, labelText) {
        if (typeof startTime === "number") {
          api.waveform.segments.createSegment(startTime, endTime, segmentEditable, color, labelText);
        } else if (Array.isArray(startTime)){
          startTime.forEach(function(segment){
            api.waveform.segments.createSegment(segment.startTime, segment.endTime, segment.editable, segment.color, segment.labelText);
          });
        }

        api.waveform.segments.render();
      },

      // removeSegment: function (segment) {

      // },

      // clearSegments : function () { // Remove all segments

      // },

      getSegments: function () {
        return api.waveform.segments.segments;
      }

    },

    time: {
      getCurrentTime: function () {
        return api.player.getTime();
      }
    },

    zoom: { // namepsace for zooming related methods

      /**
       * Zoom in one level
       */
      zoomIn: function () {
        api.zoom.setZoom(api.currentZoomLevel - 1);
      },

      /**
       * Zoom out one level
       */
      zoomOut: function () {
        api.zoom.setZoom(api.currentZoomLevel + 1);
      },

      /**
       * Given a particular zoom level, triggers a resampling of the data in the zoomed view
       *
       * @param {number} zoomLevelIndex
       */
      setZoom: function (zoomLevelIndex) { // Set zoom level to index of current zoom levels
        if (zoomLevelIndex >= api.options.zoomLevels.length){
          zoomLevelIndex = api.options.zoomLevels.length - 1;
        }

        if (zoomLevelIndex < 0){
          zoomLevelIndex = 0;
        }

        api.currentZoomLevel = zoomLevelIndex;
        bootstrap.pubsub.emit("waveform_zoom_level_changed", api.options.zoomLevels[zoomLevelIndex]);
      },

      /**
       * Returns the current zoom level
       *
       * @returns {number}
       */
      getZoom: function () {
        return api.currentZoomLevel;
      }

    }
  };

  return api;

});
