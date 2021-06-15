/**
 * @file
 *
 * Defines the {@link CueEmitter} class.
 *
 * @module cue-emitter
 */

import Cue, { CUE_POINT, CUE_SEGMENT_END, CUE_SEGMENT_START } from './cue.js';
import { objectHasProperty } from './utils.js';

const w = globalThis.window;
const isHeadless = w && /HeadlessChrome/.test(w.navigator.userAgent);

const triggerUpdateOn = [
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
];

function windowIsVisible() {
  if (isHeadless || w.navigator.webdriver) {
    return false;
  }

  return (typeof document === 'object') &&
    ('visibilityState' in document) &&
    (document.visibilityState === 'visible');
}

const requestAnimationFrame =
  window.requestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.msRequestAnimationFrame;

const cancelAnimationFrame =
  window.cancelAnimationFrame ||
  window.mozCancelAnimationFrame ||
  window.webkitCancelAnimationFrame ||
  window.msCancelAnimationFrame;

const EVENT_TYPE_POINT = 0;
const EVENT_TYPE_SEGMENT_ENTER = 1;
const EVENT_TYPE_SEGMENT_EXIT = 2;

const eventTypes = {
  forward: {
    [CUE_POINT]: EVENT_TYPE_POINT,
    [CUE_SEGMENT_START]: EVENT_TYPE_SEGMENT_ENTER,
    [CUE_SEGMENT_END]: EVENT_TYPE_SEGMENT_EXIT
  },
  reverse: {
    [CUE_POINT]: EVENT_TYPE_POINT,
    [CUE_SEGMENT_START]: EVENT_TYPE_SEGMENT_EXIT,
    [CUE_SEGMENT_END]: EVENT_TYPE_SEGMENT_ENTER
  }
};

const eventNames = {
  [EVENT_TYPE_POINT]: 'points.enter',
  [EVENT_TYPE_SEGMENT_ENTER]: 'segments.enter',
  [EVENT_TYPE_SEGMENT_EXIT]: 'segments.exit'
};

/**
 * Given a cue instance, returns the corresponding {@link Point}
 * {@link Segment}.
 *
 * @param {Peaks} peaks
 * @param {Cue} cue
 * @return {Point|Segment}
 * @throws {Error}
 */

function getPointOrSegment(peaks, cue) {
  switch (cue.type) {
    case CUE_POINT:
      return peaks.points.getPoint(cue.id);

    case CUE_SEGMENT_START:
    case CUE_SEGMENT_END:
      return peaks.segments.getSegment(cue.id);

    default:
      throw new Error('getPointOrSegment: id not found?');
  }
}

function getSegmentIdComparator(id) {
  return function compareSegmentIds(segment) {
    return segment.id === id;
  };
}

/**
 * CueEmitter is responsible for emitting <code>points.enter</code>,
 * <code>segments.enter</code>, and <code>segments.exit</code> events.
 *
 * @class
 * @alias CueEmitter
 *
 * @param {Peaks} peaks Parent {@link Peaks} instance.
 */

export default class CueEmitter {
  constructor(peaks) {
    this._cues = [];
    this._peaks = peaks;
    this._previousTime = -1;
    this._updateCues = this._updateCues.bind(this);
    // Event handlers:
    this._onPlaying = this.onPlaying.bind(this);
    this._onSeeked = this.onSeeked.bind(this);
    this._onTimeUpdate = this.onTimeUpdate.bind(this);
    this._onAnimationFrame = this.onAnimationFrame.bind(this);
    this._rAFHandle = null;
    this._activeSegments = {};
    this._attachEventHandlers();
  }

  /**
   * This function is bound to all {@link Peaks} events relating to mutated
   * [Points]{@link Point} or [Segments]{@link Segment}, and updates the
   * list of cues accordingly.
   *
   * @private
   */

  _updateCues() {
    var self = this;

    var points = self._peaks.points.getPoints();
    var segments = self._peaks.segments.getSegments();

    self._cues.length = 0;

    points.forEach(function(point) {
      self._cues.push(new Cue(point.time, CUE_POINT, point.id));
    });

    segments.forEach(function(segment) {
      self._cues.push(new Cue(segment.startTime, CUE_SEGMENT_START, segment.id));
      self._cues.push(new Cue(segment.endTime, CUE_SEGMENT_END, segment.id));
    });

    self._cues.sort(Cue.sorter);

    var time = self._peaks.player.getCurrentTime();

    self._updateActiveSegments(time);
  }

