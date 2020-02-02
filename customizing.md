# Customizing Peaks.js

This document describes how to customize various aspects of the waveform rendering in Peaks.js.

Peaks.js makes use of the [Konva.js](https://konvajs.org/) graphics library,
and so we recommend becoming familiar with Konva. You may find the following tutorials helpful:

* [Konva Polygon Tutorial](https://konvajs.github.io/docs/shapes/Line_-_Polygon.html)
* [Konva Text Tutorial](https://konvajs.github.io/docs/shapes/Text.html)
* [Konva Label Tutorial](https://konvajs.github.io/docs/shapes/Label.html)

**Note:** The APIs described in this document are not yet stable, and so may
change at any time.

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

There is a complete example demo available [here](demo/custom-markers.html) that
shows how to use these functions to draw custom point and segment marker
handles.

### `createPointMarker(options)`

The `createPointMarker` function returns an object that renders a point marker
handle. When called, this function receives an object containing the following
options:

| Name        | Type          | Description                                                                                                                          |
| ----------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `point`     | `Point`       | The `Point` object associated with this marker handle. This provides access to the `time`, `color`, and `labelText` attributes, etc. |
| `view`      | `string`      | The name of the view that the marker handle is being created in, either `zoomview` or `overview`.                                    |
| `layer`     | `PointsLayer` | The rendering layer, see [Layer API](#layer-api) for details.                                                                        |
| `draggable` | `boolean`     | If `true`, the marker is draggable.                                                                                                  |
| `color`     | `string`      | Color for the marker handle (set by the `pointMarkerColor` option in `Peaks.init()`.                                                 |

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

  timeUpdated() {
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

Your custom point marker handle object must implement the `init` and
`fitToView` methods. It may also optionally implement `timeUpdated` and
`destroy`. Refer to the [Marker methods](#marker-methods) section for
details.

### `createSegmentMarker(options)`

The `createSegmentMarker` function returns an object that renders a segment
marker handle. When called, this function receives an object containing the
following options:

| Name           | Type            | Description                                                                                                                                            |
| -------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `segment`      | `Segment`       | The `Segment` object associated with this marker handle. This provides access to the `startTime`, `endTime`, `color`, and `labelText` attributes, etc. |
| `view`         | `string`        | The name of the view that the marker handle is being created in, either `zoomview` or `overview`.                                                      |
| `layer`        | `SegmentsLayer` | The rendering layer, see [Layer API](#layer-api) for details.                                                                                          |
| `draggable`    | `boolean`       | This value is always `true` for segment marker handles.                                                                                                |
| `color`        | `string`        | Color for the marker handle (set by the `segmentStartMarkerColor` or `segmentEndMarkerColor` option in `Peaks.init()`.                                 |
| `startMarker`  | `boolean`       | If `true`, the marker indicates the start time of the segment. If `false`, the marker indicates the end time of the segment.                           |

The function should return an instance of an object as illustrated by the
`CustomSegmentMarker` class below.

You can use the `view` option to give the marker a different appearance or
behaviour in the zoomview and overview waveform views. You can also return
`null` from this function if you do not want to display a segment marker handle.

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

  timeUpdated() {
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

Your custom segment marker handle object must implement the `init` and
`fitToView` methods. It may also optionally implement `timeUpdated` and
`destroy`. Refer to the [Marker methods](#marker-methods) section for details.

### Marker methods

Marker objects are constructed in two stages, firstly your code uses `new` to
create the marker object, passing the supplied `options` to the constructor.
Then, Peaks.js will call your `init()` method to complete the initialization.

#### `constructor(options)`

The constructor typically just stores the `options` for later use.

```javascript
constructor(options) {
  this._options = options;
}
```

#### `init(group)`

The `init` method should create the Konva objects needed to render the
marker handle and add them to the supplied `group` object.

| Name      | Type                                                      | Description                                                                                                                          |
| --------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `group`   | [`Konva.Group`](https://konvajs.org/api/Konva.Group.html) | A container for the marker's Konva objects.                                                                                          |
| `options` | `object`                                                  | The same options passed to [`createPointMarker`](#createpointmarkeroptions) or [`createSegmentMarker`](#createsegmentmarkeroptions). |

The following example creates a point marker handle as a vertical line with a
rectangular handle.

Note that the `x` and `y` coordinates (0, 0) represent the centre of the marker
and the top of the waveform view.

```javascript
class CustomPointMarker
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

#### `fitToView()`

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

#### `timeUpdated(time)`

The `timeUpdated` method is called when the marker's time position has changed.
This is the marker's `time` attribute (for point markers), or `startTime` or
`endTime` (for segment markers).

| Name   | Type     | Description                      |
| ------ | -------- | -------------------------------- |
| `time` | `number` | Marker time position, in seconds |

```javascript
timeUpdated(time) {
  console.log('Marker time', time);
}
```

#### `destroy()`

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

Redraws the layer. Call this method after creating or updating any Konva
objects.

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
