<template>
  <div class="option-list space-y-3">
    <ul class="space-y-2">
      <li v-for="(o, idx) in options" :key="o.id" class="flex items-center gap-3">
        <OptionItem
          :option="o"
          :index="idx"
          @update="onUpdate(idx, $event)"
          @remove="onRemove(idx)"
          @move-up="() => moveUp(idx)"
          @move-down="() => moveDown(idx)"
        />
      </li>
    </ul>
    <div class="pt-2">
      <button class="w-full rounded-xl py-3 text-xs sm:text-sm font-medium bg-primary-50 text-primary-600 hover:bg-primary-100 transition border border-primary-100" @click.prevent="addOption">選択肢を追加</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, toRaw, watch, toRef } from 'vue';
import OptionItem from '~/components/OptionItem.vue';
import type { Choice } from '~/types/models';
const props = defineProps<{ modelValue?: Array<Partial<Choice> & { id?: string }> }>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: Array<{ id: string; text: string; color?: string }> ): void;
}>();

type Opt = { id: string; text: string; color?: string };
// simple palette used for auto-assignment when adding or when incoming items lack color
const palette = ['#4F46E5', '#EC4899', '#F97316', '#10B981', '#06B6D4', '#F59E0B'];

const pickNextColor = (used: Set<string>) => {
  for (const c of palette) if (!used.has(c)) return c;
  // all used -> pick next by cycling
  return palette[used.size % palette.length];
};

// When loading existing modelValue, assign missing colors immediately and try to avoid duplicates
const initial: Opt[] = (() => {
  const items: Array<{ id: string; text: string; color: string }> = (props.modelValue || []).map(
    (o: any, i: number) => ({
      id: o.id || `opt_${i}_${Date.now()}`,
      text: o.text || '',
      color: (o.color || '').trim(),
    }),
  );
  const used = new Set<string>();
  return items.map((it: { id: string; text: string; color: string }, idx: number) => {
    if (it.color) {
      used.add(it.color);
      return it;
    }
    const c = pickNextColor(used);
    used.add(c);
    return { ...it, color: c };
  });
})();
const options = reactive(initial as Opt[]);

// Keep local options in sync when parent updates modelValue
const mv = toRef(props, 'modelValue');
watch(
  mv,
  (nv: any) => {
    if (!nv) return;
    const arr = nv as any[];
    // quick equality check: same length and same ids/text
    if (
      arr.length === options.length &&
      arr.every(
        (a, i) =>
          (a.id || '') === (options[i].id || '') &&
          String(a.text || '') === String(options[i].text || ''),
      )
    ) {
      return;
    }
    // replace array while preserving the same reactive object
    const newItems = arr.map((o: any, i: number) => {
      const existing = options[i];
      const id = o.id || (existing && existing.id) || `opt_${i}_${Date.now()}`;
      return { id, text: o.text || '', color: o.color || '' };
    });
    options.splice(0, options.length, ...newItems);
  },
  { deep: true },
);

const addOption = () => {
  const used = new Set<string>(options.map((o: Opt) => (o.color || '').toString()).filter(Boolean));
  const color = pickNextColor(used);
  options.push({ id: `opt_${options.length}_${Date.now()}`, text: '', color });
  emit('update:modelValue', toRaw(options));
};

const moveUp = (idx: number) => {
  if (idx <= 0) return;
  const [item] = options.splice(idx, 1);
  options.splice(idx - 1, 0, item);
  emit('update:modelValue', toRaw(options));
};

const moveDown = (idx: number) => {
  if (idx >= options.length - 1) return;
  const [item] = options.splice(idx, 1);
  options.splice(idx + 1, 0, item);
  emit('update:modelValue', toRaw(options));
};

const onUpdate = (idx: number, opt: any) => {
  if (idx >= 0 && idx < options.length) {
    options[idx] = opt;
    emit('update:modelValue', toRaw(options));
  }
};
const onRemove = (idx: number) => {
  if (idx >= 0 && idx < options.length) {
    options.splice(idx, 1);
    emit('update:modelValue', toRaw(options));
  }
};

const emitUpdate = () => {
  emit('update:modelValue', toRaw(options));
};

// Note: do not auto-emit from watching `options` to avoid recursive update loops.
</script>

<style scoped>
.option-list {
  display: block;
}
</style>
