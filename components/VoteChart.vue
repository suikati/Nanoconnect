<template>
  <div class="chart-wrapper" ref="wrapper">
    <div
      class="chart-container outline-none"
      ref="container"
      tabindex="0"
      @keydown="onKeyNav"
      @blur="clearActive"
    >
      <canvas ref="canvas" />
      <!-- Empty placeholder -->
      <div
        v-if="allZero"
        class="absolute inset-0 flex items-center justify-center text-sm text-gray-500/70 pointer-events-none select-none"
      >まだ投票がありません</div>
    </div>
    <!-- aria live leader message -->
    <div class="sr-only" role="status" aria-live="polite">{{ leaderMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick, computed } from 'vue';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  PieController,
  ArcElement,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import type { Choice } from '~/types/models';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  PieController,
  ArcElement,
  ChartDataLabels,
);

const props = defineProps<{ counts: Record<string, number>; choices: Choice[]; chartType?: 'bar' | 'pie' }>();
const canvas = ref<HTMLCanvasElement | null>(null);
const container = ref<HTMLDivElement | null>(null);
const wrapper = ref<HTMLDivElement | null>(null);
let chart: Chart | null = null;
let stripePattern: CanvasPattern | null = null;

// Active (hover/focus) bar index
const activeIndex = ref<number | null>(null);

// Leader message (ARIA)
const leaderMessage = ref('');

