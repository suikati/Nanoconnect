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
  ChartDataLabels,
);

const props = defineProps<{ counts: Record<string, number>; choices: Choice[] }>();
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

const renderChart = async () => {
  await nextTick();
  if (!canvas.value || !container.value) return;
  const ctx = canvas.value.getContext('2d');
  if (!ctx) return;
  const d = buildData();
  updateLeaderMessage();
  const palette = ['#6366F1', '#EC4899', '#06B6D4', '#F59E0B', '#10B981', '#F97316'];
  if (!stripePattern) {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 8; pCanvas.height = 8;
    const pctx = pCanvas.getContext('2d');
    if (pctx) {
      pctx.fillStyle = '#f3f4f6';
      pctx.fillRect(0,0,8,8);
      pctx.strokeStyle = '#e5e7eb';
      pctx.lineWidth = 2;
      pctx.beginPath();
      pctx.moveTo(0,8); pctx.lineTo(8,0); pctx.stroke();
      stripePattern = pctx.createPattern(pCanvas,'repeat');
    }
  }
  const total = d.data.reduce((a,b)=>a+b,0)||1;
  const maxVal = Math.max(...d.data);
  const maxIdxs = d.data.map((v,i)=> v===maxVal && maxVal>0 ? i : -1).filter(i=>i!==-1);

  function computeGradients(active: number | null) {
    const vertical = !(props.choices.length > 6);
    const area = (chart && (chart as any).chartArea) || { right:120, bottom:120 };
    return d.data.map((v,i)=>{
      if (v===0) return stripePattern || '#e5e7eb';
      const choice = (props.choices[i] as any);
      const base = choice && choice.color ? choice.color : palette[i % palette.length];
      const isDim = active!==null && active!==i;
  const grad = ctx!.createLinearGradient(0,0, vertical?0:area.right, vertical?area.bottom:0);
      const lighten = (amt=0.15)=>{ const c = base.replace('#',''); const r=parseInt(c.slice(0,2),16),g=parseInt(c.slice(2,4),16),b=parseInt(c.slice(4,6),16); return `rgb(${Math.min(255,Math.round(r+(255-r)*amt))},${Math.min(255,Math.round(g+(255-g)*amt))},${Math.min(255,Math.round(b+(255-b)*amt))})`; };
      const darken = (amt=0.25)=>{ const c = base.replace('#',''); const r=parseInt(c.slice(0,2),16),g=parseInt(c.slice(2,4),16),b=parseInt(c.slice(4,6),16); return `rgb(${Math.round(r*(1-amt))},${Math.round(g*(1-amt))},${Math.round(b*(1-amt))})`; };
      const top = lighten();
      const bottom = darken();
      grad.addColorStop(0, isDim? mixWithWhite(top,0.65): top);
      grad.addColorStop(1, isDim? mixWithWhite(bottom,0.65): bottom);
      return grad;
    });
  }

  if (chart) {
    try {
      chart.data.labels = d.labels as any;
      chart.data.datasets![0].data = d.data as any;
      chart.data.datasets![0].backgroundColor = computeGradients(activeIndex.value) as any;
      chart.data.datasets![0].borderColor = d.data.map((v,i)=> maxIdxs.includes(i)? '#111827':'transparent') as any;
      chart.data.datasets![0].borderWidth = d.data.map((v,i)=> maxIdxs.includes(i)?2:0) as any;
      chart.update();
      return;
    } catch(e) {
      try { chart.destroy(); } catch(_) {}
      chart = null;
    }
  }

  const bgColors = computeGradients(activeIndex.value);
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: d.labels,
      datasets: [{
        label: 'Votes',
        data: d.data,
        backgroundColor: bgColors as any,
        borderRadius: 14,
        borderSkipped: false,
        borderColor: d.data.map((v,i)=> maxIdxs.includes(i)? '#111827':'transparent') as any,
        borderWidth: d.data.map((v,i)=> maxIdxs.includes(i)?2:0) as any,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: props.choices.length > 6 ? 'y' : 'x',
      plugins: {
        legend: { display: false },
  tooltip: { backgroundColor:'#111827', titleFont:{weight:600}, bodyFont:{weight:500}, callbacks:{
          label: (ctx:any)=>{ const v = ctx.parsed.y ?? ctx.parsed; const tot = d.data.reduce((a:number,b:number)=>a+b,0)||1; const pct = Math.round((v/tot)*100); return `${v} (${pct}%)`; }
        }},
        datalabels: {
          anchor:'end', align:'end', font:{weight:600,size:12}, color:'#fff',
          formatter:(val:number)=>{ if(val<=0) return ''; const pct=Math.round((val/total)*100); return `${val} (${pct}%)`; }
        }
      },
      animation:{ duration:600, easing:'easeOutCubic' },
      scales:{
        x:{ grid:{display:false}, ticks:{ maxRotation:0, autoSkip:false, callback:(v:any,i:number)=>{ const lbl=d.labels[i]||''; return lbl.length>8? lbl.slice(0,7)+'…': lbl; }, font:{weight:500} } },
        y:{ beginAtZero:true, ticks:{ precision:0, callback:(v:any,i:number)=>{ const lbl=d.labels[i]||''; return lbl.length>10? lbl.slice(0,9)+'…': lbl; }, font:{weight:500} } }
      },
      onHover:(evt,activeEls)=>{
        if(!chart) return;
        if(activeEls.length) activeIndex.value = activeEls[0].index; else if(activeIndex.value!==null) activeIndex.value=null;
        const dataset = chart.data.datasets[0];
        (dataset as any).backgroundColor = computeGradients(activeIndex.value);
        chart.update('none');
      }
    }
  });
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
  const ctx = canvas.value?.getContext('2d');
  if (!ctx) return;
  const area = (chart as any).chartArea || { right:120, bottom:120 };
  const palette = ['#6366F1', '#EC4899', '#06B6D4', '#F59E0B', '#10B981', '#F97316'];
  const vertical = !(props.choices.length > 6);
  (dataset as any).backgroundColor = d.data.map((v,i)=>{
    if (v===0) return stripePattern || '#e5e7eb';
    const choice = (props.choices[i] as any);
    const base = choice && choice.color ? choice.color : palette[i % palette.length];
    const isDim = activeIndex.value!==null && activeIndex.value!==i;
    const grad = ctx.createLinearGradient(0,0, vertical?0:area.right, vertical?area.bottom:0);
    const lighten = (amt=0.15)=>{ const c = base.replace('#',''); const r=parseInt(c.slice(0,2),16),g=parseInt(c.slice(2,4),16),b=parseInt(c.slice(4,6),16); return `rgb(${Math.min(255,Math.round(r+(255-r)*amt))},${Math.min(255,Math.round(g+(255-g)*amt))},${Math.min(255,Math.round(b+(255-b)*amt))})`; };
    const darken = (amt=0.25)=>{ const c = base.replace('#',''); const r=parseInt(c.slice(0,2),16),g=parseInt(c.slice(2,4),16),b=parseInt(c.slice(4,6),16); return `rgb(${Math.round(r*(1-amt))},${Math.round(g*(1-amt))},${Math.round(b*(1-amt))})`; };
    const top = lighten();
    const bottom = darken();
    grad.addColorStop(0, isDim? mixWithWhite(top,0.65): top);
    grad.addColorStop(1, isDim? mixWithWhite(bottom,0.65): bottom);
    return grad;
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
