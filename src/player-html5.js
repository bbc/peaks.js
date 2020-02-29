/**
 * @file
 *
 * Implementation of {@link Player} class based on the HTML5 media element.
 *
 * @module player-html5
 */
define([
  './player'
], function(Player) {
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

  function Html5Player(peaks, mediaElement) {
    var self = this;

    self._peaks = peaks;
    self._mediaElement = mediaElement;

    var adapter = {
        init: function() {
          self._listeners = [];
          self._duration = self.getDuration();
          self._isPlaying = false;

          self._addMediaListener('timeupdate', function() {
            self._updatedTime();
          });

          self._addMediaListener('play', function() {
            self._isPlaying = true;
            self._triggeredPlay();
          });

          self._addMediaListener('pause', function() {
            self._isPlaying = false;
            self._triggeredPause();
          });

          self._addMediaListener('seeked', function() {
            self._triggeredSeek(self.getCurrentTime());
          });

          self._addMediaListener('canplay', function() {
            self._triggeredCanPlay();
          });

          self._addMediaListener('error', function(event) {
            self._triggeredError(event.target.error);
          });

          self._interval = null;
        },
        /**
         * Cleans up the player object, removing all event listeners from the
         * associated media element.
         */
        destroy: function() {
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
        },
        play: function() {
            self._mediaElement.play();
        },
        pause: function() {
            self._mediaElement.pause();
        },
        isPlaying: function() {
            return self._isPlaying;
        },
        isSeeking: function() {
            return self._mediaElement.seeking;
        },
        getCurrentTime: function() {
            return self._mediaElement.currentTime;
        },
        getDuration: function() {
            return self._mediaElement.duration;
        },
        seek: function(time) {
            self._mediaElement.currentTime = time;
        },
        playSegment: function(segment) {
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
        }
    };

    Player.call(this, peaks, adapter);
  }

  // inherit Player
  Html5Player.prototype = Object.create(Player.prototype);

  // correct the constructor pointer
  Html5Player.prototype.constructor = Html5Player;

  /**
   * Adds an event listener to the media element.
   *
   * @private
   * @param {String} type The event type to listen for.
   * @param {Function} callback An event handler function.
   */

  Html5Player.prototype._addMediaListener = function(type, callback) {
    this._listeners.push({ type: type, callback: callback });
    this._mediaElement.addEventListener(type, callback);
  };

  Html5Player.prototype.setSource = function(source) {
    this._mediaElement.setAttribute('src', source);
  };

  Html5Player.prototype.getSource = function() {
    return this._mediaElement.src;
  };

  Html5Player.prototype.getCurrentSource = function() {
    return this._mediaElement.currentSrc;
  };

  return Html5Player;
});
