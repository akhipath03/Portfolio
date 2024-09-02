// DOM Content Loaded Event Listeners
document.addEventListener("DOMContentLoaded", (event) => {
  // Initial fade-in effect
  const faders = document.querySelectorAll(".fade-in");

  faders.forEach((fader) => {
    fader.classList.add("appear");
  });

  // Create timeline
  createTimeline();
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();

    const targetId = this.getAttribute("href").substring(1);
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      const headerOffset = 80; // Adjust this value based on your header height
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  });
});

// Project card hover effect
const projectCards = document.querySelectorAll(".project-card");
projectCards.forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  });
});

// Header background change on scroll
window.addEventListener("scroll", () => {
  const header = document.querySelector("header");
  header.classList.toggle("scrolled", window.scrollY > 50);
});

// Reactive scrolling fade in/out effect
const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
      } else {
        entry.target.classList.remove("active");
      }
    });
  },
  {
    threshold: 0.15, // Adjust this value to control when the reveal happens
    rootMargin: "0px 0px -100px 0px", // Adjust this to fine-tune the reveal point
  }
);

revealElements.forEach((element) => {
  revealObserver.observe(element);
});

// Timeline data
const timelineData = [
  {
    date: "June 2024 – Present",
    title: "CostarGroup | Data Analyst Intern",
    description: [
      "Utilized SQL in SSMS and Snowflake to analyze usage patterns and predict user activity",
      "Created a Python script to fetch data from Snowflake and integrate it into SSMS",
      "Implemented Isolation Forest for usage anomaly detection",
      "Developed detailed visualizations of usage trends and performed statistical analyses",
      "Led a project to create a machine learning model to classify office building images by their architectural style, introducing a new dimension for property discovery.",
    ],
  },
  {
    date: "March 2024 – June 2024",
    title:
      "Hudson Institute | Center for Defense Concepts and Technology Spring Intern",
    description: [
      "Developed a war game simulation project with a GUI for data management and simulation outcomes",
      "Created a GUI budget tool for Excel integration",
      "Implemented backend functionality to dynamically update values based on simulation results",
      "Designed a map visualization tool to display troop movements and outcomes during simulated turns",
    ],
  },
  {
    date: "May 2025",
    title: "College of William and Mary",
    description: [
      "B.S in Data Science, Minor in Mathematics",
      "GPA: 3.95",
      "Relevant Coursework: Algorithms, Data Structures, Probability & Statistics for Scientists, Advanced Applied Machine Learning, Statistical Data Analysis, Data Visualization, Databases, Linear Algebra, Discrete Mathematics",
    ],
  },
];

// Create timeline
function createTimeline() {
  const timeline = document.querySelector(".timeline");
  timelineData.forEach((item, index) => {
    const timelineItem = document.createElement("div");
    timelineItem.classList.add("timeline-item");
    timelineItem.classList.add(index % 2 === 0 ? "left" : "right");

    const content = document.createElement("div");
    content.classList.add("timeline-content");
    content.innerHTML = `
      <h3>${item.title}</h3>
      <p class="date">${item.date}</p>
      <div class="details">
        <ul>
          ${item.description.map((desc) => `<li>${desc}</li>`).join("")}
        </ul>
      </div>
    `;

    timelineItem.appendChild(content);
    timeline.appendChild(timelineItem);
  });
}

// Dark mode toggle
const toggleSwitch = document.querySelector(
  '.theme-switch input[type="checkbox"]'
);
const currentTheme = localStorage.getItem("theme");

if (currentTheme) {
  document.documentElement.setAttribute("data-theme", currentTheme);

  if (currentTheme === "dark") {
    toggleSwitch.checked = true;
    document.body.classList.add("dark-mode");
  }
}

function switchTheme(e) {
  if (e.target.checked) {
    document.documentElement.setAttribute("data-theme", "dark");
    document.body.classList.add("dark-mode");
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    document.body.classList.remove("dark-mode");
    localStorage.setItem("theme", "light");
  }
}

toggleSwitch.addEventListener("change", switchTheme, false);
