<template>
  <div class="chart-container" ref="container">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import type { Choice } from '~/types/models';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

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
  const color = '#3b82f6';
  // 既にチャートが存在する場合は新規作成せず更新する
  if (chart) {
    try {
      chart.data.labels = d.labels as any;
      chart.data.datasets![0].data = d.data as any;
      chart.data.datasets![0].backgroundColor = d.data.map(() => color) as any;
      chart.update();
      return;
    } catch (e) {
  // 更新に失敗したら破棄して再作成する
      try { chart.destroy(); } catch (err) { /* ignore */ }
      chart = null;
    }
  }

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: d.labels,
      datasets: [{ label: 'Votes', data: d.data, backgroundColor: d.data.map(() => color) }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
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
