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

  function Player(peaks) {
    function timeFromPercentage(time, percentage) {
      return time * (percentage / 100);
    }

    return {
      init: function(mediaElement) {
        var self = this;

        this.listeners = [];
        this.mediaElement = mediaElement;
        this.duration = this.mediaElement.duration;

        if (this.mediaElement.readyState === 4) {
          peaks.emit('player_load', this);
        }

        this._addMediaListener('timeupdate', function() {
          peaks.emit('player_time_update', self.getTime());
        });

        this._addMediaListener('play', function() {
          peaks.emit('player_play', self.getTime());
        });

        this._addMediaListener('pause', function() {
          peaks.emit('player_pause', self.getTime());
        });

        this._addMediaListener('seeked', function() {
          peaks.emit('player_seek', self.getTime());
        });
      },

      _addMediaListener: function(type, callback) {
        this.listeners.push([type, callback]);
        this.mediaElement.addEventListener(type, callback);
      },

      destroy: function() {
        for (var i = 0; i < this.listeners.length; i++) {
          this.mediaElement.removeEventListener(this.listeners[i][0], this.listeners[i][1]);
        }

        this.listeners = [];
      },

      setSource: function(source) {
        this.mediaElement.setAttribute('src', source);
      },

      getSource: function() {
        return this.mediaElement.src;
      },

      play: function() {
        this.mediaElement.play();
      },

      pause: function() {
        this.mediaElement.pause();
      },

      getTime: function() {
        return this.mediaElement.currentTime;
      },

      getTimeFromPercentage: function(p) {
        return mixins.niceTime(this.duration * p / 100, false);
      },

      getSecsFromPercentage: function(p) {
        return Math.floor(this.duration * p / 100);
      },

      getDuration: function() {
        return this.mediaElement.duration;
      },

      getPercentage: function() {
        return this.getPercentageFromSeconds(this.mediaElement.currentTime);
      },

      getPercentageFromSeconds: function(s) {
        var percentage = (s / this.duration) * 100;

        return Math.round(percentage * 100) / 100; // 2DP
      },

      seek: function(percentage) {
        this.mediaElement.currentTime = timeFromPercentage(this.duration, percentage);
      },

      seekBySeconds: function(seconds) {
        this.mediaElement.currentTime = seconds;
      }
    };
  }

  return Player;
});
