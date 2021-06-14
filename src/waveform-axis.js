/**
 * @file
 *
 * Defines the {@link WaveformAxis} class.
 *
 * @module waveform-axis
 */

import { Shape } from 'konva/lib/Shape';
import { formatTime, roundUpToNearest } from './utils.js';

function buildFontString(fontFamily, fontSize, fontStyle) {
  if (!fontSize) {
    fontSize = 11;
  }

  if (!fontFamily) {
    fontFamily = 'sans-serif';
  }

  if (!fontStyle) {
    fontStyle = 'normal';
  }

  return fontStyle + ' ' + fontSize + 'px ' + fontFamily;
}

/**
 * Creates the waveform axis shapes and adds them to the given view layer.
 *
 * @class
 * @alias WaveformAxis
 *
 * @param {WaveformOverview|WaveformZoomView} view
 * @param {Object} options
 * @param {String} options.axisGridlineColor
 * @param {String} options.axisLabelColor
 * @param {String} options.axisLabelFontFamily
 * @param {Number} options.axisLabelFontSize
 * @param {String} options.axisLabelFontStyle
 */

export default class WaveformAxis {
  constructor(view, options) {
    this._axisGridlineColor = options.axisGridlineColor;
    this._axisLabelColor    = options.axisLabelColor;

    this._axisLabelFont = buildFontString(
      options.axisLabelFontFamily,
      options.axisLabelFontSize,
      options.axisLabelFontStyle
    );

    this._axisShape = new Shape({
      sceneFunc: (context) => this.drawAxis(context, view)
    });
  }

  addToLayer(layer) {
    layer.add(this._axisShape);
  }

  /**
   * Returns number of seconds for each x-axis marker, appropriate for the
   * current zoom level, ensuring that markers are not too close together
   * and that markers are placed at intuitive time intervals (i.e., every 1,
   * 2, 5, 10, 20, 30 seconds, then every 1, 2, 5, 10, 20, 30 minutes, then
   * every 1, 2, 5, 10, 20, 30 hours).
   *
   * @param {WaveformOverview|WaveformZoomView} view
   * @returns {Number}
   */

  getAxisLabelScale(view) {
    var baseSecs   = 1; // seconds
    var steps      = [1, 2, 5, 10, 20, 30];
    var minSpacing = 60;
    var index      = 0;

    var secs;

    for (;;) {
      secs = baseSecs * steps[index];
      var pixels = view.timeToPixels(secs);

      if (pixels < minSpacing) {
        if (++index === steps.length) {
          baseSecs *= 60; // seconds -> minutes -> hours
          index = 0;
        }
      }
      else {
        break;
      }
    }

    return secs;
  }

  /**
   * Draws the time axis and labels onto a view.
   *
   * @param {Konva.Context} context The context to draw on.
   * @param {WaveformOverview|WaveformZoomView} view
   */

  drawAxis(context, view) {
    var currentFrameStartTime = view.pixelsToTime(view.getFrameOffset());

    // Draw axis markers
    var markerHeight = 10;

    // Time interval between axis markers (seconds)
    var axisLabelIntervalSecs = this.getAxisLabelScale(view);

    // Time of first axis marker (seconds)
    var firstAxisLabelSecs = roundUpToNearest(currentFrameStartTime, axisLabelIntervalSecs);

    // Distance between waveform start time and first axis marker (seconds)
    var axisLabelOffsetSecs = firstAxisLabelSecs - currentFrameStartTime;

    // Distance between waveform start time and first axis marker (pixels)
    var axisLabelOffsetPixels = view.timeToPixels(axisLabelOffsetSecs);

    context.setAttr('strokeStyle', this._axisGridlineColor);
    context.setAttr('lineWidth', 1);

    // Set text style
    context.setAttr('font', this._axisLabelFont);
    context.setAttr('fillStyle', this._axisLabelColor);
    context.setAttr('textAlign', 'left');
    context.setAttr('textBaseline', 'bottom');

    var secs = firstAxisLabelSecs;
    var x;

    var width  = view.getWidth();
    var height = view.getHeight();

    for (;;) {
      // Position of axis marker (pixels)
      x = axisLabelOffsetPixels + view.timeToPixels(secs - firstAxisLabelSecs);
      if (x >= width) {
        break;
      }

      context.beginPath();
      context.moveTo(x + 0.5, 0);
      context.lineTo(x + 0.5, 0 + markerHeight);
      context.moveTo(x + 0.5, height);
      context.lineTo(x + 0.5, height - markerHeight);
      context.stroke();

      // precision = 0, drops the fractional seconds
      var label      = formatTime(secs, 0);
      var labelWidth = context.measureText(label).width;
      var labelX     = x - labelWidth / 2;
      var labelY     = height - 1 - markerHeight;

      if (labelX >= 0) {
        context.fillText(label, labelX, labelY);
      }

      secs += axisLabelIntervalSecs;
    }
  }
}
