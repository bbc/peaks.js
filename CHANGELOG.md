# Peaks.js

## 0.9.5 (2017/12/11)

 * (#207) Prevent jump in playhead motion after starting playback
   (@chrisn, @jdelStrother)

## 0.9.4 (2017/11/24)

 * Version bump to refresh npm and browserify cached releases (@chrisn)

## 0.9.3 (2017/11/24)

 * (#201) Added showPlayheadTime option to control display of the current time
   position next to the playhead marker (@chrisn)

 * (#202) Keep playhead layer in sync with timeupdate events (@jdelStrother)

## 0.9.2 (2017/09/27)

 * (#199) The playhead position is now correctly updated in the zoomable
   view after calling player.seek() (@chrisn)
 * Added parameter validation to player.seek() (@chrisn)
 * Show the time when dragging point markers (@chrisn)
 * Use a fixed set of default colors instead of random colors for segments
   (@chrisn)
 * Simplified createSegmentMarker, createSegmentLabel, and createPointMarker
   functions (@chrisn)
 * Refactored WaveformPoints and WaveformSegments classes (@chrisn)
 * Refactored PointsLayer and SegmentsLayer _removeInvisiblePoints methods
   (@chrisn)

## 0.9.1 (2017/08/29)

 * Fixed bug in IE11 which caused adding segment objects to fail (@chrisn)

## 0.9.0 (2017/08/16)

 * (#184, #116) Fixed waveform zoom and scrolling behaviour. Note that the
   animated zoom feature no longer works, and so static zoom is now always used,
   regardless of the 'zoomAdapter' option (@chrisn)
 * Refactored WaveformSegments and WaveformPoints to separate the UI code into
   new SegmentsLayer and PointsLayer classes (@chrisn)
 * Points and segments are now represented by Point and Segment objects, rather
   than plain JavaScript objects (@chrisn)
 * (#117) Improved rendering speed of points and segments (@chrisn)
 * Points and segments with duplicate ids are no longer allowed (@chrisn)
 * The 'segments.ready' event is deprecated, use 'peaks.ready' instead (@chrisn)
 * Added 'add', 'remove', 'remove_all', and 'dragged' events for points
   and segments (@chrisn)
 * The demo page now allows points and segments to be removed (@chrisn)
 * Added ZoomController and TimeController classes to simplify main.js (@chrisn)
 * Added PlayheadLayer class and refactored WaveformOverview and
   WaveformZoomView so that the playhead update code is reused between both
   (@chrisn)
 * Added peaks.points.getPoint() method (@chrisn)
 * Changed the keyboard interface so that the left/right arrow keys scroll the
   waveform by 1 second, and shift+left/right by one screen width (@chrisn)
 * Improved error messages (@chrisn)
 * Removed Node.js v4 and added v8 in Travis CI builds. Please use v6.0 or later
   to build Peaks.js (@chrisn)
 * Many other refactorings and code improvements (@chrisn)

## 0.8.1 (2017/07/03)

 * Fixed deprecation logging from time API functions (@chrisn)
 * Added parameter validation to Player.playSegment (@chrisn)

## 0.8.0 (2017/07/01)

 * (#192) Added Player.playSegment() method (@craigharvi3)
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
 * (#155) Refactored WaveformPoints and WaveformSegments (@chrisn)

## v0.5.0 (2016/08/25)

 * (#150) Add Peaks.destroy method (@jdelStrother)

## v0.4.9 (2016/08/24)

 * (#151) Report XHR errors (@jdelStrother)
 * (#152) Use the npm version of waveform-data.js (@oncletom)

## v0.4.8 (2016/08/18)

 * Fixed bug in defaultInMarker() which caused the wrong colour to be used for
   left-hand segment markers (@chrisn)
 * Renamed keyboard events (@chrisn)
 * Updated to EventEmitter v1.0.x (@chrisn)
 * Updated to Konva v1.0.x (@chrisn)
 * Fixed adding points from Peaks.init() (@chrisn)
 * (#144) Use Konva.FastLayer for drawing waveforms (@jdelStrother)
 * (#143) Improve addSegment() method signature (@jdelStrother)
 * (#142) Serve media from Karma during tests (@jdelStrother)
 * (#141) Add/remove points and segments by ID (@jdelStrother)
 * (#140) Expose browserified version as package.json "main" property
   (@oncletom)
 * (#139) Fixed keyboard right-shift bug (@chrisn)
 * Numerous other refactorings (@chrisn)

## v0.4.6 (2015/09/29)

 * (#127) Don't add waveform layer to the overview stage twice and ensure
   the UI layer is on top (@johvet)
 * (#125) Node 0.12 and iojs compability (@oncletom)
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
 * (#78) Added peaks.points.removeAll() method (@oncletom)

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
 * Aliased segments.addSegment as segments.add (@oncletom)

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
 * (#37) Added "segments.ready" event (@oncletom)
 * (#35) Simplifying the AMD tree (@oncletom)
 * (#32) Resize event is assigned to window and not the Peaks instance
   (@oncletom)
 * (#33) Enforcing strict mode (@oncletom)

## 0.1.0 (2014/02/25)

 * (#26) Removed sass dependency (@oncletom)
 * (#20) Removed JST/Underscore dependencies (@oncletom)
 * (#19) Added tests for each element of the public API (@oncletom)
 * (#15) Partially removed jQuery dependency (@oncletom)
 * (#14) Fixed {zoom,over}view mouseup is not releasing document.addEventListener("mouseup") (@oncletom)
 * (#11) Handling multiple Peaks instances (@oncletom)
 * (#10) Added peaks.time.setCurrentTime() (@oncletom)
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
