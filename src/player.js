/**
 * @file
 *
 * Defines the {@link Player} class.
 *
 * @module player
 */

define([
  './utils'
], function(Utils) {
  'use strict';

    /**
     * A wrapper for interfacing with Audio Players.
     *
     * @class
     * @alias Player
     *
     * @param {Peaks} peaks The parent {@link Peaks} object.
     * @param {Adapter} adapter The player adapter.
     *   {@link Peaks} instance.
     */
  function Player(peaks, adapter) {
    var self = this;

    self._peaks = peaks;
    self._adapter = adapter;

    adapter.init(self);
  }

  /**
   * Cleans up the player object.
   */

  Player.prototype.destroy = function() {
    this._adapter.destroy();
  };

  /**
   * Starts playback.
   */

  Player.prototype.play = function() {
    this._adapter.play();
  };

  /**
   * Pauses playback.
   */

  Player.prototype.pause = function() {
    this._adapter.pause();
  };

  /**
   * @returns {Boolean} <code>true</code> if playing, <code>false</code>
   * otherwise.
   */

  Player.prototype.isPlaying = function() {
    return this._adapter.isPlaying();
  };

  /**
   * @returns {boolean} <code>true</code> if seeking
   */
  Player.prototype.isSeeking = function() {
    return this._adapter.isSeeking();
  };

  /**
   * Returns the current playback time position, in seconds.
   *
   * @returns {Number}
   */

  Player.prototype.getCurrentTime = function() {
    return this._adapter.getCurrentTime();
  };

  /**
   * Returns the media duration, in seconds.
   *
   * @returns {Number}
   */

  Player.prototype.getDuration = function() {
    return this._adapter.getDuration();
  };

  /**
   * Seeks to a given time position within the media.
   *
   * @param {Number} time The time position, in seconds.
   */

  Player.prototype.seek = function(time) {
    if (!Utils.isValidTime(time)) {
      this._peaks.logger('peaks.player.seek(): parameter must be a valid time, in seconds');
      return;
    }

    this._adapter.seek(time);
  };

  /**
   * Plays the given segment.
   *
   * @param {Segment} segment The segment denoting the time region to play.
   */

  Player.prototype.playSegment = function(segment) {
    var self = this;

    if (!segment ||
        !Utils.isValidTime(segment.startTime) ||
        !Utils.isValidTime(segment.endTime)) {
      self._peaks.logger('peaks.player.playSegment(): parameter must be a segment object');
      return;
    }

    self._adapter.playSegment(segment);
  };

    Player.prototype._updatedTime = function() {
        this._peaks.emit('player_time_update', this.getCurrentTime());
    };

    Player.prototype._triggeredPlay = function() {
        this._peaks.emit('player_play', this.getCurrentTime());
    };

    Player.prototype._triggeredPause = function() {
        this._peaks.emit('player_pause', this.getCurrentTime());
    };

    Player.prototype._triggeredCanPlay = function() {
        this._peaks.emit('player_canplay', this);
    };

    Player.prototype._triggeredError = function(error) {
        this._peaks.emit('player_error', error);
    };

    Player.prototype._triggeredSeek = function(time) {
        this._peaks.emit('player_seek', time);
    };

  return Player;
});
