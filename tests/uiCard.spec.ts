import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import UiCard from '~/components/ui/UiCard.vue';

const mountCard = (props: any = {}, slots: any = {}) => mount(UiCard, { props, slots });

describe('UiCard', () => {
  it('renders title and slot content', () => {
    const wrapper = mountCard({ title: 'Hello' }, { default: () => 'Body' });
    expect(wrapper.text()).toContain('Hello');
    expect(wrapper.text()).toContain('Body');
  });

  it('applies glass variant classes', () => {
    const wrapper = mountCard({ title: 'Glass', variant: 'glass' });
    const cls = wrapper.attributes('class') || '';
    expect(cls).toMatch(/glass/);
    expect(cls).toMatch(/bg-white\/55/);
  });

  it('supports solid variant', () => {
    const wrapper = mountCard({ variant: 'solid' });
    const cls = wrapper.attributes('class') || '';
    expect(cls).toMatch(/bg-white/);
  });

  it('interactive adds hover shadow transition', () => {
    const wrapper = mountCard({ interactive: true });
    expect(wrapper.attributes('class')).toMatch(/hocus:shadow-pop/);
  });
});
