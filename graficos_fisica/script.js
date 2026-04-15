const appState = {
  pos: null,
  vel: null,
  acc: null,
  chart: null,
};

const graphConfig = {
  x_t: {
    title: "Espaco x em funcao do tempo",
    desc: "Grafico de posicao horizontal ao longo do tempo.",
    xSource: ["pos", "t"],
    ySource: ["pos", "x"],
    xLabel: "Tempo t (s)",
    yLabel: "Espaco x (m)",
    color: "#137cc1",
  },
  y_t: {
    title: "Espaco y em funcao do tempo",
    desc: "Grafico de posicao vertical ao longo do tempo.",
    xSource: ["pos", "t"],
    ySource: ["pos", "y"],
    xLabel: "Tempo t (s)",
    yLabel: "Espaco y (m)",
    color: "#ef8a00",
  },
  y_x: {
    title: "Espaco y em funcao do espaco x",
    desc: "Trajetoria do movimento no plano cartesiano.",
    xSource: ["pos", "x"],
    ySource: ["pos", "y"],
    xLabel: "Espaco x (m)",
    yLabel: "Espaco y (m)",
    color: "#26a96c",
  },
  vx_t: {
    title: "Velocidade em x em funcao do tempo",
    desc: "Comportamento da componente horizontal da velocidade.",
    xSource: ["vel", "t"],
    ySource: ["vel", "vx"],
    xLabel: "Tempo t (s)",
    yLabel: "Velocidade vx (m/s)",
    color: "#d35a4a",
  },
  vy_t: {
    title: "Velocidade em y em funcao do tempo",
    desc: "Comportamento da componente vertical da velocidade.",
    xSource: ["vel", "t"],
    ySource: ["vel", "vy"],
    xLabel: "Tempo t (s)",
    yLabel: "Velocidade vy (m/s)",
    color: "#8854d0",
  },
  ax_t: {
    title: "Aceleracao em x em funcao do tempo",
    desc: "Aceleracao horizontal medida no experimento.",
    xSource: ["acc", "t"],
    ySource: ["acc", "ax"],
    xLabel: "Tempo t (s)",
    yLabel: "Aceleracao ax (m/s^2)",
    color: "#8f5f38",
  },
  ay_t: {
    title: "Aceleracao em y em funcao do tempo",
    desc: "Aceleracao vertical medida no experimento.",
    xSource: ["acc", "t"],
    ySource: ["acc", "ay"],
    xLabel: "Tempo t (s)",
    yLabel: "Aceleracao ay (m/s^2)",
    color: "#e058a0",
  },
};

function parseRawTable(rawText, columns) {
  const lines = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const parts = lines[i]
      .replace(/,/g, ".")
      .split(/\s+/)
      .filter(Boolean);

    while (parts.length < columns.length) {
      parts.push("NaN");
    }

    const row = {};
    columns.forEach((col, index) => {
      row[col] = Number(parts[index]);
    });
    rows.push(row);
  }

  return rows;
}

function extractRawBlock(fileContent, varName) {
  const pattern = new RegExp(`${varName}\\s*=\\s*\"\"\"([\\s\\S]*?)\"\"\"`);
  const match = fileContent.match(pattern);
  return match ? match[1] : null;
}

function computeStats(values) {
  const valid = values.filter((v) => Number.isFinite(v));
  if (!valid.length) {
    return { n: 0, min: "-", max: "-", mean: "-" };
  }

  const n = valid.length;
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const mean = valid.reduce((acc, v) => acc + v, 0) / n;

  return {
    n,
    min: min.toFixed(4),
    max: max.toFixed(4),
    mean: mean.toFixed(4),
  };
}

function setStats(values) {
  const stats = computeStats(values);
  const statsBox = document.getElementById("chart-stats");
  statsBox.innerHTML = "";

  [
    `N: ${stats.n}`,
    `Min: ${stats.min}`,
    `Max: ${stats.max}`,
    `Media: ${stats.mean}`,
  ].forEach((item) => {
    const span = document.createElement("span");
    span.textContent = item;
    statsBox.appendChild(span);
  });
}

