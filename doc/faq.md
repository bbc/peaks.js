# Peaks.js Frequently Asked Questions

## Clicking to seek the waveform doesn't work, it always seeks back to the beginning

This problem is seen in Chromium based browsers. The usual cause is if you're serving the audio or video file from a web server that does not support [HTTP range requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests). See [this Chrome issue](https://bugs.chromium.org/p/chromium/issues/detail?id=973357) for more detail.

Most commonly, this happens with Python's `http.server` module, which does not support range requests (see [this issue](https://github.com/python/cpython/issues/86809)). The HTTP server should reply with `206 Partial Content` status in response to a range request. If you're using Python, we suggest installing an alternative HTTP server, such as
[rangehttpserver](https://pypi.org/project/rangehttpserver/).
