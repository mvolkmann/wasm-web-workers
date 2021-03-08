const headers = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp'
};

let rotatePoints;
let sharedMemory;
let translatePoints;

async function initialize() {
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

async function rotateJs(start, length, radians, center) {
  const array = new Float64Array(sharedMemory.buffer);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const constantX = center.x - center.x * cos + center.y * sin;
  const constantY = center.y - center.x * sin - center.y * cos;

  for (let i = start; i < start + length; i++) {
    const index = i * 2;
    const x = array[index];
    const y = array[index + 1];
    array[index] = x * cos - y * sin + constantX;
    array[index + 1] = x * sin + y * cos + constantY;
  }

  postMessage('ran');
}

async function rotateWasm(start, length, radians, center) {
  rotatePoints(start, length, radians, center.x, center.y);
  postMessage('ran');
}

async function translateWasm(start, length, dx, dy) {
  //TODO: How can the WASM code use Atomics functions to
  //TODO: safely perform concurrent updates to the shared memory?
  translatePoints(start, length, dx, dy);
  postMessage('ran');
}

onmessage = event => {
  const {data} = event;
  const {command} = data;
  if (command === 'initialize') {
    sharedMemory = data.sharedMemory;
    initialize();
  } else if (command === 'rotate') {
    //TODO: It seems that doing rotate calculations in JS just as fast as
    //TODO: using WASM, so the primary speed improvement seems to come from
    //TODO: using multiple Web Workers, not from using WASM.
    rotateWasm(data.start, data.length, data.radians, data.center);
    //rotateJs(data.start, data.length, data.radians, data.center);
  } else if (command === 'translate') {
    translateWasm(data.start, data.length, data.dx, data.dy);
  } else {
    console.error('worker.js requires length and sharedMemory');
  }
};
