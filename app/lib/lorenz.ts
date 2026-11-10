// Lorenz's convection model with sigma = 10, rho = 28, beta = 8/3.
// https://cdanfort.w3.uvm.edu/research/lorenz-1963.pdf
export const LORENZ_STEP = 0.008;

// Drawn points are shifted down by this much so the figure rotates about its middle.
export const LORENZ_CENTRE = 25;

type State = readonly [number, number, number];

function derivative(x: number, y: number, z: number) {
  return [
    10 * (y - x),
    x * (28 - z) - y,
    x * y - (8 / 3) * z,
  ];
}

/** One fourth-order Runge–Kutta step. */
export function stepLorenz([x, y, z]: State, step = LORENZ_STEP): [number, number, number] {
  const a = derivative(x, y, z);
  const b = derivative(x + a[0] * step / 2, y + a[1] * step / 2, z + a[2] * step / 2);
  const c = derivative(x + b[0] * step / 2, y + b[1] * step / 2, z + b[2] * step / 2);
  const d = derivative(x + c[0] * step, y + c[1] * step, z + c[2] * step);

  return [
    x + step * (a[0] + 2 * b[0] + 2 * c[0] + d[0]) / 6,
    y + step * (a[1] + 2 * b[1] + 2 * c[1] + d[1]) / 6,
    z + step * (a[2] + 2 * b[2] + 2 * c[2] + d[2]) / 6,
  ];
}

export function createLorenzPoints(count = 5600) {
  const points = new Float32Array(count * 3);
  let state: [number, number, number] = [0.1, 0, 0];

  // The first thousand steps carry the path from its starting point onto the attractor.
  for (let index = -1000; index < count; index++) {
    state = stepLorenz(state);

    if (index >= 0) {
      points[index * 3] = state[0];
      points[index * 3 + 1] = state[1];
      points[index * 3 + 2] = state[2] - LORENZ_CENTRE;
    }
  }

  return points;
}
