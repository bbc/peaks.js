/**
 * @file
 *
 * Defines the {@link Player} class.
 *
 * @module peaks/player/player
 */

define(['peaks/waveform/waveform.utils'], function(Utils) {
  'use strict';

  /**
   * A wrapper for interfacing with the HTML5 media element API.
   * Initializes the player for a given media element.
   *
   * @class
   * @alias Player
   *
   * @param {Peaks} peaks The parent {@link Peaks} object.
   * @param {HTMLMediaElement} mediaElement The HTML <code>&lt;audio&gt;</code>
   *   or <code>&lt;video&gt;</code> element to associate with the
   *   {@link Peaks} instance.
   */

  function Player(peaks, mediaElement) {
    var self = this;

    self._peaks = peaks;
    self._listeners = [];
    self._mediaElement = mediaElement;
    self._duration = self.getDuration();
    self._isPlaying = false;

    if (self._mediaElement.readyState === 4) {
      self._peaks.emit('player_load', self);
    }

    self._addMediaListener('timeupdate', function() {
      self._peaks.emit('player_time_update', self.getCurrentTime());
    });

    self._addMediaListener('play', function() {
      self._setPlaying(true);
      self._peaks.emit('player_play', self.getCurrentTime());
    });

    self._addMediaListener('pause', function() {
      self._setPlaying(false);
      self._peaks.emit('player_pause', self.getCurrentTime());
    });

    self._addMediaListener('seeked', function() {
      self._peaks.emit('player_seek', self.getCurrentTime());
    });

    self._interval = null;
    self._animationFrame = null;

    self._fireFakeTimeUpdate = self._fireFakeTimeUpdate.bind(self);
  }

  /**
   * Adds an event listener to the media element.
   *
   * @private
   * @param {String} type The event type to listen for.
   * @param {Function} callback An event handler function.
   */

  Player.prototype._addMediaListener = function(type, callback) {
    this._listeners.push({ type: type, callback: callback });
    this._mediaElement.addEventListener(type, callback);
  };

  /**
    * Records whether the playing is currently playing.
    # If it is, start firing requestAnimationFrame events to trigger time_update
    *
    * @private
    * @param {boolean} flag Whether the player is playing
    */

  Player.prototype._setPlaying = function(flag) {
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }
    if (flag) {
      this._animationFrame = requestAnimationFrame(this._fireFakeTimeUpdate);
    }
    this._isPlaying = flag;
  };

  /**
   * Fire a fake player_time_update event, at a much higher
   * rate than the native timeupdate events.
   *
   * @private
   */
  Player.prototype._fireFakeTimeUpdate = function() {
    this._peaks.emit('player_time_update', this.getCurrentTime());
    this._animationFrame = requestAnimationFrame(this._fireFakeTimeUpdate);
  };

  /**
   * Cleans up the player object, removing all event listeners from the
   * associated media element.
   */

  Player.prototype.destroy = function() {
    for (var i = 0; i < this._listeners.length; i++) {
      var listener = this._listeners[i];

      this._mediaElement.removeEventListener(
        listener.type,
        listener.callback
      );
    }

    this.listeners = [];

    if (self._interval !== null) {
      clearTimeout(self._interval);
      self._interval = null;
    }
  };

  Player.prototype.setSource = function(source) {
    this._mediaElement.setAttribute('src', source);
  };

  Player.prototype.getSource = function() {
    return this._mediaElement.src;
  };

  /**
   * Starts playback.
   */

  Player.prototype.play = function() {
    this._mediaElement.play();
  };

  /**
   * Pauses playback.
   */

  Player.prototype.pause = function() {
    this._mediaElement.pause();
  };

  /**
   * Returns the current playback time position, in seconds.
   *
   * @returns {Number}
   */

  Player.prototype.getCurrentTime = function() {
    return this._mediaElement.currentTime;
  };

  /**
   * Returns the media duration, in seconds.
   *
   * @returns {Number}
   */

  Player.prototype.getDuration = function() {
    return this._mediaElement.duration;
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

    this._mediaElement.currentTime = time;
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
    self._mediaElement.play();

    // We need to use setInterval here as the timeupdate event doesn't fire
    // often enough.
    self._interval = setInterval(function() {
      if (self.getCurrentTime() >= segment.endTime || self._mediaElement.paused) {
        clearTimeout(self._interval);
        self._interval = null;
        self._mediaElement.pause();
      }
    }, 30);
  };

  return Player;
});
