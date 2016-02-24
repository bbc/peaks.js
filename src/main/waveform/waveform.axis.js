/**
 * WAVEFORM.AXIS.JS
 *
 * This module handles all functionality related to drawing the
 * visualisations. Only a sigle object of this type is
 * instantiated meaning this code is reused multiple times.
 *
 */
define(["peaks/waveform/waveform.mixins", "konva"], function (mixins, Konva) {
  'use strict';

  /*
   * Rounds the given value up to the nearest given multiple.
   * e.g: roundUpToNearest(5.5, 3) returns 6
   *      roundUpToNearest(141.0, 10) returns 150
   *      roundUpToNearest(-5.5, 3) returns -6
   */

  function roundUpToNearest(value, multiple) {
    var remainder = value % multiple;
    if (remainder === 0) {
      return value;
    }
    else {
      return value + multiple - remainder;
    }
  }

  function WaveformAxis(view) {
    this.view = view; // store reference to waveform view object

    this.axisShape = new Konva.Shape({
      fill: 'rgba(38, 255, 161, 1)',
      strokeWidth: 0,
      opacity: 1
    });

    this.axisShape.sceneFunc(this.axisDrawFunction.bind(this, view));

    this.view.uiLayer.add(this.axisShape);
  }

  /*
   * Returns number of seconds for each x-axis marker, appropriate for the
   * current zoom level, ensuring that markers are not too close together
   * and that markers are placed at intuitive time intervals (i.e., every 1,
   * 2, 5, 10, 20, 30 seconds, then every 1, 2, 5, 10, 20, 30 minutes, then
   * every 1, 2, 5, 10, 20, 30 hours).
   */

  WaveformAxis.prototype.getAxisLabelScale = function() {
    var baseSecs   = 1; // seconds
    var steps      = [1, 2, 5, 10, 20, 30];
    var minSpacing = 60;
    var index      = 0;

    var secs;

    for (;;) {
      secs = baseSecs * steps[index];
      var pixels = this.view.data.at_time(secs);
      if (pixels < minSpacing) {
        if (++index == steps.length) {
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
   *
   * @param {WaveformOverview|WaveformZoomview} view
   * @param {Konva.Context} context
   */
  WaveformAxis.prototype.axisDrawFunction = function (view, context) {
    // allow a view to override the time it reports to the axis
    var currentFrameStartTime = (typeof view.getDataTime === "function") ? view.getDataTime () : view.data.time(view.frameOffset);

    // Draw axis markers
    var markerHeight = 10;

    // Time interval between axis markers (seconds)
    var axisLabelIntervalSecs = this.getAxisLabelScale();

    // Time of first axis marker (seconds)
    var firstAxisLabelSecs = roundUpToNearest(currentFrameStartTime, axisLabelIntervalSecs);

    // Distance between waveform start time and first axis marker (seconds)
    var axisLabelOffsetSecs = firstAxisLabelSecs - currentFrameStartTime;

    // Distance between waveform start time and first axis marker (pixels)
    // // addlow a view to override the time it reports to the axis
    var axisLabelOffsetPixels = (typeof this.view.atDataTime === "function") ? this.view.atDataTime(axisLabelOffsetSecs) : this.view.data.at_time(axisLabelOffsetSecs);

    context.setAttr('strokeStyle', this.view.options.axisGridlineColor);
    context.setAttr('lineWidth', 1);

    // Set text style
    context.setAttr('font', "11px sans-serif");
    context.setAttr('fillStyle', this.view.options.axisLabelColor);
    context.setAttr('textAlign', "left");
    context.setAttr('textBaseline', "bottom");

    var secs = firstAxisLabelSecs;
    var x;

    // infinite loop protection
    var count = 0;

    for (;;) {
      // Position of axis marker (pixels)
      // allow a view to override the time it reports to the axis
      x = axisLabelOffsetPixels + (typeof this.view.atDataTime === "function" ? this.view.atDataTime (secs - firstAxisLabelSecs) : this.view.data.at_time(secs - firstAxisLabelSecs));
      if (x >= this.view.width) {
        break;
      }

      // break infinite loop
      count++;
      if (count > 30) {
        break;
      }

      // Draw the axis out old-skool canvas style

      context.beginPath();
      context.moveTo(x + 0.5, 0);
      context.lineTo(x + 0.5, 0 + markerHeight);
      context.moveTo(x + 0.5, this.view.height);
      context.lineTo(x + 0.5, this.view.height - markerHeight);
      context.stroke();

      var label      = mixins.niceTime(secs, true);
      var labelWidth = context._context.measureText(label).width; // todo handle this with Konva.Text
      var labelX     = x - labelWidth / 2;
      var labelY     = this.view.height - 1 - markerHeight;

      if (labelX >= 0) {
        context.fillText(label, labelX, labelY);
      }

      secs += axisLabelIntervalSecs;
    }
  };

  return WaveformAxis;
});
