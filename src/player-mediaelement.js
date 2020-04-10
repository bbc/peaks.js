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

  function MediaElementPlayer(mediaElement) {
    var self = this;

    self._listeners = [];
    self._mediaElement = mediaElement;

    /**
   * Adds an event listener to the media element.
   *
   * @private
   * @param {String} type The event type to listen for.
   * @param {Function} callback An event handler function.
   */

    self._addMediaListener = function(type, callback) {
      self._listeners.push({ type: type, callback: callback });
      self._mediaElement.addEventListener(type, callback);
    };

    self.init = function(player) {
      self._player = player;
      self._listeners = [];
      self._duration = self.getDuration();
      self._isPlaying = false;

      self._addMediaListener('timeupdate', function() {
        self._player._updatedTime();
      });

      self._addMediaListener('play', function() {
        self._isPlaying = true;
        self._player._triggeredPlay();
      });

      self._addMediaListener('pause', function() {
        self._isPlaying = false;
        self._player._triggeredPause();
      });

      self._addMediaListener('seeked', function() {
        self._player._triggeredSeek(self.getCurrentTime());
      });

      self._addMediaListener('canplay', function() {
        self._player._triggeredCanPlay();
      });

      self._addMediaListener('error', function(event) {
        self._player._triggeredError(event.target.error);
      });

      self._interval = null;
    };
    /**
         * Cleans up the player object, removing all event listeners from the
         * associated media element.
         */
    self.destroy = function() {
      for (var i = 0; i < self._listeners.length; i++) {
        var listener = self._listeners[i];

        self._mediaElement.removeEventListener(
          listener.type,
          listener.callback
        );
      }

      self._listeners.length = 0;

      if (self._interval !== null) {
        clearTimeout(self._interval);
        self._interval = null;
      }

      self._mediaElement = null;
    };
    self.play = function() {
      self._mediaElement.play();
    };
    self.pause = function() {
      self._mediaElement.pause();
    };
    self.isPlaying = function() {
      return self._isPlaying;
    };
    self.isSeeking = function() {
      return self._mediaElement.seeking;
    };
    self.getCurrentTime = function() {
      return self._mediaElement.currentTime;
    };
    self.getDuration = function() {
      return self._mediaElement.duration;
    };
    self.seek = function(time) {
      self._mediaElement.currentTime = time;
    };
    self.playSegment = function(segment) {
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
  }

  return MediaElementPlayer;
});
