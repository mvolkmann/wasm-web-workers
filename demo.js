//const random = () => Math.random() * 100;
const random = () => Math.ceil(Math.random() * 10);

// Generate random points.
const POINTS = 50;
const points = [];
for (let i = 0; i < POINTS; i++) {
  points.push({x: random(), y: random()});
}

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

const WORKERS = 3;
let finished = 0;
const length = Math.ceil(POINTS / WORKERS);

function work(start, length) {
  const myWorker = new Worker('worker.js');
  myWorker.onmessage = event => {
    if (event.data === 'translated') {
      finished++;
      if (finished === WORKERS) {
        console.log('demo.js: translated point array =', array);
      }
    } else {
      console.error('demo.js: unsupported message', event.data);
    }
  };
  myWorker.postMessage({sharedMemory, start, length, dx: 2, dy: 3});
}

for (let i = 0; i < WORKERS; i++) {
  const start = i * length;
  work(start, Math.min(POINTS - start, length));
}
