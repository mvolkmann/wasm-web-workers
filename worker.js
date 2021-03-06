const headers = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp'
};

async function run(sharedMemory, length, dx, dy) {
  // Share the shared memory with the WASM module.
  const imports = {env: {memory: sharedMemory}};
  const res = fetch('demo.wasm', {headers});
  const m = await WebAssembly.instantiateStreaming(res, imports);

  const {translatePoints} = m.instance.exports;
  //TODO: How can the WASM code use Atomics functions to
  //TODO: safely perform concurrent updates to the shared memory?
  translatePoints(length, dx, dy);

  // Inform the main thread that translation is finished.
  postMessage('translated');
}

onmessage = event => {
  const {dx, dy, length, sharedMemory} = event.data;
  if (length && sharedMemory) {
    run(sharedMemory, length, dx, dy);
  } else {
    console.error('worker.js requires length and sharedMemory');
  }
};
