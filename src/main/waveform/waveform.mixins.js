/**
 * WAVEFORM.MIXINS.JS
 *
 * Common functions used in multiple modules are
 * collected here for DRY purposes.
 */
define(function () {
  'use strict';

  // Private methods

  /**
   * Create a Left or Right side handle group in Kinetic based on given options.
   * @param  {int}      height    Height of handle group container (canvas)
   * @param  {string}   color     Colour hex value for handle and line marker
   * @param  {Boolean}  inMarker  Is this marker the inMarker (LHS) or outMarker (RHS)
   * @return {Function}
   */
  var createHandle = function (height, color, inMarker) {

    /**
     * @param  {Boolean}  draggable If true, marker is draggable
     * @param  {Object}   segment   Parent segment object with in and out times
     * @param  {Object}   parent    Parent context
     * @param  {Function} onDrag    Callback after drag completed
     * @return {Kinetic Object}     Kinetic group object of handle marker elements
     */
    return function (draggable, segment, parent, onDrag) {
      var markerTop     = 0,
          markerX       = 0.5,
          handleTop     = (height / 2) - 10.5,
          handleBottom  = (height / 2) + 9.5,
          markerBottom  = height,
          handleX       = inMarker ? -19.5 : 19.5;

      var handlePoints = [
        [markerX, markerTop],
        [markerX, handleTop],
        [handleX, handleTop],
        [handleX, handleBottom],
        [markerX, handleBottom],
        [markerX, markerBottom]
      ];

      var group = new Kinetic.Group({
        draggable: draggable,
        dragBoundFunc: function(pos) {
          var limit;

          if (inMarker) {
            limit = segment.outMarker.getX() - segment.outMarker.getWidth();
            if (pos.x > limit) pos.x = limit;
          }
          else {
            limit = segment.inMarker.getX() + segment.inMarker.getWidth();
            if (pos.x < limit) pos.x = limit;
          }

          return {
            x: pos.x,
            y: this.getAbsolutePosition().y
          };
        }
      }).on("dragmove", function (event) {
        onDrag(segment, parent);
      });

      var xPosition = inMarker ? -24 : 24;

      var text = new Kinetic.Text({
        x: xPosition,
        y: (height / 2) - 5,
        text: "",
        fontSize: 10,
        fontFamily: 'sans-serif',
        fill: "#000",
        textAlign: "center"
      });
      text.hide();
      group.label = text;
      group.add(text);

      var handle = new Kinetic.Polygon({
        points: handlePoints,
        fill: color,
        stroke: color,
        strokeWidth: 1
      }).on("mouseover", function (event) {
        text.show();
        if (inMarker) text.setX(xPosition - text.getWidth());
        segment.view.segmentLayer.draw();
      }).on("mouseout", function (event) {
        text.hide();
        segment.view.segmentLayer.draw();
      });
      group.add(handle);

      return group;
    };
  };

  /**
   * Create a point handle group in Kinetic based on given options.
   * @param  {int}      height    Height of handle group container (canvas)
   * @param  {string}   color     Colour hex value for handle and line marker
   * @return {Function}
   */
  var createPointHandle = function(height, color) {
      /**
       * @param  {Boolean}  draggable If true, marker is draggable
       * @param  {Object}   point     Parent point object with in times
       * @param  {Object}   parent    Parent context
       * @param  {Function} onDrag    Callback after drag completed
       * @return {Kinetic Object}     Kinetic group object of handle marker elements
       */
      return function (draggable, point, parent, onDrag, onDblClick, onDragEnd) {
          var markerTop     = 0,
              markerX       = 0.5,
              handleTop     = (height / 2) - 10.5,
              handleBottom  = (height / 2) + 9.5,
              markerBottom  = height,
              handleX       = 9.75; //Place in the middle of the marker

          var handlePoints = [
              [markerX, markerTop],
              [markerX, handleTop],
              [handleX, handleTop],
              [handleX, handleBottom],
              [markerX, handleBottom],
              [markerX, markerBottom]
          ];

          var group = new Kinetic.Group({
              draggable: draggable,
              dragBoundFunc: function(pos) {

                  return {
                      x: pos.x, //No constraint hoziontally
                      y: this.getAbsolutePosition().y //Constrained vertical line
                  };
              }
          }).on("dragmove", function (event) {
                  onDrag(point, parent);
              });

          if(onDblClick) {
              group.on('dblclick', function (event) {
                  onDblClick(parent);
              });
          }

          if(onDragEnd) {
              group.on('dragend', function (event) {
                  onDragEnd(parent);
              });
          }

          //Place text to the left of the mark
          var xPosition = -24;

          var text = new Kinetic.Text({
              x: xPosition,
              y: (height / 2) - 5,
              text: "",
              fontSize: 10,
              fontFamily: 'sans-serif',
              fill: "#000",
              textAlign: "center"
          });
          text.hide();
          group.label = text;
          group.add(text);

          var handle = new Kinetic.Polygon({
              points: handlePoints,
              fill: color,
              stroke: color,
              strokeWidth: 1
          }).on("mouseover", function (event) {
                  text.show();
                  text.setX(xPosition - text.getWidth()); //Position text to the left of the mark
                  point.view.pointLayer.draw();
              }).on("mouseout", function (event) {
                  text.hide();
                  point.view.pointLayer.draw();
              });
          group.add(handle);

          return group;

      };
  };

  /**
   * Draw a waveform on a canvas context
   * @param  {Object}   ctx           Canvas Context to draw on
   * @param  {Array}    min           Min values for waveform
   * @param  {Array}    max           Max values for waveform
   * @param  {Int}      offset_start  Where to start drawing
   * @param  {Int}      offset_length How much to draw
   * @param  {Function} y             Calculate height (see fn interpolateHeight)
   */
  var drawWaveform = function (ctx, min, max, offset_start, offset_length, y) {
    ctx.beginPath();

    min.forEach(function(val, x){
      ctx.lineTo(offset_start + x + 0.5, y(val) + 0.5);
    });

    max.reverse().forEach(function(val, x){
      ctx.lineTo(offset_start + (offset_length - x) + 0.5, y(val) + 0.5);
    });

    ctx.closePath();
  };

  // Public API
  return {

    interpolateHeight: function interpolateHeightGenerator (total_height){
      var amplitude = 256;
      return function interpolateHeight (size){
        return total_height - ((size + 128) * total_height) / amplitude;
      };
    },

    /**
     * Draws a whole waveform
     *
     * @param {WaveformData} waveform
     * @param {Canvas} canvas
     * @param {Function} y interpolateHeightGenerator instance
     */
    waveformDrawFunction: function (waveform, canvas, y) {
      var offset_length = waveform.offset_length,
          ctx = canvas.getContext();
      drawWaveform(ctx, waveform.min, waveform.max, 0, offset_length, y);
      canvas.fillStroke(this);
    },

    /**
     *
     * @param {WaveformData} waveform
     * @param {Canvas} canvas
     * @param {interpolateHeight} y
     */
    waveformSegmentDrawFunction: function(waveform, id, canvas, y){
      if (waveform.segments[id] === undefined){
        return;
      }
      var segment = waveform.segments[id],
          offset_length = segment.offset_length,
          offset_start = segment.offset_start - waveform.offset_start,
          ctx = canvas.getContext();
      drawWaveform(ctx, segment.min, segment.max, offset_start, offset_length, y);
      canvas.fillStroke(this);
    },

    waveformOffsetDrawFunction: function(waveform, canvas, y){
      if (waveform.segments.zoom === undefined){
        return;
      }
      var offset_length = waveform.segments.zoom.offset_length,
          offset_start = waveform.segments.zoom.offset_start - waveform.offset_start,
          ctx = canvas.getContext();
      drawWaveform(ctx, waveform.segments.zoom.min, waveform.segments.zoom.max, offset_start, offset_length, y);
      canvas.fillStroke(this);
    },

    /**
     * Format a time nicely
     * @param  {int}      time            Time in seconds to be formatted
     * @param  {Boolean}  dropHundredths  Don't display hundredths of a second if true
     * @return {String}   Formatted time string
     */
    niceTime: function (time, dropHundredths) {
      var hundredths, seconds, minutes, hours, result = [];

      hundredths = Math.floor((time % 1) * 100);
      seconds = Math.floor(time);
      minutes = Math.floor(seconds / 60);
      hours = Math.floor(minutes / 60);

      if (hours>0) result.push(hours); // Hours
      result.push(minutes % 60); // Mins
      result.push(seconds % 60); // Seconds

      for (var i = 0; i < result.length; i++) {
        var x = result[i];
        if (x < 10) {
          result[i] = "0" + x;
        } else {
          result[i] = x;
        }
      }

      result = result.join(":");

      if (!dropHundredths) {
        if (hundredths < 10) {
          hundredths = "0" + hundredths;
        }

        result += "." + hundredths; // Hundredths of a second
      }

      return result;
    },

    /**
     * Return a function that on execution creates and returns a new
     * IN handle object
     * @param  {Object}   options Root Peaks.js options containing config info for handle
     * @return {Function} Provides Kinetic handle group on execution
     */
    defaultInMarker: function (options) {
      return createHandle(options.height, options.outMarkerColor, true);
    },

    /**
     * Return a function that on execution creates and returns a new
     * OUT handle object
     * @param  {Object}   options Root Peaks.js options containing config info for handle
     * @return {Function} Provides Kinetic handle group on execution
     */
    defaultOutMarker: function (options) {
      return createHandle(options.height, options.outMarkerColor, false);
    },

    defaultPointMarker: function (options) {
      return createPointHandle(options.height, options.pointMarkerColor);
    },

    defaultSegmentLabelDraw: function (options) {
      return function (segment, parent) {
        return new Kinetic.Text({
          x: 12,
          y: 12,
          text: parent.labelText,
          fontSize: 12,
          fontFamily: 'Arial, sans-serif',
          fill: "#000",
          textAlign: "center"
        });
      };
    }
  };
});
