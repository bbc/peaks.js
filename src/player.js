/**
 * @file
 *
 * A general audio player class which interfaces with external audio players.
 * The default audio player in Peaks.js is {@link MediaElementPlayer}.
 *
 * @module player
 */
define([
  './utils'
], function(Utils) {
  'use strict';

  function validateAdapter(adapter) {
    var publicAdapterMethods = [
      'init',
      'destroy',
      'play',
      'pause',
      'isPlaying',
      'isSeeking',
      'getCurrentTime',
      'getDuration',
      'seek',
      'playSegment'
    ];

    publicAdapterMethods.forEach(function(method) {
      if (!Object.hasOwnProperty.call(adapter,method)) {
        throw new TypeError('peaks.player: property ' + method + ' is undefined');
      }
      if ((typeof adapter[method]) !== 'function') {
        throw new TypeError('peaks.player: property ' + method + ' is not a function');
      }
    });
  }

  /**
   * A wrapper for interfacing with an external player API.
   *
   * @class
   * @alias Player
   *
   * @param {Peaks} peaks The parent {@link Peaks} object.
   * @param {Adapter} adapter The player adapter.
   */

  function Player(peaks, adapter) {
    var self = this;

    self._peaks = peaks;

    validateAdapter(adapter);
    self._adapter = adapter;

    self._adapter.init(self);

    /**
   * Cleans up the player object.
   */

    self.destroy = function() {
      self._adapter.destroy();
    };

    /**
   * Starts playback.
   */

    self.play = function() {
      self._adapter.play();
      self._triggeredPlay();
    };

    /**
   * Pauses playback.
   */

    self.pause = function() {
      self._adapter.pause();
      self._triggeredPause();
    };

    /**
   * @returns {Boolean} <code>true</code> if playing, <code>false</code>
   * otherwise.
   */

    self.isPlaying = function() {
      return self._adapter.isPlaying();
    };

    /**
   * @returns {boolean} <code>true</code> if seeking
   */
    self.isSeeking = function() {
      return self._adapter.isSeeking();
    };

    /**
   * Returns the current playback time position, in seconds.
   *
   * @returns {Number}
   */

    self.getCurrentTime = function() {
      return self._adapter.getCurrentTime();
    };

    /**
   * Returns the media duration, in seconds.
   *
   * @returns {Number}
   */

    self.getDuration = function() {
      return self._adapter.getDuration();
    };

    /**
   * Seeks to a given time position within the media.
   *
   * @param {Number} time The time position, in seconds.
   */

    self.seek = function(time) {
      if (!Utils.isValidTime(time)) {
        self._peaks.logger('peaks.player.seek(): parameter must be a valid time, in seconds');
        return;
      }

      self._adapter.seek(time);
      self._triggeredSeek(time);
      self._updatedTime();
    };

    /**
   * Plays the given segment.
   *
   * @param {Segment} segment The segment denoting the time region to play.
   */

    self.playSegment = function(segment) {
      if (!segment ||
        !Utils.isValidTime(segment.startTime) ||
        !Utils.isValidTime(segment.endTime)) {
        self._peaks.logger('peaks.player.playSegment(): parameter must be a segment object');
        return;
      }

      self._adapter.playSegment(segment);
    };

    self._updatedTime = function() {
      self._peaks.emit('player_time_update', self.getCurrentTime());
    };

    self._triggeredPlay = function() {
      self._peaks.emit('player_play', self.getCurrentTime());
    };

    self._triggeredPause = function() {
      self._peaks.emit('player_pause', self.getCurrentTime());
    };

    self._triggeredCanPlay = function() {
      self._peaks.emit('player_canplay', self);
    };

    self._triggeredError = function(error) {
      self._peaks.emit('player_error', error);
    };

    self._triggeredSeek = function(time) {
      self._peaks.emit('player_seek', time);
    };
  }

  return Player;
});
