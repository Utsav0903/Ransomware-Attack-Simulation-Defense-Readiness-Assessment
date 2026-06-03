/* ─────────────────────────────────────────────────────────────
   GLOBE.JS — Multicolor Cinematic SOC Globe
   - Region-colored nodes (every dot clearly visible)
   - Vivid multicolor atmosphere
   - Bright nebula star clusters
   - 8-color attack arcs
───────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  function init() {
    if (typeof THREE === 'undefined') { console.error('[Globe] THREE not loaded'); return; }
    if (typeof THREE.OrbitControls === 'undefined') { console.error('[Globe] OrbitControls missing'); return; }

    var el = document.getElementById('globe-canvas');
    if (!el) { console.error('[Globe] #globe-canvas missing'); return; }

    function W() { return el.clientWidth  || 600; }
    function H() { return el.clientHeight || 600; }

    // ── Scene ──────────────────────────────────────────────────
    var scene  = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(40, W() / H(), 0.1, 1000);
    camera.position.set(0, 0, 9.0);

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W(), H());
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;border-radius:inherit;';
    el.appendChild(renderer.domElement);

    // ── Controls ───────────────────────────────────────────────
    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false; controls.enablePan = false;
    controls.enableDamping = true; controls.dampingFactor = 0.05;
    controls.autoRotate = true; controls.autoRotateSpeed = 0.28;
    controls.minPolarAngle = 0.25; controls.maxPolarAngle = Math.PI - 0.25;

    // ── Lights ─────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x1a2050, 1.8));
    var sun = new THREE.DirectionalLight(0xfff0dd, 2.2);
    sun.position.set(12, 7, 10); scene.add(sun);
    var rim1 = new THREE.PointLight(0x6020ff, 1.0, 80);
    rim1.position.set(-10, 4, -8); scene.add(rim1);
    var rim2 = new THREE.PointLight(0x00ffcc, 0.4, 60);
    rim2.position.set(8, -5, 6); scene.add(rim2);

    // ── Stars ─────────────────────────────────────────────────
    // Main starfield — 6000 stars
    var SC = 6000, sp = new Float32Array(SC*3), sc = new Float32Array(SC*3);
    for (var i = 0; i < SC; i++) {
      var r = 82+Math.random()*18, t = Math.random()*Math.PI*2, p = Math.acos(2*Math.random()-1);
      sp[i*3] = r*Math.sin(p)*Math.cos(t); sp[i*3+1] = r*Math.cos(p); sp[i*3+2] = r*Math.sin(p)*Math.sin(t);
      var b = 0.50+Math.random()*0.50, x = Math.random();
      if      (x > 0.90) { sc[i*3]=b;      sc[i*3+1]=b*0.72; sc[i*3+2]=b*0.48; } // warm
      else if (x > 0.78) { sc[i*3]=b*0.60; sc[i*3+1]=b*0.78; sc[i*3+2]=b;      } // cool blue
      else if (x > 0.70) { sc[i*3]=b*0.80; sc[i*3+1]=b*0.55; sc[i*3+2]=b;      } // purple
      else               { sc[i*3]=b;      sc[i*3+1]=b;      sc[i*3+2]=b;      } // white
    }
    var sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    sg.setAttribute('color',    new THREE.BufferAttribute(sc, 3));
    var stars = new THREE.Points(sg, new THREE.PointsMaterial({
      size:0.16, vertexColors:true, transparent:true, opacity:0.90,
      blending:THREE.AdditiveBlending, depthWrite:false, sizeAttenuation:true,
    }));
    scene.add(stars);

    // Bright accent stars — 80 larger bright dots
    var BS = 80, bp = new Float32Array(BS*3), bc = new Float32Array(BS*3);
    var BPAL = [[1,0.9,0.6],[0.6,0.8,1],[0.9,0.6,1],[0.6,1,0.9]];
    for (var i = 0; i < BS; i++) {
      var r=83+Math.random()*16, t=Math.random()*Math.PI*2, p=Math.acos(2*Math.random()-1);
      bp[i*3]=r*Math.sin(p)*Math.cos(t); bp[i*3+1]=r*Math.cos(p); bp[i*3+2]=r*Math.sin(p)*Math.sin(t);
      var col = BPAL[Math.floor(Math.random()*BPAL.length)];
      bc[i*3]=col[0]; bc[i*3+1]=col[1]; bc[i*3+2]=col[2];
    }
    var bsg = new THREE.BufferGeometry();
    bsg.setAttribute('position', new THREE.BufferAttribute(bp, 3));
    bsg.setAttribute('color',    new THREE.BufferAttribute(bc, 3));
    scene.add(new THREE.Points(bsg, new THREE.PointsMaterial({
      size:0.35, vertexColors:true, transparent:true, opacity:0.95,
      blending:THREE.AdditiveBlending, depthWrite:false, sizeAttenuation:true,
    })));

    // Nebula cluster — purple/blue dust band
    var NC = 1800, np = new Float32Array(NC*3);
    for (var i = 0; i < NC; i++) {
      var r=76+Math.random()*9, gt=Math.random()*Math.PI*2, gp=Math.PI/2+(Math.random()-0.5)*0.30;
      np[i*3]=r*Math.sin(gp)*Math.cos(gt); np[i*3+1]=r*Math.cos(gp); np[i*3+2]=r*Math.sin(gp)*Math.sin(gt);
    }
    var ng = new THREE.BufferGeometry(); ng.setAttribute('position', new THREE.BufferAttribute(np,3));
    scene.add(new THREE.Points(ng, new THREE.PointsMaterial({
      size:0.10, color:0x8866ee, transparent:true, opacity:0.22,
      blending:THREE.AdditiveBlending, depthWrite:false,
    })));

    // ── Earth ──────────────────────────────────────────────────
    var ER = 3.0, tl = new THREE.TextureLoader();
    var onErr = function(u){ console.warn('[Globe] Missing:', u); };

    var earth = new THREE.Mesh(
      new THREE.SphereGeometry(ER, 64, 64),
      new THREE.MeshPhongMaterial({
        map:               tl.load('/static/assets/earth.jpg',        undefined, undefined, onErr),
        emissiveMap:       tl.load('/static/assets/earth_lights.png', undefined, undefined, onErr),
        emissive:          new THREE.Color(0xff9922),
        emissiveIntensity: 0.80,
        shininess: 10, specular: new THREE.Color(0x0a1838),
      })
    );
    scene.add(earth);

    var clouds = new THREE.Mesh(
      new THREE.SphereGeometry(ER+0.07, 48, 48),
      new THREE.MeshPhongMaterial({
        map: tl.load('/static/assets/earth_clouds.png', undefined, undefined, onErr),
        transparent:true, opacity:0.28, depthWrite:false,
      })
    );
    scene.add(clouds);

    // ── Atmosphere — multicolor layers ─────────────────────────
    [
      { r:ER+0.40, c:0x0010aa, o:0.048 },  // deep blue
      { r:ER+0.26, c:0x1133ee, o:0.055 },  // blue
      { r:ER+0.15, c:0x4400cc, o:0.042 },  // purple tint
      { r:ER+0.08, c:0x22aaff, o:0.050 },  // cyan glow
      { r:ER+0.03, c:0x66ffdd, o:0.030 },  // teal rim
    ].forEach(function(l){
      scene.add(new THREE.Mesh(
        new THREE.SphereGeometry(l.r, 32, 32),
        new THREE.MeshBasicMaterial({ color:l.c, transparent:true, opacity:l.o,
          side:THREE.BackSide, blending:THREE.AdditiveBlending, depthWrite:false })
      ));
    });

    // ── Grid lines ─────────────────────────────────────────────
    var gm = new THREE.LineBasicMaterial({ color:0x1a3a7a, transparent:true, opacity:0.22,
      blending:THREE.AdditiveBlending, depthWrite:false });
    var GR = ER + 0.01;
    for (var lat = -60; lat <= 60; lat += 30) {
      var phi = (90-lat)*Math.PI/180, pts = [];
      for (var s=0;s<=48;s++){ var a=(s/48)*Math.PI*2;
        pts.push(new THREE.Vector3(-GR*Math.sin(phi)*Math.cos(a),GR*Math.cos(phi),GR*Math.sin(phi)*Math.sin(a))); }
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gm));
    }
    var eqM = new THREE.LineBasicMaterial({ color:0x4455cc, transparent:true, opacity:0.40,
      blending:THREE.AdditiveBlending, depthWrite:false });
    var eqPts = [];
    for (var s=0;s<=64;s++){ var a=(s/64)*Math.PI*2;
      eqPts.push(new THREE.Vector3(-GR*Math.cos(a),0,GR*Math.sin(a))); }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(eqPts), eqM));
    for (var lng=0; lng<360; lng+=30) {
      var th=(lng+180)*Math.PI/180, mpts=[];
      for (var s=0;s<=32;s++){ var p2=(s/32)*Math.PI;
        mpts.push(new THREE.Vector3(-GR*Math.sin(p2)*Math.cos(th),GR*Math.cos(p2),GR*Math.sin(p2)*Math.sin(th))); }
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(mpts), gm));
    }

    // ── lat/lng helper ─────────────────────────────────────────
    function ll(la, lo, r) {
      var ph=(90-la)*Math.PI/180, th=(lo+180)*Math.PI/180;
      return new THREE.Vector3(-r*Math.sin(ph)*Math.cos(th), r*Math.cos(ph), r*Math.sin(ph)*Math.sin(th));
    }

    // ── Nodes — each country has its own region color ──────────
    var NR = ER + 0.10;
    var NODES = [
      // [lat, lng, dotColor, ringColor, name]
      [38,  -97,  0x00aaff, 0x0066cc, 'USA'        ],
      [62,   100, 0xff3344, 0xcc1122, 'Russia'      ],
      [36,   104, 0xffcc00, 0xcc9900, 'China'       ],
      [52,   -1,  0x00ff88, 0x00cc66, 'UK'          ],
      [22,   78,  0xff8800, 0xcc6600, 'India'       ],
      [-14, -52,  0x00ffff, 0x00aacc, 'Brazil'      ],
      [-25,  134, 0x88ff00, 0x66cc00, 'Australia'   ],
      [51,   10,  0xaa44ff, 0x8822ee, 'Germany'     ],
      [36,   138, 0xff44aa, 0xcc2288, 'Japan'       ],
      [37,   127, 0x44ffee, 0x22ccbb, 'SouthKorea'  ],
      [46,   2,   0xff6688, 0xcc3355, 'France'      ],
      [60,  -95,  0x44ccff, 0x2299dd, 'Canada'      ],
      [-29,  25,  0xffaa44, 0xcc8822, 'SouthAfrica' ],
      [24, -102,  0xff3388, 0xcc1166, 'Mexico'      ],
      [49,   32,  0x6688ff, 0x4455dd, 'Ukraine'     ],
      [1,   104,  0x00ffcc, 0x00ccaa, 'Singapore'   ],
      [24,   54,  0xffdd00, 0xccaa00, 'UAE'         ],
      [55,   37,  0xff4444, 0xcc2222, 'Moscow'      ],
      [40,  116,  0xffcc44, 0xccaa22, 'Beijing'     ],
      [19,   73,  0xff7722, 0xcc5500, 'Mumbai'      ],
      [41,   29,  0x22ddff, 0x00aacc, 'Istanbul'    ],
      [-34, -58,  0x88ffaa, 0x55dd88, 'BuenosAires' ],
    ];

    var nodeObjs = NODES.map(function (n) {
      var pos = ll(n[0], n[1], NR);

      // Core dot — larger & colored
      var dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.052, 10, 10),
        new THREE.MeshBasicMaterial({ color:n[2], transparent:true, opacity:0.98,
          blending:THREE.AdditiveBlending, depthWrite:false })
      );
      dot.position.copy(pos); scene.add(dot);

      // Inner ring
      var ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.090, 0.010, 8, 28),
        new THREE.MeshBasicMaterial({ color:n[3], transparent:true, opacity:0.72,
          blending:THREE.AdditiveBlending, depthWrite:false })
      );
      ring.position.copy(pos); ring.lookAt(0,0,0); scene.add(ring);

      // Outer ring
      var ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(0.145, 0.007, 6, 28),
        new THREE.MeshBasicMaterial({ color:n[2], transparent:true, opacity:0.30,
          blending:THREE.AdditiveBlending, depthWrite:false })
      );
      ring2.position.copy(pos); ring2.lookAt(0,0,0); scene.add(ring2);

      // Glow halo — small sphere slightly above surface
      var halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.080, 8, 8),
        new THREE.MeshBasicMaterial({ color:n[2], transparent:true, opacity:0.15,
          blending:THREE.AdditiveBlending, depthWrite:false })
      );
      halo.position.copy(pos); scene.add(halo);

      return { dot:dot, ring:ring, ring2:ring2, halo:halo,
               pos:pos, phase:Math.random()*Math.PI*2,
               dotColor:n[2] };
    });

    // ── Attack arcs — 8 colors ─────────────────────────────────
    var ARCS = [], MAX_ARCS = 7, ARC_R = ER + 0.10;
    var PAL  = [0x00aaff,0x00ffcc,0xff2255,0xaa33ff,0x00eeff,0xffaa00,0xff44aa,0x44ff88];

    function makeArc(ai, bi) {
      var from = ll(NODES[ai][0], NODES[ai][1], ARC_R);
      var to   = ll(NODES[bi][0], NODES[bi][1], ARC_R);
      var mid  = from.clone().add(to).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(ARC_R + Math.max(from.distanceTo(to)*0.54, 1.3) + 0.5);
      var curve = new THREE.QuadraticBezierCurve3(from, mid, to);
      var color = PAL[Math.floor(Math.random()*PAL.length)];

      // Main arc line
      var line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve.getPoints(90)),
        new THREE.LineBasicMaterial({ color:color, transparent:true, opacity:0,
          blending:THREE.AdditiveBlending, depthWrite:false })
      );
      scene.add(line);

      // Glow duplicate (thicker appearance)
      var glow = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve.getPoints(60)),
        new THREE.LineBasicMaterial({ color:color, transparent:true, opacity:0,
          blending:THREE.AdditiveBlending, depthWrite:false })
      );
      scene.add(glow);

      // Particles — 3 per arc
      var particles = [0, 0.33, 0.66].map(function(offset){
        var m = new THREE.Mesh(
          new THREE.SphereGeometry(0.032, 6, 6),
          new THREE.MeshBasicMaterial({ color:color, transparent:true, opacity:0,
            blending:THREE.AdditiveBlending, depthWrite:false })
        );
        scene.add(m);
        return { mesh:m, offset:offset };
      });

      // Impact flash
      var flash = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 10, 10),
        new THREE.MeshBasicMaterial({ color:color, transparent:true, opacity:0,
          blending:THREE.AdditiveBlending, depthWrite:false })
      );
      flash.position.copy(to); scene.add(flash);

      return { line:line, glow:glow, particles:particles, flash:flash,
               curve:curve, life:0, duration:4.0+Math.random()*2.5 };
    }

    function spawn() {
      if (ARCS.length >= MAX_ARCS) return;
      var a = Math.floor(Math.random()*NODES.length), b;
      do { b = Math.floor(Math.random()*NODES.length); } while (b===a);
      ARCS.push(makeArc(a, b));
    }
    for (var si=0; si<MAX_ARCS; si++){ (function(d){setTimeout(spawn,d);})(si*650); }
    setInterval(function(){ if(ARCS.length<MAX_ARCS) spawn(); }, 1100);

    // ── Animate ────────────────────────────────────────────────
    var clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      var dt = clock.getDelta(), t = clock.getElapsedTime();

      stars.rotation.y  += 0.000013;
      clouds.rotation.y += 0.00019;

      // Node pulse — each dot clearly visible with its color
      nodeObjs.forEach(function (n) {
        // Pulsing inner ring scale
        var p = 0.65 + 0.55 * Math.abs(Math.sin(t * 1.4 + n.phase));
        n.ring.scale.setScalar(p);
        n.ring.material.opacity = 0.72 * (1 - (p-0.65)/0.55) + 0.12;
        n.ring.lookAt(0,0,0);

        // Outer ring slow rotation
        var p2 = 0.80 + 0.60 * Math.abs(Math.sin(t * 0.85 + n.phase + 1.2));
        n.ring2.scale.setScalar(p2);
        n.ring2.material.opacity = 0.30 * (1 - (p2-0.80)/0.60) + 0.05;
        n.ring2.lookAt(0,0,0);

        // Dot brightness pulse — always clearly visible
        n.dot.material.opacity = 0.80 + 0.20 * Math.sin(t * 2.2 + n.phase);

        // Halo breathe
        n.halo.material.opacity = 0.10 + 0.12 * Math.abs(Math.sin(t * 1.4 + n.phase));
        n.halo.scale.setScalar(1 + 0.5 * Math.abs(Math.sin(t * 1.4 + n.phase)));
      });

      // Arc animation
      for (var i = ARCS.length-1; i >= 0; i--) {
        var arc = ARCS[i]; arc.life += dt;
        var prog = arc.life / arc.duration;
        var fade = prog<0.12 ? prog/0.12 : prog>0.82 ? (1-prog)/0.18 : 1.0;
        fade = Math.max(0, Math.min(1, fade));

        arc.line.material.opacity = fade * 0.82;
        arc.glow.material.opacity = fade * 0.28;  // softer glow copy

        arc.particles.forEach(function (p) {
          var param = (prog + p.offset) % 1.0;
          p.mesh.position.copy(arc.curve.getPoint(Math.min(param, 1.0)));
          p.mesh.material.opacity = fade * 0.98;
          p.mesh.scale.setScalar(1 + 1.1*Math.max(0, 1 - Math.abs(param-prog)*24));
        });

        if (prog > 0.82) {
          var ff = (prog-0.82)/0.18;
          arc.flash.material.opacity = ff * 0.60 * fade;
          arc.flash.scale.setScalar(1 + 2.5*ff*Math.abs(Math.sin(t*20)));
        }

        if (arc.life >= arc.duration) {
          scene.remove(arc.line); scene.remove(arc.glow); scene.remove(arc.flash);
          arc.particles.forEach(function(p){ scene.remove(p.mesh); });
          ARCS.splice(i, 1);
        }
      }

      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // ── Resize ─────────────────────────────────────────────────
    function onResize() {
      camera.aspect = W()/H();
      camera.updateProjectionMatrix();
      renderer.setSize(W(), H());
    }
    window.addEventListener('resize', onResize);
    setTimeout(onResize, 150);
    setTimeout(onResize, 800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();