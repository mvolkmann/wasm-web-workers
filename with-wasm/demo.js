const POINTS = 1_000_000;
//const POINTS = 10;
//const PAGE_SIZE = 64; // KB
//const PAGE_BYTES = PAGE_SIZE * 1024;
//const PAGES = Math.ceil((POINTS * 16) / PAGE_BYTES);
//console.log('demo.js x: PAGES =', PAGES);
const PAGES = 245; // enough for one million points
// Must change the numbers in the `(import "env" "memory"`
// line in demo.wat to match this!
const WORKERS = 8;

// For translations
const dx = 2;
const dy = 3;

// For rotations
//const center = {x: 0, y: 0};
const center = {x: 2, y: 3};
//const degrees = 90;
const degrees = 45;
const radians = (degrees * Math.PI) / 180;
const cos = Math.cos(radians);
const sin = Math.sin(radians);
const constantX = center.x - center.x * cos + center.y * sin;
const constantY = center.y - center.x * sin - center.y * cos;

let array;
let workers = [];

// For benchmarking
let startTime, endTime;
function startTimer() {
  startTime = Date.now();
}
function stopTimer(label) {
  endTime = Date.now();
  console.info(`${label} took ${endTime - startTime}ms`);
}

// For testing
function assertArraysEqual(expected, actual) {
  console.assert(
    expected.length === actual.length,
    `expected array length ${expected.length} but got ${actual.length}`
  );

  for (let i = 0; i < expected.length; i++) {
    const expectedPt = expected[i];
    const actualPt = actual[i];
    console.assert(
      expectedPt.x === actualPt.x,
      `expected x at index ${i} to be ${expectedPt.x} but got ${actual.x}`
    );
    console.assert(
      expectedPt.y === actualPt.y,
      `expected y at index ${i} to be ${expectedPt.y} but got ${actual.y}`
    );
  }
}

// JS translation
function translatePoint(point, dx, dy) {
  return {x: point.x + dx, y: point.y + dy};
}

// JS rotation with no optimization
function rotatePoint(point, radians, center) {
  /*
  // Approach #1 - slower
  // Translate the point so the center is at the origin.
  const transX = point.x - center.x;
  const transY = point.y - center.y;

  // Rotate the point.
  const rotatedX = transX * cos - transY * sin;
  const rotatedY = transX * sin + transY * cos;

  // Translate the point back.
  return {x: rotatedX + center.x, y: rotatedY + center.y};
  */

  // Approach #2 - faster if constants are only computed once.
  return {
    x: point.x * cos - point.y * sin + constantX,
    y: point.x * sin + point.y * cos + constantY
  };
}

// Generate random points.
const random = () => Math.ceil(Math.random() * 10);
const points = [];
for (let i = 0; i < POINTS; i++) {
  points.push({x: random(), y: random()});
}
console.log('demo.js: points =', points);
/*
const points = [
  {x: 3, y: 0},
  {x: 0, y: 4}
];
*/

startTimer();
const expectedTranslations = points.map(point => translatePoint(point, dx, dy));
stopTimer('JS translations');
//console.log('demo.js: expectedTranslations =', expectedTranslations);

startTimer();
const expectedRotations = points.map(point =>
  rotatePoint(point, radians, center)
);
stopTimer('JS rotations');
console.log('demo.js: expectedRotations =', expectedRotations);

function createWorkers() {
  // Allocate 1 page of shared linear memory.
  const sharedMemory = new WebAssembly.Memory({
    initial: PAGES,
    maximum: PAGES,
    shared: true
  });

  // Copy point data into the shared linear memory.
  array = new Float64Array(sharedMemory.buffer);
  let index = 0;
  for (const point of points) {
    array[index++] = point.x;
    array[index++] = point.y;
  }
  //console.info('demo.js createWorkers: original point array =', array);

  let createdCount = 0;
  return new Promise(resolve => {
    for (let i = 0; i < WORKERS; i++) {
      const worker = new Worker('worker.js');
      workers.push(worker);
      worker.onmessage = () => {
        if (++createdCount === WORKERS) resolve();
      };
      worker.postMessage({command: 'initialize', sharedMemory});
    }
  });
}

function runWorkers() {
  const length = Math.ceil(POINTS / WORKERS);
  return new Promise(resolve => {
    let finishCount = 0;
    workers.forEach((worker, i) => {
      worker.onmessage = () => {
        if (++finishCount === WORKERS) resolve();
      };
      const start = i * length;
      const len = Math.min(length, POINTS - start);
      //worker.postMessage({command: 'translate', start, length: len, dx, dy});
      worker.postMessage({
        command: 'rotate',
        start,
        length: len,
        radians,
        center
      });
    });
  });
}

async function run() {
  startTimer();
  await createWorkers();
  stopTimer('web worker creation');

  // Time to create the workers is not included in the total time
  // because in a real app the workers would be created only once,
  // but the transformations would be performed repeatedly.
  startTimer();
  await runWorkers();
  stopTimer('web worker run');

  /*
  const actualTranslations = [];
  for (let i = 0; i < POINTS; i++) {
    const index = i * 2;
    actualTranslations.push({
      x: array[index],
      y: array[index + 1]
    });
  }
  console.info('demo.js: actualTranslations =', actualTranslations);
  assertArraysEqual(expectedTranslations, actualTranslations);
  */

  const actualRotations = [];
  for (let i = 0; i < POINTS; i++) {
    const index = i * 2;
    actualRotations.push({
      x: array[index],
      y: array[index + 1]
    });
  }
  console.info('demo.js: actualRotations =', actualRotations);
  assertArraysEqual(expectedRotations, actualRotations);
}

run();
