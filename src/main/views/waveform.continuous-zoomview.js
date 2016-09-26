/**
 * @file
 *
 * Defines the {@link WaveformContinuousZoomView} class.
 *
 * @module peaks/views/waveform.continuous-zoomview
 */
define([
  'peaks/waveform/waveform.axis',
  'peaks/waveform/waveform.mixins',
  'konva'
], function(WaveformAxis, mixins, Konva) {
  'use strict';

  /**
   * Creates the continuous zoom view canvas.
   *
   * @class
   * @alias WaveformContinuousZoomView
   */
  function WaveformContinuousZoomView(waveformData, container, peaks) {
    var self = this;

    self.peaks = peaks;
    self.options = peaks.options;

    self.width = container.clientWidth;
    self.height = container.clientHeight || self.options.height;

    self.rootData = waveformData;

    // create a snapshot of the data when zoomed out all the way
    // and a snapshot of the data when zoomed in all the way
    //
    // we use the difference between the two values to determine a few scaling
    // factors

    self.zoomedOutData = self.rootData.resample(self.width);
    self.data = self.rootData.resample({
      scale: peaks.zoom.getMaximumScaleFactor()
    });

    // store the duration of the audio
    this.totalDuration = this.rootData.duration;

    // these properties always tell us how many seconds of audio are displayed
    // per pixel on the screen, and how many pixels of screen width are
    // required to display 1 second of audio. They are kept up to date
    // throughout the continuous zoom and form the basis of many of the
    // calculations
    this.secondsPerPixel = this.data.seconds_per_pixel;
    this.pixelsPerSecond = this.data.pixels_per_second;

    // when the audio is playing we keep track of the number of milliseconds
    // that have elapsed since the last draw. This lets us move the playhead
    // more smoothly than if it were entirely synced to the audio player's
    // time
    this.lastTimeDelta = null;

    // ...however, sometimes we don't want to automatically move the playhead.
    // For example, immediately following the repositioning of the playhead
    // based on the current time reported by the audio player
    this.justUpdatedTime = false;

    // stores the last time of the playhead
    this.lastTime = 0;

    // a property which keeps track of the position of the audio that's
    // currently displayed on the very left edge of the container.
    // Used to quickly determine if we are 'out of bounds'
    this.leftEdgeTime = 0;

    // when click-dragging the waveform, this lets us keep track of the amount
    // that the waveform has currently been dragged. This is used to update
    // various positions during the drag to keep things looking accurate
    this.seekMovement = 0;

    // a flag that lets us explicity tell the rendering loop that we want the
    // content to be drawn, even if it otherwise wouldn't be drawn.
    this.dirty = true;

    // a cache of pre-sampled data at different breakpoints
    this.dataCache = [];

    // decide how many different sets of pre-sampled data should be created.
    // If specificed in the options, use that value - otherwise work out a
    // number based on the duration of the audio.
    var maxCount = peaks.options.continuousZoomCacheSize ||
                   Math.max(20, Math.round(this.totalDuration / 20));

    // we are going to iterate through a process 'maxCount' times to generate
    // some data, so keep a counter to tell us how many more times we need to
    // complete this process
    var currentStep = maxCount;

    // the number of seconds of data that will be visible onscreen when totally
    // zoomed in, and therefore the number of seconds of data that will be
    // offscreen when totally zoomed in
    var visibleZoomedIn = this.width * this.data.seconds_per_pixel,
        notVisibleZoomedIn = this.totalDuration - visibleZoomedIn;

    // create the various UI elements
    this.stage = new Konva.Stage({
      container: container,
      width: this.width,
      height: this.height
    });

    this.background = new Konva.Rect({
      x: 0,
      y: 0,
      width: this.width,
      height: this.height
    });

    this.zoomWaveformLayer = new Konva.Layer();
    this.uiLayer = new Konva.Layer();

    this.createZoomWaveform();
    this.createUi();

    this.zoomWaveformLayer.add(this.background);

    // declare a function that will be called mulitple times to generate each
    // piece of pre-sampled data
    function doNext() {
      // work out the ratio of the current iteraion. The first iteration will
      // have ratio of 1, the final iteration will be 0
      var ratio = currentStep / maxCount;

      // work out the number of seconds of data that will be visible at this
      // breakpoint
      var visibleSeconds = visibleZoomedIn + (notVisibleZoomedIn * ratio);
      // now use that to work out how many pixels the audio would take up at
      // this breakpoint
      var pixelRatio = (self.totalDuration / visibleSeconds) * self.width;

      // now resample the data with these settings...
      var newData = self.rootData.resample(pixelRatio);

      // ... and offset the data to the width of the container
      newData.offset(0, self.width);
      // ... and put the data in the cache for later...
      self.dataCache.push(newData);

      currentStep--;

      // if we have more steps to complete (and note that we're going to be
      // performing the process one more time that you'd be expecting)
      if (currentStep >= 0) {
        // repeat the process after a few milliseconds
        //
        // we could do this all in one loop, but it would lock the UI.
        // Doing it this way lets us at least show a progress indicator
        // if we want to.
        //
        peaks.emit('zoom.preload-progress', maxCount - currentStep, maxCount);

        setTimeout(function() {
          doNext();
        }, 10);
      }
      else {
        // we've finished - put an extra copy of the final data in the cache,
        // and get started!
        self.dataCache.push(newData);
        ready();
      }
    }

    // being the pre-loading phase
    doNext();

    // called when the data has been pre-sampled and cached
    function ready() {
      // set the current index - in other words, which pre-sampled data are we
      // currently using
      self.currentIndex = self.dataCache.length - 1;

      // create the axis now we're ready
      self.axis = new WaveformAxis(self);

      // do some UI tidying
      self.stage.add(self.zoomWaveformLayer);
      self.zoomWaveformLayer.moveToBottom();

      // INTERACTION ===============================================

      self.stage.on('mousedown', function(event) {
        if (event.target &&
          !event.target.attrs.draggable &&
          !event.target.parent.attrs.draggable) {
          if (event.type === 'mousedown') {
            var x = event.evt.layerX, dX;

            // enable drag if necessary
            self.stage.on('mousemove', function(event) {
              peaks.seeking = true;
              dX = event.evt.layerX > x ? x - event.evt.layerX : (x - event.evt.layerX) * 1;
              x = event.evt.layerX;
              self.seekMovement = dX;
            });

            document.addEventListener('mouseup', function _upHandler() {
              if (!peaks.seeking) {
                self.seekTo(self.leftEdgeTime + (x / self.pixelsPerSecond));
              }

              if (peaks.seeking) {
                self.seekMovement = 0;
              }

              document.removeEventListener('mouseup', _upHandler);
              self.stage.off('mousemove');
              self.peaks.seeking = false;
            });
          }
        }
      });

      // EVENTS ====================================================

      var userSeekHandler = function userSeekHandler(options, time) {
        options = options || { withOffset: true };
      };

      var playerSeekHandler = function userSeekHandler(options, time) {
        options = options || { withOffset: true };
      };

      self.peaks.on('player_time_update', function(time) {
        // store the last time of the player
        self.lastTime = time;
        // tell our render function that we've just updated the time,
        // and don't need to add on the current time delta
        self.justUpdatedTime = true;
        // force a re-render
        self.dirty = true;
      });

      self.peaks.on('player_seek', playerSeekHandler.bind(null, {
        withOffset: true
      }));
      self.peaks.on('user_seek.*', userSeekHandler.bind(null, {
        withOffset: true
      }));
      self.peaks.on('user_scrub.*', userSeekHandler.bind(null, {
        withOffset: false
      }));

      self.peaks.on('player_play', function(time) {
        self.playing = true;
      });

      self.peaks.on('player_pause', function(time) {
        self.playing = false;
      });

      // handles the case where the user is dragging the left-edge of the
      // viewport box within the WaveformEditableOverview box
      self.peaks.on('zoom.change.left', function(left) {
        self.leftEdgeTime = left;
        self.adjustOffset(true);
      });

      // the main handler that responds to changes in zoom level...
      //
      // this is fiddly!
      self.peaks.on('zoom.change', function(newRatio, wasFromOverview) {
        newRatio = Math.min(1, Math.max(0, newRatio));

        // cache the current X position of the playhead
        var oldPlayheadX = (self.lastTime - self.leftEdgeTime) * self.pixelsPerSecond;

        // cache the length of the cache array
        var max = self.dataCache.length - 1;

        // a flag to say whether we've changed breakpoint or not.
        // If we do, we need to make some adjustments later on
        var changedBreakpoint = false;

        // decide which pre-sampled data we should be using from the cache
        var newIndex = Math.floor(newRatio * max);

        if (newIndex >= max) {
          newIndex = max - 1;
        }

        if (newIndex < 0) {
          newIndex = 0;
        }

        // if we've changed breakpoints...
        if (newIndex !== self.currentIndex) {
          // update the current index
          self.currentIndex = newIndex;
          // grab the value from the cache
          self.data = self.dataCache[self.currentIndex];
          // update the flag
          changedBreakpoint = true;
        }

        // above, we 'floor'ed the calculation to work out which index of the
        // cache array we should be using here, we find out the value that was
        // lost when we 'floor'ed so we can make the intermediate adjustments
        var proportionAboveIndex = (newRatio * max) - newIndex;

        // to make these intermediate adjustments, we need to knoe the different
        // in 'pixels per second' between the current pre-sampled, and the next
        // highest pre-sampled data. So get the pixels_per_second value for both
        // sets of data
        var currentRatio = self.dataCache[self.currentIndex + 1].pixels_per_second;
        var lowerRatio = self.dataCache[self.currentIndex].pixels_per_second;

        // and now work out the ratio of the two pixels_per_second values
        var divider = (currentRatio / lowerRatio);
        // finally, we can work out how to adjust between the two breakpoints
        // using this calculation
        var multiplier = (divider * proportionAboveIndex) + (1 - proportionAboveIndex);

        // the value from this calculation will become our new zoom ratio
        self.zoomRatio = multiplier;

        // update the seconds_per_pixel and pixels_per_second values that we use
        // throughout
        self.secondsPerPixel = self.dataCache[self.currentIndex].seconds_per_pixel * self.zoomRatio;
        self.pixelsPerSecond = self.dataCache[self.currentIndex].pixels_per_second * self.zoomRatio;

        // do some work to make sure that the position of the playhead doesn't
        // move during the zoom. This seems to be the least jarring behaviour
        // for the user. Note that if we're currently dragging the audio,
        // we skip this step
        if (!self.peaks.dragSeeking) {
          var newLeftEdgeTime = (self.lastTime - (oldPlayheadX / self.pixelsPerSecond));

          self.leftEdgeTime = newLeftEdgeTime;
        }

        // adjust the offset of the data
        self.adjustOffset(true);

        // scale the layer to the correct value
        self.zoomWaveformLayer.scale({
          x: self.zoomRatio,
          y: 1
        });

        // if we have a segment layer, that'll need scaling too
        if (self.segmentLayer && !changedBreakpoint) {
          self.segmentLayer.scale({
            x: self.zoomRatio,
            y: 1
          });
          self.segmentLayer.draw();
        }

        // set the flag to ensure a redraw
        self.dirty = true;

        // if we changed breakpoints, we need to redraw the layer and send out
        // notification
        if (changedBreakpoint) {
          self.zoomWaveformLayer.draw();
          self.peaks.emit('waveform_zoom_updating');
        }
      });

      self.peaks.on('window_resized', function(width, newWaveformData) {
        self.peaks.emit('zoomview_resized');
      });

      // KEYBOARD EVENTS =========================================
      var nudgeFrame = function nudgeFrame(step) {
        var time = self.options.mediaElement.currentTime +
                   self.options.nudgeIncrement * step;

        self.peaks.emit('user_seek.zoomview', time, 999);
      };

      self.peaks.on('keyboard.left', nudgeFrame.bind(self, -1));
      self.peaks.on('keyboard.right', nudgeFrame.bind(self, 1));
      self.peaks.on('keyboard.shift_left', nudgeFrame.bind(self, -10));
      self.peaks.on('keyboard.shift_right', nudgeFrame.bind(self, 10));

      self.peaks.emit('zoom.change', self.peaks.zoom.getZoom());

      // rAF polyfill - todo - improve this
      window.requestAnimFrame = (function() {
        return window.requestAnimationFrame ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame ||
          function(callback) {
            window.setTimeout(callback, 1000 / 60);
          };
      })();

      // setup our render loop
      (function animloop() {
        window.requestAnimFrame(animloop);

        var now = new Date().getTime(),
            dt = now - (self.lastTimeDelta || now);

        self.lastTimeDelta = now;

        self.render(dt);
      })();

      // and finally, send out notification that we're ready to go
      self.peaks.emit('zoomview.ready');
    }
  }

  // WAVEFORM ZOOMVIEW FUNCTIONS =========================================

  WaveformContinuousZoomView.prototype.render = function(timeDelta) {
    // if we're playing, we want to gracefully update the playhead position
    if (this.playing && !this.justUpdatedTime) {
      this.lastTime += timeDelta / 1000;
    }
    this.justUpdatedTime = false;

    // if we're seeking...
    if (this.peaks.seeking && this.seekMovement !== 0) {
      this.adjustFromSeek();
      this.seekMovement = 0;
    }

    // if we need to redraw for *any* reason, do it
    if (this.peaks.seeking || this.dirty || this.playing) {
      this.dirty = false;
      this.syncPlayhead();
      this.peaks.emit('zoomview.displaying', this.leftEdgeTime, this.getRightEdgeTime());
    }
  };

  /**
   * Returns the position of the audio found at the very right hand edge
   * of the screen at the current zoom level.
   *
   * @returns {Number}
   */
  WaveformContinuousZoomView.prototype.getRightEdgeTime = function() {
    var rightEdgeTime = this.leftEdgeTime +
                        (this.secondsPerPixel * this.width / (this.zoomRatio * this.zoomRatio));

    return rightEdgeTime;
  };

  /**
   * Seeks to a certain position in the audio, and sets the 'dirty' flag
   * ensuring a redraw.
   *
   * @param {Number} time The time position to seek to, in seconds
   */
  WaveformContinuousZoomView.prototype.seekTo = function(time) {
    this.peaks.emit('user_seek.zoomview', time);
    this.dirty = true;
    this.lastTime = time;
  };

  /**
   * Returns the position of the audio found at the very left hand edge
   * of the screen at the current zoom level.
   *
   * @returns {Number}
   */
  WaveformContinuousZoomView.prototype.getDataTime = function() {
    return this.leftEdgeTime;
  };

  /**
   * Returns the pixel position for a particuilar position in the audio.
   *
   * @returns {Number}
   */
  WaveformContinuousZoomView.prototype.atDataTime = function(axisLabelOffsetSecs) {
    return axisLabelOffsetSecs * this.pixelsPerSecond;
  };

  /**
   * Sets up the waveform etc.
   */
  WaveformContinuousZoomView.prototype.createZoomWaveform = function() {
    this.zoomWaveformShape = new Konva.Shape({
      fill: this.options.zoomWaveformColor,
      strokeWidth: 0
    });

    this.zoomWaveformShape.sceneFunc(mixins.waveformDrawFunction.bind(this.zoomWaveformShape, this));

    this.zoomWaveformLayer.add(this.zoomWaveformShape);
  };

  /**
   * Creates and configures the UI.
   */
  WaveformContinuousZoomView.prototype.createUi = function() {
    this.zoomPlayheadLine = new Konva.Line({
      points: [0.5, 0, 0.5, this.height],
      stroke: this.options.playheadColor,
      strokeWidth: 1
    });

    this.zoomPlayheadText = new Konva.Text({
      x: 2,
      y: 12,
      text: '00:00:00',
      fontSize: 11,
      fontFamily: 'sans-serif',
      fill: this.options.playheadTextColor,
      align: 'right'
    });

    this.zoomPlayheadGroup = new Konva.Group({
      x: 0,
      y: 0
    });

    this.zoomPlayheadGroup.add(this.zoomPlayheadLine)
                          .add(this.zoomPlayheadText);

    this.uiLayer.add(this.zoomPlayheadGroup);
    this.stage.add(this.uiLayer);

    this.zoomPlayheadGroup.moveToTop();
  };

  // UI functions ==============================
  //
  WaveformContinuousZoomView.prototype.syncPlayhead = function() {
    // get the current time that would be displayed at the right hand edge
    // of the screen
    var rightEdgeTime = this.getRightEdgeTime();

    // if we're not seeking, and the playhead is off the left or right hand
    // edges...
    if (!this.peaks.seeking && (this.lastTime > rightEdgeTime ||
                                this.lastTime < this.leftEdgeTime)) {
      // adjust the offset
      this.adjustOffset(false);
    }

    // adjust the position of the playhead to match the current position
    // in the audio
    this.zoomPlayheadGroup.setAttr('x', (this.lastTime - this.leftEdgeTime) * this.pixelsPerSecond);
    // store the current position of the left edge of the screen, in pixels.
    // This is used by other classes
    this.frameOffset = this.leftEdgeTime * this.pixelsPerSecond;
    // update the time displayed on the playhead
    this.zoomPlayheadText.setText(mixins.niceTime(this.lastTime, false));

    this.uiLayer.draw();
  };

  /**
   * Clamps the left and right edges of the display to make sure we don't
   * go out of bounds.
   *
   * @private
   */
  WaveformContinuousZoomView.prototype.clamp = function() {
    this.leftEdgeTime = Math.max(0, Math.min(this.totalDuration - (this.width * this.secondsPerPixel), this.leftEdgeTime));

    var start = Math.floor(this.leftEdgeTime * this.pixelsPerSecond),
        end = start + (this.width / this.zoomRatio);

    this.data.offset(start, end);
    this.zoomWaveformLayer.draw();
  };

  /**
   * During a seek (e.g., when the user drags the overview window) we need to
   * adjust the position of the waveform to keep things in sync.
   */
  WaveformContinuousZoomView.prototype.adjustFromSeek = function() {
    // cache the current left edge time
    var leftEdgeTime = this.leftEdgeTime;
    // work out how many seconds of audio are visible on the screen
    var secondsOnScreen = this.width * this.secondsPerPixel / (this.zoomRatio * this.zoomRatio);

    // adjust the current left edge based on the amount we have seeked
    this.leftEdgeTime += this.seekMovement * this.secondsPerPixel / (this.zoomRatio * this.zoomRatio);
    // and clamp
    this.leftEdgeTime = Math.max(0, Math.min(this.totalDuration - secondsOnScreen, this.leftEdgeTime));

    // now adjust the offset
    var start = Math.floor(this.leftEdgeTime * this.pixelsPerSecond / (this.zoomRatio)),
        end = start + (this.width / this.zoomRatio);

    this.data.offset(start, end);

    // if we made a change, send out notification
    if (leftEdgeTime !== this.leftEdgeTime) {
      this.peaks.emit('waveform_zoom_updating');
    }

    this.zoomWaveformLayer.draw();
  };

  /**
   * Makes UI adjustments once the segment layer is added.
   */
  WaveformContinuousZoomView.prototype.segmentLayerAdded = function() {
    this.uiLayer.moveToTop();
  };

  /**
   * Another method to help with adjusting and clamping the zoom to prevent us
   * going out of bounds.
   *
   * @private
   */
  WaveformContinuousZoomView.prototype.adjustOffset = function(offsetOnly) {
    // cache the current left edge time
    var leftEdgeTime = this.leftEdgeTime;

    // work out how many seconds of audio are visible on the screen
    var secondsOnScreen = this.width * this.secondsPerPixel / (this.zoomRatio * this.zoomRatio);

    // if we've not opted to only change the offset, and we're not dragging
    // (in which case we wouldn't want the position of the audio to change)
    // adjust the left edge as necessary, keeping the playhead in the middle
    // of the screen
    if (!offsetOnly && !this.peaks.dragSeeking) {
      this.leftEdgeTime = this.lastTime - (secondsOnScreen * 0.5);
    }

    // clamp the position
    this.leftEdgeTime = Math.max(0, Math.min(this.totalDuration - (secondsOnScreen), this.leftEdgeTime));

    var start = Math.floor(this.leftEdgeTime * this.pixelsPerSecond / this.zoomRatio),
        end = start + (this.width / this.zoomRatio);

    this.data.offset(start, end);

    // if we made a change, send out notification
    if (leftEdgeTime !== this.leftEdgeTime) {
      this.peaks.emit('waveform_zoom_updating');
    }

    this.zoomWaveformLayer.draw();
  };

  WaveformContinuousZoomView.prototype.hidePlayhead = function() {
    this.zoomPlayheadGroup.hide();
    this.uiLayer.draw();
  };

  WaveformContinuousZoomView.prototype.showPlayhead = function() {
    this.zoomPlayheadGroup.show();
    this.uiLayer.draw();
  };

  return WaveformContinuousZoomView;
});
