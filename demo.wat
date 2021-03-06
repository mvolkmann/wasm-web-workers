(module
  ;; Using "shared" requires wat2wasm with --enable-threads.
  (import "env" "memory" (memory $mem 1 2 shared))
  (import "env" "log_i32" (func $log_i32 (param i32)))
  (import "env" "log_f64" (func $log_f64 (param f64)))

  ;; This adds $delta to the value in linear memory at $offset.
  (func $translate (param $offset i32) (param $delta f64)
    ;;(call $log_i32 (local.get $offset))
    (f64.store
      (local.get $offset)
      (f64.add
        (f64.load (local.get $offset))
        (local.get $delta)
      )
    )
  )

  ;; This translates $length points by the $dx and $dy values.
  (func
    (export "translatePoints")
    (param $start i32)
    (param $length i32)
    (param $dx f64)
    (param $dy f64)

    (local $offset i32)
    (local $lastOffset i32)

    ;; The starting offset is $start * 16 (8 bytes for x + 8 bytes for y).
    (local.set $offset (i32.mul (local.get $start) (i32.const 16)))

    ;; Determine the offset of the last point
    ;; so we know when to exit the loop below.
    (local.set $lastOffset
      (i32.add
        (local.get $offset)
        (i32.mul
          (local.get $length) ;; number of points
          (i32.const 16) ;; 8 bytes for x + 8 bytes for y
        )
      )
    )
    ;;(call $log_i32 (local.get $lastOffset))

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
