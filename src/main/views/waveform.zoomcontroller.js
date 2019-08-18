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

  ZoomController.prototype.setZoomLevels = function(zoomLevels) {
    this._zoomLevels = zoomLevels;
    this.setZoom(0, true);
  };

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

  ZoomController.prototype.setZoom = function(zoomLevelIndex, forceUpdate) {
    if (zoomLevelIndex >= this._zoomLevels.length) {
      zoomLevelIndex = this._zoomLevels.length - 1;
    }

    if (zoomLevelIndex < 0) {
      zoomLevelIndex = 0;
    }

    if (!forceUpdate && (zoomLevelIndex === this._zoomLevelIndex)) {
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
   * Returns the current zoom level index.
   *
   * @returns {Number}
   */

  ZoomController.prototype.getZoom = function() {
    return this._zoomLevelIndex;
  };

  /**
   * Returns the current zoom level, in samples per pixel.
   *
   * @returns {Number}
   */

  ZoomController.prototype.getZoomLevel = function() {
    return this._zoomLevels[this._zoomLevelIndex];
  };

  return ZoomController;
});
