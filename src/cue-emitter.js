/**
 * @file
 *
 * Defines the {@link CueEmitter} class.
 *
 * @module cue-emitter
 */

import Cue from './cue';
import { objectHasProperty } from './utils';

const isHeadless = /HeadlessChrome/.test(navigator.userAgent);

function windowIsVisible() {
  if (isHeadless || navigator.webdriver) {
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

const eventTypes = {
  forward: {},
  reverse: {}
};

const EVENT_TYPE_POINT = 0;
const EVENT_TYPE_SEGMENT_ENTER = 1;
const EVENT_TYPE_SEGMENT_EXIT = 2;

eventTypes.forward[Cue.POINT] = EVENT_TYPE_POINT;
eventTypes.forward[Cue.SEGMENT_START] = EVENT_TYPE_SEGMENT_ENTER;
eventTypes.forward[Cue.SEGMENT_END] = EVENT_TYPE_SEGMENT_EXIT;

eventTypes.reverse[Cue.POINT] = EVENT_TYPE_POINT;
eventTypes.reverse[Cue.SEGMENT_START] = EVENT_TYPE_SEGMENT_EXIT;
eventTypes.reverse[Cue.SEGMENT_END] = EVENT_TYPE_SEGMENT_ENTER;

const eventNames = {};

eventNames[EVENT_TYPE_POINT] = 'points.enter';
eventNames[EVENT_TYPE_SEGMENT_ENTER] = 'segments.enter';
eventNames[EVENT_TYPE_SEGMENT_EXIT] = 'segments.exit';

const eventAttributes = {};

eventAttributes[EVENT_TYPE_POINT] = 'point';
eventAttributes[EVENT_TYPE_SEGMENT_ENTER] = 'segment';
eventAttributes[EVENT_TYPE_SEGMENT_EXIT] = 'segment';

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
    case Cue.POINT:
      return peaks.points.getPoint(cue.id);

    case Cue.SEGMENT_START:
    case Cue.SEGMENT_END:
      return peaks.segments.getSegment(cue.id);

    default:
      throw new Error('getPointOrSegment: id not found?');
  }
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

function CueEmitter(peaks) {
  this._cues = [];
  this._peaks = peaks;
  this._previousTime = -1;
  this._updateCues = this._updateCues.bind(this);
  this._onPlaying = this._onPlaying.bind(this);
  this._onSeeked = this._onSeeked.bind(this);
  this._onTimeUpdate = this._onTimeUpdate.bind(this);
  this._onAnimationFrame = this._onAnimationFrame.bind(this);
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

CueEmitter.prototype._updateCues = function() {
  const self = this;

  const points = self._peaks.points.getPoints();
  const segments = self._peaks.segments.getSegments();

  self._cues.length = 0;

  points.forEach(function(point) {
    self._cues.push(new Cue(point.time, Cue.POINT, point.id));
  });

  segments.forEach(function(segment) {
    self._cues.push(new Cue(segment.startTime, Cue.SEGMENT_START, segment.id));
    self._cues.push(new Cue(segment.endTime, Cue.SEGMENT_END, segment.id));
  });

  self._cues.sort(Cue.sorter);

  const time = self._peaks.player.getCurrentTime();

  self._updateActiveSegments(time);
};

/**
 * Emits events for any cues passed through during media playback.
 *
 * @param {Number} time The current time on the media timeline.
 * @param {Number} previousTime The previous time on the media timeline when
 *   this function was called.
 */

CueEmitter.prototype._onUpdate = function(time, previousTime) {
  const isForward = time > previousTime;
  let start;
  let end;
  let step;

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

  // Cues are sorted.

  for (let i = start; isForward ? i < end : i > end; i += step) {
    const cue = this._cues[i];

    if (isForward ? cue.time > previousTime : cue.time < previousTime) {
      if (isForward ? cue.time > time : cue.time < time) {
        break;
      }

      // Cue falls between time and previousTime.

      const marker = getPointOrSegment(this._peaks, cue);

      const eventType = isForward ? eventTypes.forward[cue.type] :
                                    eventTypes.reverse[cue.type];

      if (eventType === EVENT_TYPE_SEGMENT_ENTER) {
        this._activeSegments[marker.id] = marker;
      }
      else if (eventType === EVENT_TYPE_SEGMENT_EXIT) {
        delete this._activeSegments[marker.id];
      }

      const event = {
        time: time
      };

      event[eventAttributes[eventType]] = marker;

      this._peaks.emit(eventNames[eventType], event);
    }
  }
};

// The next handler and onAnimationFrame are bound together
// when the window isn't in focus, rAF is throttled
// falling back to timeUpdate.

CueEmitter.prototype._onTimeUpdate = function(time) {
  if (windowIsVisible()) {
    return;
  }

  if (this._peaks.player.isPlaying() && !this._peaks.player.isSeeking()) {
    this._onUpdate(time, this._previousTime);
  }

  this._previousTime = time;
};

CueEmitter.prototype._onAnimationFrame = function() {
  const time = this._peaks.player.getCurrentTime();

  if (!this._peaks.player.isSeeking()) {
    this._onUpdate(time, this._previousTime);
  }

  this._previousTime = time;

  if (this._peaks.player.isPlaying()) {
    this._rAFHandle = requestAnimationFrame(this._onAnimationFrame);
  }
};

CueEmitter.prototype._onPlaying = function() {
  this._previousTime = this._peaks.player.getCurrentTime();
  this._rAFHandle = requestAnimationFrame(this._onAnimationFrame);
};

CueEmitter.prototype._onSeeked = function(time) {
  this._previousTime = time;

  this._updateActiveSegments(time);
};

function getSegmentIdComparator(id) {
  return function compareSegmentIds(segment) {
    return segment.id === id;
  };
}

/**
 * The active segments is the set of all segments which overlap the current
 * playhead position. This function updates that set and emits
 * <code>segments.enter</code> and <code>segments.exit</code> events.
 */

CueEmitter.prototype._updateActiveSegments = function(time) {
  const self = this;

  const activeSegments = self._peaks.segments.getSegmentsAtTime(time);

  // Remove any segments no longer active.

  for (const id in self._activeSegments) {
    if (objectHasProperty(self._activeSegments, id)) {
      const segment = activeSegments.find(getSegmentIdComparator(id));

      if (!segment) {
        self._peaks.emit('segments.exit', {
          segment: self._activeSegments[id],
          time: time
        });

        delete self._activeSegments[id];
      }
    }
  }

  // Add new active segments.

  activeSegments.forEach(function(segment) {
    if (!(segment.id in self._activeSegments)) {
      self._activeSegments[segment.id] = segment;

      self._peaks.emit('segments.enter', {
        segment: segment,
        time: time
      });
    }
  });
};

const events = [
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

CueEmitter.prototype._attachEventHandlers = function() {
  this._peaks.on('player.timeupdate', this._onTimeUpdate);
  this._peaks.on('player.playing', this._onPlaying);
  this._peaks.on('player.seeked', this._onSeeked);

  for (let i = 0; i < events.length; i++) {
    this._peaks.on(events[i], this._updateCues);
  }

  this._updateCues();
};

CueEmitter.prototype._detachEventHandlers = function() {
  this._peaks.off('player.timeupdate', this._onTimeUpdate);
  this._peaks.off('player.playing', this._onPlaying);
  this._peaks.off('player.seeked', this._onSeeked);

  for (let i = 0; i < events.length; i++) {
    this._peaks.off(events[i], this._updateCues);
  }
};

CueEmitter.prototype.destroy = function() {
  if (this._rAFHandle) {
    cancelAnimationFrame(this._rAFHandle);
    this._rAFHandle = null;
  }

  this._detachEventHandlers();

  this._previousTime = -1;
};

export default CueEmitter;
