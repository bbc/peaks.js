# Peaks.js

## 3.2.1 (2023/11/29)

* (#513) Fixed `view.setZoom()` waveform scale calculation. This bug would manifest
  as a misalignment of time axis labels and point and segment markers, because
  the waveform can only be an integer number of samples per pixel (@chrisn)

## 3.2.0 (2023/10/19)

* Added `playheadBackgroundColor` and `playheadPadding` options (@amber-huo)

* Fixed zoomview mouse drag handler (@chrisn)

## 3.1.0 (2023/09/19)

* Added `enablePoints` and `enableSegments` options (@chrisn)

* Added `axisTopMarkerHeight` and `axisBottomMarkerHeight` options (@chrisn)

* Fixed point and segment rendering in the overview waveform, if the audio duration
  is different to the waveform duration (@chrisn)

## 3.0.0 (2023/08/28)

* Fixed point marker dragging (@chrisn)

* Removed window `resize` event handling. Instead, you should use
  [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
  and call [`fitToContainer()`](doc/API.md#viewfittocontainer) (@chrisn)

* Added `views.getScrollbar()` method, to allow the scrollbar to be
  resized (@chrisn)

* Removed undocumented `dataUriDefaultFormat` option (@chrisn)

## 3.0.0-beta.13 (2023/07/15)

* (#499) Added a new `zoomview.setWaveformDragMode()` method, which
  enables users to create new segments by clicking and dragging in the
  zoomable waveform view. The segment id value can now be set using
  `segment.update()` (and point ids can be updated similarly). A new event
  is emitted, `segments.insert` after the user has inserted a new segment
  by dragging in the waveform view.

  The following event handlers now receive event objects, see
  [doc/migration-guide.md](doc/migration-guide.md) and
  [doc/API.md](doc/API.md) for details:

  * `points.add`, `points.remove`
  * `segments.add`, `segments.remove`
  * `points.enter`, `segments.enter`, `segments.exit`
  * `zoom.update` (@chrisn)

* (#498) Fixed changing the `editable` flag on point markers (@chrisn)

* (#500) Fixed "Zoom level too low" error, which can happen with short
  duration audio files when the overview window tries to resample the
  audio to fit the available width (@chrisn)

* The custom marker `draggable` option has been renamed to `editable`,
  to be consistent with the point and segment attribute with the same
  name. Refer to [doc/migration-guide.md](doc/migration-guide.md) for
  details of how to update your application (@chrisn)

## 3.0.0-beta.12 (2023/06/27)

* (#498) The custom marker `timeUpdated()` method has been removed, and
  replaced by a more general purpose `update()` method, which is called
  when any of the point or segment attributes have been updated
  (including when markers are dragged). Refer to
  [doc/migration-guide.md](doc/migration-guide.md) for details of how to
  update your application (@chrisn)

* (#497) Added zoomview `autoScroll` and `autoScrollOffset` options
  (@chrisn)

* (#88) Added `enablePoints` and `enableSegment` options, to allow you
  to control whether points and segments are shown in the zoomview and
  overview waveforms (@chrisn)

## 3.0.0-beta.11 (2023/06/07)

* (#490) Added `preventViewEvent()` method for point and segment events.
  This allows you to prevent `zoomview.*` or `overview.*` click events
  from a `segments.*` or `points.*` click event handler (@chrisn)

* (#489) Improved event documentation, see [doc/API.md](doc/API.md#events)
  (@chrisn)

* (#494) Enable use of Konva v9.x (@jdelStrother)

## 3.0.0-beta.10 (2023/05/12)

* (#488) Added `marker` flag to `segments.dragstart`, `segments.dragend`,
  and `segments.dragged` events, so you can detect whether a segment
  start or end marker, or the entire segment is being dragged (@chrisn)

## 3.0.0-beta.9 (2023/05/06)

* (#484) Validate container elements after loading the waveform (@chrisn)

* (#484) Calling `peaksInstance.destroy()` will now abort an in-progress
  HTTP request to fetch audio or waveform data (@chrisn)

* (#483) Enable point and segment marker updates while dragging (@chrisn)

* (#481) Improved point/segment attribute validation to prevent
  overwriting internal Point or Segment properties (@chrisn)

* Added FAQ documentation, see [doc/faq.md](doc/faq.md) (@chrisn)

## 3.0.0-beta.8 (2023/03/24)

* (#481) Fixed TypeScript declarations (@chrisn)

## 3.0.0-beta.7 (2023/03/11)

* (#433) Prevent resizing the waveform canvas to zero width (@chrisn)

* (#479) Reduced the width of the hit region for resizing overlay segments
  (@chrisn)

* (#480) Adjacent segments can now have the same start or end time when
  dragging a segment start or end marker over an adjacent segment in
  `no-overlap` mode (@chrisn)

## 3.0.0-beta.6 (2023/02/10)

* (#477) Added `segments.mousedown` and `segments.mouseup` events (@chrisn)

* (#478) Fixed dragging of point markers (@chrisn)

* Added `view.setMinSegmentDragWidth()` method to set the minimum segment
  width to apply when dragging segment handles or when using the `compress`
  drag mode (@chrisn)

## 3.0.0-beta.5 (2023/01/30)

* Allow the playhead to be dragged when within a segment (@chrisn)

* Fixed segment handle dragging, when the segment becomes zero width (@chrisn)

## 3.0.0-beta.4 (2023/01/18)

* (#473) Added `getWaveformData()` method (@chrisn)

* `segments.dragstart` and `segments.dragend` events are now emitted when
  when dragging entire segments (@chrisn)

## 3.0.0-beta.3 (2022/12/28)

* Replaced the `segmentOptions.style` option with separate options to enable
  segment markers and overlays (@chrisn)

## 3.0.0-beta.2 (2022/12/16)

* (#341) Check media element source during initialisation (@chrisn)

* (#360) Fixed `setSource()` where the media element has `preload="none"`
  (@chrisn)

* (#451) Disable use of Worker when using the `webAudio.audioBuffer` option
  in `Peaks.init()` or `instance.setSource()` (@chrisn)

* Removed deprecated options:

  * `containers` - use `zoomview.container` and `overview.container`
  * `overviewWaveformColor` - `use overview.waveformColor`
  * `overviewHighlightOffset` - `use overview.highlightOffset`
  * `overviewHighlightColor` - `use overview.highlightColor`
  * `zoomWaveformColor` - `use zoomview.waveformColor` (@chrisn)

* Segment dragging improvements:

  * Increased overlay segment handle size, to make resizing segments easier
  * The segment being dragged is now moved to the top of the z-order,
    so that it remains on top of any other segments that the handle is dragged
    over (@chrisn)

## 3.0.0-beta.1 (2022/11/05)

* Fixed dragging of custom point and segment markers (@chrisn)

## 3.0.0-beta.0 (2022/11/05)

* (#443) Added new options to control segment appearance. Two segment styles
  are now supported: marker style (as in previous versions), and overlay
  style.

  Segment options are now controlled using the new `segmentOptions` settings
  in `Peaks.init()`, and settings can be controlled separately for the
  overview and zoomable waveform views, using the `overview.segmentOptions`
  and `zoomview.segmentOptions` settings.

  Some segment options have been removed, please refer to
  [doc/migration-guide.md](doc/migration-guide.md) for details of how to
  update your application (@chrisn)

 * Added scrollbar (@chrisn)

## 2.1.0 (2022/10/17)

* (#467) Added new config options to style the overview waveform
  highlight region: `highlightStrokeColor`, `highlightOpacity`,
  and `highlightCornerRadius` (@jakiestfu)

* Fixed zoomview mouse drag handler (@chrisn)

## 2.0.6 (2022/09/07)

* (#443) Check container element height is non-zero in `Peaks.init()`
  (@chrisn)

* (#461) Fixed handling of deprecated `zoomviewWaveformColor` and
  `overviewWaveformColor` options (@chrisn)

* Fixed TypeScript declarations (@chrisn)

## 2.0.5 (2022/08/27)

* (#460) Fixed TypeScript declarations, which were causing problems
  using Peaks.js in Angular apps (@chrisn)

## 2.0.4 (2022/08/17)

* (#454) Added `captureVerticalScroll` option to `view.setWheelMode()`.
  This option makes the zoomview respond to all mousewheel / touchpad
  events. It means that the user no longer has to press Shift to
  scroll the waveform, but it also means that using the mousewheel
  while the pointer is over the waveform will no longer scroll the
  page (@chrisn)

## 2.0.3 (2022/07/31)

* (#457) Improve horizontal scrolling on trackpad on Mac OS (@jdelStrother)

## 2.0.2 (2022/06/18)

* (#454) Fixed mousewheel scrolling on Mac OS. The new behaviour is:

  * Vertical trackpad gesture scrolls the page
  * Horizontal trackpad gesture (with pointer over the waveform view) scrolls
    the waveform
  * Shift + either horizontal or vertical trackpad gesture (with pointer over
    the waveform view) scrolls the waveform
  * Mousewheel scrolls the page
  * Shift + mousewheel (with pointer over the waveform view) scrolls the
    waveform (@chrisn)

## 2.0.1 (2022/06/02)

* Improved support for page mode in mousewheel events (@chrisn)

* (#374) Improved waveform rendering. The waveform now shows a horizontal
  line where the audio amplitude is zero (@chrisn)

* Added `setSource()` documentation for custom player objects (@chrisn)

* Fixed `waveformCache` TypeScript definition (@tscz)

## 2.0.0 (2022/04/27)

* (#450) Fixed waveform view initialization. This required a changed to
  how custom player objects are initialized, to be async. If your application
  uses a custom player object, this is a breaking API change. Please refer to
  [doc/migration-guide.md](doc/migration-guide.md) for details of how to update
  your application (@chrisn)

* The waveform cache is now cleared on calling `setSource()`. This would
  cause the waveform to not be updated when it should (@chrisn)

## 1.1.0 (2022/03/31)

* (#447) Playhead dragging in the zoomable and overview waveform views is
  now limited to only the primary mouse button (@chrisn)

## 1.0.0 (2022/03/14)

* (#427) Changed all mouse and click event handlers to also expose the
  MouseEvent or PointerEvent. This is a breaking API change, please refer to
  [doc/migration-guide.md](doc/migration-guide.md) for details of how to update
  your application (@chrisn)

* (#441) Added `zoomview.contextmenu`, `overview.contextmenu`,
  `points.contextmenu`, and `segments.contextmenu` events (@rowild)

## 0.28.1 (2022/02/16)

* (#442) Fixed `player.isPlaying()` (@chrisn)

## 0.28.0 (2022/02/03)

* (#430) Fixed scrolling of non-editable waveform segments (@chrisn)

* The playhead in the zoomable waveform view can now be dragged to seek the
  playhead position. There is a new option, `playheadClickTolerance` that
  controls how close you have to click to drag the playhead rather than
  scroll the waveform view (@chrisn)

* Added some features to speed up changing the zoom level:

  * Added a cache of waveform data at each zoom level used. This avoids
    unnecessary re-calculation, but increases memory usage. This is enabled
    by default and can be disabled by setting the `waveformCache` option
    to `false`

  * Instead of resampling the original waveform data to the target zoom
    level, resample from the next lowest available zoom level (@chrisn)

* (#421) Added `view.enableSeek()` function to allow seeking the playback
  position by clicking in the waveform view to be disabled (@chrisn)

* (#417) Fixed `logger` option (@rowild, @chrisn)

* (#418, #423) Fixed documentation links (@rowild)

## 0.27.0 (2021/11/04)

* (#310) Updated to use ES module format, Replaced browserify with Rollup and
  removed Bower support (@chrisn, @oncletom)

* (#392) Fixed `MouseDragHandler` under- and over-reporting mousemove events
  (@jdelStrother)

* Updated Konva to 8.1.4. This made some `draw()` calls unnecessary, so these
  have been removed (@chrisn)

* (#368) Konva.js and waveform-data.js are now included as peer dependencies.
  This means that projects using Peaks.js need to also import compatible
  versions of these libraries into their build. Peaks.js also now only
  imports the Konva modules that it uses, which significantly reduces bundle
  size (@chrisn)

* Use Rollup to build the custom markers demo page (@chrisn)

* (#387) Added a new `Peaks.init()` options structure (@chrisn)

* (#340) Added `showAxisTimeLabels`, `formatAxisTime`, and `formatPlayheadTime`
  options, to allow customization of the time labels shown next to the playhead
  and on the time axis (@chrisn)

* (#181) Added `playedWaveformColor` zoomview and overview options, and
  `view.setPlayedWaveformColor()` method (@chrisn)

* (#317) Added `view.setScrollMode()` function to allow scrolling the zoomable
  waveform using a mousewheel or trackpad gesture (@chrisn, @ffxsam,
  @jdelStrother)

* (#392) Added `view.scrollWaveform()` function (@jdelStrother, @chrisn)

* (#402) `points.add()` and `segments.add()` now return the objects added
  (@chrisn)

* (#318, #324) Added various click events: `points.dblclick`, `segments.click`,
  `zoomview.click`, and `overview.click` (@chrisn)

* (#396) Documentation improvements (@chrisn, @Liscare, @rowild)

* (#390) Fixed segment labels being overlapped by waveform segments, to ensure
  labels are visible (@chrisn)

* (#348) An error is now returned if `Peaks.init()` or `setSource()` is called
  with 16-bit waveform data (@chrisn)

* (#408) Added `peaks.once()` to the documented API (@chrisn)

* (#408) Changed `player.playSegment()` to return a Promise (@chrisn)

* (#363) Replaced remaining uses of `player.play` event with `player.playing`
  (@chrisn)

* Refactored to remove some code duplication (@jdelStrother)

* Improved TypeScript definitions (@jdelStrother, @chrisn)

## 0.26.0 (2021/05/22)

* Removed the `container` and `template` options. Please use the `containers`
  options instead (@chrisn)

* Removed the `height` option, as waveforms are automatically sized to fit
  the container element (@chrisn)

* Removed `containers.zoom` as alternative for the `containers.zoomview`
  option (@chrisn)

* (#356) Use integer values for mouse positions and waveform frame offset
  (@chrisn)

* Updated waveform-data.js to v4.1.0 (@chrisn)

## 0.25.0 (2021/04/18)

* (#353) Fixed setWaveformColor() to allow switching between fixed and gradient
  colors (@chrisn)

* Changed `Peaks.init()` to return undefined. Instead of using the
  `Peaks.init()` return value, you should now pass a callback parameter
  (@chrisn)

* Updated use of Konva.FastLayer, removes deprecation warnings (@chrisn)

* Refactored SegmentsLayer and SegmentShape (@chrisn)

* Removed undocumented `deprecationLogger` option (@chrisn)

## 0.24.1 (2021/04/09)

* (#380) Fixed cue events following renaming the player.play event
  in 0.24.0 (@chrisn)

* Minor code optimization in PlayheadLayer (@chrisn)

* Removed colors.css dependency (@chrisn)

* Simplified template and container option checks in Peaks.init()
  (@chrisn)

* Updated demo pages to use the containers option in Peaks.init()
  (@chrisn)

## 0.24.0 (2021/03/09)

* (#353) Added color gradient support for waveforms (@Christilut)

* (#359) Fixed setSource() so that the mediaUrl option is only required
  if using a media element (@Christilut)

* (#360) Fixed waveform initialisation where the media element has
  preload="none" (@chrisn)

* (#363) Changed playSegment() to use requestAnimationFrame() (@ffxsam)

* (#363) The player.play event has been renamed to player.playing, for
  consistency with the corresponding HTMLMediaElement event (@chrisn)

* (#367) Added player.ended event. This is emitted when the media element
  emits an "ended" event, and when playSegment() reaches the end of the
  segment (@ffxsam)

* (#369) Fixed documentation (@OmarShehata)

* Various fixes to the demo pages (@chrisn)

## 0.23.1 (2020/11/27)

 * Version bump to update npm release (@chrisn)

## 0.23.0 (2020/11/27)

 * (#325) Added fontFamily, fontStyle, fontSize config options (@chrisn)

 * (#321) Fixed waveform rendering so that waveforms are no longer inverted
   (@chrisn)

 * Removed unnecessary waveform re-render after dragging to scroll the
   zoomable waveform view (@chrisn)

## 0.22.0 (2020/09/05)

 * (#329) Added looped playback option to `segments.playSegment()` (@chrisn)

 * (#336) Allow users to set custom point and segment attributes (@chrisn)

 * (#332) Adjust playhead time label position when the playhead is at the right
   edge of the waveform display (@Karoid)

 * (#328) Fixed package.json to work on Windows (@chrisn)

## 0.21.0 (2020/04/27)

 * (#314) Added `player` option to allow use of external media player libraries.
   See customizing.md for details (@tscz)

 * (#104) Fixed initialization error for short media files, where the overview
   waveform is shorter than the container width (@chrisn)

 * (#31) Added player events to the public API, and renamed events for
   consistency (e.g., `player_seek` to `player.seeked`). See README.md for
   the new event names (@chrisn)

 * Replaced EventEmitter2 with EventEmitter3, to reduce file size (@chrisn)

## 0.20.0 (2020/04/25)

 * (#319) Added `timeLabelPrecision` option and `view.setTimeLabelPrecision()`
   method (@Dananji)

 * (#308) Added `waveformData` option, which allows Peaks.js to use pre-computed
   waveform data, instead of fetching the data from a web server or computing it
   using the Web Audio API (@is343)

 * Removed deprecated code, including:

   * `segments.ready` event (use `peaks.ready` or pass a callback to
     `Peaks.init()` instead)

   * `points.add()` no longer accepts a `timestamp` option (use `time` instead)

   * `points.add()` and `segments.add()` now only accept an object or an array
     of objects with point or segment data

   * `time.setCurrentTime()` and `time.getCurrentTime()` methods (use
     `player.seek()` and `player.getCurrentTime()` instead) (@chrisn)

 * Fixed error handling to use `Peaks.init()` callback consistently instead
   of throwing errors in some cases (@chrisn)

 * Enabled code coverage test reports (@chrisn)

 * Updated dependencies (@chrisn)

## 0.19.0 (2020/02/06)

 * (#309) Fixed rendering of non-editable segment marker handles (@chrisn)

 * Reduced size of npm and Bower installs by removing unnecessary files
   (@chrisn)

 * Refactored to simplify code structure. All source files are now placed
   in a single 'src' directory, and several files have been renamed for
   consistency (@chrisn)

## 0.18.1 (2020/02/02)

 * (#306) Updated TypeScript declarations (@tscz)

 * Documented `zoomview.setStartTime()` (@chrisn)

## 0.18.0 (2020/02/02)

 * (#300) Redesigned the marker customization API. Refer to customizing.md
   for detailed documentation on how to customize the appearance of point
   and segment marker handles (@chrisn)

 * Added a `view.fitToContainer()` method that resizes the waveform and point
   and segment marker handles to fit the available space (@chrisn)

 * Added zoomview.setStartTime() method (@chrisn)

 * The `inMarkerColor` and `outMarkerColor` configuration options have been
   renamed to `segmentStartMarkerColor` and `segmentEndMarkerColor` (@chrisn)

 * (#305) Added a `zoomview.setZoom()` method that gives applications greater
   flexibility in setting the zoom level. The zoom level can be set to (a)
   a number of samples per pixel, as per the existing `peaks.zoom.setZoom()`
   API, (b) a number of seconds fit to the available width, or (c) the entire
   audio duration fit to the available width (@chrisn)

## 0.17.0 (2020/01/16)

 * (#302) Fixed segment handle dragging so that dragging the start marker does
   not change the segment end time, and vice versa (@chrisn)

 * Added `view.enableMarkerEditing()` method (@chrisn)

 * Updated Typescript definitions (@is343, @chrisn)

## 0.16.0 (2019/12/16)

 * (#262) Increased hit region for segment mouseenter and mouseleave events,
   no longer requires placing the mouse directly over the waveform image
   (@chrisn)

 * (#263, #283) Added `destroyZoomview()` and `destroyOverview()` methods
   (@chrisn)

## 0.15.0 (2019/12/04)

 * (#293) Added `overview.dblclick` and `zoomview.dblclick` events (@chrisn)

 * Fixed Typescript definitions (@tscz, @chrisn)

## 0.14.5 (2019/11/10)

 * (#290) Fixed `setAmplitudeScale()` to update all waveform segments (@chrisn)

 * Disabled warnings from Konva.js

 * Fixed demo pages for Webkit

## 0.14.4 (2019/11/06)

 * (#289) Fixed `overlapHighlightOffset` behaviour when value too large
   (@jodonnell)

## 0.14.3 (2019/11/06)

 * (#288) Added `overviewHighlightOffset` option, and renamed the
   `overviewHighlightRectangleColor` option to `overviewHighlightColor`
   (@jodonnell)

## 0.14.2 (2019/11/05)

 * (#285) The axis labels are now correctly rendered on top of the waveform
   (@chrisn)

 * (#286) Fixed point/segment marker creation function options, and updated
   documentation (@chrisn)

## 0.14.1 (2019/10/31)

 * (#284) Fixed `peaks.destroy()` (@chrisn)

 * Updated waveform-data.js to v3.1.0 (@chrisn)

## 0.14.0 (2019/10/23)

 * (#287) Added `segment.dragstart` and `segment.dragend` events.
   The `segment.dragged` event now receives a boolean parameter that indicates
   whether the start or end marker is being dragged (@Spidy88)

## 0.13.1 (2019/10/22)

 * (#281) Fixed TypeScript definitions (@tscz)

 * Updated demo pages to use updated `Peaks.init()` API options (@chrisn)

## 0.13.0 (2019/09/11)

 * (#228, #240) Added ability to intialise a Peaks instance given an
   AudioBuffer

 * The API for creating waveforms using the Web Audio API has changed.
   Instead of passing an `audioContext` option to `Peaks.init()` or
   `peaksInstance.setSource()`, you should now pass a `webAudio` object,
   for example:

    ```javascript
    const options = {
      // ... etc
      webAudio: {
        audioContext: new AudioContext(),
        multiChannel: true
      }
    }

    Peaks.init(options, function(err, peaksInstance) { ... });
    ```

 * The (undocumented) `waveformBuilderOptions` option has also been removed.
   If you were using `amplitude_scale`, please use `view.setAmplitudeScale()`
   instead. The `scale` option is now determined by the lowest `zoomLevels`
   setting

 * Added `view.enableAutoScroll()` method

## 0.12.0 (2019/08/24)

 * (#194) Added multi-channel waveform support (@chrisn)

## 0.11.1 (2019/08/23)

 * Updated waveform-data.js to v3.0.0 (@chrisn)

## 0.11.0 (2019/08/11)

 * (#243, #268) Added `emitCueEvents` option that causes Peaks.js to emit
   `points.enter`, `segments.enter`, and `segments.exit` events during playback
   or on seeking (@gmarinov, @chrisn)

 * (#92) Added `setSource()` method to change the media element's source URL
   and update the waveform (@chrisn)

## 0.10.1 (2019/07/10)

 * (#211) Added `view.setAmplitudeScale()` method, and documented new API
   methods for creating and accessing the waveform views (@chrisn)

 * (#270) Fixed segment rendering after updating `startTime` or `endTime`
   (@chrisn)

 * (#267) Added option to run specific test files by glob pattern (@gmarinov)

## 0.10.0 (2019/06/22)

 * (#247) Added `update()` methods to allow changes to segment and point
   properties (@zachsa)

 * (#250) Added `segments.mouseenter`, `segments.mouseleave`, and
   `segments.click` events (@zachsa)

 * (#258) Added new `containers` option, to allow creation of zoomable
   and non-zoomable ('overview') waveform views. Added example pages,
   in the 'demo' folder (@chrisn)

 * Updated to Konva 3.3.3 (@chrisn)

## 0.9.14 (2019/03/05)

 * (#249, #251, #252) Enabled touch events for waveform container
   and point and segment markers (@rfrei)

 * Updated to Konva 3.1.6 and waveform-data.js 2.1.2, and updated
   development dependencies (@chrisn)

 * Updated TypeScript declarations (@evanlouie)

## 0.9.13 (2018/09/04)

 * Added TypeScript declarations (@evanlouie)

## 0.9.12 (2018/07/27)

 * Version bump after updating npm access token (@chrisn)

## 0.9.11 (2018/07/27)

 * Refactored waveform rendering code, added WaveformShape class (@chrisn)

 * Removed background layer, to reduce the number of Konva layers used (@chrisn)

 * Avoid building waveform data multiple times when using the Web Audio API
   (@cky917)

## 0.9.10 (2018/06/23)

 * Fixed use of Web Audio API in Safari (@ibobobo)

 * Fixed point drag event handling (@anthonytex, @chrisn)

## 0.9.9 (2018/05/21)

 * Allow Peaks objects to be created using the new operator (@chrisn)

 * The `points.add()` and `segments.add()` methods now operate atomically. This
   change ensures that the input point/segment objects are validated before
   storing, so that if an exception is thrown, we leave the state of the
   points/segments array as it was before the function was called (@chrisn)

 * Added `points.mouseenter` and `points.mouseleave` events. Also added
   `points.dblclick`, which replaces the (previously undocumented)
`   pointDblClickHandler` config option (@markjongkind, @chrisn)

 * Added `points.dragstart` and `points.dragend` events, and renamed
   `points.dragged` to `points.dragmove`. The (also undocumented)
   `pointDragEndHandler` config option is deprecated (@chrisn)

## 0.9.8 (2018/02/10)

 * Ensure resources used by `Player` object are released on calling
   `peaks.destroy()` (@chrisn)

 * `points.remove()` and `segments.remove()` no longer throw an exception
   if multiple matching markers are found. The removed markers are returned
   in an array (@chrisn)

 * Updated to eventemitter2 v5.0.1, also updated development dependencies
   (@chrisn)

## 0.9.7 (2018/01/25)

 * (#104) Prevent "zoom level too low" exception when using the Web Audio API
   to compute the waveform data (@chrisn)

 * (#213) Added `withCredentials` option to allow users to send credentials
   when requesting waveform data files using XHR (@bennypowers)

 * (#212) Fixed `points.removeAll()` and `segments.removeAll()` (@chrisn)

 * Fixed a bug where the time axis would show the wrong times next to the
   axis markers (@chrisn)

 * Peaks.js is now available via cdnjs. Added a link to the ReadMe
   (@extend1994)

## 0.9.6 (2018/01/13)

 * (#112) Fixed a race condition where an audio element that contains
   one or more source elements is added to a page, and `Peaks.init()`
   is called before the audio element has selected which source
   to use. Also improved error reporting, to avoid a misleading "Unable to
   determine a compatible dataUri format for this browser" error (@chrisn)

## 0.9.5 (2017/12/11)

 * (#207) Prevent jump in playhead motion after starting playback
   (@chrisn, @jdelStrother)

## 0.9.4 (2017/11/24)

 * Version bump to refresh npm and browserify cached releases (@chrisn)

## 0.9.3 (2017/11/24)

 * (#201) Added `showPlayheadTime` option to control display of the current time
   position next to the playhead marker (@chrisn)

 * (#202) Keep playhead layer in sync with timeupdate events (@jdelStrother)

## 0.9.2 (2017/09/27)

 * (#199) The playhead position is now correctly updated in the zoomable
   view after calling `player.seek()` (@chrisn)

 * Added parameter validation to `player.seek()` (@chrisn)

 * Show the time when dragging point markers (@chrisn)

 * Use a fixed set of default colors instead of random colors for segments
   (@chrisn)

 * Simplified `createSegmentMarker`, `createSegmentLabel`, and
   `createPointMarker` functions (@chrisn)

 * Refactored `WaveformPoints` and `WaveformSegments` classes (@chrisn)

 * Refactored `PointsLayer` and `SegmentsLayer` `_removeInvisiblePoints` methods
   (@chrisn)

## 0.9.1 (2017/08/29)

 * Fixed bug in IE11 which caused adding segment objects to fail (@chrisn)

## 0.9.0 (2017/08/16)

 * (#184, #116) Fixed waveform zoom and scrolling behaviour. Note that the
   animated zoom feature no longer works, and so static zoom is now always used,
   regardless of the `zoomAdapter` option (@chrisn)

 * Refactored `WaveformSegments` and `WaveformPoints` to separate the UI code
   into new `SegmentsLayer` and `PointsLayer` classes (@chrisn)

 * Points and segments are now represented by `Point` and `Segment` objects,
   rather than plain JavaScript objects (@chrisn)

 * (#117) Improved rendering speed of points and segments (@chrisn)

 * Points and segments with duplicate ids are no longer allowed (@chrisn)

 * The `segments.ready` event is deprecated, use `peaks.ready` instead (@chrisn)

 * Added `add`, `remove`, `remove_all`, and `dragged` events for points
   and segments (@chrisn)

 * The demo page now allows points and segments to be removed (@chrisn)

 * Added `ZoomController` and `TimeController` classes to simplify main.js (@chrisn)

 * Added `PlayheadLayer` class and refactored `WaveformOverview` and
   `WaveformZoomView` so that the playhead update code is reused between both
   (@chrisn)

 * Added `peaks.points.getPoint()` method (@chrisn)

 * Changed the keyboard interface so that the left/right arrow keys scroll the
   waveform by 1 second, and shift+left/right by one screen width (@chrisn)

 * Improved error messages (@chrisn)

 * Removed Node.js v4 and added v8 in Travis CI builds. Please use v6.0 or later
   to build Peaks.js (@chrisn)

 * Many other refactorings and code improvements (@chrisn)

## 0.8.1 (2017/07/03)

 * Fixed deprecation logging from time API functions (@chrisn)

 * Added parameter validation to `player.playSegment()` (@chrisn)

## 0.8.0 (2017/07/01)

 * (#192) Added `player.playSegment()` method (@craigharvi3)

 * Deprecated the time API; use the player API instead (@chrisn)

 * Display optional point label text (@chrisn)

 * Added documentation for the points API (@chrisn)

 * Build ChangeLog manually (@chrisn)

## 0.7.0 (2017/05/03)

 * Updated to waveform-data.js v2.0.1 (@chrisn)

 * (#182) Modified build to output a single UMD module; supporting installation with
   package managers or the script-tag (@craigjohnwright)

 * Another fix to mouse dragging behaviour (@chrisn)

 * (#187) Fixed segment handle rendering (@chrisn)

## v0.6.0 (2016/12/19)

 * (#167) Added audioContext config option (@chrisn, @oncletom, @dodds-cc)

 * (#165) Fixed mouse dragging behaviour (@chrisn)

 * (#161) More reliable clicking behaviour, don't turn seek click off on
   vertical mouse movement (@Develliot)

 * (#159) Added JSDoc comments (@chrisn)

 * (#157) Register mouse up/move events to the window rather than the waveform
   stages (@jdelStrother)

 * (#156) Refactored player and keyboard handler objects (@chrisn)

 * (#155) Refactored `WaveformPoints` and `WaveformSegments` (@chrisn)

## v0.5.0 (2016/08/25)

 * (#150) Add Peaks.destroy method (@jdelStrother)

## v0.4.9 (2016/08/24)

 * (#151) Report XHR errors (@jdelStrother)

 * (#152) Use the npm version of waveform-data.js (@oncletom)

## v0.4.8 (2016/08/18)

 * Fixed bug in `defaultInMarker()` which caused the wrong colour to be used for
   left-hand segment markers (@chrisn)

 * Renamed keyboard events (@chrisn)

 * Updated to EventEmitter v1.0.x (@chrisn)

 * Updated to Konva v1.0.x (@chrisn)

 * Fixed adding points from Peaks.init() (@chrisn)

 * (#144) Use `Konva.FastLayer` for drawing waveforms (@jdelStrother)

 * (#143) Improve `addSegment()` method signature (@jdelStrother)

 * (#142) Serve media from Karma during tests (@jdelStrother)

 * (#141) Add/remove points and segments by ID (@jdelStrother)

 * (#140) Expose browserified version as package.json "main" property
   (@oncletom)

 * (#139) Fixed keyboard right-shift bug (@chrisn)

 * Numerous other refactorings (@chrisn)

## v0.4.6 (2015/09/29)

 * (#127) Don't add waveform layer to the overview stage twice and ensure
   the UI layer is on top (@johvet)

 * (#125) Node 0.12 and iojs compatibility (@oncletom)

 * (#120) Explicit segment draw on drag resize (@oncletom)

 * (#121) Make more colors configurable (@ziggythehamster)

## v0.4.5 (2015/07/02)

 * (#123) Allow alternate zoom adapters, add a static (non-animated) zoom
   adapter, add more safety checks (@johvet, @ziggythehamster)

## v0.4.4 (2015/06/30)

 * (#122) Fix typo, seeking instead of seaking (@johvet)

 * (#113) Make the axis label and gridline colors configurable
   (@ziggythehamster)

 * (#111) Initial error logging function for async errors (@oncletom)

 * (#108) fix for bug #105 (@un-chein-andalou)

## 0.4.3 (2014/10/15)

 * (#101) deamdify and browserify back to optionalDependencies (@oncletom)

## 0.4.2 (2014/10/09)

 * Replaced example image in README.md

 * Fixed time-out errors in Travis CI builds

## 0.4.1 (2014/10/09)

 * (#86) Fix Kinetic bower path in README (@oncletom)

## 0.4.0 (2014/09/24)

 * (#72) Upgrade to Kinetic 5.10 (@oncletom)

 * (#84) Switch from SauceLabs to BrowserStack (@oncletom)

 * (#81) beforeEach -> before, afterEach -> after (@oncletom)

 * (#78) Added `peaks.points.removeAll()` method (@oncletom)

## 0.3.2 (2014/09/10)

 * (#79) EventEmitter2 prototype workaround (@oncletom)

 * (#75) Fixed Travis + IE9 tests (@oncletom)

## 0.3.1 (2014/09/08)

 * (#74) 0.3 Build System Fix (@oncletom)

## 0.3.0 (2014/08/21)

 * (#71) Replaced eventEmitter with eventemitter2 (@oncletom)

## 0.3.0-beta.5 (2014/07/10)

 * (#62) Added waveformZoomReady event (after segments and points initialized)
   (@chainlink)

## 0.3.0-beta.4 (2014/07/10)

 * Automatically deamdify files with browserify

## 0.3.0-beta.3 (2014/07/10)

 * (#66) Simplified build system (@oncletom)

 * (#63) Fixed bug when using grunt build for vanilla JS (Kinetic Not Found)
   (@chainlink)

 * (#52) Custom height for each container (@bbcrd)

 * Refactored waveform rendering code (@oncletom)

 * View height can be set through CSS (@oncletom)

 * Added smooth zoom animation (@mgrewal, @oncletom)

 * Use waveform-data.js v1.2.0 (@chainlink)

 * Added Points interface (@chainlink)

## 0.3.0-beta.2 (2014/06/28)

 * (#51) Added functions to delete segments (@oncletom)

 * Aliased `segments.addSegment()` as `segments.add()` (@oncletom)

## 0.3.0-beta.1 (2014/06/27)

 * (#50) Peaks build system (@oncletom)

 * Added Web Audio builder from waveform-data.js

## 0.2.1 (2014/03/24)

 * (#43) Fixed "SYNTAX_ERR: DOM Exception 12" error in Safari (@oncletom)

 * (#28) Segment improvement (@oncletom)

## 0.2.0 (2014/03/13)

 * (#36) Ability to work with a video element as well (@oncletom)

 * (#39) Fixing the `FAILED Peaks.segments "before each" hook` breaking CI
   (@oncletom)

 * (#38) Removing the requirejs builder (@oncletom)

 * (#37) Added `segments.ready` event (@oncletom)

 * (#35) Simplifying the AMD tree (@oncletom)

 * (#32) Resize event is assigned to window and not the Peaks instance
   (@oncletom)

 * (#33) Enforcing strict mode (@oncletom)

## 0.1.0 (2014/02/25)

 * (#26) Removed sass dependency (@oncletom)

 * (#20) Removed JST/Underscore dependencies (@oncletom)

 * (#19) Added tests for each element of the public API (@oncletom)

 * (#15) Partially removed jQuery dependency (@oncletom)

 * (#14) Fixed {zoom,over}view mouseup is not releasing
   `document.addEventListener("mouseup")` (@oncletom)

 * (#11) Handling multiple Peaks instances (@oncletom)

 * (#10) Added `peaks.time.setCurrentTime()` (@oncletom)

 * Rewrote the README and added screenshot (@oncletom)

 * Fixed playhead positioning after click/drag etc (@oncletom)

 * Removed dependency on underscore (@oncletom)

 * Added parameter validation (@oncletom)

 * Added test cases for segments API and zoom levels (@oncletom)

 * Removed bootstrap module (@oncletom)

## 0.0.6 (2014/02/19)

 * (#30) Clicking in the zoomview should just change the playhead position
   (@oncletom)

## 0.0.5 (2014/02/17)

 * (#25) Dragging zoomview bug (low priority) (@oncletom)

 * (#24) Out of Range bug (@oncletom)

## 0.0.4 (2014/02/06)

 * (#22) Seeking not working (@oncletom)

## 0.0.3 (2014/01/30)

 * (#17) Moving the playhead in views now updates the audio element
   currentTime (@oncletom)

 * (#16) Fixed IE9 bug with createSegment (@oncletom)

 * (#3) Added TravisCI + Saucelabs (@oncletom)

 * (#13) Migrated to Mocha+Chai for tests (@oncletom)

## 0.0.2 (2014/01/28)

 * (#12) `element.currentTime` side-effect (@oncletom)

 * (#5) Segments performance boost (@oncletom)

## 0.0.1 (2013/12/14 09:42 +00:00)

 * (#1) bower install failing for me (@oncletom)
