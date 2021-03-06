const headers = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp'
};

async function run(length, sharedMemory) {
  // Share the shared memory with the WASM module.
  const imports = {env: {memory: sharedMemory}};
  const res = fetch('demo.wasm', {headers});
  const m = await WebAssembly.instantiateStreaming(res, imports);

  const {translatePoints} = m.instance.exports;
  //TODO: Need to use Atomics functions?
  translatePoints(length, 2, 3);

  // Inform the main thread that translation is finished.
  postMessage('translated');
}

onmessage = event => {
  const {command, length, sharedMemory} = event.data;
  if (command === 'run') {
    run(length, sharedMemory);
  } else {
    console.error('worker.js: unsupported command', command);
  }
};
