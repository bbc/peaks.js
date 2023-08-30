/**
 * @file
 *
 * Defines the {@link WaveformAxis} class.
 *
 * @module waveform-axis
 */

import { formatTime, objectHasProperty, roundUpToNearest } from './utils';
import Konva from 'konva/lib/Core';

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
 * @param {Boolean} options.showAxisLabels
 * @param {Function} options.formatAxisTime
 * @param {String} options.fontFamily
 * @param {Number} options.fontSize
 * @param {String} options.fontStyle
 */

function WaveformAxis(view, options) {
  const self = this;

  self._axisGridlineColor      = options.axisGridlineColor;
  self._axisLabelColor         = options.axisLabelColor;
  self._showAxisLabels         = options.showAxisLabels;
  self._axisTopMarkerHeight    = options.axisTopMarkerHeight;
  self._axisBottomMarkerHeight = options.axisBottomMarkerHeight;

  if (options.formatAxisTime) {
    self._formatAxisTime = options.formatAxisTime;
  }
  else {
    self._formatAxisTime = function(time) {
      // precision = 0, drops the fractional seconds
      return formatTime(time, 0);
    };
  }

  self._axisLabelFont = WaveformAxis._buildFontString(
    options.fontFamily,
    options.fontSize,
    options.fontStyle
  );

  self._axisShape = new Konva.Shape({
    sceneFunc: function(context) {
      self._drawAxis(context, view);
    }
  });
}

WaveformAxis._buildFontString = function(fontFamily, fontSize, fontStyle) {
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
};

WaveformAxis.prototype.addToLayer = function(layer) {
  layer.add(this._axisShape);
};

WaveformAxis.prototype.showAxisLabels = function(show, options) {
  this._showAxisLabels = show;

  if (options) {
    if (objectHasProperty(options, 'topMarkerHeight')) {
      this._axisTopMarkerHeight = options.topMarkerHeight;
    }

    if (objectHasProperty(options, 'bottomMarkerHeight')) {
      this._axisBottomMarkerHeight = options.bottomMarkerHeight;
    }
  }
};

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

WaveformAxis.prototype._getAxisLabelScale = function(view) {
  let baseSecs = 1; // seconds
  const steps = [1, 2, 5, 10, 20, 30];
  const minSpacing = 60;
  let index = 0;

  let secs;

  for (;;) {
    secs = baseSecs * steps[index];
    const pixels = view.timeToPixels(secs);

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
};

/**
 * Draws the time axis and labels onto a view.
 *
 * @param {Konva.Context} context The context to draw on.
 * @param {WaveformOverview|WaveformZoomView} view
 */

WaveformAxis.prototype._drawAxis = function(context, view) {
  const currentFrameStartTime = view.getStartTime();

  // Time interval between axis markers (seconds)
  const axisLabelIntervalSecs = this._getAxisLabelScale(view);

  // Time of first axis marker (seconds)
  const firstAxisLabelSecs = roundUpToNearest(currentFrameStartTime, axisLabelIntervalSecs);

  // Distance between waveform start time and first axis marker (seconds)
  const axisLabelOffsetSecs = firstAxisLabelSecs - currentFrameStartTime;

  // Distance between waveform start time and first axis marker (pixels)
  const axisLabelOffsetPixels = view.timeToPixels(axisLabelOffsetSecs);

  context.setAttr('strokeStyle', this._axisGridlineColor);
  context.setAttr('lineWidth', 1);

  // Set text style
  context.setAttr('font', this._axisLabelFont);
  context.setAttr('fillStyle', this._axisLabelColor);
  context.setAttr('textAlign', 'left');
  context.setAttr('textBaseline', 'bottom');

  const width  = view.getWidth();
  const height = view.getHeight();

  let secs = firstAxisLabelSecs;

  for (;;) {
    // Position of axis marker (pixels)
    const x = axisLabelOffsetPixels + view.timeToPixels(secs - firstAxisLabelSecs);

    if (x >= width) {
      break;
    }

    if (this._axisTopMarkerHeight > 0) {
      context.beginPath();
      context.moveTo(x + 0.5, 0);
      context.lineTo(x + 0.5, 0 + this._axisTopMarkerHeight);
      context.stroke();
    }

    if (this._axisBottomMarkerHeight) {
      context.beginPath();
      context.moveTo(x + 0.5, height);
      context.lineTo(x + 0.5, height - this._axisBottomMarkerHeight);
      context.stroke();
    }

    if (this._showAxisLabels) {
      const label      = this._formatAxisTime(secs);
      const labelWidth = context.measureText(label).width;
      const labelX     = x - labelWidth / 2;
      const labelY     = height - 1 - this._axisBottomMarkerHeight;

      if (labelX >= 0) {
        context.fillText(label, labelX, labelY);
      }
    }

    secs += axisLabelIntervalSecs;
  }
};

export default WaveformAxis;
