const canvas = document.getElementById("background-canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const shapes = [];
const numShapes = 15;
const colorSchemes = {
  light: ["#3498db", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6"],
  dark: ["#4db6ff", "#ff6b6b", "#50e3a4", "#ffc04d", "#c37ee2"],
};

let mouseX = 0;
let mouseY = 0;

class Shape {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 50 + 20;
    this.speedX = Math.random() * 2 - 1;
    this.speedY = Math.random() * 2 - 1;
    this.color =
      colorSchemes[
        document.body.classList.contains("dark-mode") ? "dark" : "light"
      ][Math.floor(Math.random() * 5)];
    this.rotation = 0;
    this.rotationSpeed = Math.random() * 0.02 - 0.01;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.rotation += this.rotationSpeed;

    if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
    if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

    const dx = mouseX - this.x;
    const dy = mouseY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 200;

    if (distance < maxDistance) {
      const force = (maxDistance - distance) / maxDistance;
      this.x -= dx * force * 0.05;
      this.y -= dy * force * 0.05;
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;
    ctx.beginPath();

    if (Math.random() < 0.33) {
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
    } else if (Math.random() < 0.66) {
      ctx.rect(-this.size / 2, -this.size / 2, this.size, this.size);
    } else {
      ctx.moveTo(0, -this.size / 2);
      ctx.lineTo(this.size / 2, this.size / 2);
      ctx.lineTo(-this.size / 2, this.size / 2);
      ctx.closePath();
    }

    ctx.fill();
    ctx.restore();
  }
}

function createShapes() {
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

canvas.addEventListener("mousemove", (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

createShapes();
updateShapes();

// Update shape colors when switching between light and dark modes
const toggleSwitch = document.querySelector(
  '.theme-switch input[type="checkbox"]'
);
toggleSwitch.addEventListener("change", () => {
  const mode = document.body.classList.contains("dark-mode") ? "dark" : "light";
  shapes.forEach((shape) => {
    shape.color = colorSchemes[mode][Math.floor(Math.random() * 5)];
  });
});
