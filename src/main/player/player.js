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
 * player.timeUpdate - assignable function that is called on player update during playback (normalised)
 *
 * player.getPercentage - get the percentage playthrough
 *
 * player.getTime - get a nicely formatted string representing the current timecode
 *
 * player.getDuration - get a nice formatted time representing the clip duration
 *
 * player.getTimeFromPercentage - get the time in track of a percentage playthrough without setting
 *
 * player.setVolume
 */

define(["peaks/waveform/waveform.mixins"], function (mixins) {
  'use strict';

  var radio = function (peaks) {

    function timeFromPercentage(time, percentage) {
      return time * (percentage / 100);
    }

    return {
      init: function (mediaElement) {
        var that = this;

        this.mediaElement = mediaElement;
        this.duration = this.mediaElement.duration;

        if (this.mediaElement.readyState === 4) {
          peaks.emit("player_load", that);
        }

        this.mediaElement.addEventListener("timeupdate", function () {
          peaks.emit("player_time_update", that.getTime());
        });

        this.mediaElement.addEventListener("play", function () {
          peaks.emit("player_play", that.getTime());
        });

        this.mediaElement.addEventListener("pause", function () {
          peaks.emit("player_pause", that.getTime());
        });

        this.mediaElement.addEventListener("seeked", function () {
          peaks.emit("player_seek", that.getTime());
        });
      },

      setSource: function(source) {
        this.mediaElement.setAttribute('src', source);
      },

      getSource: function() {
        return this.mediaElement.src;
      },

      play: function () {
        this.mediaElement.play();
        peaks.emit("radio_play", this.getTime());
      },

      pause: function () {
        this.mediaElement.pause();
        peaks.emit("radio_pause", this.getTime());
      },

      getTime: function () {
        return this.mediaElement.currentTime;
      },

      getTimeFromPercentage: function (p) {
        return mixins.niceTime(this.duration * p / 100, false);
      },

      getSecsFromPercentage: function (p) {
        return Math.floor(this.duration * p / 100);
      },

      getDuration: function () {
        return this.mediaElement.duration;
      },

      getPercentage: function () {
        return this.getPercentageFromSeconds(this.mediaElement.currentTime);
      },

      getPercentageFromSeconds: function (s) {
        var percentage = (s / this.duration) * 100;
        return Math.round(percentage * 100) / 100; // 2DP
      },

      seek: function (percentage) {
        this.mediaElement.currentTime = timeFromPercentage(this.duration, percentage);
      },

      seekBySeconds: function (seconds) {
        this.mediaElement.currentTime = seconds;
      }
    };
  };

  return radio;
});
