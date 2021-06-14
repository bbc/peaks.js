/**
 * @file
 *
 * Defines the {@link ViewController} class.
 *
 * @module view-controller
 */

import WaveformOverview from './waveform-overview.js';
import WaveformZoomView from './waveform-zoomview.js';
import { isNullOrUndefined } from './utils.js';

/**
 * Creates an object that allows users to create and manage waveform views.
 *
 * @class
 * @alias ViewController
 *
 * @param {Peaks} peaks
 */

export default class ViewController {
  constructor(peaks) {
    this._peaks = peaks;
    this._overview = null;
    this._zoomview = null;
  }

  createOverview(container) {
    if (this._overview) {
      return this._overview;
    }

    var waveformData = this._peaks.getWaveformData();

    this._overview = new WaveformOverview(
      waveformData,
      container,
      this._peaks
    );

    if (this._zoomview) {
      this._overview.showHighlight(
        this._zoomview.getStartTime(),
        this._zoomview.getEndTime()
      );
    }

    return this._overview;
  }

  createZoomview(container) {
    if (this._zoomview) {
      return this._zoomview;
    }

    var waveformData = this._peaks.getWaveformData();

    this._zoomview = new WaveformZoomView(
      waveformData,
      container,
      this._peaks
    );

    return this._zoomview;
  }

  destroyOverview() {
    if (!this._overview) {
      return;
    }

    if (!this._zoomview) {
      return;
    }

    this._overview.destroy();
    this._overview = null;
  }

  destroyZoomview() {
    if (!this._zoomview) {
      return;
    }

    if (!this._overview) {
      return;
    }

    this._zoomview.destroy();
    this._zoomview = null;

    this._overview.removeHighlightRect();
  }

  destroy() {
    if (this._overview) {
      this._overview.destroy();
      this._overview = null;
    }

    if (this._zoomview) {
      this._zoomview.destroy();
      this._zoomview = null;
    }
  }

  getView(name) {
    if (isNullOrUndefined(name)) {
      if (this._overview && this._zoomview) {
        return null;
      }
      else if (this._overview) {
        return this._overview;
      }
      else if (this._zoomview) {
        return this._zoomview;
      }
      else {
        return null;
      }
    }
    else {
      switch (name) {
        case 'overview':
          return this._overview;

        case 'zoomview':
          return this._zoomview;

        default:
          return null;
      }
    }
  }
}
