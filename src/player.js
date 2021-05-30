/**
 * @file
 *
 * A general audio player class which interfaces with external audio players.
 * The default audio player in Peaks.js is {@link MediaElementPlayer}.
 *
 * @module player
 */

import { isValidTime } from './utils';

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
  this._peaks = peaks;

  this._playingSegment = false;
  this._segment = null;
  this._loop = false;
  this._playSegmentTimerCallback = this._playSegmentTimerCallback.bind(this);

  validateAdapter(adapter);
  this._adapter = adapter;

  this._adapter.init(peaks);
}

/**
 * Cleans up the player object.
 */

Player.prototype.destroy = function() {
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
  if (!isValidTime(time)) {
    this._peaks.logger('peaks.player.seek(): parameter must be a valid time, in seconds');
    return;
  }

  this._adapter.seek(time);
};

/**
 * Plays the given segment.
 *
 * @param {Segment} segment The segment denoting the time region to play.
 * @param {Boolean} loop If true, playback is looped.
 */

Player.prototype.playSegment = function(segment, loop) {
  var self = this;

  if (!segment ||
    !isValidTime(segment.startTime) ||
    !isValidTime(segment.endTime)) {
    self._peaks.logger('peaks.player.playSegment(): parameter must be a segment object');
    return;
  }

  self._segment = segment;
  self._loop = loop;

  // Set audio time to segment start time
  self.seek(segment.startTime);

  self._peaks.once('player.playing', function() {
    if (!self._playingSegment) {
      self._playingSegment = true;

      // We need to use requestAnimationFrame here as the timeupdate event
      // doesn't fire often enough.
      window.requestAnimationFrame(self._playSegmentTimerCallback);
    }
  });

  // Start playing audio
  self.play();
};

Player.prototype._playSegmentTimerCallback = function() {
  if (!this.isPlaying()) {
    this.pause();
    this._playingSegment = false;
    return;
  }
  else if (this.getCurrentTime() >= this._segment.endTime) {
    if (this._loop) {
      this.seek(this._segment.startTime);
    }
    else {
      this.pause();
      this._peaks.emit('player.ended');
      this._playingSegment = false;
      return;
    }
  }

  window.requestAnimationFrame(this._playSegmentTimerCallback);
};

export default Player;
