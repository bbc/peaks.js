# Peaks.js Version Migration Guide

This document describes any breaking changes in the Peaks.js API and provides advice on how to migrate your code to the updated API.

## Peaks.js v1.0.0

Peaks.js v1.0.0 changes a number of event handlers to also expose the [MouseEvent](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent) or [PointerEvent](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent), so that applications can, for example, check the keyboard state during `click` and other events. This is a breaking API change and so you will need to update your code, as shown below.

### Waveform events

- `overview.click`, `overview.dblclick`,
- `zoomview.click`, `zoomview.dblclick`

```js
// Before
peaks.on('zoomview.click', function(time) {
  console.log(time);
});

// After
peaks.on('zoomview.click', function(event) {
  console.log(event.time);
  console.log(event.evt.ctrlKey);
  console.log(event.evt.shiftKey);
});
```

### Point events

- `points.dragstart`, `points.dragmove`, `points.dragend`
- `points.mouseenter`, `points.mouseleave`
- `points.click`, `points.dblclick`

```js
// Before
peaks.on('points.click', function(point) {
  console.log(point);
});

// After
peaks.on('points.click', function(event) {
  console.log(event.point);
  console.log(event.evt.ctrlKey);
  console.log(event.evt.shiftKey);
});
```

### Segment events

- `segments.dragstart`, `segments.dragged`, `segments.dragend`

```js
// Before
peaks.on('segments.dragged', function(segment, startMarker) {
  console.log(segment);
  console.log(startMarker);
});

// After
peaks.on('segments.dragged', function(event) {
  console.log(event.segment);
  console.log(event.startMarker);
  console.log(event.evt.ctrlKey);
  console.log(event.evt.shiftKey);
});
```

- `segments.mouseenter`, `segments.mouseleave`
- `segments.click`, `segments.dblclick`

```js
// Before
peaks.on('segments.click', function(segment) {
  console.log(segment);
});

// After
peaks.on('segments.click', function(event) {
  console.log(event.segment);
  console.log(event.evt.ctrlKey);
  console.log(event.evt.shiftKey);
});
```
