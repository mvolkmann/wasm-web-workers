# wasm-memory-export

This demonstrates allocating linear memory in WASM code,
mapping it to a `Float64Array` it in JavaScript code,
populating it there,
and calling a WASM function to modify it.

To build and run this:

- enter `wat2wasm demo.wat --enable-threads`
- start a local HTTP file server
- browse `localhost:{port}`
