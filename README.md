[![Build Status](https://travis-ci.org/bbc/peaks.js.svg?branch=master)](https://travis-ci.org/bbc/peaks.js)

<p align="center">
  <a href="https://github.com/bbc/peaks.js"><img src="peaks-logo.svg" alt="Peaks.js" height="120" /></a>
</p>

#

<p align="center">
    <strong>A client-side JavaScript component to display and interact with audio waveforms in the browser</strong>
</p>

![](https://github.com/bbc/peaks.js/blob/master/peaks.png?raw=1)

Peaks.js was developed by [BBC R&D](https://www.bbc.co.uk/rd) to allow users to make accurate clippings of audio content in the browser, using a backend API that serves the waveform data.

Peaks.js uses the HTML canvas element to display the waveform at different zoom levels, and has configuration options to allow you to customise the waveform views. Peaks.js allows users to interact with the waveform views, including zooming and scrolling, and creating point or segment markers that denote content to be clipped or for reference, e.g., distinguishing music from speech or identifying different music tracks.

### Features

* Zoomable and scrollable waveform view
* Fixed width waveform view
* Mouse, touch, scroll wheel, and keyboard interaction
* Client-side waveform computation, using the Web Audio API, for convenience
* Server-side waveform computation, for efficiency
* Mono, stereo, or multi-channel waveform views
* Create point or segment marker annotations
* Customisable waveform views

You can read more about the project and see a demo [here](https://waveform.prototyping.bbc.co.uk/).

# Contents

- [Installation](#installation)
- [Demos](#demos)
- [Using Peaks.js in your own project](#using-peaksjs-in-your-own-project)
  - [Start using AMD and require.js](#start-using-amd-and-requirejs)
  - [Start using ES2015 module loader](#start-using-es2015-module-loader)
  - [Start using CommonJS module loader](#start-using-commonjs-module-loader)
  - [Start using vanilla JavaScript](#start-using-vanilla-javascript)
  - [Generate waveform data](#generate-waveform-data)
  - [Web Audio based waveforms](#web-audio-based-waveforms)
- [Configuration](#configuration)
  - [Advanced configuration](#advanced-configuration)
- [API](#api)
  - [Initalisation](#initialisation)
    - [Peaks.init()](#peaksinitoptions-callback)
    - [instance.setSource()](#instancesetsourceoptions-callback)
  - [Player API](#player-api)
    - [instance.player.play()](#instanceplayerplay)
    - [instance.player.pause()](#instanceplayerpause)
    - [instance.player.getCurrentTime()](#instanceplayergetcurrenttime)
    - [instance.player.getDuration()](#instanceplayergetduration)
    - [instance.player.seek()](#instanceplayerseektime)
    - [instance.player.playSegment()](#instanceplayerplaysegmentsegment)
  - [Views API](#views-api)
    - [instance.views.getView()](#instanceviewsgetviewname)
    - [instance.views.createZoomview()](#instanceviewscreatezoomviewcontainer)
    - [instance.views.createOverview()](#instanceviewscreateoverviewcontainer)
  - [Zoom API](#zoom-api)
    - [instance.zoom.zoomIn()](#instancezoomzoomin)
    - [instance.zoom.zoomOut()](#instancezoomzoomout)
    - [instance.zoom.setZoom()](#instancezoomsetzoomindex)
    - [instance.zoom.getZoom()](#instancezoomgetzoom)
  - [Segments API](#segments-api)
    - [instance.segments.add()](#instancesegmentsaddsegment)
    - [instance.segments.getSegments()](#instancesegmentsgetsegments)
    - [instance.segments.getSegment()](#instancesegmentsgetsegmentid)
    - [instance.segments.removeByTime()](#instancesegmentsremovebytimestarttime-endtime)
    - [instance.segments.removeById()](#instancesegmentsremovebyidsegmentid)
    - [instance.segments.removeAll()](#instancesegmentsremoveall)
  - [Segment API](#segment-api)
    - [segment.update()](#segmentupdatestarttime-endtime-labeltext-color-editable)
  - [Points API](#points-api)
    - [instance.points.add()](#instancepointsaddpoint)
    - [instance.points.getPoints()](#instancepointsgetpoints)
    - [instance.points.getPoint()](#instancepointsgetpointid)
    - [instance.points.removeByTime()](#instancepointsremovebytimetime)
    - [instance.points.removeById()](#instancepointsremovebyidpointid)
    - [instance.points.removeAll()](#instancepointsremoveall)
  - [Point API](#point-api)
    - [point.update()](#pointupdatetime-labeltext-color-editable)
  - [View Settings API](#view-settings-api)
    - [view.setAmplitudeScale()](#viewsetamplitudescalescale)
    - [view.setWaveformColor()](#viewsetwaveformcolorcolor)
    - [view.showPlayheadTime()](#viewshowplayheadtimeshow)
    - [view.enableAutoScroll()](#viewenableautoscrollenable)
  - [Destruction](#destruction)
    - [instance.destroy()](#instancedestroy)
  - [Events](#events)
- [Building Peaks.js](#building-peaksjs)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

# Installation

- **npm**: `npm install --save peaks.js`
- **bower**: `bower install --save peaks.js`
- [Browserify CDN](https://wzrd.in/): `http://wzrd.in/standalone/peaks.js`
- [cdnjs](https://cdnjs.com/): `https://cdnjs.com/libraries/peaks.js`

# Demos

The [demo](demo) folder contains some working examples of Peaks.js in use. To view these, enter the following commands:

```bash
git clone git@github.com:bbc/peaks.js.git
cd peaks.js
npm install
npm start
```

and then open your browser at http://localhost:8080.

# Using Peaks.js in your own project

Peaks.js can be included in any web page by following these steps:

1. include it your web page
1. include a media element and its [waveform data file](https://github.com/bbc/audiowaveform)
1. initialise Peaks.js

```html
<div id="peaks-container">
  <div id="zoomview-container"></div>
  <div id="overview-container"></div>
</div>
<audio>
  <source src="test_data/sample.mp3" type="audio/mpeg">
  <source src="test_data/sample.ogg" type="audio/ogg">
</audio>
<script src="bower_components/requirejs/require.js" data-main="app.js"></script>
```

Note that the container `div`s should be left empty, as shown above, as their
content will be replaced by the waveform view `canvas` elements.

## Start using AMD and [require.js](http://requirejs.org/)

AMD modules work out of the box without any optimiser.

```javascript
// in app.js
// configure peaks path
requirejs.config({
  paths: {
    peaks: 'bower_components/peaks.js/src/main',
    EventEmitter: 'bower_components/eventemitter2/lib/eventemitter2',
    Konva: 'bower_components/konvajs/konva',
    'waveform-data': 'bower_components/waveform-data/dist/waveform-data.min'
  }
});

// require it
require(['peaks'], function(Peaks) {
  const options = {
    containers: {
      overview: document.getElementById('overview-container'),
      zoomview: document.getElementById('zoomview-container')
    }
    mediaElement: document.querySelector('audio'),
    dataUri: 'test_data/sample.json'
  };

  Peaks.init(options, function(err, peaks) {
    // Do something when the waveform is displayed and ready.
  });
});
```

## Start using ES2015 module loader

This works well with systems such as [Meteor](https://www.meteor.com/), [webpack](https://webpack.github.io/) and [browserify](http://browserify.org/) (with [babelify transform](https://github.com/babel/babelify)).

```js
import Peaks from 'peaks.js';

const options = { ... };

Peaks.init(options, function(err, peaks) {
  // ...
});
```

## Start using CommonJS module loader

This works well with systems such as [Meteor](https://www.meteor.com/), [webpack](https://webpack.github.io/) and [browserify](http://browserify.org/).

```js
var Peaks = require('peaks.js');

const options = { ... };

Peaks.init(options, function(err, peaks) {
  // ...
});
```

## Start using vanilla JavaScript

```html
<script src="node_modules/peaks.js/peaks.js"></script>
<script>
(function(Peaks) {
  const options = { ... };

  Peaks.init(options, function(err, peaks) {
    // ...
  });
})(peaks);
</script>
```

## Generate waveform data

Peaks.js uses waveform data files produced by [audiowaveform](https://github.com/bbc/audiowaveform). These can be generated in either binary (.dat) or JSON format. Binary format is preferred because of the smaller file size, but this is only compatible with [browsers that support Typed Arrays](https://caniuse.com/#feat=typedarrays).

You should also use the `-b 8` option when generating waveform data files, as Peaks.js does not currently support 16-bit waveform data files, and also to minimise file size.

To generate a binary waveform data file:

```
audiowaveform -i sample.mp3 -o sample.dat -b 8
```

To generate a JSON format waveform data file:

```
audiowaveform -i sample.mp3 -o sample.json -b 8
```

Refer to the man page audiowaveform(1) for full details of the available command line options.

## Web Audio based waveforms

Peaks.js can use the [Web Audio API](https://www.w3.org/TR/webaudio/) to generate waveforms, which means you do not have to pre-generate a `dat` or `json` file beforehand. However, note that this requires the browser to download the entire audio file before the waveform can be shown, and this process can be CPU intensive, so is not recommended for long audio files.

To use Web Audio, omit the `dataUri` option and instead pass a `webAudio` object that contains an `AudioContext` instance. Your browser must [support](https://caniuse.com/#feat=audio-api) the Web Audio API.

```js
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

const options = {
  containers: {
    overview: document.getElementById('overview-waveform'),
    zoomview: document.getElementById('zoomview-waveform')
  },
  mediaElement: document.querySelector('audio'),
  webAudio: {
    audioContext: audioContext
  }
};

Peaks.init(options, function(err, peaks) {
  // Do something when the waveform is displayed and ready
});
```

Alternatively, if you have an `AudioBuffer` containing decoded audio samples, e.g., from
[AudioContext.decodeAudioData](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData)
then an `AudioContext` is not needed:

```js
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

// arrayBuffer contains the encoded audio (e.g., MP3 format)
audioContext.decodeAudioData(arrayBuffer)
  .then(function(audioBuffer) {
    const options = {
      containers: {
        overview: document.getElementById('overview-waveform'),
        zoomview: document.getElementById('zoomview-waveform')
      },
      mediaElement: document.querySelector('audio'),
      webAudio: {
        audioBuffer: audioBuffer
      }
    };

    Peaks.init(options, function(err, peaks) {
      // Do something when the waveform is displayed and ready
    });
  });
```

# Configuration

The available options for configuration of the viewer are as follows:

```javascript
var options = {
  /** REQUIRED OPTIONS **/
  // Containing element: either
  container: document.getElementById('peaks-container'),

  // or (preferred):
  containers: {
    zoomview: document.getElementById('zoomview-container'),
    overview: document.getElementById('overview-container')
  },

  // HTML5 Media element containing an audio track
  mediaElement: document.querySelector('audio'),

  /** Optional config with defaults **/
  // URI to waveform data file in binary or JSON
  dataUri: {
    arraybuffer: '../test_data/sample.dat',
    json: '../test_data/sample.json',
  },

  // If true, Peaks.js will send credentials with all network requests,
  // i.e., when fetching waveform data.
  withCredentials: false,

  webAudio: {
    // A Web Audio AudioContext instance which can be used
    // to render the waveform if dataUri is not provided
    audioContext: new AudioContext(),

    // Alternatively, provide an AudioBuffer containing the decoded audio
    // samples. In this case, an AudioContext is not needed
    audioBuffer: null,

    // If true, the waveform will show all available channels.
    // If false, the audio is shown as a single channel waveform.
    multiChannel: false
  },

  // async logging function
  logger: console.error.bind(console),

  // if true, emit cue events on the Peaks instance (see Cue Events)
  emitCueEvents: false,

  // default height of the waveform canvases in pixels
  height: 200,

  // Array of zoom levels in samples per pixel (big >> small)
  zoomLevels: [512, 1024, 2048, 4096],

  // Bind keyboard controls
  keyboard: false,

  // Keyboard nudge increment in seconds (left arrow/right arrow)
  nudgeIncrement: 0.01,

  // Colour for the in marker of segments
  inMarkerColor: '#a0a0a0',

  // Colour for the out marker of segments
  outMarkerColor: '#a0a0a0',

  // Colour for the zoomed in waveform
  zoomWaveformColor: 'rgba(0, 225, 128, 1)',

  // Colour for the overview waveform
  overviewWaveformColor: 'rgba(0,0,0,0.2)',

  // Colour for the overview waveform rectangle
  // that shows what the zoom view shows
  overviewHighlightRectangleColor: 'grey',

  // Colour for segments on the waveform
  segmentColor: 'rgba(255, 161, 39, 1)',

  // Colour of the play head
  playheadColor: 'rgba(0, 0, 0, 1)',

  // Colour of the play head text
  playheadTextColor: '#aaa',

  // Show current time next to the play head
  // (zoom view only)
  showPlayheadTime: false,

  // the color of a point marker
  pointMarkerColor: '#FF0000',

  // Colour of the axis gridlines
  axisGridlineColor: '#ccc',

  // Colour of the axis labels
  axisLabelColor: '#aaa',

  // Random colour per segment (overrides segmentColor)
  randomizeSegmentColor: true,

  // Array of initial segment objects with startTime and
  // endTime in seconds and a boolean for editable.
  // See below.
  segments: [{
    startTime: 120,
    endTime: 140,
    editable: true,
    color: "#ff0000",
    labelText: "My label"
  },
  {
    startTime: 220,
    endTime: 240,
    editable: false,
    color: "#00ff00",
    labelText: "My Second label"
  }],

  // Array of initial point objects
  points: [{
    time: 150,
    editable: true,
    color: "#00ff00",
    labelText: "A point"
  },
  {
    time: 160,
    editable: true,
    color: "#00ff00",
    labelText: "Another point"
  }]
}
```

## Advanced configuration

The marker and label Konva.js objects may be overridden to give the segment
markers or label your own custom appearance (see main.js / waveform.mixins.js,
[Konva Polygon Example](https://konvajs.github.io/docs/shapes/Line_-_Polygon.html)
and [Konva Text Example](https://konvajs.github.io/docs/shapes/Text.html)):

```javascript
{
  segmentInMarker: mixins.defaultInMarker(p.options),
  segmentOutMarker: mixins.defaultOutMarker(p.options),
  segmentLabelDraw: mixins.defaultSegmentLabelDraw(p.options)
}
```

**Note:** This part of the API is not yet stable, and so may change at any time.

# API

## Initialisation

The top level `Peaks` object exposes a factory function to create new `Peaks` instances.

### `Peaks.init(options, callback)`

Returns a new `Peaks` instance with the [assigned options](#Configuration).
The callback is invoked after the instance has been created and initialised.
You can create and manage several `Peaks` instances within a single page with one or several configurations.

```js
const options = { ... };

Peaks.init(options, function(err, peaks) {
  console.log(peaks.player.getCurrentTime());
});
```

For backwards compatibility, you can still create a new `Peaks` instance using:

```js
const peaks = Peaks.init({ ... });

peaks.on('ready', function() {
  console.log(peaks.player.getCurrentTime());
});
```

### `instance.setSource(options, callback)`

Changes the audio or video media source associated with the `Peaks` instance. Depending on the `options` specified, the waveform is either requested from a server or is generated by the browser using the Web Audio API.

The `options` parameter is an object with the following keys. Either `dataUri` or `webAudio` must be specified, but not both.

* `mediaUrl`: Audio or video media URL
* `dataUri`: (optional) If requesting waveform data from a server, this should be an object containing `arraybuffer` and/or `json` values
  * `arraybuffer`: (optional) URL of the binary format waveform data (.dat) to request
  * `json`: (optional) URL of the JSON format waveform data to request
* `webAudio`: (optional) If using the Web Audio API to generate the waveform, this should be an object containing the following values:
  * `audioContext`: (optional) A Web Audio `AudioContext` instance, used to compute the waveform data from the media
  * `audioBuffer`: (optional) A Web Audio `AudioBuffer` instance, containing the decoded audio samples. If present, this audio data is used and the `mediaUrl` is not fetched.
  * `multiChannel`: (optional) If `true`, the waveform will show all available channels. If `false` (the default), the audio is shown as a single channel waveform.
* `withCredentials`: (optional) If `true`, Peaks.js will send credentials when requesting the waveform data from a server
* `zoomLevels`: (optional) Array of zoom levels in samples per pixel. If not present, the values passed to [Peaks.init()](#peaksinitoptions-callback) will be used

For example, to change the media URL and request pre-computed waveform data from the server:

```js
const peaks = Peaks.init({ ... });

const options = {
  mediaUrl: '/sample.mp3',
  dataUri: {
    arraybuffer: '/sample.dat',
    json: '/sample.json',
  }
};

peaks.setSource(options, function(error) {
  // Waveform updated
});
```

Or, to change the media URL and use the Web Audio API to generate the waveform:

```js
const peaks = Peaks.init({ ... });

const audioContext = new AudioContext();

const options = {
  mediaUrl: '/sample.mp3',
  webAudio: {
    audioContext: audioContext,
    multiChannel: true
  }
};

peaks.setSource(options, function(error) {
  // Waveform updated
});
```

## Player API

### `instance.player.play()`

Starts media playback, from the current time position.

```js
instance.player.play();
```

### `instance.player.pause()`

Pauses media playback.

```js
instance.player.pause();
```

### `instance.player.getCurrentTime()`

Returns the current time from the associated media element, in seconds.

```js
const time = instance.player.getCurrentTime();
```

### `instance.player.getDuration()`

Returns the duration of the media, in seconds.

```js
const duration = instance.player.getDuration();
```

### `instance.player.seek(time)`

Seeks the media element to the given time, in seconds.

```js
instance.player.seek(5.85);
const time = instance.player.getCurrentTime();
```

### `instance.player.playSegment(segment)`

Plays a given segment of the media.

```js
const segment = instance.segments.add({
  startTime: 5.0,
  endTime: 15.0,
  editable: true
});

// Plays from 5.0 to 15.0, then stops.
instance.player.playSegment(segment);
```

## Views API

A single Peaks instance may have up to two associated waveform views: a zoomable view, or "zoomview", and a non-zoomable view, or "overview".

The Views API allows you to create or obtain references to these views.

### `instance.views.getView(name)`

Returns a reference to one of the views. The `name` parameter can be omitted if there is only one view, otherwise it should be set to either `'zoomview'` or `'overview'`.

```js
const view = instance.views.getView('zoomview');
```

### `instance.views.createZoomview(container)`

Creates a zoomable waveform view in the given container element.

```js
const container = document.getElementById('zoomview-container');
const view = instance.views.createZoomview(container);
```

### `instance.views.createOverview(container)`

Creates a non-zoomable ("overview") waveform view in the given container element.

```js
const container = document.getElementById('overview-container');
const view = instance.views.createOverview(container);
```

## Zoom API

### `instance.zoom.zoomOut()`

Zooms in the waveform zoom view by one level.

Assuming the Peaks instance has been created with zoom levels: 512, 1024, 2048, 4096

```js
const instance = Peaks.init({ ..., zoomLevels: [512, 1024, 2048, 4096] });

instance.zoom.zoomOut(); // zoom level is now 1024
```

### `instance.zoom.zoomIn()`

Zooms in the waveform zoom view by one level.

```js
const instance = Peaks.init({ ..., zoomLevels: [512, 1024, 2048, 4096] });

instance.zoom.zoomIn(); // zoom level is still 512

instance.zoom.zoomOut(); // zoom level is now 1024
instance.zoom.zoomIn(); // zoom level is now 512 again
```

### `instance.zoom.setZoom(index)`

Sets the zoom level to the element in the `options.zoomLevels` array at index `index`.

```js
const instance = Peaks.init({ ..., zoomLevels: [512, 1024, 2048, 4096] });

instance.zoom.setZoom(3); // zoom level is now 4096
```

### `instance.zoom.getZoom()`

Returns the current zoom level, as an index into the `options.zoomLevels` array.

```js
const instance = Peaks.init({ ..., zoomLevels: [512, 1024, 2048, 4096] });

instance.zoom.zoomOut();
console.log(instance.zoom.getZoom()); // -> 1
```

## Segments API

**Segments** give the ability to visually tag timed portions of the audio media.
This is a great way to provide visual cues to your users.

### `instance.segments.add({startTime, endTime, editable, color, labelText, id})`
### `instance.segments.add(segment[])`

Adds a segment to the waveform timeline. Accepts the following parameters:

* `startTime`: the segment start time (seconds)
* `endTime`: the segment end time (seconds)
* `editable`: (optional) sets whether the segment is user editable (boolean, defaults to `false`)
* `color`: (optional) the segment color. If not specified, the segment is given a default color (see the `segmentColor` and
`randomizeSegmentColor` [options](#Configuration))
* `labelText`: (option) a text label which is displayed when the user hovers the mouse pointer over the segment
* `id`: (optional) the segment identifier. If not specified, the segment is automatically given a unique identifier

```js
// Add non-editable segment, from 0 to 10.5 seconds, with a random color
instance.segments.add({ startTime: 0, endTime: 10.5 });
```

Alternatively, provide an array of segment objects to add all those segments at once.

```js
instance.segments.add([
  {
    startTime: 0,
    endTime: 10.5,
    labelText: '0 to 10.5 seconds non-editable demo segment'
  },
  {
    startTime: 3.14,
    endTime: 4.2,
    color: '#666'
  }
]);
```

### `instance.segments.getSegments()`

Returns an array of all segments present on the timeline.

```js
const segments = instance.segments.getSegments();
```

### `instance.segments.getSegment(id)`

Returns the segment with the given id, or `null` if not found.

```js
const segment = instance.segments.getSegment('peaks.segment.3');
```

### `instance.segments.removeByTime(startTime[, endTime])`

Removes any segment which starts at `startTime` (seconds), and which optionally ends at `endTime` (seconds).

The return value indicates the number of deleted segments.

```js
instance.segments.add([
  { startTime: 10, endTime: 12 },
  { startTime: 10, endTime: 20 }
]);

// Remove both segments as they start at `10`
instance.segments.removeByTime(10);

// Remove only the first segment
instance.segments.removeByTime(10, 12);
```

### `instance.segments.removeById(segmentId)`

Removes segments with the given identifier.

```js
instance.segments.removeById('peaks.segment.3');
```

### `instance.segments.removeAll()`

Removes all segments.

```js
instance.segments.removeAll();
```

## Segment API

A **segment**'s properties can be updated programatically.

### `segment.update({startTime, endTime, labelText, color, editable})`

Updates an existing segment. Accepts a single parameter - `options` - with the following keys:

* `startTime`: (optional) the segment start time (seconds, defaults to current value)
* `endTime`: (optional)  the segment end time (seconds, defaults to current value)
* `editable`: (optional) sets whether the segment is user editable (boolean, defaults to current value)
* `color`: (optional) the segment color (defaults to current value)
* `labelText`: (optional) a text label which is displayed when the user hovers the mouse pointer over the segment (defaults to current value)

```js
const instance = Peaks.init({ ... });
instance.segments.add({ ... });
const segment = instance.segments.getSegments()[0]
// Or use instance.segments.getSegment(id)

segment.update({ startTime: 7 });
segment.update({ startTime: 7, labelText: "new label text" });
segment.udpate({ startTime: 7, endTime: 9, labelText: 'new label text' });
// etc.
```

## Points API

**Points** give the ability to visually tag points in time of the audio media.

### `instance.points.add({time, editable, color, labelText, id})`
### `instance.points.add(point[])`

Adds one or more points to the waveform timeline. Accepts the following parameters:

* `time`: the point time (seconds)
* `editable`: (optional) sets whether the point is user editable (boolean, defaults to `false`)
* `color`: (optional) the point color. If not specified, the point is given a default color (see the `pointMarkerColor` [option](#Configuration))
* `labelText`: (optional) a text label which is displayed next to the segment. If not given, the point's time is displayed
* `id`: (optional) the point identifier. If not specified, the point is automatically given a unique identifier

```js
// Add non-editable point, with a random color
instance.points.add({ time: 3.5 });
```

Alternatively, provide an array of point objects to add several at once.

```js
instance.points.add([
  {
    time: 3.5,
    labelText: 'Test point',
    color: '#666'
  },
  {
    time: 5.6,
    labelTect: 'Another test point',
    color: '#666'
  }
]);
```

### `instance.points.getPoints()`

Returns an array of all points present on the timeline.

```js
const points = instance.points.getPoints();
```

### `instance.points.getPoint(id)`

Returns the point with the given id, or `null` if not found.

```js
const point = instance.points.getPoint('peaks.point.3');
```

### `instance.points.removeByTime(time)`

Removes any point at the given `time` (seconds).

```js
instance.points.removeByTime(10);
```

### `instance.points.removeById(pointId)`

Removes points with the given identifier.

```js
instance.points.removeById('peaks.point.3');
```

### `instance.points.removeAll()`

Removes all points.

```js
instance.points.removeAll();
```

## Point API

A **point**'s properties can be updated programatically.

### `point.update({time, labelText, color, editable})`

Updates an existing point. Accepts a single parameter - `options` - with the following keys:

* `time`: (optional) the point's time (seconds, defaults to current value)
* `editable`: (optional) sets whether the point is user editable (boolean, defaults to current value)
* `color`: (optional) the point color (defaults to current value)
* `labelText`: (optional) a text label which is displayed when the user hovers the mouse pointer over the point (defaults to current value)

```js
const instance = Peaks.init({ ... });
instance.points.add({ ... });
const point = instance.points.getPoints()[0]
// Or use instance.points.getPoint(id)

point.update({ time: 7 });
point.update({ time: 7, labelText: "new label text" });
// etc.
```

## View Settings API

Some view properties can be updated programmatically.

### `view.setAmplitudeScale(scale)`

Changes the amplitude (vertical) waveform scale. The default scale is 1.0. If greater than 1.0, the waveform is increased in height. If between 0.0 and 1.0, the waveform is reduced in height.

```js
const view = instance.views.getView('zoomview');
view.setAmplitudeScale(1.0);
```

### `view.setWaveformColor(color)`

Sets the waveform color, as a string containing any valid [CSS color value](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value).

The initial color is controlled by the `zoomWaveformColor` and `overviewWaveformColor` configuration options.

```js
const view = instance.views.getView('zoomview');
view.setWaveformColor('#800080'); // Purple
```

### `view.showPlayheadTime(show)`

Shows or hides the current playback time, shown next to the playhead.

The initial setting is `false`, for the overview waveform view, or controlled by the `showPlayheadTime` configuration option for the zoomable waveform view.

```js
const view = instance.views.getView('zoomview');
view.showPlayeadTime(false); // Remove the time from the playhead marker.
```

### `view.enableAutoScroll(enable)`

Enables or disables auto-scroll behaviour (enabled by default). This only applies to the zoomable waveform view.

```js
const view = instance.views.getView('zoomview');
view.enableAutoScroll(false);
```

## Cue events

Emit events when the playhead reaches a point or segment boundary.

```js
const peaks = Peaks.init({ ..., emitCueEvents: true });
peaks.on('points.enter', function(point) { ... });
peaks.on('segments.enter', function(segment) { ... });
peaks.on('segments.exit', function(segment) { ... });
```

## Destruction

### `instance.destroy()`

Releases resources used by an instance. This can be useful when reinitialising Peaks.js within a single page application.

```js
instance.destroy();
```

## Events

Peaks instances emit events to enable you to extend its behaviour according to your needs.

### Media / User interactions

| Event name    | Arguments |
| ------------- | --------- |
| `peaks.ready` | (none)    |

### Waveforms

| Event name                | Arguments                                             |
| ------------------------- | ----------------------------------------------------- |
| `zoom.update`             | `Number currentZoomLevel`, `Number previousZoomLevel` |

### Segments

| Event name                | Arguments                 |
| ------------------------- | ------------------------- |
| `segments.add`            | `Array<Segment> segments` |
| `segments.remove`         | `Array<Segment> segments` |
| `segments.remove_all`     | (none)                    |
| `segments.dragged`        | `Segment segment`         |
| `segments.mouseenter`     | `Segment segment`         |
| `segments.mouseleave`     | `Segment segment`         |
| `segments.click`          | `Segment segment`         |

### Points

| Event name                | Arguments             |
| ------------------------- | --------------------- |
| `points.add`              | `Array<Point> points` |
| `points.remove`           | `Array<Point> points` |
| `points.remove_all`       | (none)                |
| `points.dragstart`        | `Point point`         |
| `points.dragmove`         | `Point point`         |
| `points.dragend`          | `Point point`         |
| `points.mouseenter`       | `Point point`         |
| `points.mouseleave`       | `Point point`         |
| `points.dblclick`         | `Point point`         |

### Cue Events

To enable cue events, call `Peaks.init()` with the `{ emitCueEvents: true }` option. When the playhead reaches a point or segment boundary, a cue event is emitted.

| Event name               | Arguments                |
| ------------------------ | ------------------------ |
| `points.enter`           | `Point point`            |
| `segments.enter`         | `Segment segment`        |
| `segments.exit`          | `Segment segment`        |

# Building Peaks.js

You might want to build a minified standalone version of Peaks.js, to test a contribution or to run additional tests. The project bundles everything you need to do so.

## Prerequisites

```bash
git clone git@github.com:bbc/peaks.js.git
cd peaks.js
npm install
```

## Building

This command will produce a UMD-compatible minified standalone version of Peaks.js, which allows you to use it with AMD or CommonJS module loaders, or even as vanilla JavaScript.

```bash
npm run build
```

The output of the build is a file named `peaks.js`, alongside its associated [source map](https://hacks.mozilla.org/2013/05/compiling-to-javascript-and-debugging-with-source-maps/).

# Testing

Tests run in Karma using Mocha + Chai + Sinon.

 - `npm test` should work for simple one time testing.
 - `npm test -- --glob %pattern%` to run selected test suite(s) only
 - `npm run test-watch` if you are developing and want to repeatedly run tests in a browser on your machine.
 - `npm run test-watch -- --glob %pattern%` is also available

# Contributing

If you'd like to contribute to Peaks.js, please take a look at our [contributer guidelines](CONTRIBUTING.md).

# License

See [COPYING](COPYING).

This project includes sample audio from the radio show [Desert Island Discs](https://en.wikipedia.org/wiki/File:Alice_walker_bbc_radio4_desert_island_discs_19_05_2013.flac), used under the terms of the [Creative Commons 3.0 Unported License](http://creativecommons.org/licenses/by/3.0/).

# Credits

- [Chris Finch](https://github.com/chrisfinch)
- [Thomas Parisot](https://github.com/oncletom)
- [Chris Needham](https://github.com/chrisn)

Copyright 2019 British Broadcasting Corporation
