# Peaks.js Version Migration Guide

This document describes any breaking changes in the Peaks.js API and provides advice on how to migrate your code to the updated API.

## Peaks.js v3.0.0

Peaks.js v3.0.0 introduces a number of changes, described in the following sections.

### `Peaks.init()` configuration options

The segment customization options have been moved under a new `segmentOptions` object in the call to `Peaks.init()`, and some options have been renamed:

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

### `randomizeSegmentColor`

The `randomizeSegmentColor` option has been removed. This option was `true` by default in earlier versions. Instead of using this option, set the `color` attribute when calling [`segments.add()`](https://github.com/bbc/peaks.js#instancesegmentsaddsegment).

### Custom marker API

The [Marker API](customizing.md#marker-api) for creating custom point and segment markers has changed. In earlier versions, updating a point or segment's attributes would cause the corresponding marker to be destroyed and then constructed again. Markers are no longer re-created on update. There is now a new `update()` method, which you should use to update a custom point or segment marker when any of its attributes have been updated. The `timeUpdated()` method has been removed, as the `update()` method provides the same functionality.

```js
// Before
class CustomSegmentMarker {
  constructor(options) {
    this._options = options;
  }

  init(group) {
    this._group = group;

    // Create Konva.js objects to render the marker

    this.fitToView();
    this.bindEventHandlers();
  }

  bindEventHandlers() {
    // etc
  }

  fitToView() {
    // etc
  }

  timeUpdated(time) {
    this._label.setText(this._options.layer.formatTime(time));
  }
}

// After
class CustomSegmentMarker {
  constructor(options) {
    this._options = options;
  }

  init(group) {
    this._group = group;

    // Create Konva.js objects to render the marker.
    //
    // See demo/custom-markers/custom-point-marker.js
    // and demo/custom-markers/custom-segment-marker.js
    // for complete examples.

    this.fitToView();
    this.bindEventHandlers();
  }

  bindEventHandlers() {
    // etc
  }

  fitToView() {
    // etc
  }

  update(options) {
    if (options.startTime !== undefined && this._options.startMarker) {
      console.log('Updated segment start marker time', options.startTime);
    }

    if (options.endTime !== undefined && !this._options.startMarker) {
      console.log('Updated segment end marker time', options.endTime);
    }

    if (options.labelText !== undefined) {
      console.log('Updated label text', options.labelText);
    }

    if (options.editable !== undefined) {
      // Show or hide Konva.js objects as needed
    }
  }
}
```

### `points.add`, `points.remove`, `segments.add`, and `segments.remove` events

These events now receive an `event` object:

Before:

```javascript
peaks.on('points.add', function(points) {
  points.forEach(function(point) {
    console.log(point);
  });
});

peaks.on('segments.remove', function(segments) {
  segments.forEach(function(segment) {
    console.log(segment);
  });
});
```

After:

```javascript
peaks.on('points.add', function(event) {
  event.points.forEach(function(point) {
    console.log(point);
  });
});

peaks.on('segments.remove', function(event) {
  event.segments.forEach(function(segment) {
    console.log(segment);
  });
});
```

### `points.enter`, `segments.enter`, and `segments.exit` events

Cue events (`points.enter`, `segments.enter`, `segments.exit`) now receive an `event` object that contains the point or segment, together with `time`, the current playback position.

Before:

```javascript
peaks.on('segments.enter', function(segment) {
  console.log(segment);
});
```

After:

```javascript
peaks.on('segments.enter', function(event) {
  console.log(event.segment);
  console.log(event.time);
});
```

### `zoom.update` event

The `zoom.update` event now receives an `event` object:

Before:

```javascript
peaks.on('zoom.update', function(currentZoom, previousZoom) {
  console.log(currentZoom, previousZoom);
});
```

After:

```javascript
peaks.on('zoom.update', function(event) {
  console.log(event.currentZoom);
  console.log(event.previousZoom);
});
```

### Window resize handling

Before v3.0.0, Peaks.js would listen for window `resize` events and update the waveform views if the container elements changed size.

This feature has been removed, because the container elements can change size for other reasons than resizing the window.

We recommend that you use a [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver). Please refer to the [`fitToContainer()`](API.md#viewfittocontainer) documentation for example code.

## Peaks.js v2.0.0

Peaks.js v2.0.0 changes how [custom player objects](customizing.md#media-playback) should be initialized. To allow for initialization that may involve asynchronous operations, your custom player object's `init` function must now return a `Promise` that resolves when the player has been initialized.

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
