/**
 * @file
 *
 * Defines the {@link TextTrack} class.
 *
 * @module peaks/player/text-track
 */

define([], function() {
  'use strict';

  function TextTrack(peaks, mediaElement) {
    this._peaks = peaks;
    this._mediaElement = mediaElement;
    this._textTrack = this._mediaElement.addTextTrack('metadata');
    this._onCueEnter = this.onCueEnter.bind(this);
    this._onCueExit = this.onCueExit.bind(this);
  }

  TextTrack.prototype.addCue = function(id, startTime, endTime) {
    var cue = new VTTCue(startTime, endTime, '');

    cue.id = id;
    cue.onenter = this._onCueEnter;
    cue.onexit = this._onCueExit;

    this._textTrack.addCue(cue);
  };

  TextTrack.prototype.updateCue = function(id, startTime, endTime) {
    var cue = this._textTrack.cues.getCueById(id);

    if (!cue) {
      console.error('peaks.player.removeCue(): no cue with id: ' + id);
      return;
    }

    cue.startTime = startTime;
    cue.endTime = endTime;
  };

  TextTrack.prototype.removeCue = function(id) {
    var cue = this._textTrack.cues.getCueById(id);

    if (!cue) {
      console.error('peaks.player.removeCue(): no cue with id: ' + id);
      return;
    }

    this._textTrack.removeCue(cue);
  };

  TextTrack.prototype.removeAllCues = function() {
    while (this._textTrack.cues.length > 0) {
      var cue = this._textTrack.cues[0];

      this._textTrack.removeCue(cue);
    }
  };

  TextTrack.prototype.onCueEnter = function(event) {
    this._emitEnterEvent(event.target.id);
  };

  TextTrack.prototype.onCueExit = function(event) {
    this._emitExitEvent(event.target.id);
  };

  return TextTrack;
});
