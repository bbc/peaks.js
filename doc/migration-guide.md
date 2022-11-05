# Peaks.js Version Migration Guide

This document describes any breaking changes in the Peaks.js API and provides advice on how to migrate your code to the updated API.

## Peaks.js v3.0.0

Peaks.js v3.0.0 adds a number of new customization options for segments. These have been moved under a new `segmentOptions` object in the call to `Peaks.init()`.

```js
// Before
Peaks.init({
  // Include other options as needed
  segmentStartMarkerColor: '#888',
  segmentEndMarkerColor: '#888',
  segmentColor: '#800'
}, function(err, peaks) {
  // ...
});

// After
Peaks.init({
  // Include other options as needed
  segmentOptions: {
    startMarkerColor: '#888',
    endMarkerColor: '#888',
    waveformColor: '#800'
  }
}, function(err, peaks) {
  // ...
});
```

The following options have also been moved, so you will need to update your code as shown below.

- `containers` (use `zoomview.container` or `overview.container`instead)
- `overviewWaveformColor` (use `overview.waveformColor` instead)
- `overviewHighlightOffset` (use `overview.highlightOffset` instead)
- `overviewHighlightColor` (use `overview.highlightColor` instead)
- `zoomWaveformColor` (use `zoomview.waveformColor` instead)

```js
// Before
Peaks.init({
  containers: {
    zoomview: document.getElementById('zoomview-container'),
    overview: document.getElementById('overview-container')
  },
  zoomWaveformColor: '#00e180',
  overviewWaveformColor: '#cccccc',
  overviewHighlightOffset: 11,
  overviewHighlightColor: '#aaaaaa'
  // Include other options as needed
}, function(err, peaks) {
  // ...
});

// After
Peaks.init({
  zoomview: {
    container: document.getElementById('zoomview-container'),
    waveformColor: '#00e180'
  },
  overview: {
    container: document.getElementById('overview-container'),
    waveformColor: '#cccccc',
    highlightOffset: 11,
    highlightColor: '#aaaaaa'
  }
  // Include other options as needed
}, function(err, peaks) {
  // ...
});
```

Finally, the `randomizeSegmentColor` option has been removed. This option was `true` by default in earlier versions. Instead of using this option, set the `color` attribute when calling [`segments.add()`](https://github.com/bbc/peaks.js#instancesegmentsaddsegment).

## Peaks.js v2.0.0

Peaks.js v2.0.0 changes how [custom player objects](../customizing.md#media-playback) should be initialized. To allow for initialization that may involve asynchronous operations, your custom player object's `init` function must now return a `Promise` that resolves when the player has been initialized.

If your application does not use a custom player object, i.e., the `player` option when calling `Peaks.init()`, then updating to v2.0.0 does not require you to make any changes.

```js
class CustomPlayer {
  init(eventEmitter) {
    this.eventEmitter = eventEmitter;
    this.state = 'paused';
    this.interval = null;

    // Initialize the external player
    this.externalPlayer = new MediaPlayer();

    // Returning a promise is now required
    return Promise.resolve();
  },

  // ... other player methods, as shown in customizing.md
};

const options = {
  // Add other options, as needed.
  player: player
};

Peaks.init(options, function(err, instance) {
  // Use the Peaks.js instance here
});
```

## Peaks.js v1.0.0

Peaks.js v1.0.0 changes a number of event handlers to also expose the [MouseEvent](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent) or [PointerEvent](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent), so that applications can, for example, check the keyboard state during `click` and other events. This is a breaking API change and so you will need to update your code, as shown below.

### Waveform events

- `overview.click`, `overview.dblclick`,
- `zoomview.click`, `zoomview.dblclick`

```js
// Before
peaks.on('zoomview.click', function(time) {
  console.log(time);
});

// After
peaks.on('zoomview.click', function(event) {
  console.log(event.time);
  console.log(event.evt.ctrlKey);
  console.log(event.evt.shiftKey);
});
```

### Point events

- `points.dragstart`, `points.dragmove`, `points.dragend`
- `points.mouseenter`, `points.mouseleave`
- `points.click`, `points.dblclick`

```js
// Before
peaks.on('points.click', function(point) {
  console.log(point);
});

// After
peaks.on('points.click', function(event) {
  console.log(event.point);
  console.log(event.evt.ctrlKey);
  console.log(event.evt.shiftKey);
});
```

### Segment events

- `segments.dragstart`, `segments.dragged`, `segments.dragend`

```js
// Before
peaks.on('segments.dragged', function(segment, startMarker) {
  console.log(segment);
  console.log(startMarker);
});

// After
peaks.on('segments.dragged', function(event) {
  console.log(event.segment);
  console.log(event.startMarker);
  console.log(event.evt.ctrlKey);
  console.log(event.evt.shiftKey);
});
```

- `segments.mouseenter`, `segments.mouseleave`
- `segments.click`, `segments.dblclick`

```js
// Before
peaks.on('segments.click', function(segment) {
  console.log(segment);
});

// After
peaks.on('segments.click', function(event) {
  console.log(event.segment);
  console.log(event.evt.ctrlKey);
  console.log(event.evt.shiftKey);
});
```
