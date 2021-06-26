import CustomPointMarker from './custom-point-marker';
import SimplePointMarker from './simple-point-marker';
import CustomSegmentMarker from './custom-segment-marker';

export function createPointMarker(options) {
  if (options.view === 'zoomview') {
    return new CustomPointMarker(options);
  }
  else {
    return new SimplePointMarker(options);
  }
}

export function createSegmentMarker(options) {
  if (options.view === 'zoomview') {
    return new CustomSegmentMarker(options);
  }

  return null;
}
