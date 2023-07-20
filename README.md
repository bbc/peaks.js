[![Build Status](https://github.com/bbc/peaks.js/workflows/Node.js%20CI/badge.svg?branch=master)](https://github.com/bbc/peaks.js/actions) [![npm](https://img.shields.io/npm/v/peaks.js.svg)](https://www.npmjs.com/package/peaks.js)

<p align="center">
  <a href="https://github.com/bbc/peaks.js"><img src="peaks-logo.svg" alt="Peaks.js" height="120" /></a>
</p>

#

<p align="center">
  <strong>A client-side JavaScript component to display and interact with audio waveforms in the browser</strong>
</p>

![](https://github.com/bbc/peaks.js/blob/master/peaks.png?raw=1)

Peaks.js uses the HTML canvas element to display the waveform at different zoom levels, and has configuration options to allow you to customize the waveform views. Peaks.js allows users to interact with the waveform views, including zooming and scrolling, and creating point or segment markers that denote content to be clipped or for reference, e.g., distinguishing music from speech or identifying different music tracks.

### Features

* Zoomable and scrollable waveform view
* Fixed width waveform view
* Mouse, touch, scroll wheel, and keyboard interaction
* Client-side waveform computation, using the Web Audio API, for convenience
* Server-side waveform computation, for efficiency
* Mono, stereo, or multi-channel waveform views
* Create point or segment marker annotations
* Customizable waveform views

You can read more about the project and see a demo [here](https://waveform.prototyping.bbc.co.uk/).

# Contents

- [Installing Peaks.js](#installing-peaksjs)
  - [Add a script tag](#add-a-script-tag)
  - [Install with npm](#install-with-npm)
- [Add Peaks.js to your web page](#add-peaksjs-to-your-web-page)
- [Initialize Peaks.js](#initialize-peaksjs)
  - [Using a script tag](#using-a-script-tag)
  - [Using an ES2015 module import](#using-an-es2015-module-import)
- [Generating waveform data](#generating-waveform-data)
  - [Pre-computed waveform data](#pre-computed-waveform-data)
  - [Web Audio based waveform data](#web-audio-based-waveform-data)
- [Next steps](#next-steps)
- [Demos](#demos)
- [API](#api)
- [Building Peaks.js](#building-peaksjs)
  - [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

# Installing Peaks.js

You can start using Peaks.js by either including the UMD bundle in a `<script>` tag in your web page, or by installing it using `npm` or `yarn` and including it in your module bundle with [Webpack](https://webpack.js.org/), [Rollup](https://rollupjs.org/), [Parcel](https://parceljs.org/), etc.

## Add a script tag

To add the Peaks.js UMD bundle to your web page, add a `<script>` tag:

```html
<script src="https://unpkg.com/peaks.js/dist/peaks.js"></script>
```

The UMD bundle is available at [unpkg](https://unpkg.com/peaks.js) and [cdnjs](https://cdnjs.com/libraries/peaks.js).

## Install with npm

We recommend that you use an ES module bundler.

Run the following commands to include Peaks.js in your module bundle:

```bash
npm install --save peaks.js
npm install --save konva
npm install --save waveform-data
```

Note that Peaks.js uses [Konva](https://konvajs.org/) and [waveform-data](https://github.com/bbc/waveform-data.js) as peer dependencies, so you must also install those modules.

# Add Peaks.js to your web page

To include Peaks.js in your web page, you need to add container `<div>` elements that Peaks.js will use to render the waveform views, and a [media element](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement) for your audio or video content. Here is an example HTML fragment:

```html
<div id="zoomview-container"></div>
<div id="overview-container"></div>
<audio id="audio">
  <source src="sample.mp3" type="audio/mpeg">
  <source src="sample.ogg" type='audio/ogg codecs="vorbis"'>
</audio>
```

The container `div`s should be left empty, as shown above, as their content will be replaced by the waveform view `canvas` elements. They should also be styled to have the desired width and height:

```css
#zoomview-container, #overview-container {
  width: 1000px;
  height: 100px;
}
```

# Initialize Peaks.js

The next step is to initialize a `Peaks` instance with [`Peaks.init()`](doc/API.md#initialization) and your configuration options.

The following examples show how to initialize Peaks.js with a minimal configuration. Refer to the [Configuration](doc/API.md#configuration) section in the API documentation for details of all the available options.

## Using a script tag

```html
<script src="https://unpkg.com/peaks.js/dist/peaks.js"></script>
<script>
(function(Peaks) {
  const options = {
    zoomview: {
      container: document.getElementById('zoomview-container')
    },
    overview: {
      container: document.getElementById('overview-container')
    },
    mediaElement: document.getElementById('audio'),
    webAudio: {
      audioContext: new AudioContext()
    }
  };

  Peaks.init(options, function(err, peaks) {
    if (err) {
      console.error(`Failed to initialize Peaks instance: ${err.message}`);
      return;
    }

    // Do something when the waveform is displayed and ready
  });
})(peaks);
</script>
```

## Using an ES2015 module import

```javascript
import Peaks from 'peaks.js';

const options = {
  zoomview: {
    container: document.getElementById('zoomview-container')
  },
  overview: {
    container: document.getElementById('overview-container')
  },
  mediaElement: document.getElementById('audio'),
  webAudio: {
    audioContext: new AudioContext()
  }
};

Peaks.init(options, function(err, peaks) {
  if (err) {
    console.error('Failed to initialize Peaks instance: ' + err.message);
    return;
  }

  // Do something when the waveform is displayed and ready
});
```

# Generating waveform data

Peaks.js creates its audio waveform visualization by processing the audio to produce waveform data. There are two ways that you can do this:

* Pre-compute the waveform data from the audio, using [audiowaveform](https://github.com/bbc/audiowaveform), and provide the data to Peaks.js from your web server
* Compute the waveform data in the browser using the Web Audio API

Using the Web Audio API can work well for short audio files, but involves downloading the entire audio file to the browser and is CPU intensive. Pre-computing the waveform data is preferable for longer audio files, because it saves your users' bandwidth and allows the waveform to be rendered faster.

## Pre-computed waveform data

Peaks.js uses waveform data files produced by [audiowaveform](https://github.com/bbc/audiowaveform). These can be generated in either binary (.dat) or JSON format. Binary format is preferred because of the smaller file size (including after gzip or Brotli compression).

You should also use the `-b 8` option when generating waveform data files, as Peaks.js does not currently support 16-bit waveform data files, and also to minimise file size.

To generate a binary waveform data file:

```
audiowaveform -i sample.mp3 -o sample.dat -b 8
```

To generate a JSON format waveform data file:

```
audiowaveform -i sample.mp3 -o sample.json -b 8
```

Refer to the audiowaveform [documentation](https://github.com/bbc/audiowaveform) for full details of the available command line options, or use the manual page:

```bash
man audiowaveform
```

Once you have created a waveform data file, you can use this from Peaks.js by passing a `dataUri` option to `Peaks.init()`:

```javascript
import Peaks from 'peaks.js';

const options = {
  zoomview: {
    container: document.getElementById('zoomview-container')
  },
  overview: {
    container: document.getElementById('overview-container')
  },
  mediaElement: document.getElementById('audio'),
  dataUri: {
    arraybuffer: 'sample.dat' // or json: 'sample.json'
  }
};

Peaks.init(options, function(err, peaks) {
  // Do something when the waveform is displayed and ready, or handle errors
});
```

## Web Audio based waveform data

Peaks.js can use the [Web Audio API](https://www.w3.org/TR/webaudio/) to generate waveforms, which means you do not have to pre-compute a waveform data file beforehand.

To use Web Audio, omit the `dataUri` option and instead pass a `webAudio` object that contains an `AudioContext` instance. Your browser must [support](https://caniuse.com/#feat=audio-api) the Web Audio API.

```js
import Peaks from 'peaks.js';

const audioContext = new AudioContext();

const options = {
  zoomview: {
    container: document.getElementById('zoomview-container')
  },
  overview: {
    container: document.getElementById('overview-container')
  },
  mediaElement: document.getElementById('audio'),
  webAudio: {
    audioContext: audioContext,
    scale: 128,
    multiChannel: false
  }
};

Peaks.init(options, function(err, peaks) {
  // Do something when the waveform is displayed and ready, or handle errors
});
```

Alternatively, if you have an `AudioBuffer` containing decoded audio samples, e.g., from
[AudioContext.decodeAudioData](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData)
then an `AudioContext` is not needed:

```js
import Peaks from 'peaks.js';

const audioContext = new AudioContext();

// arrayBuffer contains the encoded audio (e.g., MP3 format)
audioContext.decodeAudioData(arrayBuffer)
  .then(function(audioBuffer) {
    const options = {
      zoomview: {
        container: document.getElementById('zoomview-container')
      },
      overview: {
        container: document.getElementById('overview-container')
      },
      mediaElement: document.getElementById('audio'),
      webAudio: {
        audioBuffer: audioBuffer
      }
    };

    Peaks.init(options, function(err, peaks) {
      // Do something when the waveform is displayed and ready, or handle errors
    });
  });
```

# Next steps

We recommend that you take a look at the [demos](#demos), which show how to use the various options and APIs that Peaks.js provides.

Refer to the [API documentation](doc/API.md) for details of all the available configuration options and the API methods and events, and to [Customizing Peaks.js](doc/customizing.md) for more information on advanced customization options.

If you're having difficulty, please refer to the [Frequently Asked Questions](doc/faq.md) page or raise an [issue](https://github.com/bbc/peaks.js/issues).

# Demos

The [demo](demo) folder contains some working examples of Peaks.js in use. To view these, enter the following commands:

```bash
git clone git@github.com:bbc/peaks.js.git
cd peaks.js
npm install
npm start
```

and then open your browser at http://localhost:8080.

There are also some example projects that show how to use Peaks.js with popular JavaScript frameworks:

* [React](https://github.com/chrisn/peaksjs-react-example)
* [Angular](https://github.com/chrisn/peaksjs-angular-example)

# API

Refer to the [API documentation](doc/API.md) for details of all the available configuration options and the API methods and events, and to [Customizing Peaks.js](doc/customizing.md) for more information on advanced customization options.

If you're updating your code to use a new release of Peaks.js, please refer to the [Version Migration Guide](doc/migration-guide.md) for details of any breaking API changes.

# Building Peaks.js

This section describes how to build Peaks.js locally, if you want to modify the code or contribute changes.

The first step is to clone the git repository and install the dependencies:

```bash
git clone git@github.com:bbc/peaks.js.git
cd peaks.js
npm install
```

Next, use the following command to build the library:

```bash
npm run build
```

This will produce various builds of Peaks.js:

* `dist/peaks.js` and `dist/peaks.min.js` are stand-alone UMD modules that contain all dependencies. Note that [custom markers](doc/customizing.md#point-and-segment-markers) do not work with these builds. See the [FAQ](doc/faq.md) for more details

* `dist/peaks.esm.js` is an ES module bundle that does not include the Konva.js and waveform-data.js dependencies

* `dist/peaks.ext.js` and `dist/peaks.ext.min.js` are UMD builds that do not include the Konva.js and waveform-data.js dependencies

The build also creates an associated [source map](https://web.dev/source-maps/) for each JavaScript file.

## Testing

Tests run in Karma using Mocha, Chai, and Sinon.

 - `npm test` should work for simple one time testing.
 - `npm test -- --glob %pattern%` to run selected tests only
 - `npm run test-watch` if you are developing and want to repeatedly run tests in a browser on your machine.
 - `npm run test-watch -- --glob %pattern%` is also available

# Contributing

If you'd like to contribute to Peaks.js, please take a look at our [contributor guidelines](CONTRIBUTING.md).

# License

See [COPYING](COPYING).

This project includes sample audio from the BBC radio programme [Desert Island Discs](https://en.wikipedia.org/wiki/File:Alice_walker_bbc_radio4_desert_island_discs_19_05_2013.flac), used under the terms of the [Creative Commons 3.0 Unported License](http://creativecommons.org/licenses/by/3.0/).

# Credits

This software was written by:

- [Chris Finch](https://github.com/chrisfinch)
- [Thomas Parisot](https://github.com/oncletom)
- [Chris Needham](https://github.com/chrisn)

Thank you to all our [contributors](https://github.com/bbc/peaks.js/graphs/contributors).

# Copyright

Copyright 2023 British Broadcasting Corporation
