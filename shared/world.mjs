// Shared arena geometry. Both the renderer and authoritative server use these bounds.
export const HALF = 24;
export const SPAWNS = [
  [-18,-17], [18,17], [-18,17], [18,-17],
  [0,-18], [0,18], [-18,0], [18,0]
];
// x, z, width, depth, height — all grounded obstacles are server-side collisions.
export const BLOCKERS = [
  [-9,-7, 7,3,3.3], [10,7, 7,3,3.3],
  [7,-11, 3,8,3.8], [-7,11, 3,8,3.8],
  [0,0, 5,5,4.4],
  [-16,3, 3,6,3.0], [16,-3,3,6,3.0],
  [-2,-15, 5,2.5,2.6], [2,15,5,2.5,2.6],
  [-14,-14, 2,2,3.8], [14,14,2,2,3.8],
  [-14,14,2,2,3.8], [14,-14,2,2,3.8]
];
export function canOccupy(x,z,r=0.48) {
  if (x < -HALF + 1.6 + r || x > HALF - 1.6 - r || z < -HALF + 1.6 + r || z > HALF - 1.6 - r) return false;
  for (const [bx,bz,w,d] of BLOCKERS) {
    if (x+r > bx-w/2 && x-r < bx+w/2 && z+r > bz-d/2 && z-r < bz+d/2) return false;
  }
  return true;
}
