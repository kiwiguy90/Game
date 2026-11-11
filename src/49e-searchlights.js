/* ==========================================================================
   BLACKTHORN MANOR — 6m. THE SEARCHLIGHTS
   On the battlements of the four corner towers, a searchlight each: a big
   drum lamp on a yoke, throwing a long pale beam up into the rain that
   sweeps slowly across the sky. From the lane, miles off in the forest,
   they are the first thing you see of the house when the floodlights go on.
   ========================================================================== */
(function () {
'use strict';
const BM = window.BM;
const G = BM.G;
const LEN = 95;

function beamMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { level: { value: 0 }, time: { value: 0 } },
    vertexShader: 'varying float vZ; varying vec3 vN; varying vec3 vV; void main(){ vZ = position.y / ' + LEN.toFixed(1) + '; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: [
      'uniform float level; uniform float time; varying float vZ; varying vec3 vN; varying vec3 vV;',
      'void main(){',
      '  float edge = pow(abs(dot(vN, vV)), 1.6);',                            // brightest through the middle of the beam
      '  float fall = pow(clamp(1.0 - vZ, 0.0, 1.0), 1.7);',                    // fading with distance
      '  float rain = 0.85 + 0.15 * sin(vZ * 140.0 - time * 9.0);',              // the rain drifting through it
      '  gl_FragColor = vec4(vec3(0.82, 0.88, 1.0) * edge * fall * rain * level * 0.22, 1.0);',
      '}',
    ].join('\n'),
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
}

BM.buildSearchlights = function (B, game) {
  B.zone = 'exterior'; B.levelName = 'ground'; B.room = 'grounds';
  const beamGeo = new THREE.CylinderGeometry(5.5, 0.32, LEN, 24, 1, true); beamGeo.translate(0, LEN / 2, 0);
  beamGeo.userData.canonical = 'fitting:searchbeam';
  const towers = game.towers || [[-21, 15], [21, 15], [-21, -15], [21, -15]];
  const H = 24.6;
  game.searchlights = towers.map(([tx, tz], i) => {
    const out = Math.atan2(tx, tz), R = 2.8;
    const x = tx + Math.sin(out) * R, z = tz + Math.cos(out) * R;
    // the mount: a plinth on the battlements, a yoke that turns, a drum that tilts
    B.box('metalDark', x, H + 0.15, z, 0.7, 0.3, 0.7);
    const yaw = new THREE.Group(); yaw.position.set(x, H + 0.3, z); B.root.add(yaw);
    for (const s of [-1, 1]) B.box('metalDark', s * 0.42, 0.45, 0, 0.08, 0.9, 0.16, 0, yaw);
    const tilt = new THREE.Group(); tilt.position.set(0, 0.75, 0); yaw.add(tilt);
    B.mesh(G.cyl, 'metalDark', 0, 0, 0, 0.75, 0.9, 0.75, 0, tilt).rotation.x = Math.PI / 2; tilt.children[tilt.children.length - 1].updateMatrix();
    B.mesh(G.ring, 'brass', 0, 0, 0.46, 0.85, 0.85, 0.85, 0, tilt);
    const lens = B.mesh(G.disc, new THREE.MeshBasicMaterial({ color: 0x181a1c }), 0, 0, 0.47, 0.68, 0.68, 1, 0, tilt);
    const beam = new THREE.Mesh(beamGeo, beamMaterial()); beam.rotation.x = Math.PI / 2; beam.position.z = 0.4; beam.frustumCulled = false; beam.renderOrder = 7; tilt.add(beam);
    for (const o of [yaw]) o.traverse(m => { m.userData.dynamic = true; m.matrixAutoUpdate = true; });
    const light = B.fixture({ id: 'searchlight-' + i, name: 'Tower searchlight', circuit: 'lodge', on: false, chain: 'estate:flood', kind: 'incandescent', style: 'none', pos: [x, H + 1.05, z], colour: 0xdfe8ff, target: 1.4, range: 16, corona: 1.4 });
    game.estateLights.flood.push(light.id);
    return { yaw, tilt, beam, lens, light, base: out, phase: i * 1.7 };
  });
};

BM.updateSearchlights = function (game, dt, t) {
  const S = game.searchlights; if (!S) return;
  for (const s of S) {
    const l = s.light, k = l.target > 0 ? Math.min(1.2, l.intensity / l.target) : 0;
    s.beam.visible = k > 0.01;
    s.beam.material.uniforms.level.value = k; s.beam.material.uniforms.time.value = t;
    s.lens.material.color.setRGB(0.09 + 0.91 * k, 0.1 + 0.9 * k, 0.11 + 0.89 * k);
    // a slow sweep out over the grounds, rising and falling
    s.yaw.rotation.y = s.base + Math.sin(t * 0.11 + s.phase) * 1.1;
    s.tilt.rotation.x = -(0.55 + 0.25 * Math.sin(t * 0.07 + s.phase * 1.3));
  }
};
})();
