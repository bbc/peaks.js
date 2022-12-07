/**
 * @file
 *
 * Implementation of {@link Player} adapter based on the HTML5 media element.
 *
 * @module mediaelement-player
 */

/**
 * Checks whether the given HTMLMediaElement has either a src attribute
 * or any child <code>&lt;source&gt;</code> nodes
 */

function mediaElementHasSource(mediaElement) {
  if (mediaElement.src) {
    return true;
  }

  if (mediaElement.querySelector('source')) {
    return true;
  }

  return false;
}

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
  this._mediaElement = mediaElement;
}

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

MediaElementPlayer.prototype.init = function(eventEmitter) {
  const self = this;

  self._eventEmitter = eventEmitter;
  self._listeners = [];
  self._duration = self.getDuration();

  self._addMediaListener('timeupdate', function() {
    self._eventEmitter.emit('player.timeupdate', self.getCurrentTime());
  });

  self._addMediaListener('playing', function() {
    self._eventEmitter.emit('player.playing', self.getCurrentTime());
  });

  self._addMediaListener('pause', function() {
    self._eventEmitter.emit('player.pause', self.getCurrentTime());
  });

  self._addMediaListener('ended', function() {
    self._eventEmitter.emit('player.ended');
  });

  self._addMediaListener('seeked', function() {
    self._eventEmitter.emit('player.seeked', self.getCurrentTime());
  });

  self._addMediaListener('canplay', function() {
    self._eventEmitter.emit('player.canplay');
  });

  self._addMediaListener('error', function(event) {
    self._eventEmitter.emit('player.error', event.target.error);
  });

  self._interval = null;

  if (!mediaElementHasSource(self._mediaElement)) {
    return Promise.resolve();
  }

  return new Promise(function(resolve, reject) {
    function eventHandler(event) {
      self._mediaElement.removeEventListener('loadedmetadata', eventHandler);
      self._mediaElement.removeEventListener('error', eventHandler);

      if (event.type === 'loadedmetadata') {
        resolve();
      }
      else {
        reject(event.target.error);
      }
    }

    // If the media element has preload="none", clicking to seek in the
    // waveform won't work, so here we force the media to load.
    if (self._mediaElement.readyState === HTMLMediaElement.HAVE_NOTHING) {
      // Wait for the readyState to change to HAVE_METADATA so we know the
      // duration is valid, otherwise it could be NaN.
      self._mediaElement.addEventListener('loadedmetadata', eventHandler);
      self._mediaElement.addEventListener('error', eventHandler);
      self._mediaElement.load();
    }
    else {
      resolve();
    }
  });
};

/**
 * Cleans up the player object, removing all event listeners from the
 * associated media element.
 */

MediaElementPlayer.prototype.destroy = function() {
  for (let i = 0; i < this._listeners.length; i++) {
    const listener = this._listeners[i];

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
  return !this._mediaElement.paused;
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

function SetSourceHandler(eventEmitter, mediaElement) {
  this._eventEmitter = eventEmitter;
  this._mediaElement = mediaElement;
  this._playerCanPlayHandler = this._playerCanPlayHandler.bind(this);
  this._playerErrorHandler = this._playerErrorHandler.bind(this);
}

SetSourceHandler.prototype.setSource = function(options, callback) {
  const self = this;

  self._options = options;
  self._callback = callback;

  self._eventEmitter.on('player.canplay', self._playerCanPlayHandler);
  self._eventEmitter.on('player.error', self._playerErrorHandler);

  return new Promise(function(resolve, reject) {
    self._resolve = resolve;
    self._reject = reject;

    self._eventEmitter.on('player.canplay', self._playerCanPlayHandler);
    self._eventEmitter.on('player.error', self._playerErrorHandler);

    self._mediaElement.setAttribute('src', options.mediaUrl);

    // Force the media element to load, in case the media element
    // has preload="none".
    if (self._mediaElement.readyState === HTMLMediaElement.HAVE_NOTHING) {
      self._mediaElement.load();
    }
  });
};

SetSourceHandler.prototype._reset = function() {
  this._eventEmitter.removeListener('player.canplay', this._playerCanPlayHandler);
  this._eventEmitter.removeListener('player.error', this._playerErrorHandler);
};

SetSourceHandler.prototype._playerCanPlayHandler = function() {
  this._reset();

  this._resolve();
};

SetSourceHandler.prototype._playerErrorHandler = function(err) {
  this._reset();

  // Return the MediaError object from the media element
  this._reject(err);
};

MediaElementPlayer.prototype.setSource = function(options) {
  if (!options.mediaUrl) {
    // eslint-disable-next-line max-len
    return Promise.reject(new Error('peaks.setSource(): options must contain a mediaUrl when using mediaElement'));
  }

  const setSourceHandler = new SetSourceHandler(this._eventEmitter, this._mediaElement);

  return setSourceHandler.setSource(options);
};

export default MediaElementPlayer;
