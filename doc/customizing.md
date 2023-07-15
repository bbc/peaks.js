# Customizing Peaks.js

This document describes how to customize various aspects of the waveform rendering and media playback in Peaks.js.

## Contents

- [Introduction](#introduction)
- [Point and Segment Markers](#point-and-segment-markers)
  - [createPointMarker()](#createpointmarkeroptions)
  - [createSegmentMarker()](#createsegmentmarkeroptions)
  - [Marker API](#marker-api)
    - [marker.constructor()](#markerconstructoroptions)
    - [marker.init()](#markerinitgroup)
    - [marker.fitToView()](#markerfittoview)
    - [marker.update()](#markerupdateoptions)
    - [marker.destroy()](#markerdestroy)
  - [Layer API](#layer-api)
    - [layer.getHeight()](#layergetheight)
    - [layer.draw()](#layerdraw)
    - [layer.formatTime()](#layerformattime)
- [Segment Labels](#segment-labels)
  - [createSegmentLabel()](#createsegmentlabeloptions)
- [Media Playback](#media-playback)
  - [Player Interface](#player-interface)
    - [player.init()](#playeriniteventemitter)
    - [player.destroy()](#playerdestroy)
    - [player.setSource()](#playersetsourceoptions)
    - [player.play()](#playerplay)
    - [player.pause()](#playerpause)
    - [player.seek()](#playerseektime)
    - [player.isPlaying()](#playerisplaying)
    - [player.isSeeking()](#playerisseeking)
    - [player.getCurrentTime()](#playergetcurrenttime)
    - [player.getDuration()](#playergetduration)
  - [Configuration](#configuration)
  - [Initialization](#initialization)
  - [Events](#events)
    - [player.canplay](#playercanplay-event)
    - [player.error](#playererror-event)
    - [player.playing](#playerplaying-event)
    - [player.pause](#playerpause-event)
    - [player.seeked](#playerseeked-event)
    - [player.timeupdate](#playertimeupdate-event)
- [Time Labels](#time-labels)

## Introduction

**Note:** The APIs described in this document are not yet stable, and so may
change at any time.

Peaks.js makes use of the [Konva.js](https://konvajs.org/) graphics library,
and so we recommend becoming familiar with Konva. You may find the following tutorials helpful:

* [Konva Polygon Tutorial](https://konvajs.github.io/docs/shapes/Line_-_Polygon.html)
* [Konva Text Tutorial](https://konvajs.github.io/docs/shapes/Text.html)
* [Konva Label Tutorial](https://konvajs.github.io/docs/shapes/Label.html)

## Point and Segment Markers

Peaks.js allows you to customize the appearance of the point and segment
markers. This is achieved by providing `createPointMarker` and/or
`createSegmentMarker` functions in the options passed when calling
`Peaks.init()`, for example:

```javascript
function createPointMarker(options) {
  // (see below)
}

function createSegmentMarker(options) {
  // (see below)
}

const options = {
  // Add other options, as needed.
  createPointMarker: createPointMarker,
  createSegmentMarker: createSegmentMarker
};

Peaks.init(options, function(err, peaks) {
  // Use the Peaks.js instance here
});
```

There is a complete example demo available [here](demo/custom-markers) that
shows how to use these functions to draw custom point and segment markers.

Customizing markers does not work with the Peaks.js UMD bundle. You must build
Peaks.js into your own bundle with Konva as a peer dependency, using a module
bundler such as [Webpack](https://webpack.js.org/),
[Rollup](https://rollupjs.org/), [Parcel](https://parceljs.org/), etc.

### `createPointMarker(options)`

The `createPointMarker` function returns an object that renders a point marker.
When called, this function receives an object containing the following
options:

| Name         | Type          | Description                                                                                                                   |
| ------------ | ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `point`      | `Point`       | The `Point` object associated with this marker. This provides access to the `time`, `color`, and `labelText` attributes, etc. |
| `view`       | `string`      | The name of the view that the marker is being created in, either `zoomview` or `overview`.                                    |
| `layer`      | `PointsLayer` | The rendering layer, see [Layer API](#layer-api) for details.                                                                 |
| `editable`   | `boolean`     | If `true`, the `Point` time can be changed by dragging the mouse.                                                             |
| `color`      | `string`      | Color for the marker (set by the `pointMarkerColor` option in `Peaks.init()`).                                                |
| `fontFamily` | `string`      | Font family for the marker text (set by the `fontFamily` option in `Peaks.init()`, default: `'sans-serif'`).                  |
| `fontSize`   | `number`      | Font size, in px, for the marker text (set by the `fontSize` option in `Peaks.init()`, default: `10`)                         |
| `fontShape`  | `string`      | Font shape for the marker text (set by the `fontShape` option in `Peaks.init()`, default: `'normal'`).                        |

The function should return an instance of an object as illustrated by the
`CustomPointMarker` class below.

You can use the `view` option to give the marker a different appearance or
behaviour in the zoomview and overview waveform views.

```javascript
class CustomPointMarker {
  constructor(options) {
    // (required, see below)
  }

  init(group) {
    // (required, see below)
  }

  fitToView() {
    // (required, see below)
  }

  update(options) {
    // (optional, see below)
  }

  destroy() {
    // (optional, see below)
  }
};

function createPointMarker(options) {
  return new CustomPointMarker(options);
}
```

Your custom point marker object must implement the `init` and
`fitToView` methods. It may also optionally implement `update`
and `destroy`. Refer to the [Marker API](#marker-api)
section for details.

### `createSegmentMarker(options)`

The `createSegmentMarker` function returns an object that renders a segment
marker. When called, this function receives an object containing the
following options:

| Name             | Type            | Description                                                                                                                                     |
| ---------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `segment`        | `Segment`       | The `Segment` object associated with this marker. This provides access to the `startTime`, `endTime`, `color`, and `labelText` attributes, etc. |
| `view`           | `string`        | The name of the view that the marker is being created in, either `zoomview` or `overview`.                                                      |
| `layer`          | `SegmentsLayer` | The rendering layer, see [Layer API](#layer-api) for details.                                                                                   |
| `editable`       | `boolean`       | If `true`, the `Segment` start and end times can be changed by dragging the mouse.                                                              |
| `color`          | `string`        | Color for the marker (set by the `segmentOptions.startMarkerColor` or `segmentOptions.endMarkerColor` option in `Peaks.init()`.                 |
| `fontFamily`     | `string`        | Font family for the marker text (set by the `fontFamily` option in `Peaks.init()`, default: `'sans-serif'`).                                    |
| `fontSize`       | `number`        | Font size, in px, for the marker text (set by the `fontSize` option in `Peaks.init()`, default: `10`)                                           |
| `fontShape`      | `string`        | Font shape for the marker text (set by the `fontShape` option in `Peaks.init()`, default: `'normal'`).                                          |
| `startMarker`    | `boolean`       | If `true`, the marker indicates the start time of the segment. If `false`, the marker indicates the end time of the segment.                    |
| `segmentOptions` | `object`        | An object with segment display options for the current view (see `segmentOptions` in [README.md](README.md)).                                   |

The function should return an instance of an object as illustrated by the
`CustomSegmentMarker` class below.

You can use the `view` option to give the marker a different appearance or
behavior in the zoomview and overview waveform views. You can also return
`null` from this function if you do not want to display a segment marker.

```javascript
class CustomSegmentMarker {
  constructor(options) {
    // (required, see below)
  }

  init(group) {
    // (required, see below)
  }

  fitToView() {
    // (required, see below)
  }

  update(options) {
    // (optional, see below)
  }

  destroy() {
    // (optional, see below)
  }
};

function createSegmentMarker(options) {
  return new CustomSegmentMarker(options);
}
```

Your custom segment marker object must implement the `init` and
`fitToView` methods. It may also optionally implement `update`
and `destroy`. Refer to the [Marker API](#marker-api)
section for details.

### Marker API

Marker objects are constructed in two stages, firstly your code uses `new` to
create the marker object, passing the supplied `options` to the constructor.
Then, Peaks.js will call your `init()` method to complete the initialization.

#### `marker.constructor(options)`

The constructor typically just stores the `options` for later use.

```javascript
constructor(options) {
  this._options = options;
}
```

#### `marker.init(group)`

The `init` method should create the Konva objects needed to render the
marker and add them to the supplied `group` object.

| Name      | Type                                                      | Description                                 |
| --------- | --------------------------------------------------------- | ------------------------------------------- |
| `group`   | [`Konva.Group`](https://konvajs.org/api/Konva.Group.html) | A container for the marker's Konva objects. |

The following example creates a point marker as a vertical line with a
rectangular handle.

Note that the `x` and `y` coordinates (0, 0) represent the centre of the marker
and the top of the waveform view.

```javascript
class CustomPointMarker {
  constructor(options) {
    this._options = options;
  }

  init(group) {
    const layer = this._options.layer;
    const height = layer.getHeight();

    this._handle = new Konva.Rect({
      x:      -20,
      y:      0,
      width:  40,
      height: 20,
      fill:   this._options.color
    });

    this._line = new Konva.Line({
      points:      [0.5, 0, 0.5, height], // x1, y1, x2, y2
      stroke:      options.color,
      strokeWidth: 1
    });

    group.add(this._handle);
    group.add(this._line);
  }
}
```

The `init` method can also add your own custom event handlers
(e.g., `mouseenter` and `mouseleave`), if needed.

We can add the following code to the end of the `init()` method from above. This
code changes the color of the marker handle when the user hovers the mouse over
the handle.

```javascript
const layer = this._options.layer;

this._handle.on('mouseenter', () => {
  const highlightColor = '#ff0000';
  this._handle.fill(highlightColor);
  this._line.stroke(highlightColor);
  layer.draw();
});

this._handle.on('mouseleave', () => {
  const defaultColor = this._options.color;
  this._handle.fill(defaultColor);
  this._line.stroke(defaultColor);
  layer.draw();
});
```

#### `marker.fitToView()`

The `fitToView` method is called after the waveform view has been resized.
This method should resize the marker using the available space.
This is typically done when the height of the view changes.

```javascript
fitToView() {
  const layer = this._options.layer;
  const height = layer.getHeight();

  this._line.points([0.5, 0, 0.5, height]);
}
```

#### `marker.update(options)`

The `update` method is called when any of the point or segment attributes
have changed, e.g., by calling `point.update()` or `segment.update()`, or
when the marker's time position has changed. You should use this method to
update the marker as needed.

| Name      | Type     | Description                     |
| --------- | -------- | ------------------------------- |
| `options` | `object` | Contains the updated attributes |

```javascript
update(options) {
  // For a point marker:
  if (options.time !== undefined) {
    console.log('Updated point marker time', options.time);
  }

  // For a segment start/end marker:
  if (options.startTime !== undefined && this._options.startMarker) {
    console.log('Updated segment start marker time', options.startTime);
  }

  if (options.endTime !== undefined && !this._options.startMarker) {
    console.log('Updated segment end marker time', options.endTime);
  }

  if (options.labelText !== undefined) {
    console.log('Updated label text', options.labelText);
  }

  if (options.color !== undefined) {
    this._line.stroke(options.color);
  }

  if (options.editable !== undefined) {
    // Show or hide the Konva shapes that draw the marker
    console.log('Updated editable state', options.editable);
  }
}
```

#### `marker.destroy()`

The `destroy` method is called when the marker is removed from the view.
Any Konva objects added to the `group` in `init()` will be destroyed
automatically, so you only need to add a `destroy` method if additional
clean-up is needed.

```javascript
destroy() {
  console.log('Marker destroyed');
}
```

### Layer API

The `PointsLayer` and `SegmentsLayer` objects allow you to obtain information
about the rendering canvas, and to render changes to the marker Konva objects.
Note that `PointsLayer` and `SegmentsLayer` are not `Konva.Layer` objects.
The following methods are provided:

#### `layer.getHeight()`

Returns the height of the layer, in pixels.

#### `layer.draw()`

Konva will usually automatically redraw if you change any shape attributes,
but you can call this function to force a redraw if needed.

## Segment Labels

By default, Peaks.js shows the segment label when the user hovers the mouse
over a segment. The label is a Konva object created by the `createSegmentLabel`
function passed when calling `Peaks.init()`.

### `createSegmentLabel(options)`

The `createSegmentLabel` function returns a Konva object that is shown when the
user hovers the mouse over the segment. This can be used to display information
about a segment, such as its `labelText`.

You can also return `null` from this function if you do not want to display a
segment label.

| Name      | Type            | Description                                                                                                                                    |
| --------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `segment` | `Segment`       | The `Segment` object associated with this label. This provides access to the `startTime`, `endTime`, `color`, and `labelText` attributes, etc. |
| `view`    | `string`        | The name of the view that the label is being created in, either `zoomview` or `overview`.                                                      |
| `layer`   | `SegmentsLayer` | The rendering layer, see [Layer API](#layer-api) for details.                                                                                  |

```javascript
function createSegmentLabel(options) {
  if (options.view === 'overview') {
    return null;
  }

  return new Konva.Text({
    text:       options.segment.labelText,
    fontSize:   14,
    fontFamily: 'Calibri',
    fill:       'black'
  });
}

const options = {
  // Add other options, as needed.
  createSegmentLabel: createSegmentLabel,
};

Peaks.init(options, function(err, instance) {
  // Use the Peaks.js instance here
});
```

## Media Playback

Peaks.js default media player is based on the
[HTMLMediaElement](https://html.spec.whatwg.org/multipage/media.html#media-elements).
Peaks.js allows you to interface with external media player libraries. This is
most useful for Web Audio based media players such as
[Tone.js](https://tonejs.github.io/) or [Howler.js](https://howlerjs.com/).
Players based on the `HTMLMediaElement` should work as-is without requiring you
to customize Peaks.js.

An external media player can be used by implementing the player interface described
below.

You can find a complete example [here](demo/external-player.html) that shows how
to implement such a player, using [Tone.js](https://tonejs.github.io/).

### Player Interface

The `player` configuration option allows you to pass an object that will be
invoked, either directly by the Peaks.js [Player API](README.md#player-api),
or indirectly by interacting with the waveform view (e.g., seeking via mouse
click or keyboard). You do not need to pass a `mediaElement` configuration
option if you are using `player`.

The structure of the `player` interface is given below:

```javascript
const player = {
  init:           function(eventEmitter) { ... },
  destroy:        function() { ... },
  play:           function() { ... },
  pause:          function() { ... },
  seek:           function(time) { ... },
  isPlaying:      function() { ..., return boolean; },
  isSeeking:      function() { ..., return boolean; },
  getCurrentTime: function() { ..., return number; },
  getDuration:    function() { ..., return number; },
};

const options = {
  // Add other options, as needed.
  player: player
};

Peaks.init(options, function(err, instance) {
  // Use the Peaks.js instance here
});
```

#### player.init(eventEmitter)

Initializes the external media player. This method is called during Peaks.js
initialization.

The player implementation should store the `eventEmitter` for later use.
See the [Events](#events) section for more details for how your custom player
should use the `eventEmitter` to communicate with the `Peaks` instance.

To allow for initialization that may involve asynchronous operations, the
player implementation should return a `Promise` that resolves when the
external media player has been initialized.

```javascript
init(eventEmitter) {
  this.eventEmitter = eventEmitter;
  this.state = 'paused';
  this.interval = null;

  // Initialize the external player
  this.externalPlayer = new MediaPlayer();

  return Promise.resolve();
}
```

#### player.destroy()

Releases resources used by the player.

```javascript
destroy() {
  if (this.interval !== null) {
    clearTimeout(this.interval);
    this.interval = null;
  }

  // Release the external player
  this.externalPlayer.destroy();
  this.externalPlayer = null;
}
```

#### player.setSource(options)

Changes the audio or video media source associated with the Peaks instance.

The `options` are the same as those passed to [`peaks.setSource()`](README.md#instancesetsourceoptions-callback).

This function should return a Promise that resolves when the external media player has been updated.

```javascript
setSource(options) {
  // Use the given options to update the external player

  return Promise.resolve();
}
```

#### player.play()

Starts playback from the current playback position.

This function may return a `Promise` which resolves when playback actually
starts.

A [`player.playing`](#playerplaying-event) event should be emitted when playback starts.

```javascript
play() {
  return this.externalPlayer.play().then(() => {
    this.state = 'playing';
    this.eventEmitter.emit('player.playing', this.getCurrentTime());
  });
}
```

#### player.pause()

Pauses media playback.

A [`player.pause`](#playerpause-event) event should be emitted when playback becomes
paused.

```javascript
pause() {
  this.externalPlayer.pause().then(() => {
    this.state = 'paused';
    this.eventEmitter.emit('player.pause', this.getCurrentTime());
  });
}
```

#### player.seek(time)

Seeks to the given time in seconds.

```javascript
seek(time) {
  this.previousState = this.state; // 'paused' or 'playing'
  this.state = 'seeking';

  this.externalPlayer.seek(time).then(() => {
    this.state = this.previousState;
    this.eventEmitter.emit('player.seeked', this.getCurrentTime());
    this.eventEmitter.emit('player.timeupdate', this.getCurrentTime());
  });
}
```

#### player.isPlaying()

Returns `true` if the player is currently playing, or `false` otherwise.

```javascript
pause() {
  return this.state === 'playing';
}
```

#### player.isSeeking()

Returns `true` if the player is currently seeking, or `false` otherwise.

```javascript
pause() {
  return this.state === 'seeking';
}
```

#### player.getCurrentTime()

Returns the current media playback position, in seconds.

```javascript
getCurrentTime() {
  return this.externalPlayer.currentTime;
}
```

#### player.getDuration()

Returns the total media duration, in seconds.

```javascript
getDuration() {
  return this.externalPlayer.duration;
}
```

### Events

Communication between the custom player and Peaks.js is done via events.
Peaks.js uses these events to update its internal state, such as the
location of the playhead position on screen. Your custom player should
emit events to inform Peaks.js of state changes within the player.

These player events are based on the
[`HTMLMediaElement` events](https://html.spec.whatwg.org/multipage/media.html#mediaevents).

To enable Peaks.js to correctly update its internal state and visually
reflect player state changes, events should only be emitted after the
corresponding player actions have been started.

The following sections describe the events that custom players are
expected to emit.

#### `player.canplay` event

Notifies Peaks.js that media is ready to play.

```javascript
this.eventEmitter.emit('player.canplay');
```

#### `player.error` event

Notifies Peaks.js that an internal player error occurred, such as a failure to
fetch the media data.

The event data should be an `Error` object.

```javascript
this.eventEmitter.emit('player.error', new Error("Failed to start playback"));
```

#### `player.playing` event

Notifies Peaks.js that media playback has started.

The event data should be the current playback position, in seconds.

```javascript
this.eventEmitter.emit('player.playing', this.getCurrentTime());
```

#### `player.pause` event

Notifies Peaks.js that media playback has stopped or paused.

The event data should be the current playback position, in seconds.

```javascript
this.eventEmitter.emit('player.pause', this.getCurrentTime());
```

#### `player.seeked` event

Notifies Peaks.js that a seek operation has completed.

The event data should be the current playback position, in seconds.

```javascript
this.eventEmitter.emit('player.seeked', this.getCurrentTime());
```

#### `player.timeupdate` event

Notifies Peaks.js that the current playback position has changed. To mimic
`HTMLMediaElement` behavior, this event should be emitted approximately every
250 milliseconds during media playback. It should also be emitted after a
successful seek operation.

The event data should be the current playback position, in seconds.

```javascript
this.eventEmitter.emit('player.timeupdate', this.getCurrentTime());
```

## Time Labels

Peaks.js allows you to customize the timestamp labels shown on the time axis or
next to the playhead. This is achieved by providing `formatPlayheadTime` and
`formatAxisTime` functions in the options passed when calling `Peaks.init()`.

These functions accept the time, as a number, and should return a string,
for example:

```javascript
function formatPlayheadTime(time) {
  // Return time formatted to 2 decimal places
  return time.toFixed(2);
}

function formatAxisTime(time) {
  // Return time as a whole number of seconds
  return String(Math.floor(time));
}

const options = {
  // Add other options, as needed.
  formatPlayheadTime: formatPlayheadTime,
  formatAxisTime: formatAxisTime
};

Peaks.init(options, function(err, peaks) {
  // Use the Peaks.js instance here
});
```

Note that if you pass a `formatPlayheadTime` function, the `timeLabelPrecision`
option and `view.setTimeLabelPrecision()` function are ignored.
