/**
 * @file
 *
 * Implementation of {@link Player} class for external audio players.
 *
 * @module player-external
 */
define([
  './player'
], function(Player) {
  'use strict';

  /**
   * A wrapper for interfacing with an external player API.
   *
   * @class
   * @alias ExternalPlayer
   *
   * @param {Peaks} peaks The parent {@link Peaks} object.
   * @param {Adapter} adapter The player adapter.
   */

  function ExternalPlayer(peaks, adapter) {
    var self = this;

    self._peaks = peaks;

    var _adapter = {
        init: function(player) {
          adapter.init(player);
        },
        destroy: function() {
          adapter.destroy();
        },
        play: function() {
          adapter.play();
          self._triggeredPlay();
        },
        pause: function() {
          adapter.pause();
          self._triggeredPause();
        },
        isPlaying: function() {
            return adapter.isPlaying();
        },
        isSeeking: function() {
            return adapter.isSeeking();
        },
        getCurrentTime: function() {
            return adapter.getCurrentTime();
        },
        getDuration: function() {
            return adapter.getDuration();
        },
        seek: function(time) {
            adapter.seek(time);
            self._triggeredSeek(time);
            self._updatedTime();
        },
        playSegment: function(segment) {
          adapter.playSegment(segment);
        }
    };

    Player.call(this, peaks, _adapter);
  }

  // inherit Player
  ExternalPlayer.prototype = Object.create(Player.prototype);

  // correct the constructor pointer
  ExternalPlayer.prototype.constructor = ExternalPlayer;

  return ExternalPlayer;
});
