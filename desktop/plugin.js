// RTK — Hermes Desktop UI (unified package side).
// Disk plugins load UNCOMPILED: write UI with jsx()/jsxs() from
// react/jsx-runtime; only @hermes/plugin-sdk, react, react/jsx-runtime import.
// Optional starter UI — remove `desktop/` if you don't want it.
import { host, useValue } from '@hermes/plugin-sdk'
import { jsx, jsxs } from 'react/jsx-runtime'

function RtkPane() {
  const gateway = useValue(host.state.gateway)
  return jsxs('div', {
    className: 'flex h-full flex-col gap-2 p-3 text-sm',
    children: [
      jsx('div', { className: 'font-medium', children: 'RTK — Hermes plugin' }),
      jsx('div', {
        className: 'text-(--ui-text-tertiary)',
        children:
          'Rewrites Hermes terminal commands through `rtk rewrite` before execution, cutting token usage on common dev commands (git, cargo/npm test, ls, grep…). All rewrite logic lives in the rtk Rust binary.',
      }),
      jsx('div', { className: 'text-(--ui-text-tertiary)', children: `gateway: ${gateway}` }),
      jsx('div', {
        className: 'mt-auto text-(--ui-text-tertiary)',
        children:
          'v1.0.0 · community (non-official) · kerrz2020/hermes-rtk-rewrite · upstream: rtk-ai/rtk (Apache-2.0)',
      }),
    ],
  })
}

export default {
  id: 'rtk-rewrite', // must match the folder descriptor
  name: 'RTK',
  defaultEnabled: true,
  register(ctx) {
    ctx.register({
      id: 'pane',
      area: 'panes',
      title: 'rtk',
      data: { placement: 'right', width: '260px' },
      render: () => jsx(RtkPane, {}),
    })
    ctx.register({
      id: 'chip',
      area: 'statusBar.right',
      order: 130,
      render: () =>
        jsx('button', {
          type: 'button',
          className: 'px-1.5 text-[0.6875rem] text-(--ui-text-tertiary)',
          onClick: () =>
            host.notify({
              kind: 'info',
              message: 'RTK active — terminal commands are rewritten via rtk rewrite',
            }),
          children: 'rtk',
        }),
    })
  },
}