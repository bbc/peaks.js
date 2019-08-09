/**
 * @file
 * @module peaks/cues/cue-emitter
 */
define([
  'peaks/cues/cuemark'
], function(CueMark) {
  'use strict';

  var isHeadless = /HeadlessChrome/.test(navigator.userAgent);

  function windowIsVisible() {
    if (isHeadless || navigator.webdriver) {
      return false;
    }

    return (typeof document === 'object') &&
      ('visibilityState' in document) &&
      (document.visibilityState === 'visible');
  }

  var requestAnimationFrame =
    window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame;

  var cancelAnimationFrame =
    window.cancelAnimationFrame ||
    window.mozCancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.msCancelAnimationFrame;

  /**
   * this adapter navigates the peaks instance to get a corresponding point or segment
   * @param {Peaks} peaks
   * @param {CueMark} mark
   * @return {Point|Segment}
   * @throws {Error}
   */

  function getPointOrSegment(peaks, mark) {
     switch (mark.type) {
      case CueMark.POINT:
        return peaks.points.getPoint(mark.id);
      case CueMark.SEGMENT_START:
      case CueMark.SEGMENT_END:
        return peaks.segments.getSegment(mark.id);
      default:
        throw new Error('getPointOrSegment: id not found?');
    }
  }

  /**
   * @class
   * @property {Peaks} peaks
   * @property {Array.<CueMark>} marks
   * @param {Peaks} peaks
   * @constructor
   */

  function CueEmitter(peaks) {
    this._marks = Array();
    this._peaks = peaks;
    this._previousTime = -1;
    // bound to all Peaks events relating to mutated segments or points
    this._updateMarks = this._updateMarks.bind(this);
    // event handlers
    this._onPlay = this.onPlay.bind(this);
    this._onSeek = this.onSeek.bind(this);
    this._onTimeUpdate = this.onTimeUpdate.bind(this);
    this._onAnimationFrame = this.onAnimationFrame.bind(this);
    this._rAFHandle = null;
    this._init();
  }

  // updates the list of timeline entries from Peaks' points and segments
  CueEmitter.prototype._updateMarks = function() {
    var marks = this._marks;
    var points = this._peaks.points.getPoints();
    var segments = this._peaks.segments.getSegments();

    marks.length = 0;

    points.forEach(function(entry) {
      marks.push(new CueMark(entry.time, CueMark.POINT, entry.id));
    });

    segments.forEach(function(entry) {
      marks.push(new CueMark(entry.startTime, CueMark.SEGMENT_START, entry.id));
      marks.push(new CueMark(entry.endTime, CueMark.SEGMENT_END, entry.id));
    });

    marks.sort(CueMark.sorter);
  };

  CueEmitter.prototype._onUpdate = function(time, previousTime) {
    var marks = this._marks;
    var isForward = time > previousTime;
    var start;
    var end;
    var step;

    if (isForward) {
      start = 0;
      end = marks.length;
      step = 1;
    }
    else {
      start = marks.length - 1;
      end = -1;
      step = -1;
    }

    // marks are sorted
    for (var i = start, mark, markTime; isForward ? i < end : i > end; i += step) {
      mark = marks[i];
      markTime = mark.time;

      if (isForward ? markTime > previousTime : markTime < previousTime) {
        if (isForward ? markTime > time : markTime < time) {
          break;
        }

        // mark time falls between now and previous call time
        mark.emitEvent(this._peaks, isForward, getPointOrSegment(this._peaks, mark));
      }
    }
  };

  // the next handler and onAnimationFrame are bound together
  // when the window isn't in focus, rAF is throttled
  // falling back to timeUpdate

  CueEmitter.prototype.onTimeUpdate = function(time) {
    if (windowIsVisible()) {
      return;
    }

    var player = this._peaks.player;

    if (player.isPlaying() && !player.isSeeking()) {
      this._onUpdate(time, this._previousTime);
    }

    this._previousTime = time;
  };

  CueEmitter.prototype.onAnimationFrame = function() {
    var player = this._peaks.player;
    var time = player.getCurrentTime();

    if (!player.isSeeking()) {
      this._onUpdate(time, this._previousTime);
    }

    this._previousTime = time;

    if (player.isPlaying()) {
      this._rAFHandle = requestAnimationFrame(this._onAnimationFrame);
    }
  };

  CueEmitter.prototype.onPlay = function() {
    this._previousTime = this._peaks.player.getCurrentTime();
    this._rAFHandle = requestAnimationFrame(this._onAnimationFrame);
  };

  CueEmitter.prototype.onSeek = function() {
    this._previousTime = this._peaks.player.getCurrentTime();
  };

  var triggerUpdateOn = Array(
    'points.update',
    'points.dragmove',
    'points.add',
    'points.remove',
    'points.remove_all',
    'segments.update',
    'segments.dragged',
    'segments.add',
    'segments.remove',
    'segments.remove_all'
  );

  CueEmitter.prototype._attach = function() {
    var peaks = this._peaks;

    peaks.on('player_time_update', this._onTimeUpdate);
    peaks.on('player_play', this._onPlay);
    peaks.on('player_seek', this._onSeek);

    for (var i = 0; i < triggerUpdateOn.length; i++) {
      peaks.on(triggerUpdateOn[i], this._updateMarks);
    }

    this._updateMarks();
  };

  CueEmitter.prototype._detach = function() {
    var peaks = this._peaks;

    peaks.off('player_time_update', this._onTimeUpdate);
    peaks.off('player_play', this._onPlay);
    peaks.off('player_seek', this._onSeek);

    for (var i = 0; i < triggerUpdateOn.length; i++) {
      peaks.off(triggerUpdateOn[i], this._updateMarks);
    }
  };

  CueEmitter.prototype._init = function() {
    this._attach();
  };

  CueEmitter.prototype.destroy = function() {
    if (this._rAFHandle) {
      cancelAnimationFrame(this._rAFHandle);
      this._rAFHandle = null;
    }

    this._detach();

    this._previousTime = -1;
    this._marks.length = 0;
  };

  return CueEmitter;
});