// Build helper: mix color with white for dim effect
function mixWithWhite(hex: string, ratio = 0.55) {
  if (!/^#?[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const nr = Math.round(r + (255 - r) * ratio);
  const ng = Math.round(g + (255 - g) * ratio);
  const nb = Math.round(b + (255 - b) * ratio);
  return `rgb(${nr}, ${ng}, ${nb})`;
}

const buildData = () => {
  const labels: string[] = props.choices.map((c: Choice) => c.text);
  const data: number[] = props.choices.map((c: Choice) => props.counts[c.key] ?? 0);
  return { labels, data };
};

const allZero = computed(() => {
  const d = buildData();
  return d.data.every(v => v === 0);
});

function updateLeaderMessage() {
  const d = buildData();
  const total = d.data.reduce((a, b) => a + b, 0);
  if (total === 0) {
    leaderMessage.value = 'まだ投票がありません';
    return;
  }
  const max = Math.max(...d.data);
  const leaders = d.data
    .map((v, i) => ({ v, i }))
    .filter(o => o.v === max && max > 0)
    .map(o => d.labels[o.i]);
  const pct = Math.round((max / total) * 100);
  if (leaders.length === 1) {
    leaderMessage.value = `${leaders[0]} が ${max} 票 (${pct}%) で首位`;
  } else {
    leaderMessage.value = `${leaders.join(' と ')} が ${max} 票 (${pct}%) で同率首位`;
  }
}

let rendering = false;
const renderChart = async () => {
  if (rendering) return; // prevent overlapping builds
  rendering = true;
  await nextTick();
  if (!canvas.value || !container.value) return;
  const ctx = canvas.value.getContext('2d');
  if (!ctx) return;
  const d = buildData();
  updateLeaderMessage();
  const palette = ['#6366F1', '#EC4899', '#06B6D4', '#F59E0B', '#10B981', '#F97316'];
  const color = palette[0];
  // Prepare stripe pattern for zero values once
  if (!stripePattern) {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 8; pCanvas.height = 8;
    const pctx = pCanvas.getContext('2d');
    if (pctx) {
      pctx.fillStyle = '#f3f4f6';
      pctx.fillRect(0, 0, 8, 8);
      pctx.strokeStyle = '#e5e7eb';
      pctx.lineWidth = 2;
      pctx.beginPath();
      pctx.moveTo(0, 8);
      pctx.lineTo(8, 0);
      pctx.stroke();
      stripePattern = pctx.createPattern(pCanvas, 'repeat');
    }
  }

  const total = d.data.reduce((a, b) => a + b, 0) || 1;
  const maxVal = Math.max(...d.data);
  const maxIndexes = d.data.map((v, i) => (v === maxVal && maxVal > 0 ? i : -1)).filter(i => i !== -1);

  function computeBgColors(active: number | null) {
    return d.data.map((v, i) => {
      // zero value pattern
      if (v === 0) {
        return stripePattern || '#e5e7eb';
      }
      const choice = (props.choices[i] as any);
      const base = choice && choice.color ? choice.color : palette[i % palette.length];
      const isMax = maxIndexes.includes(i);
      const isDim = active !== null && active !== i;
      if (isDim) return mixWithWhite(base, 0.75);
      if (isMax) return base; // keep vivid
      return base;
    });
  }
  // 既にチャートが存在する場合は新規作成せず更新する
  if (chart) {
    try {
      chart.data.labels = d.labels as any;
      chart.data.datasets![0].data = d.data as any;
      chart.data.datasets![0].backgroundColor = computeBgColors(activeIndex.value) as any;
      // border highlight for max
      chart.data.datasets![0].borderColor = d.data.map((v, i) => (maxIndexes.includes(i) ? '#111827' : 'transparent')) as any;
      chart.data.datasets![0].borderWidth = d.data.map((v, i) => (maxIndexes.includes(i) ? 2 : 0)) as any;
      chart.update();
      return;
    } catch (e) {
      // 更新に失敗したら破棄して再作成する
      try {
        chart.destroy();
      } catch (err) {
        /* ignore */
      }
      chart = null;
    }
  }
  const bgColors = computeBgColors(activeIndex.value);

  const isPie = (props.chartType || 'bar') === 'pie';
  try {
    chart = new Chart(ctx, {
    type: isPie ? 'pie' : 'bar',
    data: {
      labels: d.labels,
      datasets: [
        {
          label: 'Votes',
          data: d.data,
          backgroundColor: bgColors as any,
          ...(isPie
            ? {
                // pie specific
                borderColor: d.data.map((v, i) => (maxIndexes.includes(i) ? '#111827' : '#ffffff')) as any,
                borderWidth: d.data.map((v, i) => (maxIndexes.includes(i) ? 2 : 1)) as any,
              }
            : {
                borderRadius: 8,
                borderSkipped: false,
                borderColor: d.data.map((v, i) => (maxIndexes.includes(i) ? '#111827' : 'transparent')) as any,
                borderWidth: d.data.map((v, i) => (maxIndexes.includes(i) ? 2 : 0)) as any,
              }),
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...(isPie ? {} : { indexAxis: props.choices.length > 6 ? 'y' : 'x' }),
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              const raw = ctx.parsed?.y ?? ctx.parsed;
              const v = typeof raw === 'number' ? raw : 0;
              const totalLocal = d.data.reduce((a: number, b: number) => a + b, 0) || 1;
              const pct = Math.round((v / totalLocal) * 100);
              return `${ctx.label}: ${v} (${pct}%)`;
            },
          },
        },
        // datalabels: バー内部に白い値ラベルを表示
        datalabels: {
          color: '#ffffff',
          textStrokeColor: 'rgba(0,0,0,0.55)',
          textStrokeWidth: 3,
          anchor: isPie ? 'center' : 'end',
          align: isPie ? 'center' : 'end',
          font: { weight: 700, size: isPie ? 13 : 14 },
          clamp: true,
          formatter: (val: number, ctx: any) => {
            if (val <= 0) return '';
            const pct = Math.round((val / total) * 100);
            if (isPie) return `${pct}%`;
            return `${val} (${pct}%)`;
          },
        },
      },
      animation: { duration: 600, easing: 'easeOutCubic' },
      ...(isPie
        ? { scales: {} }
        : {
            scales: {
              x: {
                grid: { display: false },
                ticks: { maxRotation: 0, autoSkip: false, font: { size: 13, weight: 600 }, color: '#1f2937' },
                border: { display: false },
              },
              y: {
                beginAtZero: true,
                grid: { display: false },
                ticks: { precision: 0, font: { size: 13, weight: 600 }, color: '#1f2937' },
                border: { display: false },
              },
            },
          }),
      onHover: (evt, activeEls) => {
        if (!chart) return;
        if (!isPie) {
          if (activeEls.length) {
            activeIndex.value = activeEls[0].index;
          } else if (activeIndex.value !== null) {
            activeIndex.value = null;
          }
          // Recompute colors only (fast)
          const dataset = chart.data.datasets[0];
          const d2 = buildData();
          const maxVal2 = Math.max(...d2.data);
          const maxIdx2 = d2.data.map((v, i) => (v === maxVal2 && maxVal2 > 0 ? i : -1)).filter(i => i !== -1);
          (dataset as any).backgroundColor = d2.data.map((v, i) => {
            if (v === 0) return stripePattern || '#e5e7eb';
            const choice = (props.choices[i] as any);
            const base = choice && choice.color ? choice.color : palette[i % palette.length];
            const isDim = activeIndex.value !== null && activeIndex.value !== i;
            return isDim ? mixWithWhite(base, 0.75) : base;
          });
          (dataset as any).borderColor = d2.data.map((v, i) => (maxIdx2.includes(i) ? '#111827' : 'transparent'));
          (dataset as any).borderWidth = d2.data.map((v, i) => (maxIdx2.includes(i) ? 2 : 0));
          chart.update('none');
        }
      },
    },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Chart init error', e);
    try { if (chart) { chart.destroy(); chart = null; } } catch (_) { /* ignore */ }
  } finally {
    rendering = false;
  }
};

onMounted(() => {
  renderChart();
});

// counts が変わったときに更新
watch(
  () => props.counts,
  () => { void renderChart(); },
  { deep: true },
);

// choices（ラベル）が変わったときの更新
watch(
  () => props.choices,
  () => { void renderChart(); },
  { deep: true, immediate: true },
);

function refreshColors() {
  if (!chart) return;
  const d = buildData();
  const maxVal = Math.max(...d.data);
  const maxIdx = d.data.map((v, i) => (v === maxVal && maxVal > 0 ? i : -1)).filter(i => i !== -1);
  const dataset = chart.data.datasets[0];
  (dataset as any).backgroundColor = d.data.map((v, i) => {
    if (v === 0) return stripePattern || '#e5e7eb';
    const choice = (props.choices[i] as any);
    const base = choice && choice.color ? choice.color : ['#6366F1', '#EC4899', '#06B6D4', '#F59E0B', '#10B981', '#F97316'][i % 6];
    const isDim = activeIndex.value !== null && activeIndex.value !== i;
    return isDim ? mixWithWhite(base, 0.75) : base;
  });
  (dataset as any).borderColor = d.data.map((v, i) => (maxIdx.includes(i) ? '#111827' : 'transparent'));
  (dataset as any).borderWidth = d.data.map((v, i) => (maxIdx.includes(i) ? 2 : 0));
  chart.update('none');
}

function onKeyNav(e: KeyboardEvent) {
  if (!chart) return;
  const d = buildData();
  const count = d.data.length;
  if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(e.key)) {
    e.preventDefault();
    if (activeIndex.value === null) {
      activeIndex.value = 0;
    } else {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        activeIndex.value = (activeIndex.value - 1 + count) % count;
      } else {
        activeIndex.value = (activeIndex.value + 1) % count;
      }
    }
    refreshColors();
  }
}

function clearActive() {
  if (activeIndex.value !== null) {
    activeIndex.value = null;
    refreshColors();
  }
}

onBeforeUnmount(() => {
  if (chart) {
    chart.destroy();
    chart = null;
  }
});
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  height: 260px;
}
canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
</style>
