// Allocate 1 page of shared linear memory.
const sharedMemory = new WebAssembly.Memory({
  initial: 1,
  maximum: 2,
  shared: true
});

const points = [
  {x: 1.2, y: 2.3},
  {x: 3.4, y: 4.5},
  {x: 5.6, y: 6.7}
];

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
    console.error('demo.js: unsupported command', command);
  }
};
myWorker.postMessage({command: 'run', length: points.length, sharedMemory});
