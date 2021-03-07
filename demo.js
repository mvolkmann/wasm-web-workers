function assertArraysEqual(arr1, arr2) {
  console.assert(arr1.length === arr2.length, 'array lengths differ');
  for (let i = 0; i < arr1.length; i++) {
    const point1 = arr1[i];
    const point2 = arr2[i];
    console.assert(
      point1.x === point2.x,
      `x values of points at index ${i} differ`
    );
    console.assert(
      point1.y === point2.y,
      `x values of points at index ${i} differ`
    );
  }
}

function translatePoint(point, dx, dy) {
  return {x: point.x + dx, y: point.y + dy};
}

function rotatePoint(point, radians, center) {
  const cos = Math.cos(radians);
  const sin = Math.cos(radians);
  const constantX = center.x - center.x * cos + center.y * sin;
  const constantY = center.y - center.x * sin - center.y * cos;
  return {
    x: point.x * cos - point.y * sin + constantX,
    y: point.x * sin + point.y * cos + constantY
  };
}

//const random = () => Math.random() * 100;
const random = () => Math.ceil(Math.random() * 10);

// Generate random points.
const POINTS = 3;
const points = [];
for (let i = 0; i < POINTS; i++) {
  points.push({x: random(), y: random()});
}
const dx = 2;
const dy = 3;
const expectedTranslations = points.map(point => translatePoint(point, dx, dy));
console.log('demo.js: expectedTranslations =', expectedTranslations);

const center = {x: 0, y: 0};
const degrees = 45;
const radians = (degrees * Math.PI) / 180;
const expectedRotations = points.map(point =>
  rotatePoint(point, radians, center)
);
console.log('demo.js: expectedRotations =', expectedRotations);

// Allocate 1 page of shared linear memory.
const sharedMemory = new WebAssembly.Memory({
  initial: 1,
  maximum: 2,
  shared: true
});

// Copy point data into the shared linear memory.
const array = new Float64Array(sharedMemory.buffer);
let index = 0;
for (const point of points) {
  array[index++] = point.x;
  array[index++] = point.y;
}
console.log('demo.js: untranslated point array =', array);

const WORKERS = 1;
let finished = 0;
const length = Math.ceil(POINTS / WORKERS);

function work(start, length) {
  const myWorker = new Worker('worker.js');
  myWorker.onmessage = event => {
    if (event.data === 'finished') {
      finished++;
      if (finished === WORKERS) {
        console.log('demo.js: new point array =', array);
        //TODO: Measure time to calculate expected and actual.

        /*
        const actualTranslations = [];
        for (let i = 0; i < POINTS; i++) {
          actualTranslations.push({
            x: array[i * 2],
            y: array[i * 2 + 1]
          });
        }
        console.log('demo.js: actualTranslations =', actualTranslations);
        assertArraysEqual(expectedTranslations, actualTranslations);
        */

        const actualRotations = [];
        for (let i = 0; i < POINTS; i++) {
          actualRotations.push({
            x: array[i * 2],
            y: array[i * 2 + 1]
          });
        }
        console.log('demo.js: actualRotations =', actualRotations);
        assertArraysEqual(expectedRotations, actualRotations);
      }
    } else {
      console.error('demo.js: unsupported message', event.data);
    }
  };
  myWorker.postMessage({sharedMemory, start, length, dx, dy});
}

for (let i = 0; i < WORKERS; i++) {
  const start = i * length;
  work(start, Math.min(POINTS - start, length));
}
