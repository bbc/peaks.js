/**
 * WAVEFORM.OVERVIEW.JS
 *
 * This module handles all functionality related to the editable overview
 * timeline canvas and initialises its own instance of the axis
 * object.
 *
 */
define([
  "peaks/waveform/waveform.axis",
  "peaks/waveform/waveform.mixins",
  "konva"
], function(WaveformAxis, mixins, Konva) {
  'use strict';

  function WaveformEditableOverview(waveformData, container, peaks) {
    var that = this;

    that.peaks = peaks;
    that.options = peaks.options;
    that.data = waveformData;
    that.width = container.clientWidth;
    that.height = that.options.overviewHeight || container.clientHeight;
    that.frameOffset = 0;

    // work out if we should start with the view expanded or contracted
    that.minimized = !peaks.options.editableOverviewIsMaximized;

    // create the necessary canvas stuff
    that.stage = new Konva.Stage({
      container: container,
      width: that.width,
      height: that.height
    });

    that.waveformLayer = new Konva.Layer();
    that.backgroundLayer = new Konva.Layer();

    that.background = new Konva.Rect({
      x: 0,
      y: 0,
      width: that.width,
      height: that.height,
      fill: "#FFFFFF",
      opacity: 1
    });

    that.backgroundLayer.add(that.background);
    that.background.draw();

    that.createWaveform();

    that.stage.add(that.backgroundLayer);
    that.stage.add(that.waveformLayer);

    
    // INTERACTION ===============================================
    var cancelSeeking = function() {
      that.stage.off("mousemove");
      document.removeEventListener("mousemove mouseup", cancelSeeking);
    };

    that.stage.on("mousedown", function(event) {
      if (event.target &&
        !event.target.attrs.draggable &&
        !event.target.parent.attrs.draggable) {
        if (event.type == "mousedown") {

          // if we're not dragging, send out a user seek event. Basically this tells peaks to jump to 
          // a particular place in the audio
          if (!peaks.dragseeking) {
            peaks.emit("user_seek.overview", that.data.time(event.evt.layerX), event.evt.layerX);
          }
          
          that.stage.on("mousemove", function(event) {
            if (!peaks.dragseeking) {
              peaks.emit("user_seek.overview", that.data.time(event.evt.layerX), event.evt.layerX);
            }
          });
          document.addEventListener("mouseup", cancelSeeking);
        } else {
          cancelSeeking();
        }
      }
    });

    that.createUi();

    that.createRefWaveform();

    that.updateState();

    // EVENTS ====================================================

    function trackPlayheadPosition(time, frame) {

      if (!peaks.seeking) {
        that.playheadPixel = that.data.at_time(time);
        that.updateUi(that.playheadPixel);
      }
    }

    peaks.on("player_time_update", trackPlayheadPosition);
    peaks.on("user_seek.*", trackPlayheadPosition);
    peaks.on("user_scrub.*", trackPlayheadPosition);

    peaks.on("waveform_zoom_displaying", function(start, end) {

      if (!peaks.dragseeking) {
        that.updateRefWaveform(start, end);
      }
    });

    peaks.on("overview.minimize", function() {
      that.minimize();
    });

    peaks.on("overview.maximize", function() {
      that.maximize();
    });

    peaks.on("overview.toggleMinimizedState", function () {
      that.toggleMinimizedState ();
    });

    peaks.on("resizeEndOverview", function(width, newWaveformData) {
      that.width = width;
      that.data = newWaveformData;
      that.stage.setWidth(that.width);


      //that.updateWaveform();
      peaks.emit("overview_resized");
    });
  }

  // called when the segment layer has been added, allowing us to tidy up the UI a bit
  WaveformEditableOverview.prototype.segmentLayerAdded = function() {
    var that = this;
    this.waveformLayer.moveToBottom();
    this.refLayer.moveToTop();
    this.uiLayer.moveToTop();
    this.updateState ();
  };

  WaveformEditableOverview.prototype.getDataTime = function() {
    var that = this;
    return that.data.time(that.frameOffset);
  };

  WaveformEditableOverview.prototype.atDataTime = function(axisLabelOffsetSecs) {
    var that = this;
    return that.data.at_time(axisLabelOffsetSecs);
  };

  WaveformEditableOverview.prototype.createWaveform = function() {
    var that = this;
    this.waveformShape = new Konva.Shape({
      fill: 'black',
      opacity: 0.13,
      strokeWidth: 0
    });

    this.waveformShape.sceneFunc(mixins.waveformDrawFunction.bind(this.waveformShape, that));

    this.waveformLayer.add(this.waveformShape);
    this.stage.add(this.waveformLayer);

  };

  // Reference Waveform to inform users where they are in overview waveform based on current zoom level
  // Also sets up the other parts of the UI
  // todo - this is quite messy!
  WaveformEditableOverview.prototype.createRefWaveform = function() {
    var that = this;

    this.refLayer = new Konva.Layer();

    this.refWaveformShape = new Konva.Shape({
      fill: "#666666",
      strokeWidth: 0,
      opacity: 0.5
    });

    this.refWaveformShape.sceneFunc(mixins.waveformDrawFunction.bind(this.refWaveformShape, that));

    this.refWaveformRect = new Konva.Rect({
      x: 1,
      y: 0,
      width: 0,
      stroke: "#666666",
      strokeWidth: 2,
      height: this.height - 2,
      fill: 'rgba(67,135,200,0.01)',
      opacity: 1,
      cornerRadius: 0,
      draggable: true,
      dragBoundFunc: function(pos) {
        return {
          x: Math.max(0, Math.min(pos.x, that.width - this.width())),
          y: 0
        };
      }
    });

    // short cut function that will draw a line at a particular X position
    var makeLine = function(pos) {
      return new Konva.Line({
        points: [pos, (that.height/2)-6, pos, (that.height/2)+6],
        stroke: 'white',
        strokeHitEnabled:false,
        listening: false,
        strokeWidth: 1
      });
    };

    // a short cut function that will create a group and add 4 new lines to that group
    var addLinesToGroup = function(group) {
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
    };


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

    // this is the right-hand edge o the editable window
    this.rightGroup = new Konva.Group({
      draggable: true,
      dragBoundFunc: function(pos) {
        return {
          x: Math.min(pos.x, that.width - 11),
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
      stroke: "rgba(0,0,0,0)",
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
      stroke: "rgba(0,0,0,0)",
      strokeWidth: 0,
      height: this.height,
      fill: '#666666',
      opacity: 1,
      cornerRadius: 0,
    });

    var centerRect = that.centerRect = new Konva.Rect({
      x: -4,
      y: 0,
      width: 19,
      stroke: "rgba(0,0,0,0)",
      strokeWidth: 0,
      height: this.height,
      fill: '#666666',
      opacity: 1,
      cornerRadius: 0,
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

    // handler for when we're dragging the big rectangle that covers the editable window
    this.refWaveformRect.on('dragmove', function(event) {
      var currentSeparation = that.rightGroup.x() - that.leftGroup.x();
      var currentCenterSeparation = that.centerGroup.x() - that.leftGroup.x();
      // adjust the position if the rectangles
      // note - in review, it seems like this shouldnt be necessary
      that.leftGroup.setAttrs({
        x: that.refWaveformRect.x()
      });
      that.centerGroup.setAttrs({
        x: Math.round(that.refWaveformRect.x() + currentCenterSeparation)
      });
      that.rightGroup.setAttrs({
        x: that.refWaveformRect.x() + currentSeparation
      });
      // force the updating of positions, sizes etc
      that.forceUpdateRefWaveform(that.refWaveformRect.x(), that.refWaveformRect.x() + that.refWaveformRect.width());

    });

    // when dragging the right hand box (which will resize the active area)
    this.rightGroup.on('dragmove', function(event) {
      // force the updating of positions, sizes etc
      that.forceUpdateRefWaveform(that.leftGroup.x(), that.rightGroup.x() + (that.rightGroup.scaleX() * 11));
    });

    // when dragging the right hand box (which will resize the active area)
    this.leftGroup.on('dragmove', function(event) {
      // force the updating of positions, sizes etc
      that.forceUpdateRefWaveform(that.leftGroup.x(), that.rightGroup.x() + (that.rightGroup.scaleX() * 11));
    });

    

    // darken the rectangle on hover
    this.refLayer.on('mouseenter', function() {
      that.refWaveformRect.fill('rgba(0,0,0,0.05)');
      this.draw();
    });
    this.refLayer.on('mouseleave mouseout', function() {
      that.refWaveformRect.fill('rgba(67,135,200,0.01)');
      this.draw();
    });

    // when we begin dragging the big rectangle or the edges, tell peaks what we're doing so that other views can change behaviour accordingly
    // similarly, when we stop dragging, we want to unset that flag
    this.refWaveformRect.on('dragstart', function() {
      that.peaks.dragseeking = true;
      // that.peaks.seeking = true;
    });

    this.refWaveformRect.on('dragend', function(event) {
      that.peaks.dragseeking = false;
    });


    this.leftGroup.on('dragstart', function() {
      that.peaks.dragseeking = true;
    });


    this.rightGroup.on('dragstart', function() {
      that.peaks.dragseeking = true;
    });

    this.leftGroup.on('dragend', function(event) {
      that.peaks.dragseeking = false;
    });

    this.rightGroup.on('dragend', function(event) {
      that.peaks.dragseeking = false;
    });

  };

  WaveformEditableOverview.prototype.createUi = function() {
    var that = this;

    this.playheadLine = new Konva.Line({
      points: [0.5, 0, 0.5, that.height],
      stroke: that.options.playheadColor,
      strokeWidth: 1,
      x: 0
    });

    that.uiLayer = new Konva.Layer({
      index: 100
    });

    this.uiLayer.add(this.playheadLine);
    this.stage.add(this.uiLayer);
  };

 
  // move to minimized state
  WaveformEditableOverview.prototype.minimize = function() {
    var that = this;
    that.minimized = true;
    that.updateState();
  };

  // move to maximized state
  WaveformEditableOverview.prototype.maximize = function() {
    var that = this;
    that.minimized = false;
    that.updateState();
  };

  // toggle between minimized and maximized states
  WaveformEditableOverview.prototype.toggleMinimizedState = function() { 
    this.minimized = !this.minimized;
    this.updateState ();
  };

  // redraw and reposition based on the current state
  // todo - this is messy
  WaveformEditableOverview.prototype.updateState = function() {
    var that = this;
    var backgroundTweenNodes,tween,lineTweens,tween6,tween2,tween4;
    // if we're in minimized state...
    if (that.minimized) {
      // hide the waveform in this state
      that.waveformShape.hide();
      that.refWaveformShape.hide();

      // tween some parts of the UI
      // 
      // first of all, the background and waveform
      backgroundTweenNodes = [that.waveformLayer, that.backgroundLayer];
      backgroundTweenNodes.map(function(item) {
        var tween = new Konva.Tween({
          node: item,
          duration: 0.3,
          scaleY: 5 / that.height,
          y: (25 - 5) / 2
        });
        tween.play();
      });


      // then the ref layer
      tween = new Konva.Tween({
        node: that.refLayer,
        duration: 0.3,
        scaleY: 25 / that.height
      });
      tween.play();

      // adjust the position of the lines
      lineTweens = [that.leftGroup.lines, that.centerGroup.lines, that.rightGroup.lines];
      lineTweens.map(function(item) {
        var tween6 = new Konva.Tween({
          node: item,
          duration: 0.3,
          scaleY: that.height / 25,
          y: -95
        });
        tween6.play();
      });

      // adjust the center box
      tween6 = new Konva.Tween({
        node: that.centerRect,
        duration: 0.3,
        height: that.height,
        y: 0
      });
      tween6.play();

      // tween the position of the entire UI layer
      tween2 = new Konva.Tween({
        node: that.uiLayer,
        duration: 0.3,
        scaleY: 25 / that.height
      });
      tween2.play();

      // and the segment layer, if it exists...
      if (that.segmentLayer) {
        tween4 = new Konva.Tween({
          node: that.segmentLayer,
          duration: 0.2,
          scaleY: (25/that.height),
          y: 0
        });

        tween4.play();
      }

    } else {

      // we're maximised
      // 
      // show the waveform and the ref box
      that.waveformShape.show();
      that.refWaveformShape.show();

      backgroundTweenNodes = [that.waveformLayer, that.backgroundLayer];
      backgroundTweenNodes.map(function(item) {
        var tween = new Konva.Tween({
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
        node: that.refLayer,
        duration: 0.3,
        scaleY: 1,
        y:0
      });
      tween.play();

      // tween the position of the lines
      lineTweens = [that.leftGroup.lines, that.centerGroup.lines, that.rightGroup.lines];
      lineTweens.map(function(item) {
        var tween6 = new Konva.Tween({
          node: item,
          duration: 0.3,
          scaleY: 1,
          y: 0
        });
        tween6.play();
      });

      // and the center box...
      tween6 = new Konva.Tween({
        node: that.centerRect,
        duration: 0.3,
        height: 21,
        y: (that.height - 21)/2
      });
      tween6.play();

      // and the entire UI layer
      tween2 = new Konva.Tween({
        node: that.uiLayer,
        duration: 0.3,
        scaleY: 1
      });
      tween2.play();

      // and the segment layer, if it exists...
      if (that.segmentLayer) {
        tween4 = new Konva.Tween({
          node: that.segmentLayer,
          duration: 0.3,
          scaleY: 1,
          y: 0
        });
        tween4.play();
      }

      // we may need to redraw the ref layer
      that.refWaveformShape.draw();
      
    }
  };

  // Update when we drag or resize
  WaveformEditableOverview.prototype.forceUpdateRefWaveform = function(offset_in, offset_out) {
    var that = this;

    var xPos = offset_in,
      width = offset_out - offset_in;
      
    // we need to store the original width of the editable area so we can use it as a 'minimum'.
    // This is needed for relatively short audio files
    if (!that.initialWidth) {
      that.initialWidth = width;
    }

    // work out the new percentage, based on the percentage of the audio that is covered by the editable box
    var zoomPercentage = (width - that.initialWidth) / (that.width - that.initialWidth );

    // tell peaks about the change
    that.peaks.emit("zoom.change.left", (xPos / that.width) * that.data.duration);
    that.peaks.emit("zoom.change", 1 - zoomPercentage,true);
    that.peaks.emit("zoom.change.left", (xPos / that.width) * that.data.duration);

    // reposition the box
    that.refWaveformRect.setAttrs({
      x: xPos,
      width: width
    });

    // reposition the center box
    that.centerGroup.setAttrs({
      x: xPos + (width - 11) / 2
    });

    // hide the center box if below a certain threshold
    if (width < 59) {
      that.centerGroup.hide();
    } else {
      that.centerGroup.show();
    }

    // update the various bits
    that.refWaveformShape.sceneFunc(function(canvas) {
      that.data.set_segment(offset_in, offset_out, "zoom");
      mixins.waveformOffsetDrawFunction.call(this, that.data, canvas.canvas, mixins.interpolateHeight(that.height));
    });

    that.refWaveformShape.draw();
    that.uiLayer.draw();
    that.refLayer.draw();

  };


  // Called when we need to reposition, not triggered by drag or resize
  WaveformEditableOverview.prototype.updateRefWaveform = function(time_in, time_out) {
    var that = this;

    var offset_in = that.data.at_time(time_in);
    var offset_out = that.data.at_time(time_out);


    that.data.set_segment(offset_in, offset_out, "zoom");

    var xPos = that.data.segments.zoom.offset_start - that.data.offset_start,
      width = that.data.at_time(time_out) - that.data.at_time(time_in);

    // store the initial width in case we haven't before... 
    if (!that.initialWidth) {
      that.initialWidth = width;
    }

    // resize the box
    that.refWaveformRect.setAttrs({
      x: xPos,
      width: width
    });

    // redraw the box
    that.refWaveformShape.sceneFunc(function(canvas) {
      that.data.set_segment(offset_in, offset_out, "zoom");
      mixins.waveformOffsetDrawFunction.call(this, that.data, canvas.canvas, mixins.interpolateHeight(that.height));
    });

    that.refWaveformShape.draw();

    // hide the rectangles when we get below a certain width
    var rectWidth = Math.min(11, width / 4);
    var rectOpacity = Math.min(1, rectWidth / 11);

    rectOpacity = 1;

    if (xPos < 0) {
      xPos = 0;
    }

    that.leftGroup.setAttrs({
      x: xPos,
      scaleX: rectWidth / 11,
      opacity: rectOpacity
    });

    that.rightGroup.setAttrs({
      x: xPos + width - rectWidth,
      scaleX: rectWidth / 11,
      opacity: rectOpacity
    });

    that.centerGroup.setAttrs({
      x: xPos + (Math.round((width - 11) / 2)),

    });

    this.refWaveformRect.setAttrs({
      opacity: rectOpacity
    });

    // hide the lines if the rectangles drop below a certain width
    if (rectWidth < 11) {
      that.leftGroup.lines.hide();
      that.rightGroup.lines.hide();
    } else {
      that.leftGroup.lines.show();
      that.rightGroup.lines.show();
    }

    // hide the center group if we drop below a certain threshold
    if (width < 59) {
      that.centerGroup.hide();
    } else {
      that.centerGroup.show();
    }

    that.uiLayer.draw();
    that.refLayer.draw();
  };


  WaveformEditableOverview.prototype.updateUi = function(pixel) {
    var that = this;
    // move the playhead and redraw the UI
    that.playheadLine.setAttr("x", pixel);
    that.uiLayer.draw();
  };

  return WaveformEditableOverview;
});