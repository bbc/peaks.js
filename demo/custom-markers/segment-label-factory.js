import { Label, Tag } from 'konva/lib/shapes/Label';
import { Text } from 'konva/lib/shapes/Text';

export function createSegmentLabel(options) {
  if (options.view === 'overview') {
    return null;
  }

  const label = new Label({
    x: 12,
    y: 16
  });

  label.add(new Tag({
    fill:             'black',
    pointerDirection: 'none',
    shadowColor:      'black',
    shadowBlur:       10,
    shadowOffsetX:    3,
    shadowOffsetY:    3,
    shadowOpacity:    0.3
  }));

  label.add(new Text({
    text:       options.segment.labelText,
    fontSize:   14,
    fontFamily: 'Calibri',
    fill:       'white',
    padding:    8
  }));

  return label;
}
