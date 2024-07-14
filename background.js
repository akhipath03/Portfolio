document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("background-canvas");
  const ctx = canvas.getContext("2d");

  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.zIndex = "-1";

  let shapes = [];
  const numShapes = 15;
  const colorSchemes = {
    light: ["#c0c0c0", "#a8a8a8", "#d3d3d3", "#b0b0b0", "#e0e0e0"],
    dark: ["#303030", "#404040", "#505050", "#606060", "#707070"],
  };

  let mouseX = 0;
  let mouseY = 0;
  let scrollY = 0;

  const mousePushStrength = 1;
  const shapeSpeed = 0.5;
  const scrollEffect = 0.003;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createShapes();
  }

  // Perlin noise implementation
  const perlin = {
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
      this.memory = {};
    },
    get: function (x, y) {
      if (this.memory.hasOwnProperty([x, y])) return this.memory[[x, y]];
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
      this.memory[[x, y]] = v;
      return v;
    },
  };
  perlin.seed();

  class Shape {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.baseRadius = Math.random() * 30 + 20;
      this.color =
        colorSchemes[
          document.body.classList.contains("dark-mode") ? "dark" : "light"
        ][Math.floor(Math.random() * 5)];
      this.rotation = 0;
      this.rotationSpeed = (Math.random() - 0.5) * 0.01;
      this.parallaxFactor = Math.random() * 0.5 + 0.5;
      this.noiseOffsetX = Math.random() * 1000;
      this.noiseOffsetY = Math.random() * 1000;
      this.noiseOffsetRadius = Math.random() * 1000;
      this.noiseStep = 0.02; // Increase this value (was 0.005)
      this.morphSpeed = 0.4; // Add this new property
    }

    update() {
      this.noiseOffsetX += this.noiseStep;
      this.noiseOffsetY += this.noiseStep;
      this.noiseOffsetRadius += this.noiseStep * this.morphSpeed; // Modify this line

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
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.baseRadius);
      gradient.addColorStop(0, this.color);
      gradient.addColorStop(0.7, this.color);
      gradient.addColorStop(1, adjustColor(this.color, -30));

      ctx.fillStyle = gradient;

      ctx.beginPath();
      for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
        const noiseValue = perlin.get(
          this.noiseOffsetRadius + Math.cos(angle),
          this.noiseOffsetRadius + Math.sin(angle)
        );
        const r = this.baseRadius * (1 + noiseValue * 0.1); // Increase this multiplier (was 0.2)
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

      ctx.save();
      ctx.clip();
      const highlightGradient = ctx.createLinearGradient(
        -this.baseRadius,
        -this.baseRadius,
        this.baseRadius,
        this.baseRadius
      );
      highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.2)");
      highlightGradient.addColorStop(0.5, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = highlightGradient;
      ctx.fillRect(
        -this.baseRadius,
        -this.baseRadius,
        this.baseRadius * 2,
        this.baseRadius * 2
      );
      ctx.restore();

      ctx.restore();
    }
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

  function createShapes() {
    shapes = [];
    for (let i = 0; i < numShapes; i++) {
      shapes.push(new Shape());
    }
  }

  function updateShapes() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes.forEach((shape) => {
      shape.update();
      shape.draw();
    });
    requestAnimationFrame(updateShapes);
  }

  function updateMousePosition(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
  }

  document.addEventListener("mousemove", updateMousePosition);

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
    });
  });

  resizeCanvas();
  createShapes();
  updateShapes();
});
