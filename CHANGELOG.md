## Change Log

### 0.4.6 (2015/09/29 10:56 +00:00)
- [#127](https://github.com/bbcrd/peaks.js/pull/127) Bugfix: Don't add waveform layer to the overview stage twice and ensure the UI layer is on top (@johvet)
- [#125](https://github.com/bbcrd/peaks.js/pull/125) Node 0.12 and iojs compability (@oncletom)
- [#120](https://github.com/bbcrd/peaks.js/pull/120) Explicit segment draw on drag resize (@oncletom)
- [#121](https://github.com/bbcrd/peaks.js/pull/121) Make more colors configurable (@ziggythehamster)

### v0.4.5 (2015/07/02 10:45 +00:00)
- [#123](https://github.com/bbcrd/peaks.js/pull/123) Allow alternate zoom adapters, add a static (non-animated) zoom adapter, add more safety checks (@johvet, @ziggythehamster)

### v0.4.4 (2015/06/30 06:55 +00:00)
- [#122](https://github.com/bbcrd/peaks.js/pull/122) Fix typo, seeking instead of seaking (@johvet)
- [#113](https://github.com/bbcrd/peaks.js/pull/113) Make the axis label and gridline colors configurable (@ziggythehamster)
- [#111](https://github.com/bbcrd/peaks.js/pull/111) Initial error logging function for async errors. (@oncletom)
- [#108](https://github.com/bbcrd/peaks.js/pull/108) fix for bug #105 (@un-chein-andalou)

### 0.4.3 (2014/10/15 12:34 +00:00)
- [#101](https://github.com/bbcrd/peaks.js/pull/101) deamdify and browserify back to optionalDependencies. (@oncletom)

### 0.4.1 (2014/10/09 19:12 +00:00)
- [#86](https://github.com/bbcrd/peaks.js/pull/86) Fix Kinetic bower path in README. (@oncletom)

### 0.4.0 (2014/09/24 12:15 +00:00)
- [#72](https://github.com/bbcrd/peaks.js/pull/72) Upgrade to Kinetic 5.10 (@oncletom)
- [#84](https://github.com/bbcrd/peaks.js/pull/84) Switch from SauceLabs to BrowserStack (@oncletom)
- [#81](https://github.com/bbcrd/peaks.js/pull/81) beforeEach -> before, afterEach -> after (@oncletom)
- [#78](https://github.com/bbcrd/peaks.js/pull/78) peaks.points.removeAll() method (@oncletom)

### 0.3.2 (2014/09/10 09:51 +00:00)
- [#79](https://github.com/bbcrd/peaks.js/pull/79) EventEmitter2 prototype workaround. (@oncletom)
- [#75](https://github.com/bbcrd/peaks.js/pull/75) Travis + IE9 tests to work again (@oncletom)

### 0.3.1 (2014/09/08 11:05 +00:00)
- [#74](https://github.com/bbcrd/peaks.js/pull/74) 0.3 Build System Fix (@oncletom)

### 0.3.0 (2014/08/21 13:19 +00:00)
- [#71](https://github.com/bbcrd/peaks.js/pull/71) eventEmitter -> eventemitter2 (@oncletom)

### 0.3.0-beta.5 (2014/07/10 17:28 +00:00)
- [#62](https://github.com/bbcrd/peaks.js/pull/62) Added waveformZoomReady event (after segments and points initialized) (@chainlink)

### 0.3.0-beta.3 (2014/07/10 16:14 +00:00)
- [#66](https://github.com/bbcrd/peaks.js/pull/66) Simplified build system. (@oncletom)
- [#63](https://github.com/bbcrd/peaks.js/pull/63) Fixed Bug when using grunt build for vanilla JS (Kinetic Not Found). (@chainlink)
- [#52](https://github.com/bbcrd/peaks.js/pull/52) Custom Height for each container (@oncletom)

### 0.3.0-beta.2 (2014/06/28 16:31 +00:00)
- [#51](https://github.com/bbcrd/peaks.js/pull/51) Delete segments (@oncletom)

### 0.3.0-beta.1 (2014/06/27 19:26 +00:00)
- [#50](https://github.com/bbcrd/peaks.js/pull/50) Peaks build system. (@oncletom)

### 0.2.1 (2014/03/24 17:47 +00:00)
- [#43](https://github.com/bbcrd/peaks.js/pull/43) Fixing `SYNTAX_ERR: DOM Exception 12` in Safari (@oncletom)
- [#28](https://github.com/bbcrd/peaks.js/pull/28) Segment improvement (@oncletom)

### 0.2.0 (2014/03/13 17:58 +00:00)
- [#36](https://github.com/bbcrd/peaks.js/pull/36) Ability to work with a video element as well (@oncletom)
- [#39](https://github.com/bbcrd/peaks.js/pull/39) Fixing the `FAILED Peaks.segments "before each" hook` breaking CI (@oncletom)
- [#38](https://github.com/bbcrd/peaks.js/pull/38) Removing the requirejs builder (@oncletom)
- [#37](https://github.com/bbcrd/peaks.js/pull/37) Emitting a `segments.ready` event. (@oncletom)
- [#35](https://github.com/bbcrd/peaks.js/pull/35) Simplifying the AMD tree (@oncletom)
- [#32](https://github.com/bbcrd/peaks.js/pull/32) Resize event is assigned to window and not the Peaks instance (@oncletom)
- [#33](https://github.com/bbcrd/peaks.js/pull/33) Enforcing strict mode (@oncletom)

### 0.0.6 (2014/02/19 22:31 +00:00)
- [#30](https://github.com/bbcrd/peaks.js/pull/30) Clicking in the zoomview should just change the playhead position (@oncletom)

### 0.0.5 (2014/02/17 19:26 +00:00)
- [#25](https://github.com/bbcrd/peaks.js/pull/25) Dragging zoomview bug (low priority) (@oncletom)
- [#24](https://github.com/bbcrd/peaks.js/pull/24) Out of Range bug (@oncletom)

### 0.0.4 (2014/02/06 18:09 +00:00)
- [#22](https://github.com/bbcrd/peaks.js/pull/22) Seeking not working (@oncletom)

### 0.0.3 (2014/01/30 16:56 +00:00)
- [#17](https://github.com/bbcrd/peaks.js/pull/17) [READY] Moving the playhead in views should update the audio element currentTime (@oncletom)
- [#16](https://github.com/bbcrd/peaks.js/pull/16) IE9: Unable to get value of the property 'createSegment': object is null or undefined (@oncletom)
- [#3](https://github.com/bbcrd/peaks.js/pull/3) [WIP] Adding TravisCI + Saucelabs (@oncletom)
- [#13](https://github.com/bbcrd/peaks.js/pull/13) Migrating to Mocha+Chai for tests (@oncletom)

### 0.0.2 (2014/01/28 16:07 +00:00)
- [#12](https://github.com/bbcrd/peaks.js/pull/12) `element.currentTime` side-effect (@oncletom)
- [#5](https://github.com/bbcrd/peaks.js/pull/5) [READY] Segments performance boost (@oncletom)

### 0.0.1 (2013/12/14 09:42 +00:00)
- [#1](https://github.com/bbcrd/peaks.js/pull/1) bower install failing for me (@oncletom)