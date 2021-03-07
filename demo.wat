(module
  ;; Using "shared" requires wat2wasm with --enable-threads.
  (import "env" "memory" (memory $mem 3 3 shared))
  (import "env" "cos" (func $cos_fn (param f64) (result f64)))
  (import "env" "sin" (func $sin_fn (param f64) (result f64)))
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
    (local $last_offset i32)

    ;; The starting offset is $start * 16 (8 bytes for x + 8 bytes for y).
    (local.set $offset (i32.mul (local.get $start) (i32.const 16)))

    ;; Determine the offset of the last point
    ;; so we know when to exit the loop below.
    (local.set $last_offset
      (i32.add
        (local.get $offset)
        (i32.mul
          (local.get $length) ;; number of points
          (i32.const 16) ;; 8 bytes for x + 8 bytes for y
        )
      )
    )
    ;;(call $log_i32 (local.get $last_offset))

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
      (br_if 0 (i32.lt_s (local.get $offset) (local.get $last_offset)))
    )
  )

  ;; This adds $delta to the value in linear memory at $offset.
  (func $rotate
    (param $offsetX i32)
    (param $cos f64)
    (param $sin f64)
    (param $constantX f64)
    (param $constantY f64)

    (local $offsetY i32)
    (local $px f64)
    (local $py f64)

    (local.set $offsetY (i32.add (local.get $offsetY) (i32.const 1)))
    (local.set $px (f64.load (local.get $offsetX)))
    (local.set $py (f64.load (local.get $offsetY)))

    (f64.store
      (local.get $offsetX)
      (f64.sub
        (f64.sub
          (f64.mul (local.get $px) (local.get $cos))
          (f64.mul (local.get $py) (local.get $sin))
        )
        (local.get $constantX)
      )
    )

    (f64.store
      (local.get $offsetY)
      (f64.add
        (f64.add
          (f64.mul (local.get $px) (local.get $sin))
          (f64.mul (local.get $py) (local.get $cos))
        )
        (local.get $constantY)
      )
    )
  )

  ;; This rotates $length points by $angle radians about ($centerX, $centerY).
  (func
    (export "rotatePoints")
    (param $start i32)
    (param $length i32)
    (param $radians f64)
    (param $cx f64) ;; center x value
    (param $cy f64) ;; center y value

    (local $offset i32)
    (local $last_offset i32)
    (local $cos f64)
    (local $sin f64)
    (local $constantX f64)
    (local $constantY f64)

    ;; The starting offset is $start * 16 (8 bytes for x + 8 bytes for y).
    (local.set $offset (i32.mul (local.get $start) (i32.const 16)))

    ;; Determine the offset of the last point
    ;; so we know when to exit the loop below.
    (local.set $last_offset
      (i32.add
        (local.get $offset)
        (i32.mul
          (local.get $length) ;; number of points
          (i32.const 16) ;; 8 bytes for x + 8 bytes for y
        )
      )
    )

    (local.set $cos (call $cos_fn (local.get $radians)))
    (local.set $sin (call $sin_fn (local.get $radians)))

    ;; If a current point is (px, py),
    ;; we are rotating it about (cx, cy), and
    ;; the rotated point is (rx, ry) then
    ;; rx = px*cos - py*sin + (cx - cx*cos + cy*sin)
    ;; ry = px*sin + py*cos + (cy - cx*sin - cy*cos)
    ;; The last term in the rx and ry formulas is the same for every point,
    ;; so those are calculated here.
    (local.set $constantX
      (f64.add
        (f64.sub
          (local.get $cx)
          (f64.mul (local.get $cx) (local.get $cos))
        )
        (f64.mul (local.get $cy) (local.get $sin))
      )
    )
    (local.set $constantY
      (f64.sub
        (f64.sub
          (local.get $cy)
          (f64.mul (local.get $cx) (local.get $sin))
        )
        (f64.mul (local.get $cy) (local.get $cos))
      )
    )
    
    (loop
      ;; Translate x value by $dx.
      (call $rotate
        (local.get $offset)
        (local.get $cos)
        (local.get $sin)
        (local.get $constantX)
        (local.get $constantY)
      )

      ;; Advance $offset to get the next point.
      (local.set $offset (i32.add (local.get $offset) (i32.const 16)))

      ;; Branching to depth 0 continues the loop.  Otherwise it exits.
      (br_if 0 (i32.lt_s (local.get $offset) (local.get $last_offset)))
    )
  )
)
