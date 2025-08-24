<template>
  <div class="chart-container" ref="container">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import type { Choice } from '~/types/models';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, ChartDataLabels);

const props = defineProps<{ counts: Record<string, number>, choices: Choice[] }>();
const canvas = ref<HTMLCanvasElement | null>(null);
const container = ref<HTMLDivElement | null>(null);
let chart: Chart | null = null;

const buildData = () => {
  const labels: string[] = props.choices.map((c: Choice) => c.text);
  const data: number[] = props.choices.map((c: Choice) => props.counts[c.key] ?? 0);
  return { labels, data };
};

const renderChart = async () => {
  await nextTick();
  if (!canvas.value || !container.value) return;
  const ctx = canvas.value.getContext('2d');
  if (!ctx) return;
  const d = buildData();
  // グラデーションを作るユーティリティ（updateパスでも使うため早めに定義）
  const gradientFor = (ctx: CanvasRenderingContext2D, area: any, from: string, to: string) => {
    const g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
    g.addColorStop(0, from);
    g.addColorStop(1, to);
    return g;
  };
  const palette = ['#6366F1', '#EC4899', '#06B6D4', '#F59E0B', '#10B981', '#F97316'];
  const color = palette[0];
  // 既にチャートが存在する場合は新規作成せず更新する
  if (chart) {
    try {
      chart.data.labels = d.labels as any;
      chart.data.datasets![0].data = d.data as any;
      // regenerate background colors using choice.color when available
      const ctx2 = canvas.value.getContext('2d')!;
      const bgColorsUpdate = d.data.map((_, i) => {
        const choice = props.choices[i] as any;
        const c1 = (choice && choice.color) ? choice.color : palette[i % palette.length];
        return gradientFor(ctx2, canvas.value!.getBoundingClientRect(), c1, '#ffffff');
      });
      chart.data.datasets![0].backgroundColor = bgColorsUpdate as any;
      chart.update();
      return;
    } catch (e) {
  // 更新に失敗したら破棄して再作成する
      try { chart.destroy(); } catch (err) { /* ignore */ }
      chart = null;
    }
  }
  const bgColors = d.data.map((_, i) => {
    const choice = props.choices[i] as any;
    const c1 = (choice && choice.color) ? choice.color : palette[i % palette.length];
    const c2 = '#ffffff';
    return gradientFor(ctx, canvas.value!.getBoundingClientRect(), c1, c2);
  });

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: d.labels,
      datasets: [{
        label: 'Votes',
        data: d.data,
        backgroundColor: bgColors as any,
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              const v = ctx.parsed.y ?? ctx.parsed;
              const total = d.data.reduce((a: number, b: number) => a + b, 0) || 1;
              const pct = Math.round((v / total) * 100);
              return `${v} (${pct}%)`;
            }
          }
        },
        // datalabels: バー内部に白い値ラベルを表示
        datalabels: {
          color: '#ffffff',
          anchor: 'end',
          align: 'end',
          font: { weight: '600', size: 12 },
          formatter: (val: number) => val > 0 ? val : ''
        }
      },
      animation: { duration: 600, easing: 'easeOutCubic' },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: false } },
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
};

onMounted(() => {
  renderChart();
});

// counts が変わったときに更新
watch(() => props.counts, () => {
  // レンダー／更新を一元化する
  void renderChart();
}, { deep: true });

// choices（ラベル）が変わったときの更新
watch(() => props.choices, () => {
  // レンダー／更新を一元化する
  void renderChart();
}, { deep: true, immediate: true });

onBeforeUnmount(() => {
  if (chart) {
    chart.destroy();
    chart = null;
  }
});
</script>

<style scoped>
.chart-container { position: relative; width: 100%; height: 260px; }
canvas { display:block; width:100% !important; height:100% !important; }
</style>
