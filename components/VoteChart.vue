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
  <!-- 空状態プレースホルダ (全て 0 票) -->
      <div
        v-if="allZero"
        class="absolute inset-0 flex items-center justify-center text-sm text-gray-500/70 pointer-events-none select-none"
      >まだ投票がありません</div>
    </div>
  <!-- アクセシビリティ: 現在首位の選択肢をスクリーンリーダへ通知 -->
    <div class="sr-only" role="status" aria-live="polite">{{ leaderMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick, computed } from 'vue';
import { buildChartData, computeBgColors, truncateLabel } from '~/utils/chart';
import { mixWithWhite } from '~/utils/colors';
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

// アクティブ（ホバー / キー操作フォーカス）中のバーインデックス
const activeIndex = ref<number | null>(null);

// ARIA 用先頭メッセージ（同率首位にも対応）
const leaderMessage = ref('');

const buildData = () => buildChartData(props.choices, props.counts);

// 全選択肢が 0 票か判定（空表示切替）
const allZero = computed(() => {
  const d = buildData();
  return d.data.every(v => v === 0);
});

// 首位表示メッセージを再計算
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

// rAF による再レンダリングバッチング (連続変更時の過剰 update を抑制)
let rafId: number | null = null;
const schedule = () => {
  if (rafId != null) return;
  const raf = (typeof window !== 'undefined' && window.requestAnimationFrame)
    ? window.requestAnimationFrame.bind(window)
    : (cb: FrameRequestCallback) => setTimeout(() => cb(typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()), 0) as unknown as number;
  rafId = raf(() => {
    rafId = null;
    void renderNow();
  });
};

const renderChart = () => { schedule(); };

// Chart.js 再描画（必要に応じ破棄→再生成 / データ差分更新）
const renderNow = async () => {
  await nextTick();
  if (!canvas.value || !container.value) {
    return;
  }
  const ctx = canvas.value.getContext('2d');
  if (!ctx) { return; }
  const d = buildData();
  updateLeaderMessage();
  const palette = ['#6366F1', '#EC4899', '#06B6D4', '#F59E0B', '#10B981', '#F97316'];
  const color = palette[0];
  // 0 票用ストライプパターンを一度だけ生成
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

  const numericSum = (arr: any[]) => arr.reduce((a, b) => a + (Number(b) || 0), 0);
  const total = numericSum(d.data) || 1;
  const isPie = (props.chartType || 'bar') === 'pie';
  const maxVal = Math.max(...d.data);
  // maxIndexes no longer needed for highlight

  const bgColors = computeBgColors(d.data, props.choices as any, palette, activeIndex.value, stripePattern);
  // 既存インスタンスがあればタイプ変更やラベル数差分を考慮し再利用/再生成
  if (chart) {
    const desiredType = isPie ? 'pie' : 'bar';
    if ((chart.config as any).type !== desiredType) {
      try { chart.destroy(); } catch (e) { /* ignore */ }
      chart = null;
    }
  }
  if (chart) {
    try {
  // ラベル数変更で内部配列再割当が頻発するケース → 安全に破棄
      if ((chart.data.labels?.length || 0) !== d.labels.length) {
        chart.destroy();
        chart = null;
      }
  } catch (e) { try { if (chart) chart.destroy(); } catch(_){} chart=null; }
  }
  if (chart) {
    try {
      chart.data.labels = d.labels as any;
      chart.data.datasets![0].data = d.data as any;
      chart.data.datasets![0].backgroundColor = computeBgColors(d.data, props.choices as any, palette, activeIndex.value, stripePattern) as any;
      chart.data.datasets![0].borderColor = isPie ? d.data.map(() => '#ffffff') as any : d.data.map(() => 'transparent') as any;
      chart.data.datasets![0].borderWidth = isPie ? d.data.map(() => 1) as any : d.data.map(() => 0) as any;
      chart.update();
      return;
    } catch (e) { try { chart.destroy(); } catch(_){ } chart = null; }
  }
  const bgColors2 = computeBgColors(d.data, props.choices as any, palette, activeIndex.value, stripePattern);

  // isPie 判定済
  try {
    chart = new Chart(ctx, {
    type: isPie ? 'pie' : 'bar',
    data: {
      labels: d.labels,
      datasets: [
        {
          label: 'Votes',
          data: d.data,
          backgroundColor: bgColors2 as any,
            ...(isPie
              ? { borderColor: d.data.map(() => '#ffffff') as any, borderWidth: d.data.map(() => 1) as any }
              : { borderRadius: 8, borderSkipped: false, borderColor: d.data.map(() => 'transparent') as any, borderWidth: d.data.map(() => 0) as any }),
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
              // parsed may be {x: value, y: index} for horizontal bars, or a number for vertical bars
              const parsed = ctx.parsed;
              let rawVal: any = 0;
              if (typeof parsed === 'number') rawVal = parsed;
              else if (parsed && typeof parsed === 'object') rawVal = Number(parsed.x ?? parsed.y ?? parsed) || 0;
              else rawVal = 0;
              const v = Number(rawVal) || 0;
              const totalLocal = numericSum(d.data) || 1;
              const pct = totalLocal > 0 ? Math.round((v / totalLocal) * 100) : 0;
              return `${ctx.label}: ${v} (${pct}%)`;
            },
          },
        },
  // datalabels: バー/パイ内部の値ラベル表示設定
               datalabels: isPie
           ? {
               color: '#ffffff',
               textStrokeColor: 'rgba(0,0,0,0.55)',
               textStrokeWidth: 2,
               anchor: 'center',
               align: 'center',
               font: { weight: 600, size: 14 },
               clamp: true,
                formatter: (val: number, ctx: any) => {
                 const numVal = Number(val) || 0;
                 if (numVal <= 0) return '';
                 const label = ctx.chart.data.labels?.[ctx.dataIndex] || '';
                 const pct = total > 0 ? Math.round((numVal / total) * 100) : 0;
                 if (pct < 5) return '';
                 const short = truncateLabel(String(label), 6);
                 // 区切りを全角コロンに変更
                 return `${short}：${numVal}`;
               },
             }
           : {
               color: '#ffffff',
               textStrokeColor: 'rgba(0,0,0,0.45)',
               textStrokeWidth: 2,
               font: { weight: 600, size: 14 },
               clamp: true,
               formatter: (val: number) => {
                 if (val <= 0) return '';
                 return String(val);
               },
               anchor: 'center',
               align: 'center',
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
                ticks: { display: false },
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
          (dataset as any).backgroundColor = d2.data.map((v, i) => {
            if (v === 0) return stripePattern || '#e5e7eb';
            const choice = (props.choices[i] as any);
            const base = choice && choice.color ? choice.color : palette[i % palette.length];
            const isDim = activeIndex.value !== null && activeIndex.value !== i;
            return isDim ? mixWithWhite(base, 0.75) : base;
          });
          chart.update('none');
        }
      },
    },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Chart init error', e);
    try { if (chart) { chart.destroy(); chart = null; } } catch (_) { /* ignore */ }
  }
};

onMounted(() => { renderChart(); });

// counts が変わったときに更新
watch(() => props.counts, () => renderChart(), { deep: true });

// choices（ラベル）が変わったときの更新
watch(() => props.choices, () => renderChart(), { deep: true, immediate: true });

// chartType 変更時にも再構築（タイプ切替）
watch(() => props.chartType, () => renderChart());

// アクティブバー変更時の高速色更新（データ不変で chart.update('none')）
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

// キーボード矢印操作でバー間フォーカス移動 (循環)
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

// フォーカス喪失時にアクティブ解除
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
