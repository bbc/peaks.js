# Peaks.js [![Build Status](https://travis-ci.org/bbc/peaks.js.svg?branch=master)](https://travis-ci.org/bbc/peaks.js)

> A browser based audio waveform visualisation frontend component from BBC R&D.

Peaks.js is a modular client-side JavaScript component designed for the display of and interaction with audio waveform material in the browser.

![](https://github.com/bbc/peaks.js/blob/master/peaks.png?raw=1)

Peaks.js is developed by [BBC R&D](http://www.bbc.co.uk/rd) to allow users to make accurate clippings of audio data over a timeline in browser, using a backend API that serves the waveform data.

Peaks.js uses HTML5 canvas technology to display waveform data at different zoom levels and provides some basic convenience methods for interacting with waveforms and creating time-based visual sections for denoting content to be clipped or for reference, eg: distinguishing music from speech or identifying different music tracks.

[More information about the **Waveform project**](http://waveform.prototyping.bbc.co.uk/).

# Installation

- **npm**: `npm install --save peaks.js`
- *bower*: `bower install --save peaks.js`
- [Browserify CDN](http://wzrd.in/): `http://wzrd.in/standalone/peaks.js`
- *old school*: [download zip file](https://github.com/bbc/peaks.js/archive/master.zip)

# Using Peaks.js in your own project

Peaks.js can be included in any web page by following these steps:

1. include it your web page
1. include a media element and its [waveform data file](https://github.com/bbc/audiowaveform)
1. initialise Peaks.js

```html
<div id="peaks-container"></div>
<audio>
  <source src="test_data/sample.mp3" type="audio/mpeg">
  <source src="test_data/sample.ogg" type="audio/ogg">
</audio>
<script src="bower_components/requirejs/require.js" data-main="app.js"></script>
```

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
require(['peaks'], function (Peaks) {
  var p = Peaks.init({
    container: document.querySelector('#peaks-container'),
    mediaElement: document.querySelector('audio'),
    dataUri: 'test_data/sample.json'
  });

  p.on('segments.ready', function(){
    // do something when segments are ready to be displayed
  });
});
```

A working example is provided in [`index.html`](index.html).

## Start using ES2015 module loader

This works well with systems such as [Meteor](https://www.meteor.com/), [webpack](https://webpack.github.io/) and [browserify](http://browserify.org/) (with [babelify transform](https://github.com/babel/babelify)).

```js
import Peaks from 'peaks.js';

const p = Peaks.init({ … });
```

## Start using CommonJS module loader

This works well with systems such as [Meteor](https://www.meteor.com/), [webpack](https://webpack.github.io/) and [browserify](http://browserify.org/).

```js
var Peaks = require('peaks.js');

var p = Peaks.init({ … });
```

## Start using vanilla JavaScript

```html
<script src="node_modules/peaks.js/peaks.js"></script>
<script>
(function(Peaks){
  var p = Peaks.init({ … });
})(peaks);
</script>
```

## Generate waveform data

Peaks uses waveform data files produced by [audiowaveform](https://github.com/bbc/audiowaveform). These can be generated in either binary (.dat) or JSON format. Binary format is preferred because of the smaller file size, but this is only compatible with [browsers that support Typed Arrays](http://caniuse.com/#feat=typedarrays).

You should also use the `-b 8` option when generating waveform data files, as Peaks does not currently support 16-bit waveform data files, and also to minimise file size.

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

Since `0.3.0`, Peaks.js can use the [Web Audio API](https://www.w3.org/TR/webaudio/) to generate waveforms, which means you would not have to pre-generate a `dat` or `json` file beforehand.

To do so, skip the `dataUri` option and make sure you pass in a valid instance of an AudioContext as the 'audioContext' option. You may also want to make sure [your browser is compatible with Web Audio](http://caniuse.com/#feat=audio-api).

```js
var myAudioContext = new AudioContext();

var p = Peaks.init({
  container: document.querySelector('#peaks-container'),
  mediaElement: document.querySelector('audio'),
  audioContext: myAudioContext
});

p.on('segments.ready', function(){
  // do something when segments are ready to be displayed
});
```

**Notice**: be aware **it can be CPU intensive** if your audio file has a long duration.

# Configuration

The available options for configuration of the viewer are as follows:

```javascript
var options = {
  /** REQUIRED OPTIONS **/
  // Containing element
  container: document.getElementById('peaks-container'),

  // HTML5 Media element containing an audio track
  mediaElement: document.querySelector('audio'),

  /** Optional config with defaults **/
  // URI to waveform data file in binary or JSON
  dataUri: {
    arraybuffer: '../test_data/sample.dat',
    json: '../test_data/sample.json',
  },

  // An Web Audio AudioContext instance which can be used to render the waveform if dataUri is not provided
  audioContext: new AudioContext(),

  // async logging function
  logger: console.error.bind(console),

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

  // Colour for the overview waveform rectangle that shows what the zoom view shows
  overviewHighlightRectangleColor: 'grey',

  // Colour for segments on the waveform
  segmentColor: 'rgba(255, 161, 39, 1)',

  // Colour of the play head
  playheadColor: 'rgba(0, 0, 0, 1)',

  // Colour of the play head text
  playheadTextColor: '#aaa',

  // the color of a point marker
  pointMarkerColor: '#FF0000',

  // Colour of the axis gridlines
  axisGridlineColor: '#ccc',

  // Colour of the axis labels
  axisLabelColor: '#aaa',

  // Random colour per segment (overrides segmentColor)
  randomizeSegmentColor: true,

  // Zoom view adapter to use. Valid adapters are: 'animated' (default) and 'static'
  zoomAdapter: 'animated',

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
  }]
}
```

## Segment Format

Segments provided from Peaks.js use the following format:

```javascript
[{
  // Assigned colour of the segment
  color: "rgba(123, 2, 61, 1)",
  // Editable state of the segment
  editable: true,
  // End time in seconds of the segment
  endTime: 588.986667,
  // Unique ID of the segment
  id: "segment0",
  // Konva.js Element group of segment canvas objects for overview waveform
  overview: Konva.Group,
  // End time in seconds of the segment
  startTime: 578.986667,
  // Konva.js Element group of segment canvas objects for overview waveform
  zoom: Konva.Group
}]
```

## Advanced configuration

The marker and label Konva.js objects may be overridden to give the segment
markers or label your own custom appearance (see main.js / waveform.mixins.js,
[Konva Polygon Example](http://konvajs.github.io/docs/shapes/Line_-_Polygon.html)
and [Konva Text Example](http://konvajs.github.io/docs/shapes/Text.html)):

```javascript
{
  segmentInMarker: mixins.defaultInMarker(p.options),
  segmentOutMarker: mixins.defaultOutMarker(p.options),
  segmentLabelDraw: mixins.defaultSegmentLabelDraw(p.options)
}
```

# API

## Initialisation

The top level `Peaks` object exposes a factory function to create new `Peaks` instances.

### `Peaks.init(options)`

Starts an instance of Peaks with the [assigned options](#Configuration). It allows you to create and manage several instances
of Peaks within a single page with one or several configurations.

```js
var peaksInstance = Peaks.init({ … });
var secondPeaksInstance = Peaks.init({ … });
```

## Time API

### `instance.time.getCurrentTime()`

Returns the current time from the associated HTMLMediaElement, in seconds.
This is a convenience method interchangeable with `mediaElement.currentTime`.

```js
var instance = Peaks.init({ … });

console.log(instance.time.getCurrentTime()); // -> 0
```

### `instance.time.setCurrentTime(time)`

Sets the media element current time in seconds.

```js
var instance = Peaks.init({ … });

instance.time.setCurrentTime(5.85);
console.log(instance.time.getCurrentTime()); // -> 5.85
```

## Zoom API

### `instance.zoom.zoomOut()`

Zooms in the waveform zoom view by one level.

```js
var instance = Peaks.init({ …, zoomLevels: [512, 1024, 2048, 4096] });

instance.zoom.zoomOut(); // zoom level is now 1024
```

### `instance.zoom.zoomIn()`

Zooms in the waveform zoom view by one level.

```js
var instance = Peaks.init({ …, zoomLevels: [512, 1024, 2048, 4096] });

instance.zoom.zoomIn(); // zoom level is still 512

instance.zoom.zoomOut(); // zoom level is now 1024
instance.zoom.zoomIn(); // zoom level is now 512 again
```

### `instance.zoom.setZoom(index)`

Sets the zoom level to the element in the `options.zoomLevels` array at index `index`.

```js
var instance = Peaks.init({ …, zoomLevels: [512, 1024, 2048, 4096] });

instance.zoom.setZoom(3); // zoom level is now 4096
```

### `instance.zoom.getZoom()`

Returns the current zoom level, as an index into the `options.zoomLevels` array.

```js
var instance = Peaks.init({ …, zoomLevels: [512, 1024, 2048, 4096] });

instance.zoom.zoomOut();
console.log(instance.zoom.getZoom()); // -> 1
```

## Segments API

**Segments** give the ability to visually tag timed portions of a media object.
This is a great way to provide visual cues to your users.

### `instance.segments.add({startTime, endTime, editable, color, labelText, id})`
### `instance.segments.add(segment[])`

Adds a segment to the waveform timeline. Accepts the following parameters:

* `startTime`: the segment start time (seconds)
* `endTime`: the segment end time (seconds)
* `editable`: (optional) sets whether the segment is user editable (boolean, defaults to `false`)
* `color`: (optional) the segment color. If not specified, the segment is given a default color (see the `segmentColor` and
`randomizeSegmentColor` [options](#Configuration)).
* `id`: (optional) the segment identifier. If not specified, the segment is automatically given a unique identifier.

```js
var instance = Peaks.init({ … });

// Add non-editable segment, from 0 to 10.5 seconds, with a random color
instance.segments.add({startTime: 0, endTime: 10.5});
```

Alternatively, provide an array of segment objects to add all those segments at once.

```js
var instance = Peaks.init({ … });

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

Returns an array of objects representing all displayed segments present on the timeline in the segment format.

### `instance.segments.removeByTime(startTime[, endTime])`

Removes any segment which starts at `startTime` (seconds), and which optionally ends at `endTime` (seconds).

The return value indicates the number of deleted segments.

```js
var instance = Peaks.init({ … });

instance.segments.add([{ startTime: 10, endTime: 12 }, { startTime: 10, endTime: 20 }]);

// remove both segments as they start at `10`
instance.segments.removeByTime(10);

// remove only the first segment
instance.segments.removeByTime(10, 12);
```

### `instance.segments.removeById(segmentId)`

Removes segments with the given identifier.

```js
var instance = Peaks.init({ … });

instance.segments.removeById('peaks.segment.3');
```

### `instance.segments.removeAll()`

Removes all segments.

```js
var instance = Peaks.init({ … });

instance.segments.removeAll();
```

## Destruction

### `instance.destroy()`

Releases resources used by an instance. This can be useful when reinitialising Peaks.js within a single page application.

```js
var instance = Peaks.init({ … });

// later:
instance.destroy();
```

## Events

Peaks instances emit events to enable you to extend its behaviour according to your needs.

### General

                           | Arguments
---------------------------|----------------
`error`                    | `Error err`

### Media / User interactions

                           | Arguments
---------------------------|----------------
`segments.ready`           | N/A
`user_seek.overview`       | `float time`
`user_seek.zoomview`       | `float time`

### Waveforms

                           | Arguments
---------------------------|----------------
`zoom.update`              | `float currentZoomLevel`, `float previousZoomLevel`

### Segments / Points

                           | Arguments
---------------------------|----------------
`segments.ready`           | N/A
`points.ready`             | N/A
`segments.dragged`         | `Segment segment`
`points.dragged`           | `Point point`

# Building Peaks.js

You might want to build a minified standalone version of Peaks.js, to test a contribution or to run additional tests.
The project bundles everything you need to do so.

## Prerequisites

```bash
git clone https://github.com/bbc/peaks.js.git
cd peaks.js
npm install
```

## Building

This command will produce a UMD-compatible minified standalone version of Peaks.js, which allows you to use it with AMD or CommonJS module loaders, or even as vanilla JavaScript.

```bash
npm run build
```

The output of the build is a file named `peaks.js`, alongside its associated [source map](https://hacks.mozilla.org/2013/05/compiling-to-javascript-and-debugging-with-source-maps/).

## Live Demo

This command will serve a local demo page containing a single Peaks instance. Look at the file [index.html](https://github.com/bbc/peaks.js/blob/master/index.html) to see an example of Peaks.js in use.

```bash
npm start
```

Then open http://localhost:9000 in a Web browser.

# Testing

`npm test` should work for simple one time testing.

If you are developing and want to repeatedly run tests in a browser on your machine simply launch `npm run watch`.

# License

See [COPYING](COPYING).

This project includes sample audio from the radio show [Desert Island Discs](http://en.wikipedia.org/wiki/File:Alice_walker_bbc_radio4_desert_island_discs_19_05_2013.flac), used under the terms of the [Creative Commons 3.0 Unported License](http://creativecommons.org/licenses/by/3.0/).

# Credits

- [Chris Finch](http://github.com/chrisfinch)
- [Thomas Parisot](https://github.com/oncletom)
- [Chris Needham](http://github.com/chrisn)

Copyright 2016, British Broadcasting Corporation.
