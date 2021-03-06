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
      log_i32: n => console.log('i32 =', n),
      log_f64: n => console.log('f64 =', n),
      memory: sharedMemory
    }
  };
  const res = fetch('demo.wasm', {headers});
  const m = await WebAssembly.instantiateStreaming(res, imports);

  const {translatePoints} = m.instance.exports;
  //TODO: How can the WASM code use Atomics functions to
  //TODO: safely perform concurrent updates to the shared memory?
  translatePoints(start, length, dx, dy);

  // Inform the main thread that translation is finished.
  postMessage('translated');
}

onmessage = event => {
  const {dx, dy, length, start, sharedMemory} = event.data;
  if (length && sharedMemory) {
    run(sharedMemory, start, length, dx, dy);
  } else {
    console.error('worker.js requires length and sharedMemory');
  }
};
