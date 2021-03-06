(module
  ;; Using "shared" requires wat2wasm with --enable-threads.
  (import "env" "memory" (memory $mem 1 2 shared))

  ;; This adds $delta to the value in linear memory at $offset.
  (func $translate (param $offset i32) (param $delta f64)
    (f64.store
      (local.get $offset)
      (f64.add
        (f64.load (local.get $offset))
        (local.get $delta)
      )
    )
  )

  ;; This translates $length points by the $dx and $dy values.
  (func (export "translatePoints") (param $length i32) (param $dx f64) (param $dy f64)
    (local $offset i32) ;; starts at zero

    ;; Determine the offset of the last point
    ;; so we know when to exit the loop below.
    (local $lastOffset i32)
    (local.set $lastOffset
      (i32.mul
        (local.get $length) ;; number of points
        (i32.const 16) ;; 8 bytes for x + 8 bytes for y
      )
    )

    (loop
      ;; Translate x value by $dx.
      (call $translate (local.get $offset) (local.get $dx))

      ;; Advance $offset to get the next y value.
      (local.set $offset (i32.add (local.get $offset) (i32.const 8)))

      ;; Translate y value by $dy.
      (call $translate (local.get $offset) (local.get $dy))

      ;; Advance $offset to get the next x value.
      (local.set $offset (i32.add (local.get $offset) (i32.const 8)))

      ;; Branching to depth 0 continues the loop.  Otherwise it exits.
      (br_if 0 (i32.lt_s (local.get $offset) (local.get $lastOffset)))
    )
  )
)
