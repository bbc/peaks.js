/**
 * @file
 *
 * Defines the {@link WaveformEditableOverview} class.
 *
 * @module peaks/views/waveform.editable-overview
 */
define([
  'peaks/waveform/waveform.axis',
  'peaks/waveform/waveform.mixins',
  'konva'
], function(WaveformAxis, mixins, Konva) {
  'use strict';

  /**
   * Creates the editable overview timeline canvas.
   *
   * @class
   * @alias WaveformEditableOverview
   *
   * @param {WaveformData} waveformData
   * @param {HTMLElement} container
   * @param {Peaks} peaks
   */
  function WaveformEditableOverview(waveformData, container, peaks) {
    var self = this;

    self.originalWaveformData = waveformData;
    self.container = container;
    self.peaks = peaks;

    self.options = peaks.options;
    self.width = container.clientWidth;
    self.height = self.options.overviewHeight || container.clientHeight;
    self.frameOffset = 0;

    self.data = waveformData.resample(self.width);

    // work out if we should start with the view expanded or contracted
    self.minimized = !peaks.options.editableOverviewIsMaximized;

    // create the necessary canvas stuff
    self.stage = new Konva.Stage({
      container: container,
      width: self.width,
      height: self.height
    });

    self.waveformLayer = new Konva.Layer();
    self.backgroundLayer = new Konva.Layer();

    self.background = new Konva.Rect({
      x: 0,
      y: 0,
      width: self.width,
      height: self.height,
      fill: '#FFFFFF',
      opacity: 1
    });

    self.backgroundLayer.add(self.background);
    self.background.draw();

    self.createWaveform();

    self.stage.add(self.backgroundLayer);
    self.stage.add(self.waveformLayer);

    // INTERACTION ===============================================
    function cancelSeeking() {
      self.stage.off('mousemove');
      document.removeEventListener('mousemove mouseup', cancelSeeking);
    }

    self.stage.on('mousedown', function(event) {
      if (event.target &&
        !event.target.attrs.draggable &&
        !event.target.parent.attrs.draggable) {
        if (event.type === 'mousedown') {
          // if we're not dragging, send out a user seek event. Basically
          // this tells peaks to seek to a particular place in the audio
          if (!peaks.dragSeeking) {
            peaks.emit('user_seek.overview', self.data.time(event.evt.layerX), event.evt.layerX);
          }

          self.stage.on('mousemove', function(event) {
            if (!peaks.dragSeeking) {
              peaks.emit('user_seek.overview', self.data.time(event.evt.layerX), event.evt.layerX);
            }
          });

          document.addEventListener('mouseup', cancelSeeking);
        }
        else {
          cancelSeeking();
        }
      }
    });

    self.createUi();

    self.createRefWaveform();

    self.updateState();

    // EVENTS ====================================================

    function trackPlayheadPosition(time, frame) {
      if (!peaks.seeking) {
        self.playheadPixel = self.data.at_time(time);
        self.updateUi(self.playheadPixel);
      }
    }

    peaks.on('player_time_update', trackPlayheadPosition);
    peaks.on('user_seek.*', trackPlayheadPosition);

    peaks.on('zoomview.displaying', function(start, end) {
      if (!peaks.dragSeeking) {
        self.updateRefWaveform(start, end);
      }
    });

    peaks.on('overview.minimize', function() {
      self.minimize();
    });

    peaks.on('overview.maximize', function() {
      self.maximize();
    });

    peaks.on('overview.toggleMinimizedState', function() {
      self.toggleMinimizedState();
    });

    peaks.on('window_resize', function() {
      self.container.hidden = true;
    });

    peaks.on('window_resize_complete', function(width) {
      self.width = width;
      self.stage.setWidth(self.width);

      // self.updateWaveform();
      peaks.emit('overview_resized');
    });
  }

  /**
   * Called when the segment layer has been added, allowing us to
   * tidy up the UI a bit.
   *
   * @private
   */
  WaveformEditableOverview.prototype.segmentLayerAdded = function() {
    this.waveformLayer.moveToBottom();
    this.refLayer.moveToTop();
    this.uiLayer.moveToTop();
    this.updateState();
  };

  /**
   * Returns the position of the audio found at the very left hand edge
   * of the screen at the current zoom level.
   *
   * @returns {Number}
   */
  WaveformEditableOverview.prototype.getDataTime = function() {
    return this.data.time(this.frameOffset);
  };

  /**
   * Returns the pixel position for a particuilar position in the audio.
   *
   * @returns {Number}
   */
  WaveformEditableOverview.prototype.atDataTime = function(axisLabelOffsetSecs) {
    return this.data.at_time(axisLabelOffsetSecs);
  };

  /**
   * Sets up the waveform etc.
   */
  WaveformEditableOverview.prototype.createWaveform = function() {
    this.waveformShape = new Konva.Shape({
      fill: 'black',
      opacity: 0.13,
      strokeWidth: 0
    });

    this.waveformShape.sceneFunc(mixins.waveformDrawFunction.bind(this.waveformShape, this));

    this.waveformLayer.add(this.waveformShape);
    this.stage.add(this.waveformLayer);
  };

  /**
   * Creates a reference waveform to inform users where they are in the overview
   * waveform based on the current zoom level. Also sets up the other parts of
   * the UI.
   */
  WaveformEditableOverview.prototype.createRefWaveform = function() {
    var self = this;

    // TODO: this is quite messy!

    this.refLayer = new Konva.Layer();

    this.refWaveformShape = new Konva.Shape({
      fill: '#666666',
      strokeWidth: 0,
      opacity: 0.5
    });

    this.refWaveformShape.sceneFunc(mixins.waveformDrawFunction.bind(this.refWaveformShape, this));

    this.refWaveformRect = new Konva.Rect({
      x: 1,
      y: 0,
      width: 0,
      stroke: '#666666',
      strokeWidth: 2,
      height: this.height - 2,
      fill: 'rgba(67,135,200,0.01)',
      opacity: 1,
      cornerRadius: 0,
      draggable: true,
      dragBoundFunc: function(pos) {
        return {
          x: Math.max(0, Math.min(pos.x, self.width - this.width())),
          y: 0
        };
      }
    });

    // short cut function that will draw a line at a particular X position
    function makeLine(pos) {
      return new Konva.Line({
        points: [pos, (self.height / 2) - 6, pos, (self.height / 2) + 6],
        stroke: 'white',
        strokeHitEnabled: false,
        listening: false,
        strokeWidth: 1
      });
    }

    // a short cut function that will create a group and add 4 new lines
    // to that group
    function addLinesToGroup(group) {
      var xs = [3, 5, 7, 9];
      var lineGroup = new Konva.Group({
        offsetX: 0.5,
        offsetY: 0.5
      });

      group.add(lineGroup);

      xs.map(function(pos) {
        lineGroup.add(makeLine(pos));
      });

      group.lines = lineGroup;
    }

    // this is the left-hand edge of the editable window
    this.leftGroup = new Konva.Group({
      draggable: true,
      dragBoundFunc: function(pos) {
        return {
          x: Math.max(0, pos.x),
          y: 0
        };
      }
    });

    // this is the right-hand edge of the editable window
    this.rightGroup = new Konva.Group({
      draggable: true,
      dragBoundFunc: function(pos) {
        return {
          x: Math.min(pos.x, self.width - 11),
          y: 0
        };
      }
    });

    // this is the center block of the editable window
    this.centerGroup = new Konva.Group({
    });

    // create rectangles for the various blocks
    var leftRect = new Konva.Rect({
      x: 0,
      y: 0,
      width: 11,
      stroke: 'rgba(0,0,0,0)',
      strokeWidth: 0,
      height: this.height,
      fill: '#666666',
      opacity: 1,
      cornerRadius: 0
    });

    var rightRect = new Konva.Rect({
      x: 0,
      y: 0,
      width: 11,
      stroke: 'rgba(0,0,0,0)',
      strokeWidth: 0,
      height: this.height,
      fill: '#666666',
      opacity: 1,
      cornerRadius: 0
    });

    var centerRect = self.centerRect = new Konva.Rect({
      x: -4,
      y: 0,
      width: 19,
      stroke: 'rgba(0,0,0,0)',
      strokeWidth: 0,
      height: this.height,
      fill: '#666666',
      opacity: 1,
      cornerRadius: 0
    });

    // and add those rectangles
    this.leftGroup.add(leftRect);
    this.rightGroup.add(rightRect);
    this.centerGroup.add(centerRect);

    // add lines to the 3 groups
    addLinesToGroup(this.leftGroup);
    addLinesToGroup(this.rightGroup);
    addLinesToGroup(this.centerGroup);

    // add the left and right groups to the UI layer
    this.uiLayer.add(this.leftGroup);
    this.uiLayer.add(this.rightGroup);

    // and the rest of the items to the ref layer
    this.refLayer.add(this.refWaveformShape);
    this.refLayer.add(this.centerGroup);
    this.refLayer.add(this.refWaveformRect);

    // finally, add the new ref layer to the stage
    this.stage.add(this.refLayer);

    // Prevent some defaults
    this.rightGroup.on('mousedown', function(event) {
      event.evt.stopPropagation();
      event.evt.preventDefault();

      return false;
    });

    this.leftGroup.on('mousedown', function(event) {
      event.evt.stopPropagation();
      event.evt.preventDefault();

      return false;
    });

    // handler for when we're dragging the big rectangle that covers
    // the editable window
    this.refWaveformRect.on('dragmove', function(event) {
      var currentSeparation = self.rightGroup.x() - self.leftGroup.x();
      var currentCenterSeparation = self.centerGroup.x() - self.leftGroup.x();

      // adjust the position if the rectangles
      // note - in review, it seems like this shouldnt be necessary
      self.leftGroup.setAttrs({
        x: self.refWaveformRect.x()
      });

      self.centerGroup.setAttrs({
        x: Math.round(self.refWaveformRect.x() + currentCenterSeparation)
      });

      self.rightGroup.setAttrs({
        x: self.refWaveformRect.x() + currentSeparation
      });

      // force the updating of positions, sizes etc
      self.forceUpdateRefWaveform(
        self.refWaveformRect.x(),
        self.refWaveformRect.x() + self.refWaveformRect.width()
      );
    });

    // when dragging the right hand box (which will resize the active area)
    this.rightGroup.on('dragmove', function(event) {
      // force the updating of positions, sizes etc
      self.forceUpdateRefWaveform(
        self.leftGroup.x(),
        self.rightGroup.x() + (self.rightGroup.scaleX() * 11)
      );
    });

    // when dragging the right hand box (which will resize the active area)
    this.leftGroup.on('dragmove', function(event) {
      // force the updating of positions, sizes etc
      self.forceUpdateRefWaveform(
        self.leftGroup.x(),
        self.rightGroup.x() + (self.rightGroup.scaleX() * 11)
      );
    });

    // darken the rectangle on hover
    this.refLayer.on('mouseenter', function() {
      self.refWaveformRect.fill('rgba(0,0,0,0.05)');
      this.draw();
    });

    this.refLayer.on('mouseleave mouseout', function() {
      self.refWaveformRect.fill('rgba(67,135,200,0.01)');
      this.draw();
    });

    // when we begin dragging the big rectangle or the edges, tell Peaks what
    // we're doing so that other views can change behaviour accordingly
    // similarly, when we stop dragging, we want to unset that flag
    this.refWaveformRect.on('dragstart', function() {
      self.peaks.dragSeeking = true;
      // self.peaks.seeking = true;
    });

    this.refWaveformRect.on('dragend', function(event) {
      self.peaks.dragSeeking = false;
    });

    this.leftGroup.on('dragstart', function() {
      self.peaks.dragSeeking = true;
    });

    this.rightGroup.on('dragstart', function() {
      self.peaks.dragSeeking = true;
    });

    this.leftGroup.on('dragend', function(event) {
      self.peaks.dragSeeking = false;
    });

    this.rightGroup.on('dragend', function(event) {
      self.peaks.dragSeeking = false;
    });
  };

  WaveformEditableOverview.prototype.createUi = function() {
    this.playheadLine = new Konva.Line({
      points: [0.5, 0, 0.5, this.height],
      stroke: this.options.playheadColor,
      strokeWidth: 1,
      x: 0
    });

    this.uiLayer = new Konva.Layer({
      index: 100
    });

    this.uiLayer.add(this.playheadLine);
    this.stage.add(this.uiLayer);
  };

  /**
   * Moves to the minimized state.
   */
  WaveformEditableOverview.prototype.minimize = function() {
    this.minimized = true;
    this.updateState();
  };

  /**
   * Moves to the maximized state.
   */
  WaveformEditableOverview.prototype.maximize = function() {
    this.minimized = false;
    this.updateState();
  };

  /**
   * Toggles between minimized and maximized states.
   */
  WaveformEditableOverview.prototype.toggleMinimizedState = function() {
    this.minimized = !this.minimized;
    this.updateState();
  };

  /**
   * Redraws and repositions based on the current state.
   */
  WaveformEditableOverview.prototype.updateState = function() {
    var self = this;
    var backgroundTweenNodes, lineTweens, tween, tween6, tween2, tween4;

    // TODO: this is messy

    // if we're in minimized state...
    if (self.minimized) {
      // hide the waveform in this state
      self.waveformShape.hide();
      self.refWaveformShape.hide();

      // tween some parts of the UI
      //
      // first of all, the background and waveform
      backgroundTweenNodes = [self.waveformLayer, self.backgroundLayer];

      backgroundTweenNodes.map(function(item) {
        tween = new Konva.Tween({
          node: item,
          duration: 0.3,
          scaleY: 5 / self.height,
          y: (25 - 5) / 2
        });
        tween.play();
      });

      // then the ref layer
      tween = new Konva.Tween({
        node: self.refLayer,
        duration: 0.3,
        scaleY: 25 / self.height
      });
      tween.play();

      // adjust the position of the lines
      lineTweens = [
        self.leftGroup.lines,
        self.centerGroup.lines,
        self.rightGroup.lines
      ];

      lineTweens.map(function(item) {
        tween6 = new Konva.Tween({
          node: item,
          duration: 0.3,
          scaleY: self.height / 25,
          y: -95
        });
        tween6.play();
      });

      // adjust the center box
      tween6 = new Konva.Tween({
        node: self.centerRect,
        duration: 0.3,
        height: self.height,
        y: 0
      });
      tween6.play();

      // tween the position of the entire UI layer
      tween2 = new Konva.Tween({
        node: self.uiLayer,
        duration: 0.3,
        scaleY: 25 / self.height
      });
      tween2.play();

      // and the segment layer, if it exists...
      if (self.segmentLayer) {
        tween4 = new Konva.Tween({
          node: self.segmentLayer,
          duration: 0.2,
          scaleY: 25 / self.height,
          y: 0
        });

        tween4.play();
      }
    }
    else {
      // we're maximised
      //
      // show the waveform and the ref box
      self.waveformShape.show();
      self.refWaveformShape.show();

      backgroundTweenNodes = [self.waveformLayer, self.backgroundLayer];

      backgroundTweenNodes.map(function(item) {
        tween = new Konva.Tween({
          node: item,
          duration: 0.3,
          scaleY: 1,
          y: 0
        });

        tween.play();
      });

      // tween some parts of the UI
      //
      // first of all, the background and waveform
      tween = new Konva.Tween({
        node: self.refLayer,
        duration: 0.3,
        scaleY: 1,
        y: 0
      });

      tween.play();

      // tween the position of the lines
      lineTweens = [
        self.leftGroup.lines,
        self.centerGroup.lines,
        self.rightGroup.lines
      ];

      lineTweens.map(function(item) {
        tween6 = new Konva.Tween({
          node: item,
          duration: 0.3,
          scaleY: 1,
          y: 0
        });

        tween6.play();
      });

      // and the center box...
      tween6 = new Konva.Tween({
        node: self.centerRect,
        duration: 0.3,
        height: 21,
        y: (self.height - 21) / 2
      });
      tween6.play();

      // and the entire UI layer
      tween2 = new Konva.Tween({
        node: self.uiLayer,
        duration: 0.3,
        scaleY: 1
      });
      tween2.play();

      // and the segment layer, if it exists...
      if (self.segmentLayer) {
        tween4 = new Konva.Tween({
          node: self.segmentLayer,
          duration: 0.3,
          scaleY: 1,
          y: 0
        });
        tween4.play();
      }

      // we may need to redraw the ref layer
      self.refWaveformShape.draw();
    }
  };

  /**
   * Updates when we drag or resize.
   */
  WaveformEditableOverview.prototype.forceUpdateRefWaveform = function(offsetIn, offsetOut) {
    var self = this;

    var xPos = offsetIn,
        width = offsetOut - offsetIn;

    // we need to store the original width of the editable area so we can use
    // it as a 'minimum'. This is needed for relatively short audio files
    if (!this.initialWidth) {
      this.initialWidth = width;
    }

    // work out the new percentage, based on the percentage of the audio that
    // is covered by the editable box
    var zoomPercentage = (width - this.initialWidth) / (this.width - this.initialWidth);

    // tell peaks about the change
    this.peaks.emit('zoom.change.left', (xPos / this.width) * this.data.duration);
    this.peaks.emit('zoom.change', 1 - zoomPercentage, true);
    this.peaks.emit('zoom.change.left', (xPos / this.width) * this.data.duration);

    // reposition the box
    this.refWaveformRect.setAttrs({
      x: xPos,
      width: width
    });

    // reposition the center box
    this.centerGroup.setAttrs({
      x: xPos + (width - 11) / 2
    });

    // hide the center box if below a certain threshold
    if (width < 59) {
      this.centerGroup.hide();
    }
    else {
      this.centerGroup.show();
    }

    // update the various bits
    this.refWaveformShape.sceneFunc(function(canvas) {
      self.data.set_segment(offsetIn, offsetOut, 'zoom');

      mixins.waveformOffsetDrawFunction.call(
        this,
        self.data,
        canvas.canvas,
        mixins.interpolateHeight(self.height)
      );
    });

    this.refWaveformShape.draw();
    this.uiLayer.draw();
    this.refLayer.draw();
  };

  /**
   * Called when we need to reposition, not triggered by drag or resize.
   */
  WaveformEditableOverview.prototype.updateRefWaveform = function(timeIn, timeOut) {
    var self = this;

    var offsetIn  = this.data.at_time(timeIn);
    var offsetOut = this.data.at_time(timeOut);

    this.data.set_segment(offsetIn, offsetOut, 'zoom');

    var xPos = this.data.segments.zoom.offset_start - this.data.offset_start,
        width = this.data.at_time(timeOut) - this.data.at_time(timeIn);

    // store the initial width in case we haven't before...
    if (!this.initialWidth) {
      this.initialWidth = width;
    }

    // resize the box
    this.refWaveformRect.setAttrs({
      x: xPos,
      width: width
    });

    // redraw the box
    this.refWaveformShape.sceneFunc(function(canvas) {
      self.data.set_segment(offsetIn, offsetOut, 'zoom');

      mixins.waveformOffsetDrawFunction.call(
        this,
        self.data,
        canvas.canvas,
        mixins.interpolateHeight(self.height)
      );
    });

    this.refWaveformShape.draw();

    // hide the rectangles when we get below a certain width
    var rectWidth = Math.min(11, width / 4);
    var rectOpacity = Math.min(1, rectWidth / 11);

    rectOpacity = 1;

    if (xPos < 0) {
      xPos = 0;
    }

    this.leftGroup.setAttrs({
      x: xPos,
      scaleX: rectWidth / 11,
      opacity: rectOpacity
    });

    this.rightGroup.setAttrs({
      x: xPos + width - rectWidth,
      scaleX: rectWidth / 11,
      opacity: rectOpacity
    });

    this.centerGroup.setAttrs({
      x: xPos + (Math.round((width - 11) / 2))
    });

    this.refWaveformRect.setAttrs({
      opacity: rectOpacity
    });

    // hide the lines if the rectangles drop below a certain width
    if (rectWidth < 11) {
      this.leftGroup.lines.hide();
      this.rightGroup.lines.hide();
    }
    else {
      this.leftGroup.lines.show();
      this.rightGroup.lines.show();
    }

    // hide the center group if we drop below a certain threshold
    if (width < 59) {
      this.centerGroup.hide();
    }
    else {
      this.centerGroup.show();
    }

    this.uiLayer.draw();
    this.refLayer.draw();
  };

  WaveformEditableOverview.prototype.updateUi = function(pixel) {
    // move the playhead and redraw the UI
    this.playheadLine.setAttr('x', pixel);
    this.uiLayer.draw();
  };

  return WaveformEditableOverview;
});
