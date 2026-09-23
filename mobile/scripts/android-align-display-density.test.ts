import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const { injectAttachBaseContext } = require('../plugins/android-align-display-density.js') as {
  injectAttachBaseContext: (source: string, className: string, method?: string) => string
}

const activity = `package com.example

class MainActivity : ReactActivity() {
  override fun getMainComponentName(): String = "main"
}
`

describe('android-align-display-density plugin', () => {
  it('routes attachBaseContext through the density helper, once', () => {
    const once = injectAttachBaseContext(activity, 'MainActivity')
    expect(once).toContain('super.attachBaseContext(OrcaDisplayDensity.wrap(base))')
    expect(injectAttachBaseContext(once, 'MainActivity')).toBe(once)
  })

  it('routes the Activity through the window-safe variant', () => {
    expect(injectAttachBaseContext(activity, 'MainActivity', 'wrapActivity')).toContain(
      'super.attachBaseContext(OrcaDisplayDensity.wrapActivity(base))'
    )
  })

  it('handles a class header with several supertypes', () => {
    const app = 'class MainApplication : Application(), ReactApplication {\n}\n'
    expect(injectAttachBaseContext(app, 'MainApplication')).toContain('OrcaDisplayDensity.wrap')
  })

  it('fails loudly when the class is missing', () => {
    expect(() => injectAttachBaseContext('object Foo {}', 'MainActivity')).toThrow(/not found/)
  })
})
