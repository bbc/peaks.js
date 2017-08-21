/**
 * @file
 *
 * Common functions used in multiple modules are collected here for DRY purposes.
 *
 * @module peaks/waveform/waveform.mixins
 */

define(['konva'], function(Konva) {
  'use strict';

  /**
   * Parameters for the {@link createSegmentMarker} function.
   *
   * @typedef {Object} CreateSegmentMarkerOptions
   * @global
   * @property {Boolean} draggable If true, marker is draggable.
   * @property {Number} height Height of handle group container (canvas).
   * @property {String} color Colour hex value for handle and line marker.
   * @property {Boolean} inMarker Is this marker the inMarker (LHS) or outMarker (RHS).
   * @property {Konva.Group} segmentGroup
   * @property {Object} segment
   * @property {Konva.Layer} layer
   * @property {Function} onDrag Callback after drag completed.
   */

  /**
   * Creates a Left or Right side segment handle group in Konva based on the
   * given options.
   *
   * @param {CreateSegmentMarkerOptions} options
   * @returns {Konva.Group} Konva group object of handle marker element.
   */

  function createSegmentMarker(options) {
    var handleHeight = 20;
    var handleWidth  = handleHeight / 2;
    var handleY      = (options.height / 2) - 10.5;
    var handleX      = -(handleWidth / 2) + 0.5;

    var group = new Konva.Group({
      draggable: options.draggable,
      dragBoundFunc: function(pos) {
        var limit;

        if (options.inMarker) {
          limit = options.segmentGroup.outMarker.getX() - options.segmentGroup.outMarker.getWidth();

          if (pos.x > limit) {
            pos.x = limit;
          }
        }
        else {
          limit = options.segmentGroup.inMarker.getX() + options.segmentGroup.inMarker.getWidth();

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

    if (options.draggable && options.onDrag) {
      group.on('dragmove', function(event) {
        options.onDrag(options.segmentGroup, options.segment);
      });
    }

    var xPosition = options.inMarker ? -24 : 24;

    var text = new Konva.Text({
      x:          xPosition,
      y:          (options.height / 2) - 5,
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
      fill:        options.color,
      stroke:      options.color,
      strokeWidth: 1
    });

    // Vertical Line

    var line = new Konva.Line({
      x:           0,
      y:           0,
      points:      [0.5, 0, 0.5, options.height],
      stroke:      options.color,
      strokeWidth: 1
    });

    // Events

    handle.on('mouseover', function(event) {
      if (options.inMarker) {
        text.setX(xPosition - text.getWidth());
      }
      text.show();
      options.layer.draw();
    });

    handle.on('mouseout', function(event) {
      text.hide();
      options.layer.draw();
    });

    group.add(text);
    group.add(line);
    group.add(handle);

    return group;
  }

  /**
   * Creates a Konva.Text object that renders a segment's label text.
   *
   * @param {Konva.Group} segmentGroup
   * @param {Segment} segment
   * @returns {Konva.Text}
   */

  function createSegmentLabel(segmentGroup, segment) {
    return new Konva.Text({
      x:          12,
      y:          12,
      text:       segment.labelText,
      textAlign:  'center',
      fontSize:   12,
      fontFamily: 'Arial, sans-serif',
      fill:       '#000'
    });
  }

  /**
   * Parameters for the {@link createPointMarker} function.
   *
   * @typedef {Object} CreatePointMarkerOptions
   * @global
   * @property {Boolean} draggable If true, marker is draggable.
   * @property {Boolean} showLabel If true, show the label text next to the marker.
   * @property {String} handleColor Color hex value for handle and line marker.
   * @property {Number} height Height of handle group container (canvas).
   * @property {Konva.Group} pointGroup  Point marker UI object.
   * @property {Object} point Point object with timestamp.
   * @property {Konva.Layer} layer Layer that contains the pointGroup.
   * @property {Function} onDrag Callback after drag completed.
   * @property {Function} onDblClick
   * @property {Function} onDragEnd
   */

  /**
   * Creates a point handle group in Konva based on the given options.
   *
   * @param {CreatePointMarkerOptions} options
   * @returns {Konva.Group} Konva group object of handle marker elements
   */

  function createPointMarker(options) {
    var handleTop = (options.height / 2) - 10.5;
    var handleWidth = 10;
    var handleHeight = 20;
    var handleX = -(handleWidth / 2) + 0.5; // Place in the middle of the marker

    var group = new Konva.Group({
      draggable: options.draggable,
      dragBoundFunc: function(pos) {
        return {
          x: pos.x, // No constraint horizontally
          y: this.getAbsolutePosition().y // Constrained vertical line
        };
      }
    });

    if (options.draggable && options.onDrag) {
      group.on('dragmove', function(event) {
        options.onDrag(options.pointGroup, options.point);
      });
    }

    if (options.onDblClick) {
      group.on('dblclick', function(event) {
        options.onDblClick(options.point);
      });
    }

    if (options.draggable && options.onDragEnd) {
      group.on('dragend', function(event) {
        options.onDragEnd(options.point);
      });
    }

    // Label
    var text = null;

    if (options.showLabel) {
      text = new Konva.Text({
        x:          2,
        y:          12,
        text:       options.point.labelText,
        textAlign:  'left',
        fontSize:   10,
        fontFamily: 'sans-serif',
        fill:       '#000'
      });

      group.label = text;
    }

    // Handle
    var handle = null;

    if (options.draggable) {
      handle = new Konva.Rect({
        x:      handleX,
        y:      handleTop,
        width:  handleWidth,
        height: handleHeight,
        fill:   options.handleColor
      });
    }

    // Line
    var line = new Konva.Line({
      x:           0,
      y:           0,
      points:      [0, 0, 0, options.height],
      stroke:      options.handleColor,
      strokeWidth: 1
    });

    // Events
    var time = null;

    if (handle) {
      // Time
      time = new Konva.Text({
        x:          -24,
        y:          (options.height / 2) - 5,
        text:       '',
        fontSize:   10,
        fontFamily: 'sans-serif',
        fill:       '#000',
        textAlign:  'center'
      });

      time.hide();
      group.time = time;

      handle.on('mouseover', function(event) {
        // Position text to the left of the marker
        time.setX(-24 - time.getWidth());
        time.show();
        options.layer.draw();
      });

      handle.on('mouseout', function(event) {
        time.hide();
        options.layer.draw();
      });
    }

    if (handle) {
      group.add(handle);
    }

    group.add(line);

    if (text) {
      group.add(text);
    }

    if (time) {
      group.add(time);
    }

    return group;
  }

  /**
   * Scales the waveform data for drawing on a canvas context.
   *
   * @param {Number} amplitude The waveform data point amplitude.
   * @param {Number} height The height of the waveform, in pixels.
   * @returns {Number} The scaled waveform data point.
   */

  function scaleY(amplitude, height) {
    var range = 256;
    var offset = 128;

    return height - ((amplitude + offset) * height) / range;
  }

  /**
   * Draws a waveform on a canvas context.
   *
   * @param {Konva.Context} context  The canvas context to draw on.
   * @param {WaveformData} waveformData  The waveform data to draw.
   * @param {Int} frameOffset
   * @param {Int} startPixels
   * @param {Int} endPixels
   * @param {Int} width The width of the waveform area, in pixels.
   * @param {Int} height The height of the waveform area, in pixels.
   */

  function drawWaveform(context, waveformData, frameOffset, startPixels, endPixels, width, height) {
    if (startPixels < frameOffset) {
      startPixels = frameOffset;
    }

    var limit = frameOffset + width;

    if (endPixels > limit) {
      endPixels = limit;
    }

    var adapter = waveformData.adapter;
    var x, val;

    context.beginPath();

    for (x = startPixels; x < endPixels; x++) {
      val = adapter.at(2 * x);

      context.lineTo(x - frameOffset + 0.5, scaleY(val, height) + 0.5);
    }

    for (x = endPixels - 1; x >= startPixels; x--) {
      val = adapter.at(2 * x + 1);

      context.lineTo(x - frameOffset + 0.5, scaleY(val, height) + 0.5);
    }

    context.closePath();
  }

  // Public API

  return {
    drawWaveform: drawWaveform,
    createSegmentMarker: createSegmentMarker,
    createPointMarker: createPointMarker,
    createSegmentLabel: createSegmentLabel
  };
});
