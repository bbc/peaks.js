/**
 * @file
 *
 * Implementation of {@link Player} adapter based on the HTML5 media element.
 *
 * @module player-medialement
 */

define([
], function() {
  'use strict';

  /**
   * A wrapper for interfacing with the HTML5 media element API.
   * Initializes the player for a given media element.
   *
   * @class
   * @alias MediaElementPlayer
   * @param {HTMLMediaElement} mediaElement The HTML <code>&lt;audio&gt;</code>
   *   or <code>&lt;video&gt;</code> element to associate with the
   *   {@link Peaks} instance.
   */

  function MediaElementPlayer(peaks, mediaElement) {
    var self = this;

    self._peaks = peaks;
    self._listeners = [];
    self._mediaElement = mediaElement;

    /**
     * Adds an event listener to the media element.
     *
     * @private
     * @param {String} type The event type to listen for.
     * @param {Function} callback An event handler function.
     */

    MediaElementPlayer.prototype._addMediaListener = function(type, callback) {
      this._listeners.push({ type: type, callback: callback });
      this._mediaElement.addEventListener(type, callback);
    };

    MediaElementPlayer.prototype.init = function(player) {
      self._player = player;
      self._listeners = [];
      self._duration = self.getDuration();
      self._isPlaying = false;

      self._addMediaListener('timeupdate', function() {
        self._peaks.emit('player.timeupdate', self.getCurrentTime());
      });

      self._addMediaListener('play', function() {
        self._isPlaying = true;
        self._peaks.emit('player.play', self.getCurrentTime());
      });

      self._addMediaListener('pause', function() {
        self._isPlaying = false;
        self._peaks.emit('player.pause', self.getCurrentTime());
      });

      self._addMediaListener('seeked', function() {
        self._peaks.emit('player.seeked', self.getCurrentTime());
      });

      self._addMediaListener('canplay', function() {
        self._peaks.emit('player.canplay');
      });

      self._addMediaListener('error', function(event) {
        self._peaks.emit('player.error', event.target.error);
      });

      self._interval = null;
    };

    /**
     * Cleans up the player object, removing all event listeners from the
     * associated media element.
     */

    MediaElementPlayer.prototype.destroy = function() {
      for (var i = 0; i < this._listeners.length; i++) {
        var listener = this._listeners[i];

        this._mediaElement.removeEventListener(
          listener.type,
          listener.callback
        );
      }

      this._listeners.length = 0;

      this._mediaElement = null;
    };

    MediaElementPlayer.prototype.play = function() {
      return this._mediaElement.play();
    };

    MediaElementPlayer.prototype.pause = function() {
      this._mediaElement.pause();
    };

    MediaElementPlayer.prototype.isPlaying = function() {
      return this._isPlaying;
    };

    MediaElementPlayer.prototype.isSeeking = function() {
      return this._mediaElement.seeking;
    };

    MediaElementPlayer.prototype.getCurrentTime = function() {
      return this._mediaElement.currentTime;
    };

    MediaElementPlayer.prototype.getDuration = function() {
      return this._mediaElement.duration;
    };

    MediaElementPlayer.prototype.seek = function(time) {
      this._mediaElement.currentTime = time;
    };
  }

  return MediaElementPlayer;
});
