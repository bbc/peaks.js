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

    var _helpers = {
      timeFromPercentage: function (time, percentage) {
        return time*(percentage/100);
      }
    };

    return {

      init: function (mediaElement) {
        var that = this;
        this.player = mediaElement;
        this.duration = this.player.duration;

        if (this.player.readyState === 4) {
          peaks.emit("player_load", that);
        }

        this.player.addEventListener("timeupdate", function () {
          peaks.emit("player_time_update", that.getTime());
        });

        this.player.addEventListener("play", function () {
          peaks.emit("player_play", that.getTime());
        });

        this.player.addEventListener("pause", function () {
          peaks.emit("player_pause", that.getTime());
        });

        this.player.addEventListener("seeked", function () {
          peaks.emit("waveform_seek", that.getTime());
        });

      },

      setSource: function(source) {
        this.player.setAttribute('src', source);
      },

      getSource: function() {
        return this.player.src;
      },

      play: function () {
        this.player.play();
        peaks.emit("radio_play", this.getTime());
      },

      /**
       * Plays from a start time to an end time.
       * Precision can be improved as timeupdate events are not sent frequently enough.
       *
       * @since 0.3.0
       * @param {Number} startTime
       * @param {Number=} endTime
       */
      playFrom: function playFrom(startTime, endTime) {
        var that = this;
        endTime = endTime || this.getDuration();

        if ((startTime >= 0) === false) {
          throw new TypeError('playerplayFrom startTime should be a valid HTMLMediaElement time value.');
        }

        if (startTime >= this.getDuration()) {
          throw new RangeError('player.playFrom startTime value should be lower than its duration.');
        }

        if (endTime <= startTime) {
          throw new RangeError('player.playFrom endTime should be further in time that the startTime value.');
        }


        var stopPlayback = (function(){
          var isPrevented = false;

          var stopPlayback = function stopPlayback(callback){
            if (isPrevented === false) {
              callback.apply(null);
            }
          };

          stopPlayback.preventDefault = function preventDefaultPlayback(){
            isPrevented = true;
          };

          stopPlayback.isPrevented = function (){
            return isPrevented;
          };

          return stopPlayback;
        })();

        this.seekBySeconds(startTime);

        /*
         When we reach the end of the playback, we hook
         */
        peaks.once('player_playfrom_end', stopPlayback.bind(null, that.pause.bind(that)));

        peaks.on('player_time_update', function playFromTimeWatcher(currentTime){
          if (currentTime >= endTime) {
            peaks.emit('player_playfrom_end', endTime, stopPlayback.preventDefault);

            // cancels the listener once its done
            return true;
          }
        });

        this.play();
      },

      playNextSegment: function playNextSegment(time){
        time = time >= 0 ? time : this.getTime();

        var nextSegment = peaks.segments.getNextSegment(time);

        if (nextSegment) {
          this.playFrom(nextSegment.startTime, nextSegment.endTime);
        }
      },

      playSegments: function playSegments(){
        var that = this;

        peaks.on('player_playfrom_end', function(endTime, preventDefault){
          var nextSegment = peaks.segments.getNextSegment(endTime);

          if (nextSegment === null){
            return;
          }

          // if segments are overlapping this will start at the beginning of the segment
          // we rather want to call something like postponeTo(nextSegment.endTime) to address the issue.
          that.playNextSegment(nextSegment.startTime);
        });


        this.playNextSegment(0);
      },

      pause: function () {
        this.player.pause();
        peaks.emit("radio_pause", this.getTime());
      },

      getTime: function () {
        return this.player.currentTime;
      },

      getTimeFromPercentage: function (p) {
        return mixins.niceTime(this.duration * p / 100, false);
      },

      getSecsFromPercentage: function (p) {
        return Math.floor(this.duration * p / 100);
      },

      getDuration: function () {
        return this.duration;
      },

      getPercentage: function () {
        return this.getPercentageFromSeconds(this.player.currentTime);
      },

      getPercentageFromSeconds: function (s) {
        var percentage = (s / this.duration) * 100;
        return Math.round(percentage * 100) / 100; // 2DP
      },

      seek: function (percentage) {
        this.player.currentTime = _helpers.timeFromPercentage(this.duration, percentage);
      },

      seekBySeconds: function (seconds) {
        this.player.currentTime = seconds;
      }
    };
  };

  return radio;
});
