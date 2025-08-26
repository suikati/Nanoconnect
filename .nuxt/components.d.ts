
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T extends DefineComponent> = T & DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>>
type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = (T & DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }>)
interface _GlobalComponents {
      'CommentItem': typeof import("../components/CommentItem.vue")['default']
    'LiveComment': typeof import("../components/LiveComment.vue")['default']
    'OptionItem': typeof import("../components/OptionItem.vue")['default']
    'OptionList': typeof import("../components/OptionList.vue")['default']
    'PlayByPlay': typeof import("../components/PlayByPlay.vue")['default']
    'VoteChart': typeof import("../components/VoteChart.vue")['default']
    'VoteOption': typeof import("../components/VoteOption.vue")['default']
    'UiAppShell': typeof import("../components/ui/AppShell.vue")['default']
    'UiButton': typeof import("../components/ui/UiButton.vue")['default']
    'UiCard': typeof import("../components/ui/UiCard.vue")['default']
    'NuxtWelcome': typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/welcome.vue")['default']
    'NuxtLayout': typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-layout")['default']
    'NuxtErrorBoundary': typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
    'ClientOnly': typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/client-only")['default']
    'DevOnly': typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/dev-only")['default']
    'ServerPlaceholder': typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/server-placeholder")['default']
    'NuxtLink': typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-link")['default']
    'NuxtLoadingIndicator': typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
    'NuxtTime': typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
    'NuxtRouteAnnouncer': typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
    'NuxtImg': typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
    'NuxtPicture': typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
    'NuxtPage': typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/pages/runtime/page")['default']
    'NoScript': typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['NoScript']
    'Link': typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Link']
    'Base': typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Base']
    'Title': typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Title']
    'Meta': typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Meta']
    'Style': typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Style']
    'Head': typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Head']
    'Html': typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Html']
    'Body': typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Body']
    'NuxtIsland': typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-island")['default']
    'NuxtRouteAnnouncer': typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/server-placeholder")['default']
      'LazyCommentItem': LazyComponent<typeof import("../components/CommentItem.vue")['default']>
    'LazyLiveComment': LazyComponent<typeof import("../components/LiveComment.vue")['default']>
    'LazyOptionItem': LazyComponent<typeof import("../components/OptionItem.vue")['default']>
    'LazyOptionList': LazyComponent<typeof import("../components/OptionList.vue")['default']>
    'LazyPlayByPlay': LazyComponent<typeof import("../components/PlayByPlay.vue")['default']>
    'LazyVoteChart': LazyComponent<typeof import("../components/VoteChart.vue")['default']>
    'LazyVoteOption': LazyComponent<typeof import("../components/VoteOption.vue")['default']>
    'LazyUiAppShell': LazyComponent<typeof import("../components/ui/AppShell.vue")['default']>
    'LazyUiButton': LazyComponent<typeof import("../components/ui/UiButton.vue")['default']>
    'LazyUiCard': LazyComponent<typeof import("../components/ui/UiCard.vue")['default']>
    'LazyNuxtWelcome': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/welcome.vue")['default']>
    'LazyNuxtLayout': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
    'LazyNuxtErrorBoundary': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
    'LazyClientOnly': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/client-only")['default']>
    'LazyDevOnly': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/dev-only")['default']>
    'LazyServerPlaceholder': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/server-placeholder")['default']>
    'LazyNuxtLink': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-link")['default']>
    'LazyNuxtLoadingIndicator': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
    'LazyNuxtTime': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
    'LazyNuxtRouteAnnouncer': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
    'LazyNuxtImg': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
    'LazyNuxtPicture': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
    'LazyNuxtPage': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/pages/runtime/page")['default']>
    'LazyNoScript': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['NoScript']>
    'LazyLink': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Link']>
    'LazyBase': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Base']>
    'LazyTitle': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Title']>
    'LazyMeta': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Meta']>
    'LazyStyle': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Style']>
    'LazyHead': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Head']>
    'LazyHtml': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Html']>
    'LazyBody': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Body']>
    'LazyNuxtIsland': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-island")['default']>
    'LazyNuxtRouteAnnouncer': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/server-placeholder")['default']>
}

