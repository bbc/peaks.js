/**
 * @file
 *
 * Defines the {@link SegmentTextTrack} class.
 *
 * @module peaks/player/segment-text-track
 */

define(['peaks/player/text-track'], function(TextTrack) {
  'use strict';

  function SegmentTextTrack(peaks, mediaElement) {
    TextTrack.call(this, peaks, mediaElement);
  }

  SegmentTextTrack.prototype = Object.create(TextTrack.prototype);

  SegmentTextTrack.prototype._emitEnterEvent = function(id) {
    var segment = this._peaks.segments.getSegment(id);

    this._peaks.emit('segments.enter', segment);
  };

  SegmentTextTrack.prototype._emitExitEvent = function(id) {
    var segment = this._peaks.segments.getSegment(id);

    this._peaks.emit('segments.exit', segment);
  };

  return SegmentTextTrack;
});
