# Peaks.js Frequently Asked Questions

## Clicking to seek the waveform doesn't work, it always seeks back to the beginning

This problem is seen in Chromium based browsers. The usual cause is if you're serving the audio or video file from a web server that does not support [HTTP range requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests). See [this Chrome issue](https://bugs.chromium.org/p/chromium/issues/detail?id=973357) for more detail.

Most commonly, this happens with Python's `http.server` module, which does not support range requests (see [this issue](https://github.com/python/cpython/issues/86809)). The HTTP server should reply with `206 Partial Content` status in response to a range request. If you're using Python, we suggest installing an alternative HTTP server, such as
[rangehttpserver](https://pypi.org/project/rangehttpserver/).

## Custom markers don't work, they cannot be dragged

This problem is most often caused by having more than one copy of the Konva.js dependency in your JavaScript bundle.

You should use the `peaks.esm.js` or `peaks.ext.js` builds (or their minified equivalents), which excludes external dependencies, rather than `peaks.js` which is fully self-contained.

## How do I test a pre-release build?

The best way to test a pre-release build in your own project is to clone the repo, check out the branch you want to use, and build locally:

```
git clone git@github.com:bbc/peaks.js
cd peaks.js
npm install
npm run build
```

Then, in your own project, install Peaks.js then copy the files you just built into your project's `node_modules/peaks.js` folder:

```
npm install peaks.js
cp ../peaks.js/peaks.js.d.ts node_modules/peaks.js
cp ../peaks.js/dist/*.js node_modules/peaks.js/dist
cp ../peaks.js/dist/*.map node_modules/peaks.js/dist
```
