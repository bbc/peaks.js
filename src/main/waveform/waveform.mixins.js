/**
 * @file
 *
 * Common functions used in multiple modules are collected here for DRY purposes.
 *
 * @module peaks/waveform/waveform.mixins
 */
define(['konva'], function(Konva) {
  'use strict';

  // Private methods

  /**
   * Returns a function that creates a Left or Right side segment handle group
   * in Konva based on the given options.
   *
   * @param  {int}      height    Height of handle group container (canvas)
   * @param  {string}   color     Colour hex value for handle and line marker
   * @param  {Boolean}  inMarker  Is this marker the inMarker (LHS) or outMarker (RHS)
   * @return {Function} Segment handle creator function
   */
   function segmentHandleCreator(height, color, inMarker) {
    /**
     * @param  {Boolean}  draggable If true, marker is draggable
     * @param  {Object}   segment   Parent segment object with in and out times
     * @param  {Object}   parent    Parent context
     * @param  {Function} onDrag    Callback after drag completed
     * @return {Konva.Group} Konva group object of handle marker elements
     */
    return function createSegmentHandle(draggable, segment, parent, onDrag) {
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

            if (pos.x > limit) {
              pos.x = limit;
            }
          }
          else {
            limit = segment.inMarker.getX() + segment.inMarker.getWidth();

            if (pos.x < limit) {
              pos.x = limit;
            }
          }

          return {
            x: pos.x,
            y: this.getAbsolutePosition().y
          };
        }
      });

      group.on('dragmove', function(event) {
        onDrag(segment, parent);
      });

      var xPosition = inMarker ? -24 : 24;

      var text = new Konva.Text({
        x:          xPosition,
        y:          (height / 2) - 5,
        text:       '',
        fontSize:   10,
        fontFamily: 'sans-serif',
        fill:       '#000',
        textAlign:  'center'
      });

      text.hide();
      group.label = text;

      var handle = new Konva.Rect({
        x:           handleX,
        y:           handleY,
        width:       handleWidth,
        height:      handleHeight,
        fill:        color,
        stroke:      color,
        strokeWidth: 1
      });

      // Vertical Line

      var line = new Konva.Line({
        x:           0,
        y:           0,
        points:      [0.5, 0, 0.5, height],
        stroke:      color,
        strokeWidth: 1
      });

      // Events

      handle.on('mouseover', function(event) {
        if (inMarker) {
          text.setX(xPosition - text.getWidth());
        }
        text.show();
        segment.view.segmentLayer.draw();
      });

      handle.on('mouseout', function(event) {
        text.hide();
        segment.view.segmentLayer.draw();
      });

      group.add(text);
      group.add(line);
      group.add(handle);

      return group;
    };
  }

  /**
   * Returns a function that creates a point handle group in Konva
   * based on the given options.
   *
   * @param  {int}      height    Height of handle group container (canvas)
   * @param  {string}   color     Colour hex value for handle and line marker
   * @return {Function} Point handle creator function
   */
  function pointHandleCreator(height, color) {
    /**
     * @param  {Boolean}     draggable   If true, marker is draggable
     * @param  {Konva.Group} point
     * @param  {Object}      parent      Parent point object with timestamp
     * @param  {Function}    onDrag      Callback after drag completed
     * @param  {Function}    onDblClick
     * @param  {Function}    onDragEnd
     * @return {Konva.Group} Konva group object of handle marker elements
     */
    return function createPointHandle(draggable, point, parent, onDrag, onDblClick, onDragEnd) {
      var handleTop = (height / 2) - 10.5;
      var handleWidth = 10;
      var handleHeight = 20;
      var handleX = 0.5; // Place in the middle of the marker

      var handleColor = parent.color ? parent.color : color;

      var group = new Konva.Group({
        draggable: draggable,
        dragBoundFunc: function(pos) {
          return {
            x: pos.x, // No constraint horizontally
            y: this.getAbsolutePosition().y // Constrained vertical line
          };
        }
      });

      group.on('dragmove', function(event) {
        onDrag(point, parent);
      });

      if (onDblClick) {
        group.on('dblclick', function(event) {
          onDblClick(parent);
        });
      }

      if (onDragEnd) {
        group.on('dragend', function(event) {
          onDragEnd(parent);
        });
      }

      // Place text to the left of the mark
      var xPosition = -handleWidth;

      var text = new Konva.Text({
        x:          xPosition,
        y:          (height / 2) - 5,
        text:       '',
        textAlign:  'center',
        fontSize:   10,
        fontFamily: 'sans-serif',
        fill:       '#000'
      });

      text.hide();
      group.label = text;

      // Handle
      var handle = new Konva.Rect({
        x:      handleX,
        y:      handleTop,
        width:  handleWidth,
        height: handleHeight,
        fill:   handleColor
      });

      // Line
      var line = new Konva.Line({
        x:           handleX,
        y:           0,
        points:      [0, 0, 0, height],
        stroke:      handleColor,
        strokeWidth: 1
      });

      // Events

      handle.on('mouseover', function(event) {
        text.show();
        text.setX(xPosition - text.getWidth()); // Position text to the left of the mark
        point.view.pointLayer.draw();
      });

      handle.on('mouseout', function(event) {
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
   * Draws a waveform on a canvas context.
   *
   * @param  {Konva.Context} context  Canvas Context to draw on
   * @param  {Array}    min           Min values for waveform
   * @param  {Array}    max           Max values for waveform
   * @param  {Int}      offsetStart   Where to start drawing
   * @param  {Int}      offsetLength  How much to draw
   * @param  {Function} y             Calculate height (see fn interpolateHeight)
   */
  function drawWaveform(context, min, max, offsetStart, offsetLength, y) {
    context.beginPath();

    min.forEach(function(val, x) {
      context.lineTo(offsetStart + x + 0.5, y(val) + 0.5);
    });

    max.reverse().forEach(function(val, x) {
      context.lineTo(offsetStart + (offsetLength - x) + 0.5, y(val) + 0.5);
    });

    context.closePath();
  }

  /**
   * Returns a height interpolator function
   *
   * @param {Number} total_height
   * @returns {interpolateHeight}
   */
  function interpolateHeightGenerator(totalHeight) {
    var amplitude = 256;

    return function interpolateHeight(size) {
      return totalHeight - ((size + 128) * totalHeight) / amplitude;
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
    waveformDrawFunction: function(view, context) {
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
     * Returns a function that creates and returns a new IN handle object.
     *
     * @param  {Object}   options Root Peaks.js options containing config info for handle
     * @return {Function} Provides Konva handle group on execution
     */
    defaultInMarker: function(options) {
      return segmentHandleCreator(options.height, options.inMarkerColor, true);
    },

    /**
     * Returns a function that creates and returns a new OUT handle object.
     *
     * @param  {Object}   options Root Peaks.js options containing config info for handle
     * @return {Function} Provides Konva handle group on execution
     */
    defaultOutMarker: function(options) {
      return segmentHandleCreator(options.height, options.outMarkerColor, false);
    },

    /**
     * Returns a function that creates and returns a new point marker.
     *
     * @param  {Object}   options Root Peaks.js options containing config info for marker
     * @return {Function} Provides Konva marker group on execution
     */
    defaultPointMarker: function(options) {
      return pointHandleCreator(options.height, options.pointMarkerColor);
    },

    defaultSegmentLabelDraw: function(options) {
      return function(segment, parent) {
        return new Konva.Text({
          x:          12,
          y:          12,
          text:       parent.labelText,
          textAlign:  'center',
          fontSize:   12,
          fontFamily: 'Arial, sans-serif',
          fill:       '#000'
        });
      };
    }
  };
});
