# Peaks.js API Documentation

This document describes the Peaks.js API, including configuration options, function calls, and events.

## Contents

- [Configuration](#configuration)
  - [Marker customization](#marker-customization)
  - [Player customization](#player-customization)
  - [Time label customization](#time-label-customization)
- [Methods](#methods)
  - [Initialization](#initialization)
    - [Peaks.init()](#peaksinitoptions-callback)
    - [instance.setSource()](#instancesetsourceoptions-callback)
    - [instance.getWaveformData()](#instancegetwaveformdata)
  - [Player API](#player-api)
    - [instance.player.play()](#instanceplayerplay)
    - [instance.player.pause()](#instanceplayerpause)
    - [instance.player.getCurrentTime()](#instanceplayergetcurrenttime)
    - [instance.player.getDuration()](#instanceplayergetduration)
    - [instance.player.seek()](#instanceplayerseektime)
    - [instance.player.playSegment()](#instanceplayerplaysegmentsegment-loop)
  - [Views API](#views-api)
    - [instance.views.getView()](#instanceviewsgetviewname)
    - [instance.views.getScrollbar()](#instanceviewsgetscrollbar)
    - [instance.views.createZoomview()](#instanceviewscreatezoomviewcontainer)
    - [instance.views.createOverview()](#instanceviewscreateoverviewcontainer)
    - [instance.views.destroyZoomview()](#instanceviewsdestroyzoomview)
    - [instance.views.destroyOverview()](#instanceviewsdestroyoverview)
  - [View API](#view-api)
    - [view.setAmplitudeScale()](#viewsetamplitudescalescale)
    - [view.setWaveformColor()](#viewsetwaveformcolorcolor)
    - [view.setPlayedWaveformColor()](#viewsetplayedwaveformcolorcolor)
    - [view.showPlayheadTime()](#viewshowplayheadtimeshow)
    - [view.setTimeLabelPrecision()](#viewsettimeLabelPrecisionprecision)
    - [view.showAxisLabels()](#viewshowaxislabelsshow-options)
    - [view.enableAutoScroll()](#viewenableautoscrollenable-options)
    - [view.enableMarkerEditing()](#viewenablemarkereditingenable)
    - [view.enableSegmentDragging()](#viewenablesegmentdraggingenable)
    - [view.setSegmentDragMode()](#viewsetsegmentdragmodemode)
    - [view.setMinSegmentDragWidth()](#viewsetminsegmentdragwidthwidth)
    - [view.setWaveformDragMode()](#viewsetwaveformdragmodemode)
    - [view.fitToContainer()](#viewfittocontainer)
    - [view.setZoom()](#viewsetzoomoptions)
    - [view.setStartTime()](#viewsetstarttimetime)
    - [view.setWheelMode()](#viewsetwheelmodemode-options)
    - [view.enableSeek()](#viewenableseekenable)
  - [Scrollbar API](#scrollbar-api)
    - [scrollbar.fitToContainer()](#scrollbarfittocontainer)
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
    - [segment.update()](#segmentupdateoptions)
  - [Points API](#points-api)
    - [instance.points.add()](#instancepointsaddpoint)
    - [instance.points.getPoints()](#instancepointsgetpoints)
    - [instance.points.getPoint()](#instancepointsgetpointid)
    - [instance.points.removeByTime()](#instancepointsremovebytimetime)
    - [instance.points.removeById()](#instancepointsremovebyidpointid)
    - [instance.points.removeAll()](#instancepointsremoveall)
  - [Point API](#point-api)
    - [point.update()](#pointupdateoptions)
  - [Event Handling](#event-handling)
    - [instance.on()](#instanceonevent-callback)
    - [instance.once()](#instanceonceevent-callback)
    - [instance.off()](#instanceoffevent-callback)
  - [Destruction](#destruction)
    - [instance.destroy()](#instancedestroy)
- [Events](#events)
  - [Initialization Events](#initialization-events)
    - [peaks.ready](#peaksready)
  - [Player Events](#player-events)
    - [player.canplay](#playercanplay)
    - [player.error](#playererror)
    - [player.pause](#playerpause)
    - [player.playing](#playerplaying)
    - [player.seeked](#playerseeked)
    - [player.timeupdate](#playertimeupdate)
    - [player.ended](#playerended)
  - [Waveform View Events](#waveform-view-events)
    - [overview.click](#overviewclick)
    - [overview.dblclick](#overviewdblclick)
    - [overview.contextmenu](#overviewcontextmenu)
    - [zoomview.click](#zoomviewclick)
    - [zoomview.dblclick](#zoomviewdblclick)
    - [zoomview.contextmenu](#zoomviewcontextmenu)
    - [zoom.update](#zoomupdate)
  - [Point Events](#point-events)
    - [points.add](#pointsadd)
    - [points.remove](#pointsremove)
    - [points.remove_all](#pointsremove_all)
    - [points.dragstart](#pointsdragstart)
    - [points.dragmove](#pointsdragmove)
    - [points.dragend](#pointsdragend)
    - [points.mouseenter](#pointsmouseenter)
    - [points.mouseleave](#pointsmouseleave)
    - [points.click](#pointsclick)
    - [points.dblclick](#pointsdblclick)
    - [points.contextmenu](#pointscontextmenu)
    - [points.enter](#pointsenter)
  - [Segment Events](#segment-events)
    - [segments.add](#segmentsadd)
    - [segments.insert](#segmentsinsert)
    - [segments.remove](#segmentsremove)
    - [segments.remove_all](#segmentsremove_all)
    - [segments.dragstart](#segmentsdragstart)
    - [segments.dragged](#segmentsdragged)
    - [segments.dragend](#segmentsdragend)
    - [segments.mouseenter](#segmentsmouseenter)
    - [segments.mouseleave](#segmentsmouseleave)
    - [segments.mousedown](#segmentsmousedown)
    - [segments.mouseup](#segmentsmouseup)
    - [segments.click](#segmentsclick)
    - [segments.dblclick](#segmentsdblclick)
    - [segments.contextmenu](#segmentscontextmenu)
    - [segments.enter](#segmentsenter)
    - [segments.exit](#segmentsexit)

# Configuration

Peaks.js provides a number of configuration options, as follows:

```javascript
var options = {

  //
  // Zoomable waveform view options
  //

  zoomview: {
    // Container <div> element for the zoomable waveform view
    container: document.getElementById('zoomview-container'),

    // Color for the zoomable waveform
    // You can also use a 2 stop gradient here. See setWaveformColor()
    waveformColor: 'rgba(0, 225, 128, 1)',

    // Color for the played region of the zoomable waveform
    // You can also use a 2 stop gradient here. See setWaveformColor()
    playedWaveformColor: 'rgba(0, 225, 128, 1)',

    // Color of the playhead
    playheadColor: 'rgba(0, 0, 0, 1)',

    // Color of the playhead text
    playheadTextColor: '#aaa',

    // Background color of the playhead text
    playheadBackgroundColor: 'transparent',

    // Padding around the playhead text (pixels)
    playheadPadding: 2,

    // Tolerance for clicks in the zoomview to be interpreted as
    // dragging the playhead (pixels)
    playheadClickTolerance: 3,

    // Returns a string for the playhead timestamp label
    formatPlayheadTime: function,

    // Show current time next to the playhead
    showPlayheadTime: false,

    // Precision of time label of playhead and point/segment markers
    timeLabelPrecision: 2,

    // Color of the axis gridlines
    axisGridlineColor: '#ccc',

    // Color of the axis labels
    axisLabelColor: '#aaa',

    // Returns a string for the axis label timestamps
    formatAxisTime: function,

    // Show or hide the axis label timestamps
    showAxisLabels: true,

    // Height of the axis markers at the top of the waveform
    axisTopMarkerHeight: 10,

    // Height of the axis markers at the top of the waveform
    axisBottomMarkerHeight: 10,

    // Font family for axis labels, playhead, and point and segment markers
    fontFamily: 'sans-serif',

    // Font size for axis labels, playhead, and point and segment markers
    fontSize: 11,

    // Font style for axis labels, playhead, and point and segment markers
    // (either 'normal', 'bold', or 'italic')
    fontStyle: 'normal',

    // Mouse-wheel mode: either 'none' or 'scroll'
    wheelMode: 'none',

    // Auto-scroll the waveform when the playhead reaches the edge of
    // the visible waveform
    autoScroll: true,

    // The offset in pixels edge of the visible waveform to trigger
    // auto-scroll
    autoScrollOffset: 100,

    // Enables point markers to be shown on the zoomable waveform
    enablePoints: true,

    // Enables segments to be shown on the zoomable waveform
    enableSegments: true,

    segmentOptions: {
      // Some segment options can be overridden for the zoomable waveform,
      // see segmentOptions below
    }
  },

  //
  // Overview waveform options
  //

  overview: {
    // Container <div> element for the non-zoomable "overview" waveform
    container: document.getElementById('overview-container')

    // Color for the overview waveform
    // You can also use a 2 stop gradient here. See setWaveformColor()
    waveformColor: 'rgba(0,0,0,0.2)',

    // Color for the played region of the overview waveform
    // You can also use a 2 stop gradient here. See setWaveformColor()
    playedWaveformColor: 'rgba(0, 225, 128, 1)',

    // Color for the overview waveform rectangle
    // that shows what the zoomable view shows
    highlightColor: 'grey',

    // Stroke color for the zoomed region
    highlightStrokeColor:   'transparent',

    // Opacity for the zoomed region
    highlightOpacity:       0.3,

    // Corner Radius for the zoomed region
    highlightCornerRadius:  2,

    // The default number of pixels from the top and bottom of the canvas
    // that the overviewHighlight takes up
    highlightOffset: 11,

    // Color of the playhead
    playheadColor: 'rgba(0, 0, 0, 1)',

    // Color of the playhead text
    playheadTextColor: '#aaa',

    // Background color of the playhead text
    playheadBackgroundColor: 'transparent',

    // Padding around the playhead text (pixels)
    playheadPadding: 2,

    // Returns a string for the playhead timestamp label
    formatPlayheadTime: function,

    // Show current time next to the playhead
    showPlayheadTime: false,

    // Precision of time label of playhead and point/segment markers
    timeLabelPrecision: 2,

    // Color of the axis gridlines
    axisGridlineColor: '#ccc',

    // Color of the axis labels
    axisLabelColor: '#aaa',

    // Returns a string for the axis label timestamps
    formatAxisTime: function,

    // Show or hide the axis label timestamps
    showAxisLabels: true,

    // Height of the axis markers at the top of the waveform
    axisTopMarkerHeight: 10,

    // Height of the axis markers at the top of the waveform
    axisBottomMarkerHeight: 10,

    // Font family for axis labels, playhead, and point and segment markers
    fontFamily: 'sans-serif',

    // Font size for axis labels, playhead, and point and segment markers
    fontSize: 11,

    // Font style for axis labels, playhead, and point and segment markers
    // (either 'normal', 'bold', or 'italic')
    fontStyle: 'normal',

    // Enables point markers to be shown on the overview waveform
    enablePoints: true,

    // Enables segments to be shown on the overview waveform
    enableSegments: true,

    segmentOptions: {
      // Some segment options can be overridden for the overview waveform,
      // see segmentOptions below
    }
  },

  //
  // Scrollbar options
  //

  scrollbar: {
    // Container <div> element for the scrollbar
    container: document.getElementById('scrollbar-container'),

    // Scrollbar color. The background color can be set using CSS on the
    // scrollbar container element
    color: '#888888',

    // Minimum scrollbar handle width, in pixels
    minWidth: 50
  }

  // HTML media element containing an audio track
  mediaElement: document.querySelector('audio'),

  //
  // Pre-computed waveform data options
  //

  dataUri: {
    // Binary format waveform data URL
    arraybuffer: '/data/sample.dat',

    // JSON format waveform data URL
    json: '/data/sample.json',
  },

  waveformData: {
    // ArrayBuffer containing binary format waveform data
    arraybuffer: null,

    // Object containing JSON format waveform data
    json: null
  },

  // If true, Peaks.js will send credentials with all network requests,
  // i.e., when fetching waveform data
  withCredentials: false,

  //
  // Web Audio generated waveform data options
  //

  webAudio: {
    // A Web Audio AudioContext instance which can be used
    // to render the waveform if dataUri is not provided
    audioContext: new AudioContext(),

    // Alternatively, provide an AudioBuffer containing the decoded audio
    // samples. In this case, an AudioContext is not needed
    audioBuffer: null,

    // If true, the waveform will show all available channels
    // If false, the audio is shown as a single channel waveform
    multiChannel: false
  },

  // Array of zoom levels in samples per pixel. Smaller numbers represent
  // being more "zoomed in".
  zoomLevels: [512, 1024, 2048, 4096],

  // To avoid computation when changing zoom level, Peaks.js maintains a cache
  // of waveforms at different zoom levels. This is enabled by default, but
  // can be disabled by setting waveformCache to false
  waveformCache: true

  //
  // Keyboard input options
  //

  // Bind keyboard controls
  keyboard: false,

  // Keyboard nudge increment in seconds (left arrow/right arrow)
  nudgeIncrement: 0.01,

  //
  // Default view options. Each of these can be set independently for each
  // waveform view, under the 'zoomview' and 'overview' options
  // (described above).
  //

  // Waveform color
  // You can also use a 2 stop gradient here. See setWaveformColor()
  waveformColor: 'rgba(0, 225, 128, 1)',

  // Color for the played waveform region
  // You can also use a 2 stop gradient here. See setWaveformColor()
  playedWaveformColor: 'rgba(0, 225, 128, 1)',

  // Color of the playhead
  playheadColor: 'rgba(0, 0, 0, 1)',

  // Color of the playhead text
  playheadTextColor: '#aaa',

  // Background color of the playhead text
  playheadBackgroundColor: 'transparent',

  // Padding around the playhead text (pixels)
  playheadPadding: 2,

  // Color of the axis gridlines
  axisGridlineColor: '#ccc',

  // Color of the axis labels
  axisLabelColor: '#aaa',

  // Font family for axis labels, playhead, and point and segment markers
  fontFamily: 'sans-serif',

  // Font size for axis labels, playhead, and point and segment markers
  fontSize: 11,

  // Font style for axis labels, playhead, and point and segment markers
  // (either 'normal', 'bold', or 'italic')
  fontStyle: 'normal',

  // Precision of time label of playhead and point/segment markers
  timeLabelPrecision: 2,

  // Show current time next to the playhead (zoomview only)
  showPlayheadTime: false,

  //
  // Point and segment options
  //

  // Default point marker color
  pointMarkerColor: '#ff0000',

  // if true, emit cue events on the Peaks instance (see Cue Events)
  emitCueEvents: false,

  // Enables point markers to be shown on the waveform views
  enablePoints: true,

  // Enables segments to be shown on the waveform views
  enableSegments: true,

  segmentOptions: {
    // Enable segment markers
    markers: true,

    // Enable segment overlays
    overlay: false,

    // Color for segment start marker handles
    startMarkerColor: '#aaaaaa',

    // Color for segment end marker handles
    endMarkerColor: '#aaaaaa',

    // Segment waveform color
    waveformColor: '#ff851b',

    // Segment overlay color
    overlayColor: '#ff0000',

    // Segment overlay opacity
    overlayOpacity: 0.3,

    // Segment overlay border color
    overlayBorderColor: '#ff0000',

    // Segment overlay border width
    overlayBorderWidth: 2,

    // Segment overlay border corner radius
    overlayCornerRadius: 5,

    // Segment overlay offset from the top and bottom of the waveform view, in pixels
    overlayOffset: 25,

    // Segment overlay label alignment, either 'top-left' or 'center'
    overlayLabelAlign: 'top-left',

    // Segment overlay label offset, in pixels
    overlayLabelPadding: 8,

    // Segment overlay label color
    overlayLabelColor: '#000000',

    // Segment overlay font family
    overlayFontFamily: 'sans-serif',

    // Segment overlay font size
    overlayFontSize: 12,

    // Segment overlay font style
    overlayFontStyle: 'normal'
  },

  //
  // Customization options (see customizing.md)
  //

  createSegmentMarker: null,
  createSegmentLabel: null,
  createPointMarker: null,
  player: null,

  //
  // Point and segment initialization
  //

  segments: [
    {
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
    }
  ],

  points: [
    {
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
    }
  ],

  //
  // Debugging options
  //

  // Diagnostic or error information is written to this function.
  // The default is console.error
  logger: console.error.bind(console)
};
```

## Marker customization

Peaks.js allows you to customize the appearance of the point and segment
markers, by specifying the following configuration options: `createPointMarker`,
`createSegmentMarker`, and `createSegmentLabel`. Please read
[Customizing Peaks.js](customizing.md) for more details.

## Player customization

By default, Peaks.js supports audio playback using the HTML `<audio>` or
`<video>` element using the `mediaElement` configuration option. Peaks.js also
allows you to use your own custom media player library, using the `player`
option. Please read [Customizing Peaks.js](customizing.md#media-playback) for more details.

## Time label customization

Peaks.js allows you to customize the appearance of the time labels in the
time axis and next to the playhead, using the `formatPlayheadTime` and
`formatAxisTime` options. Please read
[Customizing Peaks.js](customizing.md#time-labels) for more details.

# Methods

## Initialization

The top level `Peaks` object exposes a factory function to create new `Peaks` instances.

### `Peaks.init(options, callback)`

Creates a new `Peaks` instance with the [assigned options](#Configuration).
The callback is invoked after the instance has been created and initialized, or if any errors occur during initialization.
You can create and manage several `Peaks` instances within a single page with one or several configurations.

```js
const options = { ... };

Peaks.init(options, function(err, peaks) {
  if (err) {
    console.error('Failed to initialize Peaks instance: ' + err.message);
    return;
  }

  console.log(peaks.player.getCurrentTime());
});
```

### `instance.setSource(options, callback)`

Changes the audio or video media source associated with the `Peaks` instance.

You should call this method when you want to change the audio or video media URL instead of directly setting the media element's `src` attribute, so that the `Peaks` instance can update the waveform views.

If you are using a [custom player object](customizing.md#media-playback) it's your responsibility to change the audio or video content in the player, but you should also call this method to update the waveform views.

Depending on the `options` specified, the waveform is either requested from a server or is generated by the browser using the Web Audio API.

The `options` parameter is an object with the following keys. Only one of `dataUri`, `waveformData`, or `webAudio` must be specified.

* `mediaUrl`: Audio or video media URL. This is required if you are using an `<audio>` or `<video>` element, and should be omitted if you are using a [custom player object](customizing.md#media-playback)
* `dataUri`: (optional) If requesting waveform data from a server, this should be an object containing `arraybuffer` and/or `json` values
  * `arraybuffer`: (optional) URL of the binary format waveform data (.dat) to request
  * `json`: (optional) URL of the JSON format waveform data to request
* `waveformData`: (optional) If using local or previously requested waveform data, this should be an object containing `arraybuffer` and/or `json` values
  * `arraybuffer`: (optional) the binary format waveform data (.dat)
  * `json`: (optional) the JSON format waveform data
* `webAudio`: (optional) If using the Web Audio API to generate the waveform, this should be an object containing the following values:
  * `audioContext`: (optional) A Web Audio `AudioContext` instance, used to compute the waveform data from the media
  * `audioBuffer`: (optional) A Web Audio `AudioBuffer` instance, containing the decoded audio samples. If present, this audio data is used and the `mediaUrl` is not fetched.
  * `multiChannel`: (optional) If `true`, the waveform will show all available channels. If `false` (the default), the audio is shown as a single channel waveform.
* `withCredentials`: (optional) If `true`, Peaks.js will send credentials when requesting the waveform data from a server
* `zoomLevels`: (optional) Array of zoom levels in samples per pixel. If not present, the values passed to [Peaks.init()](#peaksinitoptions-callback) will be used

For example, to change the media URL and request pre-computed waveform data from the server:

```js
const options = {
  mediaUrl: '/sample.mp3',
  dataUri: {
    arraybuffer: '/sample.dat',
    json: '/sample.json',
  }
};

instance.setSource(options, function(error) {
  // Waveform updated
});
```

Or, to change the media URL and use the Web Audio API to generate the waveform:

```js
const audioContext = new AudioContext();

const options = {
  mediaUrl: '/sample.mp3',
  webAudio: {
    audioContext: audioContext,
    multiChannel: true
  }
};

instance.setSource(options, function(error) {
  // Waveform updated
});
```

### `instance.getWaveformData()`

Returns an object that contains the waveform data that Peaks.js uses to render the waveform. Refer to the [WaveformData API documentation](https://github.com/bbc/waveform-data.js/blob/master/doc/API.md) for details of how to use the returned `WaveformData` object.

```js
const waveformData = instance.getWaveformData();
console.log(waveformData);
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

### `instance.player.playSegment(segment[, loop])`

Plays a given segment of the media, with optional looped playback.

```js
const segment = instance.segments.add({
  startTime: 5.0,
  endTime: 15.0,
  editable: true
});

// Plays from 5.0 to 15.0 then stops.
instance.player.playSegment(segment);

// Plays from 5.0 to 15.0 and loops.
instance.player.playSegment(segment, true);
```

## Views API

A single Peaks instance may have up to two associated waveform views: a zoomable view, or "zoomview", and a non-zoomable view, or "overview".

The Views API allows you to create or obtain references to these views.

### `instance.views.getView(name)`

Returns a reference to one of the views, or `null` if the requested view is not available. The `name` parameter can be omitted if there is only one view, otherwise it should be set to either `'zoomview'` or `'overview'`. See [View API](#view-api) for methods available on the returned view object.

```js
const view = instance.views.getView('zoomview');
```

### `instance.views.getScrollbar()`

Returns a reference to the scrollbar, or `null` if there is no scrollbar. See [Scrollbar API](#scrollbar-api) for methods available on the returned scrollbar object.

```js
const scrollbar = instance.views.getScrollbar();
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

### `instance.views.destroyZoomview()`

Destroys the zoomable waveform view.

```js
instance.views.destroyZoomview();

const container = document.getElementById('zoomview-container');
container.style.display = 'none';
```

### `instance.views.destroyOverview()`

Destroys the non-zoomable ("overview") waveform view.

```js
instance.views.destroyOverview();

const container = document.getElementById('overview-container');
container.style.display = 'none';
```

## View API

Some view properties can be updated programmatically.

### `view.setAmplitudeScale(scale)`

Changes the amplitude (vertical) waveform scale. The default scale is 1.0. If greater than 1.0, the waveform is increased in height. If between 0.0 and 1.0, the waveform is reduced in height.

```js
const view = instance.views.getView('zoomview');
view.setAmplitudeScale(1.0);
```

### `view.setWaveformColor(color)`

Sets the waveform color, as a string containing any valid [CSS color value](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value).

The initial color is controlled by the `waveformColor`, `zoomview.waveformColor`, and `overview.waveformColor` configuration options.

```js
const view = instance.views.getView('zoomview');
view.setWaveformColor('#800080'); // Purple
```

You can also use a 2 stop linear gradient here. Units are percentage of the view height, starting at the top of the waveform.
```js
view.setWaveformColor({
  linearGradientStart: 15,
  linearGradientEnd: 30,
  linearGradientColorStops: ['hsl(120, 78%, 26%)', 'hsl(120, 78%, 10%)']
});
```

### `view.setPlayedWaveformColor(color)`

Sets color of the waveform to the left of the current playhead position. This can be string containing any valid [CSS color value](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value), or `null` to remove coloring of the played waveform region.

The initial color is controlled by the `playedWaveformColor`, `zoomview.playedWaveformColor`, and `overview.playedWaveformColor` configuration options.

```js
const view = instance.views.getView('zoomview');
view.setPlayedWaveformColor('#800080'); // Purple
```

You can also use a 2 stop linear gradient here. Units are percentage of the view height, starting at the top of the waveform.
```js
view.setPlayedWaveformColor({
  linearGradientStart: 15,
  linearGradientEnd: 30,
  linearGradientColorStops: ['hsl(120, 78%, 26%)', 'hsl(120, 78%, 10%)']
});
```

### `view.showPlayheadTime(show)`

Shows or hides the current playback time, shown next to the playhead.

The initial setting is `false` for the overview waveform view, or controlled by the `showPlayheadTime` configuration option for the zoomable waveform view.

```js
const view = instance.views.getView('zoomview');
view.showPlayheadTime(false); // Remove the time from the playhead marker.
```

### `view.setTimeLabelPrecision(precision)`

Change the precision of time label displayed for playhead and point/segment markers.

The initial setting is `2`, for both zoomable and overview waveform views. This is controlled by the `timeLabelPrecision` configuration option in both views.

```js
const view = instance.views.getView('zoomview');
view.setTimeLabelPrecision(3); // Displays time of playhead/marker as hh:mm:ss.sss
```

### `view.showAxisLabels(show[, options])`

Shows or hides the time axis timestamp labels.

The `options` object can be used to set the the height of the time axis markers on the top and bottom of the waveform.


The initial setting is controlled by the `showAxisLabels` configuration option
(default: `true`) and the `axisTopMarkerHeight` and `axisBottomMarkerHeight` options (default: 10).

```js
const view = instance.views.getView('zoomview');

// Remove the time axis labels.
view.showAxisLabels(false);

// Show the time axis labels with default markers.
view.showAxisLabels(true);

// Show the time axis labels but remove the markers.
view.showAxisLabels(true, {
  topMarkerHeight: 0,
  bottomMarkerHeight: 0
});

// Show the time axis labels and set the marker height.
view.showAxisLabels(true, {
  topMarkerHeight: 10,
  bottomMarkerHeight: 10
});
```

### `view.enableAutoScroll(enable[, options])`

Enables or disables auto-scroll behavior (enabled by default). This only applies to the zoomable waveform view.

The optional `options` parameter allows the behavior to be customized. If present, `options` should be an object with one of the following keys:

* `offset`: The offset in pixels from the edge of the visible waveform to trigger auto-scroll (`number`, defaults to 100)

```js
const view = instance.views.getView('zoomview');
view.enableAutoScroll(false);
view.enableAutoScroll(true, { offset: 0 });
```

### `view.enableMarkerEditing(enable)`

Enables or disables point and segment marker editing. By default, the zoomable waveform view allows marker editing and the overview waveform view does not.

Note that this method should be called before adding any point or segment markers. It will not change any existing non-editable markers to be editable.

```js
const view = instance.views.getView('overview');
view.enableMarkerEditing(true);

instance.segments.add({
  startTime: 5.0,
  endTime: 10.0,
  label: 'Test segment',
  editable: true
});
```

### `view.enableSegmentDragging(enable)`

Enables or disables segment dragging. By default, segments cannot be dragged.

This method applies to the zoomable waveform view only.

```js
const view = instance.views.getView('zoomview');
view.enableSegmentDragging(true);
```

### `view.setSegmentDragMode(mode)`

Controls how segments behave when dragged over an adjacent segment. Possible values for the `mode` parameter are:

* `'overlap'` (default): Segments can be dragged to overlap each other
* `'no-overlap'`: Segment overlap is prevented
* `'compress'`: Dragging a segment over the previous or next segment causes that segment to reduce in size

This method applies to the zoomable waveform view only.

```js
const view = instance.views.getView('zoomview');
view.setSegmentDragMode('no-overlap');
```

### `view.setMinSegmentDragWidth(width)`

Sets the minimum width for segments being dragged. The `width` value is a number of pixels, so that the minimum width is independent of the view's current zoom level.

This method applies to the zoomable waveform view only.

```js
const view = instance.views.getView('zoomview');
view.setMinSegmentDragWidth(50);
```

### `view.setWaveformDragMode(mode)`

Controls the behaviour of mouse drag operations. Possible values for the `mode` parameter are:

* `'scroll'` (default): Dragging scrolls the waveform
* `'insert-segment'`: Dragging inserts a new segment

```js
const view = instance.views.getView('zoomview');
view.setWaveformDragMode('insert-segment');
```

### `view.fitToContainer()`

Resizes the waveform view to fit the container. You should call this method
after changing the width or height of the container HTML element.

If the zoom level has been set to a number of seconds or `'auto'`, the waveform
will be automatically rescaled to fit the container width. As this can take
a long time, particularly for long waveforms, we recommend using a debounce
function (such as lodash's [_.debounce()](https://lodash.com/docs/#debounce))
when changing the container's width.

```js
const zoomviewContainer = document.getElementById('zoomview-container');
const scrollbarContainer = document.getElementById('scrollbar-container');
const overviewContainer = document.getElementById('overview-container');

let firstResize = true;

function onResize(entries) {
  if (firstResize) {
    firstResize = false;
    return;
  }

  for (const entry of entries) {
    if (entry.target === zoomviewContainer) {
      const view = peaksInstance.views.getView('zoomview');

      if (view) {
        view.fitToContainer();
      }
    }
    else if (entry.target === scrollbarContainer) {
      const scrollbar = peaksInstance.views.getScrollbar();

      if (scrollbar) {
        scrollbar.fitToContainer();
      }
    }
    else if (entry.target === overviewContainer) {
      const view = peaksInstance.views.getView('overview');

      if (view) {
        view.fitToContainer();
      }
    }
  }
}

const resizeObserver = new ResizeObserver(_.debounce(onResize, 500));

resizeObserver.observe(zoomviewContainer);
resizeObserver.observe(overviewContainer);

zoomviewContainer.style.height = '300px';
```

### `view.setZoom(options)`

Changes the zoom level of the zoomable waveform view.

This method gives applications greater control over the zoom level than the
older [Zoom API](#zoom-api) methods.

The `options` parameter is an object with one of the following keys:

* `scale`: Sets the zoom level, in samples per pixel. Smaller numbers represent being more "zoomed in".
* `seconds`: Sets the zoom level to fit the given number of seconds in the available width.

Either option may have the value `'auto'`, which fits the entire waveform to the container width.

```js
const view = instance.views.getView('zoomview');
view.setZoom({ scale: 512 }); // samples per pixel
view.setZoom({ seconds: 5.0 });
view.setZoom({ seconds: 'auto' });
```

### `view.setStartTime(time)`

Changes the start time, in seconds, of the zoomable waveform view.

Note that this method is not available on the overview waveform.

```js
const view = instance.views.getView('zoomview');
view.setStartTime(6.0); // seconds
```

### `view.scrollWaveform(options)`

Changes the start time of the zoomable waveform view, by the given amount.

The `options` parameter is an object with one of the following keys:

* `seconds`: Scrolls the waveform by the given number of seconds.
* `pixels`: Scrolls the waveform by the given number of pixels.

Pass a negative number to scroll the waveform to the left (towards zero).

Note that this method is not available on the overview waveform.

```js
const view = instance.views.getView('zoomview');
view.scrollWaveform({ seconds: 1.0 });
view.scrollWaveform({ pixels: -100 });
```

### `view.setWheelMode(mode[, options])`

Controls how the waveform view responds to mousewheel input. On a laptop trackpad, this is often a horizontal swipe gesture. For users with a mouse with a scroll wheel, hold down the Shift key while using the scroll wheel. Possible values for `mode` are:

* `'none'` to disable use of the mousewheel input (default)
* `'scroll'` to scroll the waveform view

The optional `options` parameter allows the behavior to be customized. If present, `options` should be an object with one of the following keys:

* `captureVerticalScroll`: controls whether the mousewheel will scroll the waveform when the mouse is positioned over the waveform, or instead scrolls the page (boolean, defaults to `false`)

Note that this method is not available on the overview waveform.

```js
const view = instance.views.getView('zoomview');
view.setWheelMode('scroll');
view.setWheelMode('scroll', { captureVerticalScroll: true });
```

### `view.enableSeek(enable)`

Enables or disables seeking the playback position by clicking in the waveform view.

```js
const overview = peaksInstance.views.getView('zoomview');
const zoomview = peaksInstance.views.getView('zoomview');

overview.enableSeek(false); // or true to re-enable
zoomview.enableSeek(false);
```

## Scrollbar API

### `scrollbar.fitToContainer()`

Resizes the scrollbar to fit the container. You should call this method
after changing the width or height of the scrollbar's container HTML element.

See [`view.fitToContainer`](#viewfittocontainer) for example code.

## Zoom API

### `instance.zoom.zoomOut()`

Zooms in the waveform zoom view by one level.

```js
Peaks.init({
  // ...
  zoomLevels: [512, 1024, 2048, 4096]
},
function(err, peaks) {
  // Initial zoom level is 512
  peaks.zoom.zoomOut(); // zoom level is now 1024
});
```

### `instance.zoom.zoomIn()`

Zooms in the waveform zoom view by one level.

```js
Peaks.init({
  // ...
  zoomLevels: [512, 1024, 2048, 4096]
},
function(err, peaks) {
  // Initial zoom level is 512
  peaks.zoom.zoomIn(); // zoom level is still 512

  peaks.zoom.zoomOut(); // zoom level is now 1024
  peaks.zoom.zoomIn(); // zoom level is now 512 again
});
```

### `instance.zoom.setZoom(index)`

Changes the zoom level of the zoomable waveform view to the element in the
`options.zoomLevels` array at index `index`.

```js
Peaks.init({
  // ...
  zoomLevels: [512, 1024, 2048, 4096]
},
function(err, peaks) {
  peaks.zoom.setZoom(3); // zoom level is now 4096
});
```

See also [view.setZoom()](#viewsetzoomoptions), which offers a more flexible
way of setting the zoom level.

### `instance.zoom.getZoom()`

Returns the current zoom level, as an index into the `options.zoomLevels` array.

```js
Peaks.init({
  // ...
  zoomLevels: [512, 1024, 2048, 4096]
},
function(err, peaks) {
  peaks.zoom.zoomOut();
  console.log(peaks.zoom.getZoom()); // -> 1
});
```

## Segments API

**Segments** give the ability to visually tag timed portions of the audio media.
This is a great way to provide visual cues to your users.

### `instance.segments.add({ startTime, endTime, editable, color, labelText, id[, ...] })`
### `instance.segments.add(segment[])`

Adds a segment to the waveform timeline. Accepts an object containing the following parameters:

* `startTime`: the segment start time (seconds)
* `endTime`: the segment end time (seconds)
* `editable`: (optional) sets whether the segment is user editable (boolean, defaults to `false`)
* `color`: (optional) the segment color. If not specified, the segment is given a default color (set by the [`segmentoptions.waveformColor` option](#Configuration) for marker-style segments or the [`segmentOptions.overlayColor` option](#Configuration) for overlay-style segments)
* `borderColor`: (optional) the segment border color. This applies only to overlay style segments. If not specified, the segment is given a default border color (set by the [`segmentOptions.overlayBorderColor` option](#Configuration))
* `labelText`: (option) a text label which is displayed when the user hovers the mouse pointer over the segment
* `id`: (optional) the segment identifier. If not specified, the segment is automatically given a unique identifier

```js
// Add non-editable segment, from 0 to 10.5 seconds, with the default color
instance.segments.add({ startTime: 0, endTime: 10.5 });
```

Alternatively, provide an array of segment objects to add all those segments at once. It's much more efficient to do this than add a single segment at a time.

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

You may also provide other user-defined data attributes, which are associated with the segment.
These can be strings, numbers, or any other JavaScript object.

```js
instance.segments.add({ id: 'segment1', startTime: 0, endTime: 10.5, customAttribute: 'value' });

const segment = instance.segments.getSegment('segment1');

console.log(segment.customAttribute); // -> 'value'
```

### `instance.segments.getSegments()`

Returns an array of all segments present on the timeline.

```js
const segments = instance.segments.getSegments();
```

### `instance.segments.getSegment(id)`

Returns the segment with the given id, or `undefined` if not found.

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

// Remove both segments as they start at 10
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

### `segment.update(options)`

Updates an existing segment. Accepts a single `options` parameter, with the following keys:

* `id`: (optoinal) the segment identifer
* `startTime`: (optional) the segment start time (seconds, defaults to current value)
* `endTime`: (optional) the segment end time (seconds, defaults to current value)
* `editable`: (optional) sets whether the segment is user editable (boolean, defaults to current value)
* `color`: (optional) the segment color (defaults to current value)
* `labelText`: (optional) a text label which is displayed when the user hovers the mouse pointer over the segment (defaults to current value)

You may also update other user-defined data attributes, which are associated with the segment.

```js
instance.segments.add({ ... });

const segment = instance.segments.getSegments()[0]
// Or use peaks.segments.getSegment(id)

segment.update({ startTime: 7 });
segment.update({ startTime: 7, labelText: "new label text" });
segment.update({ startTime: 7, endTime: 9, labelText: 'new label text' });

// Update a user-defined custom attribute
segment.update({ customAttribute: 'value' });
```

## Points API

**Points** give the ability to visually tag points in time of the audio media.

### `instance.points.add({ time, editable, color, labelText, id[, ...] })`
### `instance.points.add(point[])`

Adds one or more points to the waveform timeline. Accepts an object containing the following parameters:

* `time`: the point time (seconds)
* `editable`: (optional) sets whether the point is user editable (boolean, defaults to `false`)
* `color`: (optional) the point color. If not specified, the point is given a default color (see the `pointMarkerColor` [option](#Configuration))
* `labelText`: (optional) a text label which is displayed next to the segment. If not given, the point's time is displayed
* `id`: (optional) the point identifier. If not specified, the point is automatically given a unique identifier

```js
// Add non-editable point, with the default color
instance.points.add({ time: 3.5 });
```

Alternatively, provide an array of point objects to add several at once. Note that it's much more efficient to do this than add a single point at a time.

```js
instance.points.add([
  {
    time: 3.5,
    labelText: 'Test point',
    color: '#666'
  },
  {
    time: 5.6,
    labelText: 'Another test point',
    color: '#666'
  }
]);
```

You may also provide other user-defined data attributes, which are associated with the point.
These can be strings, numbers, or any other JavaScript object.

```js
instance.points.add({ id: 'point1', time: 3.5, customAttribute: 'value' });

const point = instance.points.getPoint('point1');

console.log(point.customAttribute); // -> 'value'
```

### `instance.points.getPoints()`

Returns an array of all points present on the timeline.

```js
const points = instance.points.getPoints();
```

### `instance.points.getPoint(id)`

Returns the point with the given id, or `undefined` if not found.

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

### `point.update(options)`

Updates an existing point. Accepts a single `options` parameter with the following keys:

* `id`: (optional) the point identifier
* `time`: (optional) the point's time (seconds, defaults to current value)
* `editable`: (optional) sets whether the point is user editable (boolean, defaults to current value)
* `color`: (optional) the point color (defaults to current value)
* `labelText`: (optional) a text label which is displayed when the user hovers the mouse pointer over the point (defaults to current value)

You may also update other user-defined data attributes, which are associated with the point.

```js
instance.points.add({ ... });
const point = instance.points.getPoints()[0]
// Or use instance.points.getPoint(id)

point.update({ time: 7 });
point.update({ time: 7, labelText: "new label text" });

// Update a user-defined custom attribute
point.update({ customAttribute: 'value' });
```

## Event Handling

Peaks instances emit events to enable you to extend its behavior according to your needs.

### `instance.on(event, callback)`

Registers a callback function to handle events emitted by a Peaks instance.

```js
function dblClickHandler(event) {
  console.log(event.time); // Time position where the user clicked
  console.log(event.evt.ctrlKey); // Access MouseEvent attributes
}

instance.on('zoomview.dblclick', dblClickHandler);
```

### `instance.once(event, callback)`

Registers a callback function to handle a single one-time event emitted by a Peaks instance.

```js
function dblClickHandler(event) {
  console.log(event.time); // Time position where the user clicked
  console.log(event.evt.ctrlKey); // Access MouseEvent attributes
}

instance.once('zoomview.dblclick', dblClickHandler);
```

### `instance.off(event, callback)`

Removes the given event handler callback function.

```js
instance.off('zoomview.dblclick', dblClickHandler);
```

## Destruction

### `instance.destroy()`

Releases resources used by an instance. This can be useful when reinitialising Peaks.js within a single page application.

```js
instance.destroy();
```

# Events

The following sections describe the available events.

## Initialization Events

### `peaks.ready`

This event is emitted during [`Peaks.init()`](#peaksinitoptions-callback) after the waveform has been loaded and initially rendered.

```js
instance.on('peaks.ready', function() {
  console.log('Intialised');
});
```

This event is deprecated. You should pass a callback function to [`Peaks.init()`](#peaksinitoptions-callback) to know when initialization is complete.

## Player Events

### `player.canplay`

This event is emitted when enough of the audio or video media is available that playback can start. This event is equivalent to the [HTMLMediaElement canplay event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/canplay_event).

```js
instance.on('player.canplay', function() {
  console.log('Playback ready');
});
```

### `player.error`

This event is emitted when the audio or video media resource could not be loaded due to an error, such as a network error or if the media data is not suppported. This event is equivalent to the [HTMLMediaElement error event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/error_event).

```js
instance.on('player.error', function(error) {
  console.log('Error loading media', error);
});
```

### `player.pause`

This event is emitted when media playback is paused. This event is equivalent to the [HTMLMediaElement pause event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/pause_event).

The event handler receives current playback time.

```js
instance.on('player.pause', function(time) {
  console.log(`Paused at ${time} seconds`);
});
```

### `player.playing`

This event is emitted when media playback is started or restarted after being paused. This event is equivalent to the [HTMLMediaElement playing event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playing_event).

The event handler receives current playback time.

```js
instance.on('player.playing', function(time) {
  console.log(`Playing at ${time} seconds`);
});
```

### `player.seeked`

This event is emitted when a seek operation on the audio or video media is completed. This event is equivalent to the [HTMLMediaElement seeked event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/seeked_event).

The event handler receives current playback time.

```js
instance.on('player.seeked', function(time) {
  console.log(`Seeked to ${time} seconds`);
});
```

### `player.timeupdate`

This event is emitted when the current playback time is updated. This event is equivalent to the [HTMLMediaElement timeupdate event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/timeupdate_event).

The event handler receives current playback time.

```js
instance.on('player.timeupdate', function(time) {
  console.log(`Current playback time: ${time} seconds`);
});
```

### `player.ended`

This event is emitted when playback stops because the end of the media was reached. This event is equivalent to the [HTMLMediaElement ended event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/ended_event).

```js
instance.on('player.ended', function() {
  console.log('Playback ended');
});
```

## Waveform View Events

### `overview.click`

This event is emitted when the user clicks on the overview waveform.

The `event` parameter contains:

* `time`: The time position where the user clicked, in seconds
* `evt`: The associated [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

```js
instance.on('overview.click', function(event) {
  console.log(`Overview waveform clicked: ${event.time} seconds`);
});
```

### `overview.dblclick`

This event is emitted when the user double clicks on the overview waveform.

The `event` parameter contains:

* `time`: The time position where the user clicked, in seconds
* `evt`: The associated [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

```js
instance.on('overview.click', function(event) {
  console.log(`Overview waveform clicked: ${event.time} seconds`);
});
```

Note that for a double click, both `overview.click` and `overview.dblclick` events are emitted.

### `overview.contextmenu`

This event is emitted when the user activates the context on the overview waveform, usually by right-clicking.

The `event` parameter contains:

* `time`: The time position where the user clicked, in seconds
* `evt`: The associated [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

```js
instance.on('overview.contextmenu', function(event) {
  event.evt.preventDefault(); // Prevent a context menu from appearing

  console.log(`Overview waveform clicked: ${event.time} seconds`);
});
```

### `zoomview.click`

This event is emitted when the user clicks on the zoomable waveform view.

The `event` parameter contains:

* `time`: The time position where the user clicked, in seconds
* `evt`: The associated [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

```js
instance.on('zoomview.click', function(event) {
  console.log(`Zoomable waveform clicked: ${event.time} seconds`);
});
```

### `zoomview.dblclick`

This event is emitted when the user double clicks on the zoomable waveform view.

The `event` parameter contains:

* `time`: The time position where the user clicked, in seconds
* `evt`: The associated [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

```js
instance.on('zoomview.click', function(event) {
  console.log(`Zoomable waveform clicked: ${event.time} seconds`);
});
```

Note that for a double click, both `zoomview.click` and `zoomview.dblclick` events are emitted.

### `zoomview.contextmenu`

This event is emitted when the user activates the context on the zoomable waveform view, usually by right-clicking.

The `event` parameter contains:

* `time`: The time position where the user clicked, in seconds
* `evt`: The associated [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

```js
instance.on('zoomview.contextmenu', function(event) {
  event.evt.preventDefault(); // Prevent a context menu from appearing

  console.log(`Zoomable waveform clicked: ${event.time} seconds`);
});
```

### `zoom.update`

This event is emitted when the zoom level in the zoomable waveform view changes.

The `event` parameter contains:

* `currentZoom`: The current zoom level, in samples per pixel
* `previousZoom`: The previous zoom level, in samples per pixel

```js
instance.on('zoom.update', function(event) {
  console.log(`Zoom changed from ${event.previousZoom} to ${event.currentZoom}`);
});
```

## Point Events

### `points.add`

This event is emitted one or more points are added, by calling [`instance.points.add()`](#instancepointsaddpoint).

The `event` parameter contains:

* `points`: An array of the [Point](#point-api) objects added

```js
instance.on('points.add', function(event) {
  event.points.forEach(function(point)) {
    console.log(`Added point: ${point.id}`);
  });
});
```

### `points.remove`

This event is emitted one or more points are removed, by calling [`instance.points.removeById()`](#instancepointtsremovebyidpointid) or [`instance.points.removeByTime`](#instancepointsremovebytimetime)).

The `event` parameter contains:

* `points`: An array of the [Point](#point-api) objects removed

```js
instance.on('points.remove', function(event) {
  event.points.forEach(function(point)) {
    console.log(`Removed point: ${point.id}`);
  });
});
```

### `points.remove_all`

This event is emitted all points are removed, by calling [`instance.points.removeAll()`](#instancepointsremoveall).

```js
instance.on('points.remove_all', function() {
  console.log('All points removed');
});
```

### `points.dragstart`

This event is emitted when the user starts dragging a point marker.

The `event` parameter contains:

* `point`: The point being dragged
* `evt`: The associated [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

```js
instance.on('points.dragstart', function(event) {
  console.log(`Start dragging point: ${event.point.id}`);
});
```

### `points.dragmove`

This event is emitted when the user drags a point marker.

The `event` parameter contains:

* `point`: The point being dragged
* `evt`: The associated [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

```js
instance.on('points.dragmove', function(event) {
  console.log(`Point dragged: ${event.point.id}`);
});
```

### `points.dragend`

This event is emitted when a point drag operation ends.

The `event` parameter contains:

* `point`: The point being dragged
* `evt`: The associated [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

```js
instance.on('points.dragend', function(event) {
  console.log(`Point dragged: ${event.point.id}`);
});
```

### `points.mouseenter`

This event is emitted when the user moves the mouse pointer over a point.

The `event` parameter contains:

* `point`: The point
* `evt`: The associated [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

```js
instance.on('points.mouseenter', function(event) {
  console.log(`Mouse entered point: ${event.point.id}`);
});
```

### `points.mouseleave`

This event is emitted when the user moves the mouse pointer away from a point.

The `event` parameter contains:

* `point`: The point
* `evt`: The associated [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

```js
instance.on('points.mouseleave', function(event) {
  console.log(`Mouse left point: ${event.point.id}`);
});
```

### `points.click`

This event is emitted when the user clicks on a point.

The `event` parameter contains:

* `point`: The point that was clicked
* `evt`: The associated [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

By default, clicking on a point will also emit either a [`zoomview.click`](#zoomviewclick) or [`overview.click`](#overviewclick) event. To prevent this, call `event.preventViewEvent()`.

```js
instance.on('points.click', function(event) {
  console.log(`Point clicked: ${event.point.id}`);
});
```

### `points.dblclick`

This event is emitted when the user double clicks on a point.

The `event` parameter contains:

* `point`: The point that was clicked
* `evt`: The associated [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

Note that for a double click, both [`points.click`](#pointsclick) and `points.dblclick` events are emitted.

By default, clicking on a point will also emit either a [`zoomview.dblclick`](#zoomviewdblclick) or [`overview.dblclick`](#overviewdblclick) event. To prevent this, call `event.preventViewEvent()`.

```js
instance.on('points.dblclick', function(event) {
  console.log(`Point clicked: ${event.point.id}`);
});
```

Note that for a double click, both `points.click` and `points.dblclick` events are emitted.

### `points.contextmenu`

This event is emitted when the user activates the context menu on a point, usually by right-clicking.

The `event` parameter contains:

* `point`: The point that was clicked
* `evt`: The associated [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

By default, clicking on a point will also emit either a [`zoomview.contextmenu`](#zoomviewcontextmenu) or [`overview.contextmenu`](#overviewcontextmenu) event. To prevent this, call `event.preventViewEvent()`.

```js
instance.on('points.contextmenu', function(event) {
  event.evt.preventDefault(); // Prevent a context menu from appearing

  console.log(`Point clicked: ${event.point.id}`);
});
```

### `points.enter`

This event is emitted when playback of the audio or video passes through a point.

The `event` parameter contains:

* `point`: The point that was passed through
* `time`: The current playback time, in seconds

This event is not emitted by default. To enable it, call `Peaks.init()` with the `emitCueEvents` option set to `true`.

```js
instance.on('points.enter', function(event) {
  console.log(`Entered point: ${event.point.id}, currentTime: ${event.time}`);
});
```

## Segment Events

### `segments.add`

This event is emitted one or more segments are added, by calling [`instance.segments.add()`](#instancesegmentsaddsegment), or when the user starts dragging on the waveform view (see [view.setWaveformDragMode()](#viewsetwaveformdragmodemode)).

The `event` parameter contains:

* `segments`: An array of the [Segment](#segment-api) objects added
* `insert`: A flag which is `true` if the segment was added by the user dragging on the waveform view.

```js
instance.on('segments.add', function(event) {
  if (event.insert) {
    const segment = event.segments[0];
    segment.update({ id: 'my-segment-id' });
  }

  event.segments.forEach(function(segment)) {
    console.log(`Added segment: ${segment.id}`);
  });
});
```

### `segments.insert`

This event is emitted after the user inserts a segment by dragging on the waveform view (see [view.setWaveformDragMode()](#viewsetwaveformdragmodemode)).

The `event` parameter contains:

* `segment`: The [Segment](#segment-api) object that was added

```js
instance.on('segments.insert', function(event) {
  event.segment.update({ id: 'my-segment-id' });
});
```

### `segments.remove`

This event is emitted one or more segments are removed, by calling [`instance.segments.removeById()`](#instancesegmentsremovebyidsegmentid) or [`instance.segments.removeByTime`](#instancesegmentsremovebytimestarttime-endtime).

The `event` parameter contains:

* `segments`: An array of the [Segment](#segment-api) objects removed

```js
instance.on('segments.remove', function(event) {
  event.segments.forEach(function(segment)) {
    console.log(`Removed segment: ${segment.id}`);
  });
});
```

### `segments.remove_all`

This event is emitted all segments are removed (by calling [`instance.segments.removeAll()`](#instancesegmentsremoveall)).

```js
instance.on('segments.remove_all', function() {
  console.log('All segments removed');
});
```

### `segments.dragstart`

This event is emitted when the user starts dragging a segment or its start or end marker.

The `event` parameter contains:

* `segment`: The segment being dragged
* `marker`: `true` if the segment's start or end marker is being dragged, or `false` if the entire segment is being dragged
* `startMarker`: `true` if the segment's start marker is being dragged, or `false` if the segment's end marker is being dragged. This value is also `false` if the entire segment is being dragged
* `evt`: The associated [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

```js
instance.on('segments.dragstart', function(event) {
  console.log(`Start dragging segment: ${event.segment.id}`);
});
```

### `segments.dragged`

This event is emitted when a segment or its start or end marker is dragged.

The `event` parameter contains:

* `segment`: The segment being dragged
* `marker`: `true` if the segment's start or end marker is being dragged, or `false` if the entire segment is being dragged
* `startMarker`: `true` if the segment's start marker is being dragged, or `false` if the segment's end marker is being dragged. This value is also `false` if the entire segment is being dragged
* `evt`: The associated [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

```js
instance.on('segments.dragged', function(event) {
  console.log(`Segment dragged: ${event.segment.id}`);
});
```

### `segments.dragend`

This event is emitted when a segment drag operation ends.

The `event` parameter contains:

* `segment`: The segment being dragged
* `marker`: `true` if the segment's start or end marker is being dragged, or `false` if the entire segment is being dragged
* `startMarker`: `true` if the segment's start marker is being dragged, or `false` if the segment's end marker is being dragged. This value is also `false` if the entire segment is being dragged
* `evt`: The associated [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

```js
instance.on('segments.dragend', function(event) {
  console.log(`Segment dragged: ${event.segment.id}`);
});
```

### `segments.mouseenter`

This event is emitted when the user moves the mouse pointer over a segment.

The `event` parameter contains:

* `segment`: The segment
* `evt`: The associated [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

```js
instance.on('segments.mouseenter', function(event) {
  console.log(`Mouse entered segment: ${event.segment.id}`);
});
```

### `segments.mouseleave`

This event is emitted when the user moves the mouse pointer out of a segment.

The `event` parameter contains:

* `segment`: The segment
* `evt`: The associated [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

```js
instance.on('segments.mouseleave', function(event) {
  console.log(`Mouse left segment: ${event.segment.id}`);
});
```

### `segments.mousedown`

This event is emitted when the user presses a mouse button down over a segment.

The `event` parameter contains:

* `segment`: The segment
* `evt`: The associated [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

```js
instance.on('segments.mousedown', function(event) {
  console.log(`Mouse down over segment: ${event.segment.id}`);
});
```

### `segments.mouseup`

This event is emitted when the user releases a mouse button over a segment.

The `event` parameter contains:

* `segment`: The segment
* `evt`: The associated [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

```js
instance.on('segments.mouseup', function(event) {
  console.log(`Mouse up over segment: ${event.segment.id}`);
});
```

### `segments.click`

This event is emitted when the user clicks on a segment.

The `event` parameter contains:

* `segment`: The segment that was clicked
* `evt`: The associated [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

By default, clicking on a segment will also emit either a [`zoomview.click`](#zoomviewclick) or [`overview.click`](#overviewclick) event. To prevent this, call `event.preventViewEvent()`.

```js
instance.on('segments.click', function(event) {
  console.log(`Segment clicked: ${event.segment.id}`);
});
```

### `segments.dblclick`

This event is emitted when the user double clicks on a segment.

The `event` parameter contains:

* `segment`: The segment that was clicked
* `evt`: The associated [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

Note that for a double click, both [`segments.click`](#segmentsclick) and `segments.dblclick` events are emitted.

By default, clicking on a segment will also emit either a [`zoomview.dblclick`](#zoomviewdblclick) or [`overview.dblclick`](#overviewdblclick) event. To prevent this, call `event.preventViewEvent()`.

```js
instance.on('segments.click', function(event) {
  console.log(`Segment clicked: ${event.segment.id}`);
});
```

### `segments.contextmenu`

This event is emitted when the user activates the context menu on a segment, usually by right-clicking.

The `event` parameter contains:

* `segment`: The segment that was clicked
* `evt`: The associated [`MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

By default, clicking on a segment will also emit either a [`zoomview.contextmenu`](#zoomviewcontextmenu) or [`overview.contextmenu`](#overviewcontextmenu) event. To prevent this, call `event.preventViewEvent()`.

```js
instance.on('segments.contextmenu', function(event) {
  event.evt.preventDefault(); // Prevent a context menu from appearing

  console.log(`Segment clicked: ${event.segment.id}`);
});
```

### `segments.enter`

This event is emitted when playback of the audio or video enters a segment.

The `event` parameter contains:

* `segment`: The segment that was entered
* `time`: The current playback time, in seconds

This event is not emitted by default. To enable it, call `Peaks.init()` with the `emitCueEvents` option set to `true`.

```js
instance.on('segments.enter', function(event) {
  console.log(`Entered segment: ${event.segment.id}, currentTime: ${event.time}`);
});
```

### `segments.exit`

This event is emitted when playback of the audio or video exits a segment.

The `event` parameter contains:

* `segment`: The segment that was exited
* `time`: The current playback time, in seconds

This event is not emitted by default. To enable it, call `Peaks.init()` with the `emitCueEvents` option set to `true`.

```js
instance.on('segments.exit', function(event) {
  console.log(`Exited segment: ${event.segment.id}, currentTime: ${event.time}`);
});
```
