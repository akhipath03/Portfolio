document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("background-canvas");
  const ctx = canvas.getContext("2d");

  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.zIndex = "-1";

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  const shapes = [];
  const numShapes = 20; // Increased number of shapes
  const colorSchemes = {
    light: ["#3498db80", "#e74c3c80", "#2ecc7180", "#f39c1280", "#9b59b680"],
    dark: ["#4db6ff80", "#ff6b6b80", "#50e3a480", "#ffc04d80", "#c37ee280"],
  };

  let mouseX = 0;
  let mouseY = 0;
  let scrollY = 0;

  const mousePushStrength = 0.08;
  const shapeSpeed = 0.3;
  const scrollEffect = 0.003;

  class Shape {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 80 + 40; // Adjusted size range
      this.speedX = (Math.random() - 0.5) * shapeSpeed;
      this.speedY = (Math.random() - 0.5) * shapeSpeed;
      this.color =
        colorSchemes[
          document.body.classList.contains("dark-mode") ? "dark" : "light"
        ][Math.floor(Math.random() * 5)];
      this.rotation = 0;
      this.rotationSpeed = (Math.random() - 0.5) * 0.02;
      this.parallaxFactor = Math.random() * 0.5 + 0.5;
      this.shapeType = Math.floor(Math.random() * 3); // 0: rounded rect, 1: circle, 2: triangle
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.rotation += this.rotationSpeed;

      if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
      if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

      const dx = this.x - mouseX;
      const dy = this.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = 150;

      if (distance < maxDistance) {
        const force = (maxDistance - distance) / maxDistance;
        const angle = Math.atan2(dy, dx);
        const pushX = Math.cos(angle) * force * mousePushStrength;
        const pushY = Math.sin(angle) * force * mousePushStrength;

        this.speedX += pushX;
        this.speedY += pushY;

        const maxSpeed = 2;
        const currentSpeed = Math.sqrt(
          this.speedX * this.speedX + this.speedY * this.speedY
        );
        if (currentSpeed > maxSpeed) {
          this.speedX = (this.speedX / currentSpeed) * maxSpeed;
          this.speedY = (this.speedY / currentSpeed) * maxSpeed;
        }
      }

      this.speedX *= 0.99;
      this.speedY *= 0.99;

      this.y += scrollY * scrollEffect * this.parallaxFactor;

      if (this.y < -this.size) this.y = canvas.height + this.size;
      if (this.y > canvas.height + this.size) this.y = -this.size;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = this.color;

      switch (this.shapeType) {
        case 0:
          this.drawRoundedRect();
          break;
        case 1:
          this.drawCircle();
          break;
        case 2:
          this.drawTriangle();
          break;
      }

      ctx.restore();
    }

    drawRoundedRect() {
      const radius = this.size / 5;
      ctx.beginPath();
      ctx.moveTo(-this.size / 2 + radius, -this.size / 2);
      ctx.arcTo(
        this.size / 2,
        -this.size / 2,
        this.size / 2,
        this.size / 2,
        radius
      );
      ctx.arcTo(
        this.size / 2,
        this.size / 2,
        -this.size / 2,
        this.size / 2,
        radius
      );
      ctx.arcTo(
        -this.size / 2,
        this.size / 2,
        -this.size / 2,
        -this.size / 2,
        radius
      );
      ctx.arcTo(
        -this.size / 2,
        -this.size / 2,
        this.size / 2,
        -this.size / 2,
        radius
      );
      ctx.closePath();
      ctx.fill();
    }

    drawCircle() {
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    drawTriangle() {
      ctx.beginPath();
      ctx.moveTo(0, -this.size / 2);
      ctx.lineTo(this.size / 2, this.size / 2);
      ctx.lineTo(-this.size / 2, this.size / 2);
      ctx.closePath();
      ctx.fill();
    }
  }

  function createShapes() {
    shapes.length = 0;
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

  window.addEventListener("resize", () => {
    resizeCanvas();
    createShapes();
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

  createShapes();
  updateShapes();
});
