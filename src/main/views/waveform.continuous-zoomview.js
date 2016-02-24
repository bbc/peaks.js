/**
 * WAVEFORM.ZOOMVIEW.JS
 *
 * This module handles all functionality related to the continuous zoomed in
 * waveform view canvas and initialises its own instance of the axis
 * object.
 *
 */

define([
  "peaks/waveform/waveform.axis",
  "peaks/waveform/waveform.mixins",
  "konva"
], function(WaveformAxis, mixins, Konva) {
  'use strict';

  function WaveformContinuousZoomView(waveformData, container, peaks) {
    var that = this;
    that.peaks = peaks;
    that.options = peaks.options;

    that.width = container.clientWidth;
    that.height = container.clientHeight || that.options.height;


    that.rootData = waveformData;

    // create a snapshot of the data when zoomed out all the way
    // and a snapshot of the data when zoomed in all the way
    // 
    // we use the difference between the two values to determine a few scaling factors
    
    that.zoomedOutData = that.rootData.resample(that.width);
    that.data = that.rootData.resample({
      scale: peaks.zoom.getMaximumScaleFactor ()
    });

    // store the duration of the audio
    this.totalDuration = that.rootData.duration;

    // these properties always tell us how many seconds of audio are displayed per pixel on the screen, and how many 
    // pixels of screen width are required to display 1 second of audio. They are kept up to date throughout the
    // continuous zoom and form the basis of many of the calculations
    this.seconds_per_pixel = that.data.seconds_per_pixel;
    this.pixels_per_second = that.data.pixels_per_second;

    // when the audio is playing we keep track of the number of milliseconds that have elapsed since the last draw.
    // This lets us move the playhead more smoothly than if it were entirely synced to the audio player's time
    this.lastTimeDelta = null;

    // ...however, sometimes we don't want to automatically move the playhead. For example, immediately following
    // the repositioning of the playhead based on the current time reported by the audio player
    this.justUpdatedTime = false;

    // stores the last time of the playhead
    this.lastTime = 0;

    // a property which keeps track of the position of the audio that's currently displayed on the very left edge of 
    // the container. Used to quickly determine if we are 'out of bounds'
    this.leftEdgeTime = 0;

    // when click-dragging the waveform, this lets us keep track of the amount that the waveform has currently been dragged.
    // This is used to update various positions during the drag to keep things looking accurate
    this.seekMovement = 0;

    // a flag that lets us explicity tell the rendering loop that we want the content to be drawn, even if it otherwise
    // woudln't be drawn.
    this.dirty = true;

    // a cache of pre-sampled data at different breakpoints
    that.data_cache = [];
    

    // decide how many different sets of pre-sampled data should be created. If specificed in the options, use that
    // value - otherwise work out a number based on the duration of the audio.
    var maxcount = peaks.options.continuousZoomCacheSize || Math.max(20, Math.round(that.totalDuration/20));

    // we are going to iterate through a process 'maxcount' times to generate some data, so keep a counter to tell us
    // how many more times we need to complete this process
    var currentStep = maxcount;

      // the number of seconds of data that will be visible onscreen when totally zoomed in, and therefore the 
      // number of seconds of data that will be offscreen when totally zoomed in
    var  visibleZoomedIn = that.width * that.data.seconds_per_pixel,
      notVisibleZoomedIn = that.totalDuration- visibleZoomedIn;

   

    // create the various UI elements
    that.stage = new Konva.Stage({
      container: container,
      width: that.width,
      height: that.height
    });

    that.background = new Konva.Rect({
      x: 0,
      y: 0,
      width: that.width,
      height: that.height
    });

    that.zoomWaveformLayer = new Konva.Layer();
    that.uiLayer = new Konva.Layer();

    that.createZoomWaveform();
    that.createUi();

    that.zoomWaveformLayer.add(that.background);


    // declare a function that will be called mulitple times to generate each piece of pre-sampled data
    var doNext = function() {
      // work out the ratio of the current iteraion. The first iteration will have ratio of 1, the final iteration will be 0
      var ratio = currentStep / maxcount;
      
      // work out the number of seconds of data that will be visible at this breakpoint
      var visibleSeconds = visibleZoomedIn + (notVisibleZoomedIn * ratio);
      // now use that to work out how many pixels the audio would take up at this breakpoint
      var pixelRatio = (that.totalDuration / visibleSeconds) * that.width;

      // now resample the data with these settings...
      var newData = that.rootData.resample(pixelRatio);
      //... and offset the data to the width of the container
      newData.offset(0, that.width);
      //... and put the data in the cache for later...
      that.data_cache.push(newData);
      
      currentStep--;

      // if we have more steps to complete (and note that we're going to be performing the process one more time that you'd be expecting)
      if (currentStep >= 0) {

        // repeat the process after a few milliseconds
        // 
        // we could do this all in one loop, but it would lock the UI. Doing it this way lets us at least show a progress indicator
        // if we want to.
        // 
        peaks.emit ('zoom.preload-progress',maxcount-currentStep,maxcount);
        setTimeout(function() {
         doNext();
        }, 10);
      } else {
        // we've finished - put an extra copy of the final data in the cache, and get started!
        that.data_cache.push(newData);
        ready();
      }
    };

    // being the pre-loading phase
    doNext();

    // called when the data has been pre-sampled and cached
    var ready = function() {
      // set the current index - in other words, which pre-sampled data are we currently using
      that.currentIndex = that.data_cache.length - 1;

      // create the axis now we're ready
      that.axis = new WaveformAxis(that);

      // do some UI tidying
      that.stage.add(that.zoomWaveformLayer);
      that.zoomWaveformLayer.moveToBottom();

      // INTERACTION ===============================================

      that.stage.on("mousedown", function(event) {
        if (event.target &&
          !event.target.attrs.draggable &&
          !event.target.parent.attrs.draggable) {
          if (event.type === "mousedown") {
            var x = event.evt.layerX,
              dX, p;

            // enable drag if necessary
            that.stage.on("mousemove", function(event) {
              peaks.seeking = true;
              dX = event.evt.layerX > x ? x - event.evt.layerX : (x - event.evt.layerX) * 1;
              x = event.evt.layerX;
              that.seekMovement = dX;
            });

            document.addEventListener("mouseup", function _upHandler() {

              if (!peaks.seeking) {
                that.jumpTo(that.leftEdgeTime + (x / that.pixels_per_second));
              }
              if (peaks.seeking) {
                that.seekMovement = 0;
              }

              document.removeEventListener("mouseup", _upHandler);
              that.stage.off("mousemove");
              that.peaks.seeking = false;
            });
          }
        }
      });


      // EVENTS ====================================================

      var userSeekHandler = function userSeekHandler(options, time) {
        options = options || {
          withOffset: true
        };
      };

      var playerSeekHandler = function userSeekHandler(options, time) {
        options = options || {
          withOffset: true
        };
      };

      that.peaks.on("player_time_update", function(time) {
        // store the last time of the player
        that.lastTime = time;
        // tell our render function that we've just updated the time, and don't need to add on the current time delta
        that.justUpdatedTime = true;
        // force a re-render
        that.dirty = true;
      });

      that.peaks.on("player_seek", playerSeekHandler.bind(null, {
        withOffset: true
      }));
      that.peaks.on("user_seek.*", userSeekHandler.bind(null, {
        withOffset: true
      }));
      that.peaks.on("user_scrub.*", userSeekHandler.bind(null, {
        withOffset: false
      }));

      that.peaks.on("player_play", function(time) {
        that.playing = true;
      });

      that.peaks.on("player_pause", function(time) {
        that.playing = false;
      });

      // handles the case where the user is dragging the left-edge of the viewport box within the 
      // WaveformEditableOverview box
      that.peaks.on("zoom.change.left", function(left) {
        that.leftEdgeTime = left;
        that.adjustOffset(true);
      });

      // the main handler that responds to changes in zoom level...
      // 
      // this is fiddly!
      that.peaks.on("zoom.change", function(new_ratio,was_from_overview) {

        
        new_ratio = Math.min(1, Math.max(0, new_ratio));

        // cache the current X position of the playhead
        var oldPlayheadX = (that.lastTime - that.leftEdgeTime) * that.pixels_per_second;

        // cache the length of the cache array
        var max = that.data_cache.length - 1;

        // a flag to say whether we've changed breakpoint or not. If we do, we need to make some adjustments later on
        var changedBreakpoint = false;

        // decide which pre-sampled data we should be using from the cache
        var newIndex = Math.floor(new_ratio * max);
        if (newIndex >= max) {
          newIndex = max - 1;
        }
        if (newIndex < 0) {
          newIndex = 0;
        }

        // if we've changed breakpoints...
        if (newIndex != that.currentIndex) {
          // update the current index
          that.currentIndex = newIndex;
          // grab the value from the cache
          that.data = that.data_cache[that.currentIndex];
          // update the flag
          changedBreakpoint = true;
        }

        // above, we 'floor'ed the calculation to work out which index of the cache array we should be using
        // here, we find out the value that was lost when we 'floor'ed so we can make the intermediate adjustments
        var proportionAboveIndex = (new_ratio * max) - newIndex;

        
        // to make these intermediate adjustments, we need to knoe the different in 'pixels per second' between the
        // current pre-sampled, and the next highest pre-sampled data. So get the pixels_per_second value for both
        // sets of data
        var currentRatio = that.data_cache[that.currentIndex + 1].pixels_per_second;
        var lowerRatio = that.data_cache[that.currentIndex].pixels_per_second;

        // and now work out the ratio of the two pixels_per_second values
        var divider = (currentRatio / lowerRatio);
        // finally, we can work out how to adjust between the two breakpoints using this calculation
        var multiplier = (divider * proportionAboveIndex) + (1 - proportionAboveIndex);
        // the value from this calculation will become our new zoom ratio
        that.zoomRatio = multiplier;
        
        // update the seconds_per_pixel and pixels_per_second values that we use throughout
        that.seconds_per_pixel = that.data_cache[that.currentIndex].seconds_per_pixel * that.zoomRatio;
        that.pixels_per_second = that.data_cache[that.currentIndex].pixels_per_second * that.zoomRatio;

        // do some work to make sure that the position of the playhead doesn't move during the zoom. This
        // seems to be the least jarring behaviour for the user.
        // Note that if we're currently dragging the audio, we skip this step
        if (!that.peaks.dragseeking) {
          var newLeftEdgeTime = (that.lastTime - (oldPlayheadX / that.pixels_per_second));
          that.leftEdgeTime = newLeftEdgeTime;
        }

        // adjust the offset of the data
        that.adjustOffset(true);

        // scale the layer to the correct value
        that.zoomWaveformLayer.scale({
          x: that.zoomRatio, 
          y: 1
        });

        // if we have a segment layer, that'll need scaling too
        if (that.segmentLayer && !changedBreakpoint) {
          that.segmentLayer.scale({
            x: that.zoomRatio,
            y: 1
          });
          that.segmentLayer.draw();
        }

        // set the flag to ensure a redraw
        that.dirty = true;

        // if we changed breakpoints, we need to redraw the layer and send out notification
        if (changedBreakpoint) {
          that.zoomWaveformLayer.draw();
          that.peaks.emit("waveform_zoom_updating");

        }

      });

      that.peaks.on("window_resized", function(width, newWaveformData) {
        that.peaks.emit("zoomview_resized");
      });

      // KEYBOARD EVENTS =========================================
      var nudgeFrame = function nudgeFrame(step) {
        var time = that.options.mediaElement.currentTime;
        time += (that.options.nudgeIncrement * step);
        that.peaks.emit("user_seek.zoomview", time, 999);
      };

      that.peaks.on("kybrd_left", nudgeFrame.bind(that, -1));
      that.peaks.on("kybrd_right", nudgeFrame.bind(that, 1));
      that.peaks.on("kybrd_shift_left", nudgeFrame.bind(that, -10));
      that.peaks.on("kybrd_shift_right", nudgeFrame.bind(that, 10));

      that.peaks.emit("zoom.change", that.peaks.zoom.getZoom());

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
        requestAnimFrame(animloop);

        var now = new Date().getTime(),
          dt = now - (that.lastTimeDelta || now);

        that.lastTimeDelta = now;
       
        that.render(dt);
      })();

      // and finally, send out notification that we're ready to go
      that.peaks.emit("zoomview.ready");

    };



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
      this.peaks.emit("waveform_zoom_displaying", this.leftEdgeTime, this.getRightEdgeTime());
    }


  };

  /**
   * Returns the position of the audio found at the very right hand edge of the screen at the current zoom level
   */
  WaveformContinuousZoomView.prototype.getRightEdgeTime = function() {
    var rightEdgeTime = this.leftEdgeTime + (this.seconds_per_pixel * this.width / (this.zoomRatio * this.zoomRatio));
    return rightEdgeTime; 
  };

  /**
   * Jumps to a certain position in the audio - sets the 'dirty' flag ensuring a redraw
   * @param  {[type]} time [description]
   */
  WaveformContinuousZoomView.prototype.jumpTo = function(time) {
    this.peaks.emit("user_seek.zoomview", time);
    this.dirty = true;
    this.lastTime = time;
  };

  /**
   * Returns the position of the audio found at the very left hand edge of the screen at the current zoom level
   */
  WaveformContinuousZoomView.prototype.getDataTime = function() {
    return this.leftEdgeTime;
  };

  /**
   * Returns the pixel position for a particuilar position in the audio
   */
  WaveformContinuousZoomView.prototype.atDataTime = function(axisLabelOffsetSecs) {
    return axisLabelOffsetSecs * this.pixels_per_second;
  };

  /* Sets up the waveform etc */
  WaveformContinuousZoomView.prototype.createZoomWaveform = function() {
    var that = this;
    that.zoomWaveformShape = new Konva.Shape({
      fill: that.options.zoomWaveformColor,
      strokeWidth: 0
    });

    that.zoomWaveformShape.sceneFunc(mixins.waveformDrawFunction.bind(that.zoomWaveformShape, that));

    that.zoomWaveformLayer.add(that.zoomWaveformShape);
  };


  /* Create and configure the UI */
  WaveformContinuousZoomView.prototype.createUi = function() {
    var that = this;

    that.zoomPlayheadLine = new Konva.Line({
      points: [0.5, 0, 0.5, that.height],
      stroke: that.options.playheadColor,
      strokeWidth: 1
    });

    that.zoomPlayheadText = new Konva.Text({
      x:2,
      y: 12,
      text: "00:00:00",
      fontSize: 11,
      fontFamily: 'sans-serif',
      fill: that.options.playheadTextColor,
      align: 'right'
    });

    that.zoomPlayheadGroup = new Konva.Group({
      x: 0,
      y: 0
    }).add(that.zoomPlayheadLine).add(that.zoomPlayheadText);

    that.uiLayer.add(that.zoomPlayheadGroup);
    that.stage.add(that.uiLayer);

    that.zoomPlayheadGroup.moveToTop();
  };



  // UI functions ==============================
  // 
  WaveformContinuousZoomView.prototype.syncPlayhead = function() {
    // get the current time that would be displayed at the right hand edge of the screen
    var rightEdgeTime = this.getRightEdgeTime();
    // if we're not seeking, and the playhead is off the left or right hand edges...
    if (!this.peaks.seeking && (this.lastTime > rightEdgeTime || this.lastTime < this.leftEdgeTime)) {
      // adjust the offset
      this.adjustOffset();
    }

    // adjust the position of the playhead to match the current position in the audio
    this.zoomPlayheadGroup.setAttr("x", (this.lastTime - this.leftEdgeTime) * this.pixels_per_second);
    // store the current position of the left edge of the screen, in pixels. This is used by other classes
    this.frameOffset = this.leftEdgeTime * this.pixels_per_second;
    // update the time displayed on the playhead
    this.zoomPlayheadText.setText(mixins.niceTime(this.lastTime, false));

    this.uiLayer.draw();


  };

  // Clamp the left and right edges of the display to make sure we don't go out of bounds. 
  WaveformContinuousZoomView.prototype.clamp = function() {

    this.leftEdgeTime = Math.max(0, Math.min(this.totalDuration - (this.width * this.seconds_per_pixel), this.leftEdgeTime));

    var start = Math.floor(this.leftEdgeTime * this.pixels_per_second),
      end = start + (this.width / this.zoomRatio);

    this.data.offset(start, end);
    this.zoomWaveformLayer.draw();

  };

  /* During a seek (e.g. user dragging overview window) we need to adjust the position of the waveform to keep things in sync */
  WaveformContinuousZoomView.prototype.adjustFromSeek = function() {
    // cache the current left edge time
    var leftEdgeTime = this.leftEdgeTime;
    // work out how many seconds of audio are visible on the screen
    var secondsOnScreen = this.width * this.seconds_per_pixel / (this.zoomRatio * this.zoomRatio);
    // adjust the current left edge based on the amount we have seeked
    this.leftEdgeTime += this.seekMovement * this.seconds_per_pixel / (this.zoomRatio * this.zoomRatio);
    // and clamp 
    this.leftEdgeTime = Math.max(0, Math.min(this.totalDuration - secondsOnScreen, this.leftEdgeTime));

    // now adjust the offset
    var start = Math.floor(this.leftEdgeTime * this.pixels_per_second / (this.zoomRatio)),
      end = start + (this.width / this.zoomRatio);

    this.data.offset(start, end);
    // if we made a change, send out notification
    if (leftEdgeTime != this.leftEdgeTime) {
      this.peaks.emit("waveform_zoom_updating");
    }
    this.zoomWaveformLayer.draw();

  };


  // make UI adjustments once the segment layer is added
  WaveformContinuousZoomView.prototype.segmentLayerAdded = function () {
    this.uiLayer.moveToTop ();
  };

 
  // another method to help with adjusting and clamping the zoom to prevent us going out of bounds
  WaveformContinuousZoomView.prototype.adjustOffset = function(offsetOnly) {
    // cache the current left edge time
    var leftEdgeTime = this.leftEdgeTime;
    // work out how many seconds of audio are visible on the screen
    var secondsOnScreen = this.width * this.seconds_per_pixel / (this.zoomRatio * this.zoomRatio);
    // if we've not opted to only change the offset, and we're not dragging 
    // (in which case we wouldn't want the position of the audio to change)
    // adjust the left edge as necessary, keeping the playhead in the middle of the screen
    if (!offsetOnly && !this.peaks.dragseeking) {
      this.leftEdgeTime = this.lastTime - (secondsOnScreen * 0.5);
    }

    // clamp the position
    this.leftEdgeTime = Math.max(0, Math.min(this.totalDuration - (secondsOnScreen), this.leftEdgeTime));

    var start = Math.floor(this.leftEdgeTime * this.pixels_per_second / (this.zoomRatio)),
      end = start + (this.width / this.zoomRatio);

    this.data.offset(start, end);

    // if we made a change, send out notification
    if (leftEdgeTime != this.leftEdgeTime) {
      this.peaks.emit("waveform_zoom_updating");
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