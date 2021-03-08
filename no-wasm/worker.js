let array;
let rotatePoints;
let translatePoints;

async function rotate(start, length, radians, center) {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const constantX = center.x - center.x * cos + center.y * sin;
  const constantY = center.y - center.x * sin - center.y * cos;

  for (let i = start; i < start + length; i++) {
    const index = i * 2;
    const x = array[index];
    const y = array[index + 1];
    array[index] = x * cos - y * sin + constantX;
    array[index + 1] = x * sin + y * cos + constantY;
  }

  postMessage('ran');
}

onmessage = event => {
  const {data} = event;
  const {command} = data;
  if (command === 'initialize') {
    array = new Float64Array(data.sharedArrayBuffer);
    postMessage('initialized');
  } else if (command === 'rotate') {
    rotate(data.start, data.length, data.radians, data.center);
  } else if (command === 'translate') {
    translate(data.start, data.length, data.dx, data.dy);
  } else {
    console.error('worker.js unsupported command:', command);
  }
};
