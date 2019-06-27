/**
 * @file
 * @module peaks/cues/cue-emitter
 */
define([
  'EventEmitter',
  'peaks/cues/cuemark'
], function(EventEmitter, CueMark) {
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

  function getRAF(top) {
    return top ? (
      top.requestAnimationFrame ||
      top.webkitRequestAnimationFrame ||
      top.mozRequestAnimationFrame ||
      top.msRequestAnimationFrame ||
      function() {}
    ) : function() {};
  }
  var rAF = getRAF(window);

  /**
   * This adapter populates the list of timeline entries from Peaks' points and segments
   * NB: mutates marks, removing the old entries
   * @param {CueMarkDef[]} marks
   * @param {Peaks} peaks
   */
  function populateMarks(marks, peaks) {
    var segments = peaks.segments.getSegments();
    var points = peaks.points.getPoints();

    marks.length = 0;
    points.forEach(function(entry) {
      marks.push(CueMark.create(entry.time, CueMark.POINT, entry.id));
    });
    segments.forEach(function(entry) {
      marks.push(CueMark.create(entry.startTime, CueMark.SEGMENT_START, entry.id));
      marks.push(CueMark.create(entry.endTime, CueMark.SEGMENT_END, entry.id));
    });

    marks.sort(CueMark.sorter);
  }

  /**
   * @param {Peaks} peaks
   * @return {HTMLMediaElement}
   */
  function getMediaElement(peaks) {
    return peaks.player._mediaElement;
  }

  /**
   * @class
   * @property {Peaks} peaks
   * @property {Array.<CueMarkDef>} marks
   * @param peaks
   * @constructor
   */
  function CueEmitter(peaks) {
    EventEmitter.call(this);
    this.marks = Array();
    this.peaks = peaks;
    this.previousTime = -1;
    // bound to all Peaks events relating to mutated segments or points
    this._updateMarks = this._updateMarks.bind(this);
    // event handlers
    this.onPeaksDestroyed = this.onPeaksDestroyed.bind(this);
    this.onPlay = this.onPlay.bind(this);
    this.onSeek = this.onSeek.bind(this);
    this.onTimeUpdate = this.onTimeUpdate.bind(this);
    this.onAnimationFrame = this.onAnimationFrame.bind(this);
    this.init();
  }

  CueEmitter.prototype = Object.create(EventEmitter.prototype);
  CueEmitter.prototype.constructor = CueEmitter;

  CueEmitter.prototype._updateMarks = function() {
    populateMarks(this.marks, this.peaks);
  };

  CueEmitter.prototype._onUpdate = function(time, previousTime) {
    var marks = this.marks;
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
      markTime = mark.getTime();

      if (isForward ? markTime > previousTime : markTime < previousTime) {
        if (isForward ? markTime > time : markTime < time) {
          break;
        }
        // mark time falls between now and previous call time
        mark.emitEvent(this, isForward);
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
    var el = getMediaElement(this.peaks);

    if (this.peaks.player.isPlaying() && !el.seeking) {
      this._onUpdate(time, this.previousTime);
    }
    this.previousTime = time;
  };

  CueEmitter.prototype.onAnimationFrame = function() {
    if (!this.peaks) {
      return;
    } // destroyed

    var peaks = this.peaks;
    var el = getMediaElement(this.peaks);
    var time = peaks.player.getCurrentTime();
    var isPlaying = peaks.player.isPlaying();

    if (!el.seeking) {
      this._onUpdate(time, this.previousTime);
    }
    this.previousTime = time;
    if (isPlaying) {
      rAF(this.onAnimationFrame);
    }
  };

  CueEmitter.prototype.onPlay = function() {
    this.previousTime = this.peaks.player.getCurrentTime();
    rAF(this.onAnimationFrame);
  };

  CueEmitter.prototype.onSeek = function() {
    this.previousTime = this.peaks.player.getCurrentTime();
  };

  CueEmitter.prototype.onPeaksDestroyed = function() {
    this.destroy();
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

  CueEmitter.prototype.attach = function() {
    var peaks = this.peaks;

    peaks.on('player_time_update', this.onTimeUpdate);
    peaks.on('player_play', this.onPlay);
    peaks.on('player_seek', this.onSeek);
    peaks.on('destroyed', this.onPeaksDestroyed);
    for (var i = 0; i < triggerUpdateOn.length; i++) {
      peaks.on(triggerUpdateOn[i], this._updateMarks);
    }
    this._updateMarks();
  };

  CueEmitter.prototype.detach = function() {
    var peaks = this.peaks;

    peaks.off('player_time_update', this.onTimeUpdate);
    peaks.off('player_play', this.onPlay);
    peaks.off('player_seek', this.onSeek);
    peaks.off('destroyed', this.onPeaksDestroyed);

    for (var i = 0; i < triggerUpdateOn.length; i++) {
      peaks.off(triggerUpdateOn[i], this._updateMarks);
    }
  };

  CueEmitter.prototype.init = function() {
    this.attach();
  };

  CueEmitter.prototype.destroy = function() {
    this.detach();
    this.peaks = undefined;
    this.previousTime = -1;
    this.marks.length = 0;
  };

  return CueEmitter;
});
