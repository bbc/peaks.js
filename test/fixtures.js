var startFixture = function () {

  define(['main'], function (peaks) {

    var audioElement = document.createElement('audio');

    var Peaks = peaks.init({
                  container: document.getElementById('waveform-visualiser-container'),
                  audioElement: audioElement,
                  dataUri: '../test_data/sample.dat',
                  keyboard: true,
                  height: 240
                });
    });

};
