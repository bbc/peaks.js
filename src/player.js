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
      'seek'
    ];

    function getAllPropertiesFrom(adapter) {
      var allProperties = [];
      var obj = adapter;

      while (obj) {
        Object.getOwnPropertyNames(obj).forEach(function(p) {
          allProperties.push(p);
        });

        obj = Object.getPrototypeOf(obj);
      }

      return allProperties;
    }

    var allProperties = getAllPropertiesFrom(adapter);

    publicAdapterMethods.forEach(function(method) {
      if (!allProperties.includes(method)) {
        throw new TypeError('Peaks.init(): Player method ' + method + ' is undefined');
      }

      if ((typeof adapter[method]) !== 'function') {
        throw new TypeError('Peaks.init(): Player method ' + method + ' is not a function');
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
    self._interval = null;

    validateAdapter(adapter);
    self._adapter = adapter;

    self._adapter.init(peaks);

    /**
     * Cleans up the player object.
     */

    Player.prototype.destroy = function() {
      if (this._interval !== null) {
        clearTimeout(this._interval);
        this._interval = null;
      }

      this._adapter.destroy();
    };

    /**
     * Starts playback.
     * @returns {Promise}
     */

    Player.prototype.play = function() {
      return this._adapter.play();
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

      clearTimeout(self._interval);
      self._interval = null;

      // Set audio time to segment start time
      self.seek(segment.startTime);

      // Start playing audio
      self.play();

      // We need to use setInterval here as the timeupdate event doesn't fire
      // often enough.
      self._interval = setInterval(function() {
        if (self.getCurrentTime() >= segment.endTime || !self.isPlaying()) {
          clearTimeout(self._interval);
          self._interval = null;
          self.pause();
        }
      }, 30);
    };
  }

  return Player;
});
