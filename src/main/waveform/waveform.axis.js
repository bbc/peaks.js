define(["peaks/waveform/waveform.mixins"], function (mixins) {
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
    this.axisShape = null;
  }

  WaveformAxis.prototype.drawAxis = function (currentFrameStartTime) {
    var that = this;
    if (!this.axisShape) { // create
      this.axisShape = new Kinetic.Shape({
        drawFunc: function(canvas) {
          that.axisDrawFunction(canvas, currentFrameStartTime);
        },
        fill: 'rgba(38, 255, 161, 1)',
        strokeWidth: 0
      });
      this.view.uiLayer.add(this.axisShape);
      this.view.uiLayer.draw();
    }
    else { // update
      this.axisShape.setDrawFunc(function (canvas) {
        that.axisDrawFunction(canvas, currentFrameStartTime);
      });
      this.view.uiLayer.draw();
    }
  };

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


  WaveformAxis.prototype.axisDrawFunction = function (canvas, currentFrameStartTime) {
    // Draw axis markers
    var markerHeight = 10;

    // Time interval between axis markers (seconds)
    var axisLabelIntervalSecs = this.getAxisLabelScale();

    // Time of first axis marker (seconds)
    var firstAxisLabelSecs = roundUpToNearest(currentFrameStartTime, axisLabelIntervalSecs);

    // Distance between waveform start time and first axis marker (seconds)
    var axisLabelOffsetSecs = firstAxisLabelSecs - currentFrameStartTime;

    // Distance between waveform start time and first axis marker (pixels)
    var axisLabelOffsetPixels = this.view.data.at_time(axisLabelOffsetSecs);

    var ctx = canvas.getContext();

    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1;

    // Set text style
    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#aaa";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";

    var secs = firstAxisLabelSecs;
    var x;

    for (;;) {
      // Position of axis marker (pixels)
      x = axisLabelOffsetPixels + this.view.data.at_time(secs - firstAxisLabelSecs);
      if (x >= this.view.width) {
        break;
      }

      // Draw the axis out old-skool canvas style

      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, 0 + markerHeight);
      ctx.moveTo(x + 0.5, this.view.height);
      ctx.lineTo(x + 0.5, this.view.height - markerHeight);
      ctx.stroke();

      var label      = mixins.niceTime(secs, true);
      var labelWidth = ctx.measureText(label).width;
      var labelX     = x - labelWidth / 2;
      var labelY     = this.view.height - 1 - markerHeight;

      if (labelX >= 0) {
        ctx.fillText(label, labelX, labelY);
      }

      secs += axisLabelIntervalSecs;
    }
  };

  return WaveformAxis;
});
