/**
 * @file
 *
 * Implementation of {@link Player} adapter based on the HTML5 media element.
 *
 * @module player-medialement
 */

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

export default class MediaElementPlayer {
  constructor(peaks, mediaElement) {
    this._peaks = peaks;
    this._listeners = [];
    this._mediaElement = mediaElement;
  }

  /**
   * Adds an event listener to the media element.
   *
   * @private
   * @param {String} type The event type to listen for.
   * @param {Function} callback An event handler function.
   */
  _addMediaListener(type, callback) {
    this._listeners.push({ type: type, callback: callback });
    this._mediaElement.addEventListener(type, callback);
  }

  init(player) {
    var self = this;

    self._player = player;
    self._listeners = [];
    self._duration = self.getDuration();
    self._isPlaying = false;

    self._addMediaListener('timeupdate', function() {
      self._peaks.emit('player.timeupdate', self.getCurrentTime());
    });

    self._addMediaListener('playing', function() {
      self._isPlaying = true;
      self._peaks.emit('player.playing', self.getCurrentTime());
    });

    self._addMediaListener('pause', function() {
      self._isPlaying = false;
      self._peaks.emit('player.pause', self.getCurrentTime());
    });

    self._addMediaListener('ended', function() {
      self._peaks.emit('player.ended');
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

    // If the media element has preload="none", clicking to seek in the
    // waveform won't work, so here we force the media to load.
    if (self._mediaElement.readyState === HTMLMediaElement.HAVE_NOTHING) {
      self._mediaElement.load();
    }
  }

  /**
   * Cleans up the player object, removing all event listeners from the
   * associated media element.
   */

  destroy() {
    for (var i = 0; i < this._listeners.length; i++) {
      var listener = this._listeners[i];

      this._mediaElement.removeEventListener(
        listener.type,
        listener.callback
      );
    }

    this._listeners.length = 0;

    this._mediaElement = null;
  }

  play() {
    return this._mediaElement.play();
  }

  pause() {
    this._mediaElement.pause();
  }

  isPlaying() {
    return this._isPlaying;
  }

  isSeeking() {
    return this._mediaElement.seeking;
  }

  getCurrentTime() {
    return this._mediaElement.currentTime;
  }

  getDuration() {
    return this._mediaElement.duration;
  }

  seek(time) {
    this._mediaElement.currentTime = time;
  }
}
