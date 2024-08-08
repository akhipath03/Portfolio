document.addEventListener("DOMContentLoaded", function () {
  // Canvas setup
  const canvas = document.getElementById("background-canvas");
  const ctx = canvas.getContext("2d");
  const resetButton = document.getElementById("reset-particles");
  resetButton.addEventListener("click", resetParticles);

  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.zIndex = "-1";

  // Global variables
  let shapes = [];
  const numShapes = 15;
  const colorSchemes = {
    light: ["#c0c0c0", "#a8a8a8", "#d3d3d3", "#b0b0b0", "#e0e0e0"],
    dark: ["#303030", "#404040", "#505050", "#606060", "#707070"],
  };

  let mouseX = 0;
  let mouseY = 0;
  let scrollY = 0;
  let isMouseDown = false;

  const mousePushStrength = 2.5;
  const shapeSpeed = 0.3;
  const scrollEffect = 0.0015;
  const connectionDistance = 300;
  const minDistance = 70;

  let animationFrameId = null;
  const gradients = {};

  // Utility functions
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function adjustColor(color, amount) {
    return (
      "#" +
      color
        .replace(/^#/, "")
        .replace(/../g, (color) =>
          (
            "0" +
            Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(
              16
            )
          ).substr(-2)
        )
    );
  }

  function createGradient(color) {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 50);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, adjustColor(color, -30));
    return gradient;
  }

  // Perlin noise implementation
  const perlin = {
    gradients: {},
    memory: new Map(),
    rand_vect: function () {
      let theta = Math.random() * 2 * Math.PI;
      return { x: Math.cos(theta), y: Math.sin(theta) };
    },
    dot_prod_grid: function (x, y, vx, vy) {
      let g_vect;
      let d_vect = { x: x - vx, y: y - vy };
      if (this.gradients[[vx, vy]]) {
        g_vect = this.gradients[[vx, vy]];
      } else {
        g_vect = this.rand_vect();
        this.gradients[[vx, vy]] = g_vect;
      }
      return d_vect.x * g_vect.x + d_vect.y * g_vect.y;
    },
    smootherstep: function (x) {
      return 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3;
    },
    interp: function (x, a, b) {
      return a + this.smootherstep(x) * (b - a);
    },
    seed: function () {
      this.gradients = {};
      this.memory.clear();
    },
    get: function (x, y) {
      const key = `${x},${y}`;
      if (this.memory.has(key)) return this.memory.get(key);
      let xf = Math.floor(x);
      let yf = Math.floor(y);
      //interpolate
      let tl = this.dot_prod_grid(x, y, xf, yf);
      let tr = this.dot_prod_grid(x, y, xf + 1, yf);
      let bl = this.dot_prod_grid(x, y, xf, yf + 1);
      let br = this.dot_prod_grid(x, y, xf + 1, yf + 1);
      let xt = this.interp(x - xf, tl, tr);
      let xb = this.interp(x - xf, bl, br);
      let v = this.interp(y - yf, xt, xb);
      this.memory.set(key, v);
      if (this.memory.size > 1000) {
        const firstKey = this.memory.keys().next().value;
        this.memory.delete(firstKey);
      }
      return v;
    },
  };
  perlin.seed();

  // Shape class
  class Shape {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.baseRadius = Math.random() * 30 + 20;
      this.color = colorSchemes[document.body.classList.contains("dark-mode") ? "dark" : "light"][Math.floor(Math.random() * 5)];
      this.rotation = 0;
      this.rotationSpeed = (Math.random() - 0.5) * 0.01;
      this.parallaxFactor = Math.random() * 0.5 + 0.5;
      this.noiseOffsetX = Math.random() * 1000;
      this.noiseOffsetY = Math.random() * 1000;
      this.noiseOffsetRadius = Math.random() * 1000;
      this.noiseStep = 0.02;
      this.morphSpeed = 0.4;
      this.velocity = { x: 0, y: 0 };

      if (!gradients[this.color]) {
        gradients[this.color] = createGradient(this.color);
      }
    }

    update() {
      this.noiseOffsetX += this.noiseStep;
      this.noiseOffsetY += this.noiseStep;
      this.noiseOffsetRadius += this.noiseStep * this.morphSpeed;

      this.x += perlin.get(this.noiseOffsetX, 0) * shapeSpeed;
      this.y += perlin.get(this.noiseOffsetY, 0) * shapeSpeed;
      this.rotation += this.rotationSpeed;

      if (
        this.x < -this.baseRadius ||
        this.x > canvas.width + this.baseRadius
      ) {
        this.reset();
        this.x = this.x < 0 ? canvas.width + this.baseRadius : -this.baseRadius;
      }
      if (
        this.y < -this.baseRadius ||
        this.y > canvas.height + this.baseRadius
      ) {
        this.reset();
        this.y =
          this.y < 0 ? canvas.height + this.baseRadius : -this.baseRadius;
      }

      const dx = this.x - mouseX;
      const dy = this.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = 150;

      if (distance < maxDistance) {
        const force = (maxDistance - distance) / maxDistance;
        const angle = Math.atan2(dy, dx);
        const pushX = Math.cos(angle) * force * mousePushStrength;
        const pushY = Math.sin(angle) * force * mousePushStrength;

        this.x += pushX;
        this.y += pushY;
      }

      this.y += scrollY * scrollEffect * this.parallaxFactor;

      // Apply velocity
      this.x += this.velocity.x;
      this.y += this.velocity.y;

      // Apply friction
      this.velocity.x *= 0.98;
      this.velocity.y *= 0.98;

      // Handle attraction mode (when mouse is held down)
      if (isMouseDown) {
        const dx = this.x - mouseX;
        const dy = this.y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 600; // Increased from 150 to 500
        const maxForce = 0.25; // Increased from 2 to 3 for stronger attraction

        if (distance < maxDistance) {
          const force = Math.min(maxForce, (maxDistance - distance) / maxDistance);
          const angle = Math.atan2(dy, dx);

          this.velocity.x -= Math.cos(angle) * force;
          this.velocity.y -= Math.sin(angle) * force;
        }
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);

      ctx.fillStyle = gradients[this.color];

      ctx.beginPath();
      for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
        const noiseValue = perlin.get(
          this.noiseOffsetRadius + Math.cos(angle),
          this.noiseOffsetRadius + Math.sin(angle)
        );
        const r = this.baseRadius * (1 + noiseValue * 0.1);
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle);
        if (angle === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    handleCollisions(shapes) {
      for (let other of shapes) {
        if (this === other) continue;

        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
          const angle = Math.atan2(dy, dx);
          const pushDistance = (minDistance - distance) / 2;

          this.x += Math.cos(angle) * pushDistance;
          this.y += Math.sin(angle) * pushDistance;
          other.x -= Math.cos(angle) * pushDistance;
          other.y -= Math.sin(angle) * pushDistance;
        }
      }
    }
  }

  // Shape and connection functions
  function createShapes() {
    shapes = [];
    for (let i = 0; i < numShapes; i++) {
      shapes.push(new Shape());
    }
  }

  function drawConnections() {
    ctx.lineWidth = 2;

    for (let i = 0; i < shapes.length; i++) {
      for (let j = i + 1; j < shapes.length; j++) {
        const dx = shapes[i].x - shapes[j].x;
        const dy = shapes[i].y - shapes[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < connectionDistance) {
          const opacity = 1 - distance / connectionDistance;

          if (document.body.classList.contains("dark-mode")) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.3})`;
          } else {
            ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.3})`;
          }

          ctx.beginPath();
          ctx.moveTo(shapes[i].x, shapes[i].y);
          ctx.lineTo(shapes[j].x, shapes[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function updateShapes() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawConnections();

    for (let i = 0; i < shapes.length; i++) {
      shapes[i].handleCollisions(shapes.slice(i + 1));
    }

    shapes.forEach((shape) => {
      shape.update();
      shape.draw();
    });

    animationFrameId = requestAnimationFrame(updateShapes);
  }

  function resetParticles() {
    shapes.forEach(shape => shape.reset());
    perlin.seed();
  }

  // Event listeners
  function updateMousePosition(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
  }

  document.addEventListener("mousemove", updateMousePosition);
  document.addEventListener("mousedown", () => isMouseDown = true);
  document.addEventListener("mouseup", () => isMouseDown = false);

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      resizeCanvas();
    }, 250);
  });

  window.addEventListener("scroll", () => {
    const newScrollY = window.pageYOffset;
    scrollY = newScrollY - scrollY;
  });

  const existingToggleSwitch = document.querySelector(
    '.theme-switch input[type="checkbox"]'
  );
  existingToggleSwitch.addEventListener("change", () => {
    const mode = document.body.classList.contains("dark-mode")
      ? "dark"
      : "light";
    shapes.forEach((shape) => {
      shape.color = colorSchemes[mode][Math.floor(Math.random() * 5)];
      if (!gradients[shape.color]) {
        gradients[shape.color] = createGradient(shape.color);
      }
    });
  });

  // Initialization
  resizeCanvas();
  createShapes();

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  updateShapes();
});