declare module 'vue' {
  export interface GlobalComponents extends _GlobalComponents { }
}

export const CommentItem: typeof import("../components/CommentItem.vue")['default']
export const LiveComment: typeof import("../components/LiveComment.vue")['default']
export const OptionItem: typeof import("../components/OptionItem.vue")['default']
export const OptionList: typeof import("../components/OptionList.vue")['default']
export const PlayByPlay: typeof import("../components/PlayByPlay.vue")['default']
export const VoteChart: typeof import("../components/VoteChart.vue")['default']
export const VoteOption: typeof import("../components/VoteOption.vue")['default']
export const UiAppShell: typeof import("../components/ui/AppShell.vue")['default']
export const UiButton: typeof import("../components/ui/UiButton.vue")['default']
export const UiCard: typeof import("../components/ui/UiCard.vue")['default']
export const NuxtWelcome: typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/welcome.vue")['default']
export const NuxtLayout: typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-layout")['default']
export const NuxtErrorBoundary: typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
export const ClientOnly: typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/client-only")['default']
export const DevOnly: typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/dev-only")['default']
export const ServerPlaceholder: typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const NuxtLink: typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-link")['default']
export const NuxtLoadingIndicator: typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
export const NuxtTime: typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
export const NuxtRouteAnnouncer: typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
export const NuxtImg: typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
export const NuxtPicture: typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
export const NuxtPage: typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/pages/runtime/page")['default']
export const NoScript: typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['NoScript']
export const Link: typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Link']
export const Base: typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Base']
export const Title: typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Title']
export const Meta: typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Meta']
export const Style: typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Style']
export const Head: typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Head']
export const Html: typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Html']
export const Body: typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Body']
export const NuxtIsland: typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-island")['default']
export const NuxtRouteAnnouncer: typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const LazyCommentItem: LazyComponent<typeof import("../components/CommentItem.vue")['default']>
export const LazyLiveComment: LazyComponent<typeof import("../components/LiveComment.vue")['default']>
export const LazyOptionItem: LazyComponent<typeof import("../components/OptionItem.vue")['default']>
export const LazyOptionList: LazyComponent<typeof import("../components/OptionList.vue")['default']>
export const LazyPlayByPlay: LazyComponent<typeof import("../components/PlayByPlay.vue")['default']>
export const LazyVoteChart: LazyComponent<typeof import("../components/VoteChart.vue")['default']>
export const LazyVoteOption: LazyComponent<typeof import("../components/VoteOption.vue")['default']>
export const LazyUiAppShell: LazyComponent<typeof import("../components/ui/AppShell.vue")['default']>
export const LazyUiButton: LazyComponent<typeof import("../components/ui/UiButton.vue")['default']>
export const LazyUiCard: LazyComponent<typeof import("../components/ui/UiCard.vue")['default']>
export const LazyNuxtWelcome: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/welcome.vue")['default']>
export const LazyNuxtLayout: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
export const LazyNuxtErrorBoundary: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
export const LazyClientOnly: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/client-only")['default']>
export const LazyDevOnly: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/dev-only")['default']>
export const LazyServerPlaceholder: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/server-placeholder")['default']>
export const LazyNuxtLink: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-link")['default']>
export const LazyNuxtLoadingIndicator: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
export const LazyNuxtTime: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
export const LazyNuxtImg: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
export const LazyNuxtPicture: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
export const LazyNuxtPage: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/pages/runtime/page")['default']>
export const LazyNoScript: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['NoScript']>
export const LazyLink: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Link']>
export const LazyBase: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Base']>
export const LazyTitle: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Title']>
export const LazyMeta: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Meta']>
export const LazyStyle: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Style']>
export const LazyHead: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Head']>
export const LazyHtml: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Html']>
export const LazyBody: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/head/runtime/components")['Body']>
export const LazyNuxtIsland: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/nuxt-island")['default']>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.18.1_@types+node@20.19.11_@vue+compiler-sfc@3.5.20_typescript@5.9.2_vite@7.1.3/node_modules/nuxt/dist/app/components/server-placeholder")['default']>

export const componentNames: string[]