  /**
   * Emits events for any cues passed through during media playback.
   *
   * @param {Number} time The current time on the media timeline.
   * @param {Number} previousTime The previous time on the media timeline when
   *   this function was called.
   */

  _onUpdate(time, previousTime) {
    var isForward = time > previousTime;
    var start;
    var end;
    var step;

    if (isForward) {
      start = 0;
      end = this._cues.length;
      step = 1;
    }
    else {
      start = this._cues.length - 1;
      end = -1;
      step = -1;
    }

    // Cues are sorted
    for (var i = start; isForward ? i < end : i > end; i += step) {
      var cue = this._cues[i];

      if (isForward ? cue.time > previousTime : cue.time < previousTime) {
        if (isForward ? cue.time > time : cue.time < time) {
          break;
        }

        // Cue falls between time and previousTime

        var marker = getPointOrSegment(this._peaks, cue);

        var eventType = isForward ? eventTypes.forward[cue.type] :
                                    eventTypes.reverse[cue.type];

        if (eventType === EVENT_TYPE_SEGMENT_ENTER) {
          this._activeSegments[marker.id] = marker;
        }
        else if (eventType === EVENT_TYPE_SEGMENT_EXIT) {
          delete this._activeSegments[marker.id];
        }

        this._peaks.emit(eventNames[eventType], marker);
      }
    }
  }

  // the next handler and onAnimationFrame are bound together
  // when the window isn't in focus, rAF is throttled
  // falling back to timeUpdate

  onTimeUpdate(time) {
    if (windowIsVisible()) {
      return;
    }

    if (this._peaks.player.isPlaying() && !this._peaks.player.isSeeking()) {
      this._onUpdate(time, this._previousTime);
    }

    this._previousTime = time;
  }

  onAnimationFrame() {
    var time = this._peaks.player.getCurrentTime();

    if (!this._peaks.player.isSeeking()) {
      this._onUpdate(time, this._previousTime);
    }

    this._previousTime = time;

    if (this._peaks.player.isPlaying()) {
      this._rAFHandle = requestAnimationFrame(this._onAnimationFrame);
    }
  }

  onPlaying() {
    this._previousTime = this._peaks.player.getCurrentTime();
    this._rAFHandle = requestAnimationFrame(this._onAnimationFrame);
  }

  onSeeked(time) {
    this._previousTime = time;

    this._updateActiveSegments(time);
  }

  /**
   * The active segments is the set of all segments which overlap the current
   * playhead position. This function updates that set and emits
   * <code>segments.enter</code> and <code>segments.exit</code> events.
   */

  _updateActiveSegments(time) {
    var self = this;

    var activeSegments = self._peaks.segments.getSegmentsAtTime(time);

    // Remove any segments no longer active.

    for (var id in self._activeSegments) {
      if (objectHasProperty(self._activeSegments, id)) {
        var segment = activeSegments.find(getSegmentIdComparator(id));

        if (!segment) {
          self._peaks.emit('segments.exit', self._activeSegments[id]);
          delete self._activeSegments[id];
        }
      }
    }

    // Add new active segments.

    activeSegments.forEach(function(segment) {
      if (!(segment.id in self._activeSegments)) {
        self._activeSegments[segment.id] = segment;
        self._peaks.emit('segments.enter', segment);
      }
    });
  }

  _attachEventHandlers() {
    this._peaks.on('player.timeupdate', this._onTimeUpdate);
    this._peaks.on('player.playing', this._onPlaying);
    this._peaks.on('player.seeked', this._onSeeked);

    for (var i = 0; i < triggerUpdateOn.length; i++) {
      this._peaks.on(triggerUpdateOn[i], this._updateCues);
    }

    this._updateCues();
  }

  _detachEventHandlers() {
    this._peaks.off('player.timeupdate', this._onTimeUpdate);
    this._peaks.off('player.playing', this._onPlaying);
    this._peaks.off('player.seeked', this._onSeeked);

    for (var i = 0; i < triggerUpdateOn.length; i++) {
      this._peaks.off(triggerUpdateOn[i], this._updateCues);
    }
  }

  destroy() {
    if (this._rAFHandle) {
      cancelAnimationFrame(this._rAFHandle);
      this._rAFHandle = null;
    }

    this._detachEventHandlers();

    this._previousTime = -1;
  }
}
