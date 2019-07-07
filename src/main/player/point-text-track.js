/**
 * @file
 *
 * Defines the {@link PointTextTrack} class.
 *
 * @module peaks/player/points-text-track
 */

define(['peaks/player/text-track'], function(TextTrack) {
  'use strict';

  function PointTextTrack(peaks, mediaElement) {
    TextTrack.call(this, peaks, mediaElement);
  }

  PointTextTrack.prototype = Object.create(TextTrack.prototype);

  PointTextTrack.prototype._emitEnterEvent = function(id) {
    var segment = this._peaks.points.getPoint(id);

    this._peaks.emit('points.enter', segment);
  };

  PointTextTrack.prototype._emitExitEvent = function(id) {
    var segment = this._peaks.points.getPoint(id);

    this._peaks.emit('points.exit', segment);
  };

  return PointTextTrack;
});
