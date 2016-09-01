/**
 * Player API
 *
 * Functionality layer for interfacing with the html5 audio API.
 *
 * player.init - takes a player object and sets up the player
 *
 * player.play - starts the audio playback and updates internal variables
 *
 * player.stop - stops playback
 *
 * player.seek - seek to a certain percentage
 *
 * player.timeUpdate - assignable function that is called on player update
 *                     during playback (normalised)
 *
 * player.getPercentage - get the percentage playthrough
 *
 * player.getTime - get a nicely formatted string representing the current timecode
 *
 * player.getDuration - get a nice formatted time representing the clip duration
 *
 * player.getTimeFromPercentage - get the time in track of a percentage
 *                                playthrough without setting
 *
 * player.setVolume
 */

define(['peaks/waveform/waveform.mixins'], function(mixins) {
  'use strict';

  function timeFromPercentage(time, percentage) {
    return time * (percentage / 100);
  }

  function Player(peaks) {
    this.peaks = peaks;
  }

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

  Player.prototype.play = function() {
    this.mediaElement.play();
  };

  Player.prototype.pause = function() {
    this.mediaElement.pause();
  };

  Player.prototype.getTime = function() {
    return this.mediaElement.currentTime;
  };

  Player.prototype.getTimeFromPercentage = function(p) {
    return mixins.niceTime(this.duration * p / 100, false);
  };

  Player.prototype.getSecsFromPercentage = function(p) {
    return Math.floor(this.duration * p / 100);
  };

  Player.prototype.getDuration = function() {
    return this.mediaElement.duration;
  };

  Player.prototype.getPercentage = function() {
    return this.getPercentageFromSeconds(this.mediaElement.currentTime);
  };

  Player.prototype.getPercentageFromSeconds = function(s) {
    var percentage = (s / this.duration) * 100;

    return Math.round(percentage * 100) / 100; // 2DP
  };

  Player.prototype.seek = function(percentage) {
    this.mediaElement.currentTime = timeFromPercentage(this.duration, percentage);
  };

  Player.prototype.seekBySeconds = function(seconds) {
    this.mediaElement.currentTime = seconds;
  };

  return Player;
});
