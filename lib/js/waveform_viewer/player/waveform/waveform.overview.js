define([
  "m/bootstrap",
  "m/player/waveform/waveform.axis",
  "m/player/waveform/waveform.mixins"
  ], function (bootstrap, WaveformAxis, mixins) {

  function WaveformOverview(waveformData, container, options) {
    var that = this;
    that.options = options;
    that.data = waveformData;
    that.container = container;
    that.width = that.container.clientWidth;
    that.height = options.height;
    that.frameOffset = 0;
    that.seeking = false;

    that.stage = new Kinetic.Stage({
      container: container,
      width: that.width,
      height: that.height
    });

    that.waveformLayer = new Kinetic.Layer();

    that.background = new Kinetic.Rect({
      x: 0,
      y: 0,
      width: that.width,
      height: that.height
    });

    that.waveformLayer.add(that.background);

    that.uiLayer = new Kinetic.Layer();
    that.refLayer = new Kinetic.Layer();

    that.axis = new WaveformAxis(that);

    that.createWaveform();
    that.createRefWaveform();
    that.axis.drawAxis(0);
    that.createUi();

    // INTERACTION ===============================================

    that.stage.on("mousedown mouseup", function (event) {
      if (event.targetNode &&
        !event.targetNode.attrs.draggable &&
        !event.targetNode.parent.attrs.draggable) {
        if (event.type == "mousedown") {
          that.seeking = true;

          var width = that.refWaveformShape.getWidth();

          that.updateRefWaveform(
            that.data.time(event.layerX),
            that.data.time(event.layerX + width)
          );

          that.playheadPixel = event.layerX;
          that.updateUi(that.playheadPixel);

          bootstrap.pubsub.emit("overview_user_seek", that.data.time(event.layerX));

          that.stage.on("mousemove", function (event) {
            that.updateRefWaveform(
              that.data.time(event.layerX),
              that.data.time(event.layerX + width)
            );
            that.playheadPixel = event.layerX;
            that.updateUi(that.playheadPixel);
            bootstrap.pubsub.emit("overview_user_seek", that.data.time(event.layerX));
          });

          document.addEventListener("mouseup", function () {
            that.stage.off("mousemove");
            that.seeking = false;
          });
        } else {
          that.stage.off("mousemove");
          that.seeking = false;
        }
      }
    });

    // EVENTS ====================================================

    bootstrap.pubsub.on("player_time_update", function (time) {
      if (!that.seeking) {
        that.currentTime = time;
        that.playheadPixel = that.data.at_time(that.currentTime);
        that.updateUi(that.playheadPixel);
      }
    });

    bootstrap.pubsub.on("waveform_zoom_displaying", function (start, end) {
      that.updateRefWaveform(start, end);
    });

    bootstrap.pubsub.on("resizeEndOverview", function (width, newWaveformData) {
      that.width = width;
      that.data = newWaveformData;
      that.stage.setWidth(that.width);
      that.updateWaveform();
      bootstrap.pubsub.emit("overview_resized");
    });
  }

  WaveformOverview.prototype.createWaveform = function() {
    var that = this;
    this.waveformShape = new Kinetic.Shape({
      drawFunc: function(canvas) {
        mixins.waveformDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
      },
      fill: that.options.overviewWaveformColor,
      strokeWidth: 0
    });
    this.waveformLayer.add(this.waveformShape);
    this.stage.add(this.waveformLayer);
  };

  WaveformOverview.prototype.createRefWaveform = function () {
    var that = this;

    this.refWaveformShape = new Kinetic.Shape({
      drawFunc: function(canvas) {
        mixins.waveformOffsetDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
      },
      fill: that.options.zoomWaveformColor,
      strokeWidth: 0
    });

    this.refLayer.add(this.refWaveformShape);
    this.stage.add(this.refLayer);
  };

  WaveformOverview.prototype.createUi = function() {
    var that = this;
    this.playheadLine = new Kinetic.Line({
      points: that._getPlayheadPoints(0),
      stroke: 'rgba(0,0,0,1)',
      strokeWidth: 1
    });
    this.uiLayer.add(this.playheadLine);
    this.stage.add(this.uiLayer);
  };

  WaveformOverview.prototype.updateWaveform = function () {
    var that = this;
    that.waveformShape.setDrawFunc(function(canvas) {
      mixins.waveformDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
    });
    that.waveformLayer.draw();
  };

  WaveformOverview.prototype.updateWaveform = function () {
    var that = this;
    that.waveformShape.setDrawFunc(function(canvas) {
      mixins.waveformDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
    });
    that.waveformLayer.draw();
  };

  WaveformOverview.prototype.updateRefWaveform = function (time_in, time_out) {
    var that = this;

    var offset_in = that.data.at_time(time_in);
    var offset_out = that.data.at_time(time_out);

    that.refWaveformShape.setDrawFunc(function(canvas) {
      that.data.set_segment(offset_in, offset_out, "zoom");

      mixins.waveformOffsetDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
    });

    that.refWaveformShape.setWidth(that.data.at_time(time_out) - that.data.at_time(time_in));
    that.refLayer.draw();
  };

  WaveformOverview.prototype.updateUi = function (pixel) {
    var that = this;
    that.playheadLine.setAttr("points", that._getPlayheadPoints(pixel));
    that.uiLayer.draw();
  };

  WaveformOverview.prototype._getPlayheadPoints = function (pixelOffset) {
    var that = this;
    return [{x:pixelOffset+0.5, y:0},{x:pixelOffset+0.5, y:that.height}];
  };

  return WaveformOverview;
});
