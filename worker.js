const headers = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp'
};

let rotatePoints;
let translatePoints;

async function initialize(sharedMemory) {
  //console.log('worker.js run: start =', start);
  //console.log('worker.js run: length =', length);
  // Share the shared memory with the WASM module.
  const imports = {
    env: {
      cos: Math.cos,
      sin: Math.sin,
      log_i32: n => console.log('i32 =', n),
      log_f64: n => console.log('f64 =', n),
      memory: sharedMemory
    }
  };
  const res = fetch('demo.wasm', {headers});
  const m = await WebAssembly.instantiateStreaming(res, imports);
  ({rotatePoints, translatePoints} = m.instance.exports);
  postMessage('initialized');
}

async function rotate(start, length, radians, center) {
  rotatePoints(start, length, radians, center.x, center.y);
  postMessage('ran');
}

async function translate(start, length, dx, dy) {
  //TODO: How can the WASM code use Atomics functions to
  //TODO: safely perform concurrent updates to the shared memory?
  translatePoints(start, length, dx, dy);
  postMessage('ran');
}

onmessage = event => {
  const {data} = event;
  const {command} = data;
  if (command === 'initialize') {
    initialize(data.sharedMemory);
  } else if (command === 'rotate') {
    rotate(data.start, data.length, data.radians, data.center);
  } else if (command === 'translate') {
    translate(data.start, data.length, data.dx, data.dy);
  } else {
    console.error('worker.js requires length and sharedMemory');
  }
};
