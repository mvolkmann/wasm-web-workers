const headers = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp'
};

async function run(sharedMemory, start, length, dx, dy) {
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

  const {rotatePoints, translatePoints} = m.instance.exports;
  //TODO: How can the WASM code use Atomics functions to
  //TODO: safely perform concurrent updates to the shared memory?
  //translatePoints(start, length, dx, dy);

  const cx = 0;
  const cy = 0;
  const degrees = 45;
  const radians = (degrees * Math.PI) / 180;
  rotatePoints(start, length, radians, cx, cy);

  // Inform the main thread that translation is finished.
  postMessage('finished');
}

onmessage = event => {
  const {dx, dy, length, start, sharedMemory} = event.data;
  if (length && sharedMemory) {
    run(sharedMemory, start, length, dx, dy);
  } else {
    console.error('worker.js requires length and sharedMemory');
  }
};
