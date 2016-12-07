/**
 * @file
 *
 * Defines the {@link Player} class.
 *
 * @module peaks/player/player
 */
define(['peaks/waveform/waveform.utils'], function(Utils) {
  'use strict';

  function timeFromPercentage(time, percentage) {
    return time * (percentage / 100);
  }

  /**
   * A wrapper for interfacing with the HTML5 media element API.
   *
   * @class
   * @alias Player
   *
   * @param {Peaks} peaks The parent Peaks object.
   */
  function Player(peaks) {
    this.peaks = peaks;
  }

  /**
   * Initializes the player for a given media element.
   *
   * @param {HTMLMediaElement} mediaElement
   */
  Player.prototype.init = function(mediaElement) {
    var self = this;

    self.listeners = [];
    self.mediaElement = mediaElement;
    self.duration = self.getDuration();

    if (self.mediaElement.readyState === 4) {
      self.peaks.emit('player_load', self);
    }

    self._addMediaListener('timeupdate', function() {
      self.peaks.emit('player_time_update', self.getTime());
    });

    self._addMediaListener('play', function() {
      self.peaks.emit('player_play', self.getTime());
    });

    self._addMediaListener('pause', function() {
      self.peaks.emit('player_pause', self.getTime());
    });

    self._addMediaListener('seeked', function() {
      self.peaks.emit('player_seek', self.getTime());
    });
  };

  /**
   * Adds an event listener to the media element.
   *
   * @param {String} type
   * @param {Function} callback
   * @private
   */
  Player.prototype._addMediaListener = function(type, callback) {
    this.listeners.push([type, callback]);
    this.mediaElement.addEventListener(type, callback);
  };

  Player.prototype.destroy = function() {
    for (var i = 0; i < this.listeners.length; i++) {
      this.mediaElement.removeEventListener(this.listeners[i][0], this.listeners[i][1]);
    }

    this.listeners = [];
  };

  Player.prototype.setSource = function(source) {
    this.mediaElement.setAttribute('src', source);
  };

  Player.prototype.getSource = function() {
    return this.mediaElement.src;
  };

  /**
   * Starts playback.
   */
  Player.prototype.play = function() {
    this.mediaElement.play();
  };

  /**
   * Pauses playback.
   */
  Player.prototype.pause = function() {
    this.mediaElement.pause();
  };

  /**
   * Returns the current playback time position, in seconds.
   *
   * @returns {Number}
   */
  Player.prototype.getTime = function() {
    return this.mediaElement.currentTime;
  };

  Player.prototype.getTimeFromPercentage = function(p) {
    return Utils.niceTime(this.duration * p / 100, false);
  };

  Player.prototype.getSecsFromPercentage = function(p) {
    return Math.floor(this.duration * p / 100);
  };

  /**
   * Returns the media duration, in seconds.
   *
   * @returns {Number}
   */
  Player.prototype.getDuration = function() {
    return this.mediaElement.duration;
  };

  /**
   * Returns the current playback position, as a percentage of the duration.
   *
   * @returns {Number}
   */
  Player.prototype.getPercentage = function() {
    return this._getPercentageFromSeconds(this.mediaElement.currentTime);
  };

  Player.prototype._getPercentageFromSeconds = function(s) {
    var percentage = (s / this.duration) * 100;

    return Math.round(percentage * 100) / 100; // 2DP
  };

  /**
   * Seeks to a given percentage position within the media.
   *
   * @param {Number} percentage
   */
  Player.prototype.seek = function(percentage) {
    this.mediaElement.currentTime = timeFromPercentage(this.duration, percentage);
  };

  /**
   * Seeks to a given time position within the media.
   *
   * @param {Number} seconds
   */
  Player.prototype.seekBySeconds = function(seconds) {
    this.mediaElement.currentTime = seconds;
  };

  return Player;
});
