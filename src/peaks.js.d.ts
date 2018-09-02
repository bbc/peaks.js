/**
 * Peaks.js TypeScript Definitions
 * @author Evan Louie <evan.louie@microsoft.com> (https://evanlouie.com)
 */

declare module 'peaks.js' {
  interface Segment {
    startTime: number;
    endTime: number;
    editable?: boolean;
    color?: string;
    labelText?: string;
    id?: string;
  }

  interface Point {
    time: number;
    editable?: boolean;
    color?: string;
    labelText?: string;
    id?: string;
  }

  interface RequiredOptions {
    // Containing element
    container: HTMLElement;
    // HTML5 Media element containing an audio track
    mediaElement: Element;
  }

  interface WebAudioOptions {
    // A Web Audio AudioContext instance which can be used
    // to render the waveform if dataUri is not provided
    audioContext: AudioContext;
  }

  interface PreGeneratedWaveformOptions {
    // URI to waveform data file in binary or JSON
    dataUri: { arraybuffer: string } | { json: string };
  }

  type AudioOptions = WebAudioOptions | PreGeneratedWaveformOptions;

  interface OptionalOptions {
    // If true, peaks will send credentials with all network requests
    // i.e. when fetching waveform data.
    withCredentials?: boolean;
    // async logging function
    logger?: (...args: any[]) => void;
    // default height of the waveform canvases in pixels
    height?: number;
    // Array of zoom levels in samples per pixel (big >> small)
    zoomLevels?: number[];
    // Bind keyboard controls
    keyboard?: boolean;
    // Keyboard nudge increment in seconds (left arrow/right arrow)
    nudgeIncrement?: number;
    // Colour for the in marker of segments
    inMarkerColor?: string;
    // Colour for the out marker of segments
    outMarkerColor?: string;
    // Colour for the zoomed in waveform
    zoomWaveformColor?: string;
    // Colour for the overview waveform
    overviewWaveformColor?: string;
    // Colour for the overview waveform rectangle
    // that shows what the zoom view shows
    overviewHighlightRectangleColor?: string;
    // Colour for segments on the waveform
    segmentColor?: string;
    // Colour of the play head
    playheadColor?: string;
    // Colour of the play head text
    playheadTextColor?: string;
    // Show current time next to the play head
    // (zoom view only)
    showPlayheadTime?: boolean;
    // the color of a point marker
    pointMarkerColor?: string;
    // Colour of the axis gridlines
    axisGridlineColor?: string;
    // Colour of the axis labels
    axisLabelColor?: string;
    // Random colour per segment (overrides segmentColor)
    randomizeSegmentColor?: boolean;
    // Zoom view adapter to use. Valid adapters are:
    // 'animated' (default) and 'static'
    zoomAdapter?: string;
    // Array of initial segment objects with startTime and
    // endTime in seconds and a boolean for editable.
    // See below.
    segments?: Segment[];
    // Array of initial point objects
    points?: Point[];
  }

  interface InstanceEvents {
    error: (err: Error) => any;
    'peaks.ready': () => any;
    'user_seek.overview': (time: number) => any;
    'user_seek.zoomview': (time: number) => any;
    'zoom.update': (currentZoomLevel: number, previousZoomLevel: number) => any;
    'segments.add': (segments: Segment[]) => any;
    'segments.remove': (segments: Segment[]) => any;
    'segments.remove_all': () => any;
    'segments.dragged': (segment: Segment) => any;
    'points.add': (points: Point[]) => any;
    'points.remove': (points: Point[]) => any;
    'points.remove_all': () => any;
    'points.dragstart': (point: Point) => any;
    'points.dragmove': (point: Point) => any;
    'points.dragend': (point: Point) => any;
    'points.mouseenter': (point: Point) => any;
    'points.mouseleave': (point: Point) => any;
    'points.dblclick': (point: Point) => any;
  }

  interface PeaksInstance {
    destroy: () => void;
    // Player API
    player: {
      play: () => void;
      pause: () => void;
      getCurrentTime: () => number;
      seek: (time: number) => void;
      playSegment: (segment: Segment) => void;
    };
    // Zoom API
    zoom: {
      zoomOut: () => void;
      zoomIn: () => void;
      setZoom: (index: number) => void;
      getZoom: () => number;
    };
    // Segments API
    segments: {
      add: (segments: Segment | Segment[]) => void;
      getSegments: () => Segment[];
      getSegment: (id: string) => Segment | null;
      removeByTime: (startTime: number, endTime?: number) => number; // returns number of deleted segments
      removeById: (segmentId: string) => void;
      removeAll: () => void;
    };
    // Points API
    points: {
      add: (points: Point | Point[]) => void;
      getPoints: () => Point[];
      getPoint: (id: string) => Point | null;
      removeByTime: (time: number) => void;
      removeById: (id: string) => void;
      removeAll: () => void;
    };
    // Events
    on: <E extends keyof InstanceEvents>(event: E, listener: InstanceEvents[E]) => void;
  }

  interface PeaksOptionsWithoutAudioOptions extends RequiredOptions, OptionalOptions {}

  export type PeaksOptions = PeaksOptionsWithoutAudioOptions & AudioOptions;
  export function init(options: PeaksOptions): PeaksInstance;
}