function openMainPanel(panelId, buttonId) {
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
  document.querySelectorAll(".main-btn").forEach((btn) => btn.classList.remove("active"));

  document.getElementById(panelId).classList.add("active");
  document.getElementById(buttonId).classList.add("active");
}

function drawGraph(graphId) {
  const cfg = graphConfig[graphId];
  const [xTable, xField] = cfg.xSource;
  const [yTable, yField] = cfg.ySource;

  const xData = appState[xTable].map((row) => row[xField]);
  const yData = appState[yTable].map((row) => row[yField]);

  const points = [];
  for (let i = 0; i < Math.min(xData.length, yData.length); i += 1) {
    if (Number.isFinite(xData[i]) && Number.isFinite(yData[i])) {
      points.push({ x: xData[i], y: yData[i] });
    }
  }

  const titleEl = document.getElementById("chart-title");
  const descEl = document.getElementById("chart-desc");
  titleEl.textContent = cfg.title;
  descEl.textContent = cfg.desc;
  setStats(points.map((p) => p.y));

  const ctx = document.getElementById("mainChart");

  if (appState.chart) {
    appState.chart.destroy();
  }

  appState.chart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [
        {
          label: cfg.title,
          data: points,
          borderColor: cfg.color,
          backgroundColor: cfg.color,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2,
          tension: 0.15,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      parsing: false,
      plugins: {
        legend: {
          display: true,
          labels: { boxWidth: 16, font: { size: 13, weight: "bold" } },
        },
      },
      scales: {
        x: {
          type: "linear",
          title: {
            display: true,
            text: cfg.xLabel,
            font: { size: 14, weight: "bold" },
          },
          ticks: { font: { size: 12 } },
          grid: { color: "rgba(40, 90, 130, 0.12)" },
        },
        y: {
          title: {
            display: true,
            text: cfg.yLabel,
            font: { size: 14, weight: "bold" },
          },
          ticks: { font: { size: 12 } },
          grid: { color: "rgba(40, 90, 130, 0.12)" },
        },
      },
    },
  });

  document.querySelectorAll("#graph-buttons-max button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.graph === graphId);
  });
}

async function loadDataFromJsFile() {
  let data = window.PHYSICS_DATA || null;

  if (!data) {
    try {
      const resp = await fetch("data.json", { cache: "no-store" });
      if (resp.ok) {
        data = await resp.json();
      }
    } catch (_) {
      data = null;
    }
  }

  if (!data) {
    throw new Error("Nao foi possivel carregar data.json");
  }

  const rawPos = data.raw_pos;
  const rawVel = data.raw_vel;
  const rawAcc = data.raw_acc;

  if (!rawPos || !rawVel || !rawAcc) {
    throw new Error("Nao encontrei raw_pos, raw_vel e raw_acc nos dados");
  }

  appState.pos = parseRawTable(rawPos, ["t", "x", "y"]);
  appState.vel = parseRawTable(rawVel, ["t", "vx", "vy"]);
  appState.acc = parseRawTable(rawAcc, ["t", "ay", "ax"]);
}

function bindUi() {
  document.getElementById("btn-obliquo-max").addEventListener("click", () => {
    openMainPanel("panel-obliquo-max", "btn-obliquo-max");
  });

  document.getElementById("btn-obliquo-metade").addEventListener("click", () => {
    openMainPanel("panel-obliquo-metade", "btn-obliquo-metade");
  });

  document.getElementById("btn-queda-livre").addEventListener("click", () => {
    openMainPanel("panel-queda-livre", "btn-queda-livre");
  });

  document.querySelectorAll("#graph-buttons-max button").forEach((btn) => {
    btn.addEventListener("click", () => drawGraph(btn.dataset.graph));
  });
}

function showError(message) {
  const panel = document.getElementById("panel-obliquo-max");
  panel.innerHTML = `
    <h2>Lancamento Obliquo - Altura Maxima</h2>
    <p class="placeholder">Erro ao carregar dados: ${message}</p>
    <p class="placeholder">Abra a pasta com um servidor local (por exemplo, Five Server) e tente novamente.</p>
  `;
}

(async function init() {
  bindUi();

  try {
    await loadDataFromJsFile();
    drawGraph("x_t");
  } catch (error) {
    showError(error.message);
  }
})();
