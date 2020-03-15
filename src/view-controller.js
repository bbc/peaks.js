/**
 * @file
 *
 * Defines the {@link ViewController} class.
 *
 * @module view-controller
 */

define([
  './waveform-overview',
  './waveform-zoomview',
  './utils'
], function(
    WaveformOverview,
    WaveformZoomView,
    Utils) {
  'use strict';

  /**
   * Creates an object that allows users to create and manage waveform views.
   *
   * @class
   * @alias ViewController
   *
   * @param {Peaks} peaks
   */

  function ViewController(peaks) {
    this._peaks = peaks;
    this._overview = null;
    this._zoomview = null;
  }

  ViewController.prototype.createOverview = function(container) {
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
  };

  ViewController.prototype.createZoomview = function(container) {
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
  };

  ViewController.prototype.destroyOverview = function() {
    if (!this._overview) {
      return;
    }

    if (!this._zoomview) {
      return;
    }

    this._overview.destroy();
    this._overview = null;
  };

  ViewController.prototype.destroyZoomview = function() {
    if (!this._zoomview) {
      return;
    }

    if (!this._overview) {
      return;
    }

    this._zoomview.destroy();
    this._zoomview = null;

    this._overview.removeHighlightRect();
  };

  ViewController.prototype.destroy = function() {
    if (this._overview) {
      this._overview.destroy();
      this._overview = null;
    }

    if (this._zoomview) {
      this._zoomview.destroy();
      this._zoomview = null;
    }
  };

  ViewController.prototype.getView = function(name) {
    if (Utils.isNullOrUndefined(name)) {
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
  };

  return ViewController;
});
