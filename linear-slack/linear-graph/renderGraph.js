const vega = require('vega');
const sharp = require('sharp');

// Currently missing some fonts:
//   https://stackoverflow.com/questions/63169825/utilizing-custom-font-in-aws-lambda-and-node-js-12-x
const renderGraph = async (table) => {
  const spec = {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'A basic line chart example.',
    width: 500,
    height: 200,
    padding: 5,

    signals: [
      {
        name: 'interpolate',
        value: 'linear',
        bind: {
          input: 'select',
          options: [
            'basis',
            'cardinal',
            'catmull-rom',
            'linear',
            'monotone',
            'natural',
            'step',
            'step-after',
            'step-before',
          ],
        },
      },
    ],

    data: [
      {
        name: 'table',
        values: table,
      },
    ],

    scales: [
      {
        name: 'x',
        type: 'point',
        range: 'width',
        domain: { data: 'table', field: 'x' },
      },
      {
        name: 'y',
        type: 'linear',
        range: 'height',
        nice: true,
        zero: true,
        domain: { data: 'table', field: 'y' },
      },
      {
        name: 'color',
        type: 'ordinal',
        range: 'category',
        domain: { data: 'table', field: 'c' },
      },
    ],

    axes: [
      { orient: 'bottom', scale: 'x' },
      { orient: 'left', scale: 'y' },
    ],

    marks: [
      {
        type: 'group',
        from: {
          facet: {
            name: 'series',
            data: 'table',
            groupby: 'c',
          },
        },
        marks: [
          {
            type: 'line',
            from: { data: 'series' },
            encode: {
              enter: {
                x: { scale: 'x', field: 'x' },
                y: { scale: 'y', field: 'y' },
                stroke: { scale: 'color', field: 'c' },
                strokeWidth: { value: 2 },
              },
              update: {
                interpolate: { signal: 'interpolate' },
                strokeOpacity: { value: 1 },
              },
              hover: {
                strokeOpacity: { value: 0.5 },
              },
            },
          },
        ],
      },
    ],
  };

  const view = new vega.View(vega.parse(spec), { renderer: 'none' });

  const svg = await view.toSVG();

  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();

  return buffer;
};

module.exports = { renderGraph };
