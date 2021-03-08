# wasm-memory-export

This demonstrates allocating linear memory in WASM code,
mapping it to a `Float64Array` it in JavaScript code,
populating it there,
and calling a WASM function to modify it.

To build and run this:

- cd to either `with-wasm` or `without-wasm`
- enter `wat2wasm demo.wat --enable-threads`
- start a local HTTP file server
- browse `localhost:{port}`

This works in Chrome.

Other browsers have an issue running the `with-wasm` version
with this line that passes the shared memory to a Web Worker:

```js
worker.postMessage({command: 'initialize', sharedMemory});
```

To get this to work in Firefox Developer Edition,
not plain Firefox, browse `about:config` and set
`dom.postMessage.sharedArrayBuffer.bypassCOOP_COEP.insecure.enabled` to `true`.

Neither version works in Safari
because it does not yet support `SharedArrayBuffer`.

The primary reasons that performing the transformations in workers
is faster than not using workers (see code in `without-wasm` directory) are:

1. The use of a SharedArrayBuffer and a Float64Array view over it
   does not require hash lookups for every x/y value access.
2. Using multiple web workers allows work to be done in parallel.

The use of WASM seems to have no benefit in this example.

Note that the time to copy the point data from a normal JS array
into a `SharedArrayBuffer` is part of "web worker creation",
but even considering that time it is still faster.
This is true even if only a single Web Worker is used, so really
reason #1 (avoiding hash lookups) above is the primary benefit.
