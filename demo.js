const random = () => Math.random() * 100;

// Generate random points.
const COUNT = 100;
const points = [];
for (let i = 0; i < COUNT; i++) {
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

const myWorker = new Worker('worker.js');
myWorker.onmessage = event => {
  if (event.data === 'translated') {
    console.log('demo.js: translated point array =', array);
  } else {
    console.error('demo.js: unsupported message', event.data);
  }
};
myWorker.postMessage({sharedMemory, length: COUNT, dx: 2, dy: 3});
