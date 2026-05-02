// Lightweight world-map backdrop drawn as SVG paths over an equirectangular projection.
// Coordinates are normalized 0..1 to match HUBS positions in src/lib/sim/network.ts.
// We approximate continents with simple polygons — enough to give a clear "world" feel
// without bundling a heavy GeoJSON file.

const CONTINENTS: { name: string; points: [number, number][] }[] = [
  // North America
  { name: "NA", points: [
    [-168, 65],[-150, 70],[-130, 70],[-95, 80],[-70, 75],[-55, 60],[-60, 50],
    [-65, 45],[-75, 35],[-82, 25],[-98, 18],[-110, 23],[-117, 32],[-125, 40],
    [-130, 50],[-145, 60],[-168, 65],
  ]},
  // Central America
  { name: "CA", points: [
    [-105, 22],[-95, 18],[-83, 8],[-77, 8],[-78, 14],[-90, 17],[-100, 22],[-105, 22],
  ]},
  // South America
  { name: "SA", points: [
    [-78, 12],[-70, 8],[-50, 5],[-35, -5],[-35, -25],[-55, -55],[-72, -55],
    [-78, -30],[-80, -10],[-78, 12],
  ]},
  // Europe
  { name: "EU", points: [
    [-10, 60],[5, 70],[30, 72],[50, 65],[40, 50],[28, 38],[15, 36],[0, 38],
    [-10, 43],[-12, 52],[-10, 60],
  ]},
  // Africa
  { name: "AF", points: [
    [-18, 32],[-5, 36],[12, 32],[35, 30],[42, 12],[48, -2],[42, -18],[30, -34],
    [18, -34],[8, -20],[-5, 0],[-15, 12],[-18, 32],
  ]},
  // Middle East / West Asia
  { name: "ME", points: [
    [30, 42],[55, 40],[60, 30],[55, 18],[44, 12],[36, 16],[33, 28],[30, 42],
  ]},
  // Asia (mainland)
  { name: "AS", points: [
    [50, 70],[100, 75],[140, 70],[145, 55],[135, 45],[140, 35],[125, 25],[105, 22],
    [95, 18],[85, 22],[78, 8],[70, 22],[60, 30],[55, 40],[50, 50],[50, 70],
  ]},
  // SE Asia / Indonesia (rough cluster)
  { name: "SEA", points: [
    [95, 5],[110, 6],[120, 0],[135, -3],[140, -8],[120, -10],[105, -8],[95, 5],
  ]},
  // Australia
  { name: "AU", points: [
    [113, -22],[130, -12],[145, -12],[154, -28],[148, -38],[130, -34],[115, -34],[113, -22],
  ]},
];

const W = 1000;
const H = 560;

function project(lon: number, lat: number): [number, number] {
  const x = ((lon + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return [x, y];
}

function pointsToPath(points: [number, number][]): string {
  return points.map((p, i) => {
    const [x, y] = project(p[0], p[1]);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ") + " Z";
}

export function WorldBackdrop() {
  return (
    <g aria-hidden>
      {CONTINENTS.map(c => (
        <path
          key={c.name}
          d={pointsToPath(c.points)}
          fill="hsl(var(--muted))"
          fillOpacity={0.35}
          stroke="hsl(var(--border))"
          strokeWidth={0.8}
          strokeOpacity={0.6}
        />
      ))}
      {/* Equator + meridians for vibe */}
      <line x1={0} y1={H/2} x2={W} y2={H/2}
        stroke="hsl(var(--border))" strokeOpacity={0.2} strokeDasharray="2 6" />
      <line x1={W/2} y1={0} x2={W/2} y2={H}
        stroke="hsl(var(--border))" strokeOpacity={0.2} strokeDasharray="2 6" />
    </g>
  );
}