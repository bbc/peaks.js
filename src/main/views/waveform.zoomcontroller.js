/**
 * @file
 *
 * Defines the {@link ZoomController} class.
 *
 * @module peaks/views/waveform.zoomcontroller.js
 */

define([], function() {
  'use strict';

  /**
   * Creates an object to control zoom levels in a {@link WaveformZoomView}.
   *
   * @class
   * @alias ZoomController
   *
   * @param {Peaks} peaks
   * @param {Array<Integer>} zoomLevels
   */

  function ZoomController(peaks, zoomLevels) {
    this._peaks = peaks;
    this._zoomLevels = zoomLevels;
    this._zoomLevelIndex = 0;
  }

  /**
   * Zoom in one level.
   */

  ZoomController.prototype.zoomIn = function() {
    this.setZoom(this._zoomLevelIndex - 1);
  };

  /**
   * Zoom out one level.
   */

  ZoomController.prototype.zoomOut = function() {
    this.setZoom(this._zoomLevelIndex + 1);
  };

  /**
   * Given a particular zoom level, triggers a resampling of the data in the
   * zoomed view.
   *
   * @param {number} zoomLevelIndex An index into the options.zoomLevels array.
   */

  ZoomController.prototype.setZoom = function(zoomLevelIndex) {
    if (zoomLevelIndex >= this._zoomLevels.length) {
      zoomLevelIndex = this._zoomLevels.length - 1;
    }

    if (zoomLevelIndex < 0) {
      zoomLevelIndex = 0;
    }

    if (zoomLevelIndex === this._zoomLevelIndex) {
      // Nothing to do.
      return;
    }

    var previousZoomLevelIndex = this._zoomLevelIndex;

    this._zoomLevelIndex = zoomLevelIndex;

    this._peaks.emit(
      'zoom.update',
      this._zoomLevels[zoomLevelIndex],
      this._zoomLevels[previousZoomLevelIndex]
    );
  };

  /**
   * Returns the current zoom level.
   *
   * @returns {Number}
   */

  ZoomController.prototype.getZoom = function() {
    return this._zoomLevelIndex;
  };

  /**
   * Sets the zoom level to an overview level.
   */

  ZoomController.prototype.overview = function zoomToOverview() {
    this._peaks.emit(
      'zoom.update',
      this.peaks.waveform.waveformOverview.data.adapter.scale,
      this._zoomLevels[this._zoomLevelIndex]
    );
  };

  /**
   * Sets the zoom level to an overview level.
   */

  ZoomController.prototype.reset = function resetOverview() {
    this._peaks.emit(
      'zoom.update',
      this._zoomLevels[this._zoomLevelIndex],
      this._peaks.waveform.waveformOverview.data.adapter.scale
    );
  };

  return ZoomController;
});
