# Peaks.js Changelog

## 0.0.4

Fixing regressions introduced since `0.0.1`, related to inaccuracies between audio playback, user interactions
and rendering: what you could hear was not what you clicked on and vice-versa.

- [#22](https://github.com/bbcrd/peaks.js/issue/22): Seeking not working
- [#21](https://github.com/bbcrd/peaks.js/issue/21): Beats don't match anymore if you try to seek
- [#9](https://github.com/bbcrd/peaks.js/issue/9): Skipping in audio via JS doesn't move zoomed-in view

## 0.0.3

Delivering a fix for playhead sync within the zoom view and an improved Internet Explorer compatibility.

Continuous Integration is now performed with [TravisCI](https://travis-ci.org/bbcrd/peaks.js) and [SauceLabs](http://saucelabs.com/).

- [#16](https://github.com/bbcrd/peaks.js/issue/16): IE9: Unable to get value of the property 'createSegment': object is null or undefined
- [#17](https://github.com/bbcrd/peaks.js/issue/17): Moving the playhead in views should update the audio element currentTime

## 0.0.2

You can now manage hundreds of segments without encountering a performance hit in your interface!

- [#5](https://github.com/bbcrd/peaks.js/issue/5): dramatically improved `peaks.segments.addSegment` API
- [#4](https://github.com/bbcrd/peaks.js/issue/4), [#12](https://github.com/bbcrd/peaks.js/issue/12): fixed a misplacement of the playhead when clicking in the zoom view when adjusting the `audioElement.currentTime` programmatically

## 0.0.1

- initial release
- `bower` and `npm` registry publishing