/**
 * @file
 *
 * Defines the {@link TimeController} class.
 *
 * @module peaks/views/waveform.timecontroller.js
 */

define([], function() {
  'use strict';

  /**
   * Creates an object to get/set the playback position. This interface is
   * deprecated, use the {@link Player} interface instead.
   *
   * @class
   * @alias TimeController
   *
   * @param {Peaks} peaks
   */

  function TimeController(peaks) {
    this._peaks = peaks;
  }

  TimeController.prototype.setCurrentTime = function(time) {
    // eslint-disable-next-line max-len
    this._peaks.options.deprecationLogger('peaks.time.setCurrentTime(): this function is deprecated. Call peaks.player.seek() instead');
    return this._peaks.player.seek(time);
  };

  TimeController.prototype.getCurrentTime = function() {
    // eslint-disable-next-line max-len
    this._peaks.options.deprecationLogger('peaks.time.getCurrentTime(): this function is deprecated. Call peaks.player.getCurrentTime() instead');
    return this._peaks.player.getCurrentTime();
  };

  return TimeController;
});
