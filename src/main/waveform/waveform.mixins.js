/**
 * WAVEFORM.MIXINS.JS
 *
 * Common functions used in multiple modules are
 * collected here for DRY purposes.
 */
define(['konva'], function (Konva) {
  'use strict';

  // Private methods

  /**
   * Create a Left or Right side handle group in Konva based on given options.
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
     * @return {Konva Object}     Konva group object of handle marker elements
     */
    return function (draggable, segment, parent, onDrag) {
      var handleHeight = 20;
      var handleWidth = handleHeight / 2;
      var handleY = (height / 2) - 10.5;
      var handleX = inMarker ? -handleWidth + 0.5 : 0.5;

      var group = new Konva.Group({
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

      var text = new Konva.Text({
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

      var handle = new Konva.Rect({
        width: handleWidth,
        height: handleHeight,
        fill: color,
        stroke: color,
        strokeWidth: 1,
        x: handleX,
        y: handleY
      });

      /*
      Vertical Line
       */
      var line = new Konva.Line({
        points: [0.5, 0, 0.5, height],
        strokeWidth: 1,
        stroke: color,
        x: 0,
        y: 0
      });

      /*
      Events
       */
      handle.on("mouseover", function (event) {
        if (inMarker) text.setX(xPosition - text.getWidth());
        text.show();
        segment.view.segmentLayer.draw();
      });
      handle.on("mouseout", function (event) {
        text.hide();
        segment.view.segmentLayer.draw();
      });

      group.add(text);
      group.add(line);
      group.add(handle);

      return group;
    };
  };

  /**
   * Create a point handle group in Konva based on given options.
   * @param  {int}      height    Height of handle group container (canvas)
   * @param  {string}   color     Colour hex value for handle and line marker
   * @return {Function}
   */
  function createPointHandle(height, color) {
      /**
       * @param  {Boolean}  draggable If true, marker is draggable
       * @param  {Object}   point     Parent point object with in times
       * @param  {Object}   parent    Parent context
       * @param  {Function} onDrag    Callback after drag completed
       * @return {Konva Object}     Konva group object of handle marker elements
       */
      return function (draggable, point, parent, onDrag, onDblClick, onDragEnd) {
          var handleTop = (height / 2) - 10.5;
          var handleWidth = 10;
          var handleHeight = 20;
          var handleX = 0.5; //Place in the middle of the marker

          var group = new Konva.Group({
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
          var xPosition = -handleWidth;

          var text = new Konva.Text({
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

          /*
          Handle
           */
          var handle = new Konva.Rect({
            width: handleWidth,
            height: handleHeight,
            fill: color,
            x: handleX,
            y: handleTop
          });

          /*
          Line
           */
          var line = new Konva.Line({
            points: [0, 0, 0, height],
            stroke: color,
            strokeWidth: 1,
            x: handleX,
            y: 0
          });

          /*
          Events
           */
          handle.on("mouseover", function (event) {
            text.show();
            text.setX(xPosition - text.getWidth()); //Position text to the left of the mark
            point.view.pointLayer.draw();
          });
          handle.on("mouseout", function (event) {
            text.hide();
            point.view.pointLayer.draw();
          });

          group.add(handle);
          group.add(line);
          group.add(text);

          return group;

      };
  }

  /**
   * Draw a waveform on a canvas context
   * @param  {Konva.Context}  ctx   Canvas Context to draw on
   * @param  {Array}    min           Min values for waveform
   * @param  {Array}    max           Max values for waveform
   * @param  {Int}      offset_start  Where to start drawing
   * @param  {Int}      offset_length How much to draw
   * @param  {Function} y             Calculate height (see fn interpolateHeight)
   */
  function drawWaveform(ctx, min, max, offset_start, offset_length, y) {
    ctx.beginPath();

    min.forEach(function(val, x){
      ctx.lineTo(offset_start + x + 0.5, y(val) + 0.5);
    });

    max.reverse().forEach(function(val, x){
      ctx.lineTo(offset_start + (offset_length - x) + 0.5, y(val) + 0.5);
    });

    ctx.closePath();
  }

  /**
   * Returns a height interpolator function
   *
   * @param {Number} total_height
   * @returns {interpolateHeight}
   */
  function interpolateHeightGenerator (total_height){
    var amplitude = 256;
    return function interpolateHeight (size){
      return total_height - ((size + 128) * total_height) / amplitude;
    };
  }

  // Public API
  return {

    interpolateHeight: interpolateHeightGenerator,

    drawWaveform: drawWaveform,

    /**
     *
     * @this {Konva.Shape}
     * @param {WaveformOverview} view
     * @param {Konva.Context} context
     */
    waveformDrawFunction: function (view, context) {
      var waveform = view.intermediateData || view.data;
      var y = interpolateHeightGenerator(view.height);
      var offset_length = waveform.offset_length;

      drawWaveform(context, waveform.min, waveform.max, 0, offset_length, y);
      context.fillStrokeShape(this);
    },

    waveformOverviewMarkerDrawFunction: function(xIndex, viewGroup, view) {
      viewGroup.waveformShape.setPoints([xIndex, 0, xIndex, view.height]);
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
     * @return {Function} Provides Konva handle group on execution
     */
    defaultInMarker: function (options) {
      return createHandle(options.height, options.outMarkerColor, true);
    },

    /**
     * Return a function that on execution creates and returns a new
     * OUT handle object
     * @param  {Object}   options Root Peaks.js options containing config info for handle
     * @return {Function} Provides Konva handle group on execution
     */
    defaultOutMarker: function (options) {
      return createHandle(options.height, options.outMarkerColor, false);
    },

    defaultPointMarker: function (options) {
      return createPointHandle(options.height, options.pointMarkerColor);
    },

    defaultSegmentLabelDraw: function (options) {
      return function (segment, parent) {
        return new Konva.Text({
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
