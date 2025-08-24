<template>
  <div>
    <canvas ref="canvas" :width="width" :height="height"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const props = defineProps<{ counts: Record<string, number>, choices: Array<{ key: string, text: string }>, width?: number, height?: number }>();
const canvas = ref<HTMLCanvasElement | null>(null);
let chart: Chart | null = null;

const width = props.width ?? 400;
const height = props.height ?? 200;

function buildData() {
  const labels = props.choices.map(c => c.text);
  const data = props.choices.map(c => props.counts[c.key] ?? 0);
  return { labels, data };
}

onMounted(() => {
  if (!canvas.value) return;
  const ctx = canvas.value.getContext('2d');
  if (!ctx) return;
  const d = buildData();
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: d.labels,
      datasets: [{ label: 'Votes', data: d.data, backgroundColor: '#3b82f6' }]
    },
    options: {
      responsive: false,
      animation: { duration: 200 }
    }
  });
});

watch(() => props.counts, () => {
  if (!chart) return;
  const d = buildData();
  chart.data.labels = d.labels as any;
  chart.data.datasets![0].data = d.data as any;
  chart.update();
}, { deep: true });

onBeforeUnmount(() => {
  if (chart) {
    chart.destroy();
    chart = null;
  }
});
</script>

<style scoped>
canvas { display:block; }
</style>
