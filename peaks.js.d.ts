/**
 * Peaks.js TypeScript Definitions
 * @author Evan Louie <evan.louie@microsoft.com> (https://evanlouie.com)
 */

declare module 'peaks.js' {

  interface SegmentAddOptions {
    startTime: number;
    endTime: number;
    editable?: boolean;
    color?: string;
    labelText?: string;
    id?: string;
  }

  interface SegmentUpdateOptions {
    startTime?: number;
    endTime?: number;
    editable?: boolean;
    color?: string;
    labelText?: string;
  }

  interface Segment extends SegmentAddOptions {
    update: (options: SegmentUpdateOptions) => void;
  }

  interface PointAddOptions {
    time: number;
    editable?: boolean;
    color?: string;
    labelText?: string;
    id?: string;
  }

  interface PointUpdateOptions {
    time?: number;
    editable?: boolean;
    color?: string;
    labelText?: string;
  }

  interface Point extends PointAddOptions {
    update: (options: PointUpdateOptions) => void;
  }

  interface RequiredOptions {
    // HTML5 Media element containing an audio track
    mediaElement: Element;
  }

  interface SingleContainerOptions {
    // Container element for the waveform views
    container: HTMLElement;
  }

  interface ViewContainerOptions {
    containers: {
      // Container element for the overview (non-zoomable) waveform view
      overview?: HTMLElement;
      // Container element for the zoomable waveform view
      zoomview?: HTMLElement;
    }
  }

  type ContainerOptions = SingleContainerOptions | ViewContainerOptions;

  interface PreGeneratedWaveformOptions {
    dataUri: {
      // URI to waveform data file in binary or JSON
      arraybuffer?: string;
      json?: string;
    }
  }

  interface WebAudioOptions {
    webAudio: {
      // A Web Audio AudioContext instance which can be used
      // to render the waveform if dataUri is not provided
      audioContext?: AudioContext;
      // Alternatively, provide an AudioBuffer containing the decoded audio
      // samples. In this case, an AudioContext is not needed
      audioBuffer?: AudioBuffer;
      scale?: number;
      multiChannel?: boolean;
    }
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
    // Array of initial segment objects
    segments?: Segment[];
    // Array of initial point objects
    points?: Point[];
    // Emit cue events when playing
    emitCueEvents?: boolean;
  }

  interface SetSourceRequiredOptions {
    mediaUrl: string;
    withCredentials?: boolean;
  }

  type SetSourceOptions = SetSourceRequiredOptions & AudioOptions;

  type SetSourceCallback = (error: Error) => void;

  interface InstanceEvents {
    'peaks.ready': () => void;
    'points.add': (points: Point[]) => void;
    'points.dblclick': (point: Point) => void;
    'points.dragend': (point: Point) => void;
    'points.dragmove': (point: Point) => void;
    'points.dragstart': (point: Point) => void;
    'points.mouseenter': (point: Point) => void;
    'points.mouseleave': (point: Point) => void;
    'points.remove_all': () => void;
    'points.remove': (points: Point[]) => void;
    'points.enter': (point: Point) => void;
    'segments.add': (segments: Segment[]) => void;
    'segments.dragstart': (segment: Segment, inMarker: boolean) => void;
    'segments.dragged': (segment: Segment, inMarker: boolean) => void;
    'segments.dragend': (segment: Segment, inMarker: boolean) => void;
    'segments.remove_all': () => void;
    'segments.remove': (segments: Segment[]) => void;
    'segments.mouseenter': (segment: Segment) => void;
    'segments.mouseleave': (segment: Segment) => void;
    'segments.click': (segment: Segment) => void;
    'segments.enter': (segment: Segment) => void;
    'segments.exit': (segment: Segment) => void;
    'zoom.update': (currentZoomLevel: number, previousZoomLevel: number) => void;
    player_seek: (time: number) => void;
    user_seek: (time: number) => void;
  }

  interface WaveformView {
    setAmplitudeScale: (scale: number) => void;
    setWaveformColor: (color: string) => void;
    showPlayheadTime: (show: boolean) => void;
    enableAutoScroll: (enable: boolean) => void;
  }

  interface PeaksInstance {
    setSource: (options: SetSourceOptions, callback: SetSourceCallback) => void;
    destroy: () => void;
    // Player API
    player: {
      play: () => void;
      pause: () => void;
      getCurrentTime: () => number;
      seek: (time: number) => void;
      playSegment: (segment: Segment) => void;
    };
    // Views API
    views: {
      createOverview: (container: HTMLElement) => WaveformView;
      createZoomview: (container: HTMLElement) => WaveformView;
      getView: (name: string) => WaveformView | null;
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
      add: (segments: SegmentAddOptions | SegmentAddOptions[]) => void;
      getSegments: () => Segment[];
      getSegment: (id: string) => Segment | null;
      removeByTime: (startTime: number, endTime?: number) => Segment[];
      removeById: (segmentId: string) => Segment[];
      removeAll: () => void;
    };
    // Points API
    points: {
      add: (points: PointAddOptions | PointAddOptions[]) => void;
      getPoints: () => Point[];
      getPoint: (id: string) => Point | null;
      removeByTime: (time: number) => Point[];
      removeById: (id: string) => Point[];
      removeAll: () => void;
    };
    // Events
    on: <E extends keyof InstanceEvents>(event: E, listener: InstanceEvents[E]) => void;
  }

  type PeaksInitCallback = (error: Error, peaks?: PeaksInstance) => void;

  interface PeaksOptionsWithoutAudioOptions extends RequiredOptions, OptionalOptions {}

  export type PeaksOptions = PeaksOptionsWithoutAudioOptions & AudioOptions & ContainerOptions;
  export function init(options: PeaksOptions, callback?: PeaksInitCallback): PeaksInstance;
}
