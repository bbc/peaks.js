/**
 * @file
 *
 * Defines the {@link ZoomController} class.
 *
 * @module zoom-controller
 */

/**
 * Creates an object to control zoom levels in a {@link WaveformZoomView}.
 *
 * @class
 * @alias ZoomController
 *
 * @param {Peaks} peaks
 * @param {Array<Integer>} zoomLevels
 */

export default class ZoomController {
  constructor(peaks, zoomLevels) {
    this._peaks = peaks;
    this._zoomLevels = zoomLevels;
    this._zoomLevelIndex = 0;
  }

  setZoomLevels(zoomLevels) {
    this._zoomLevels = zoomLevels;
    this.setZoom(0, true);
  }

  /**
   * Zoom in one level.
   */

  zoomIn() {
    this.setZoom(this._zoomLevelIndex - 1);
  }

  /**
   * Zoom out one level.
   */

  zoomOut() {
    this.setZoom(this._zoomLevelIndex + 1);
  }

  /**
   * Given a particular zoom level, triggers a resampling of the data in the
   * zoomed view.
   *
   * @param {number} zoomLevelIndex An index into the options.zoomLevels array.
   */
  setZoom(zoomLevelIndex, forceUpdate) {
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

    this._zoomLevelIndex = zoomLevelIndex;

    var zoomview = this._peaks.views.getView('zoomview');

    if (!zoomview) {
      return;
    }

    zoomview.setZoom({ scale: this._zoomLevels[zoomLevelIndex] });
  }

  /**
   * Returns the current zoom level index.
   *
   * @returns {Number}
   */

  getZoom() {
    return this._zoomLevelIndex;
  }

  /**
   * Returns the current zoom level, in samples per pixel.
   *
   * @returns {Number}
   */

  getZoomLevel() {
    return this._zoomLevels[this._zoomLevelIndex];
  }
}
