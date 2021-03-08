# wasm-memory-export

This demonstrates allocating linear memory in WASM code,
mapping it to a `Float64Array` it in JavaScript code,
populating it there,
and calling a WASM function to modify it.

To build and run this:

- enter `wat2wasm demo.wat --enable-threads`
- start a local HTTP file server
- browse `localhost:{port}`

This works in Chrome.

Other browsers have an issue with this line
that passes the shared memory to a Web Worker:

```js
worker.postMessage({command: 'initialize', sharedMemory});
```

To get this to work in Firefox Developer Edition,
not plain Firefox, browse `about:config` and set
`dom.postMessage.sharedArrayBuffer.bypassCOOP_COEP.insecure.enabled` to `true`.

This does not work in Safari.
