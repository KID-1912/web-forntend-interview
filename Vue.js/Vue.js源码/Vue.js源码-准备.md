# 目录设计

源码地址：[GitHub - vuejs/vue at 2.6](https://github.com/vuejs/vue/tree/2.6)

**vue2.6**

```
src
├── compiler        # 编译相关
├── core            # 核心代码
├── platforms       # 不同平台的支持
├── server          # 服务端渲染
├── sfc             # .vue 文件解析
├── shared          # 共享代码
```

**compiler**：compiler 目录包含 Vue.js 所有编译相关的代码

**core**： Vue.js 的核心代码，包括内置组件、全局 API 封装，Vue 实例化、观察者、虚拟 DOM、工具函数等等

**platforms**：Vue.js 的入口，2 个目录代表 2 个主要入口，分别打包成运行在 web 上和 weex 上的 Vue.js

**shared**：一些共享的工具方法，这里定义的都是被浏览器端的 Vue.js 和服务端的 Vue.js 所共享

`node_modules/@vue` 目录下存放vue生态的package集合，以 `@vue` 为命名空间

# 构建

## 构建脚本

`package.json` 文件的 `scripts` 字段包含脚本：

```json
{
  "build": "node scripts/build.js",
  "build:ssr": "npm run build -- web-runtime-cjs,web-server-renderer",
  "build:weex": "npm run build -- weex"
}
```

**构建脚本** `scripts/build.js`

```js
let builds = require('./config').getAllBuilds()

// filter builds via command line arg
if (process.argv[2]) {
  const filters = process.argv[2].split(',')
  builds = builds.filter(b => {
    return filters.some(f => b.output.file.indexOf(f) > -1 || b._name.indexOf(f) > -1)
  })
} else {
  // filter out weex builds by default
  builds = builds.filter(b => {
    return b.output.file.indexOf('weex') === -1
  })
}

build(builds)
```

**构建配置** `scripts/config.js`

```js
const builds = {
  // Runtime only (CommonJS). Used by bundlers e.g. Webpack & Browserify
  'web-runtime-cjs-dev': {
    entry: resolve('web/entry-runtime.js'),
    dest: resolve('dist/vue.runtime.common.dev.js'),
    format: 'cjs',
    env: 'development',
    banner
  },
  'web-runtime-cjs-prod': {
    entry: resolve('web/entry-runtime.js'),
    dest: resolve('dist/vue.runtime.common.prod.js'),
    format: 'cjs',
    env: 'production',
    banner
  },
  // ......
}
```

每个配置由 `src/platforms/web` 的各vue.js入口文件，按照 `format` `env` 定义多个打包输出配置；

配置文件中 `resolve` 方法，使用了 `scripts/alias.js` 定义的别名，主要是源代码 `src` 目录下各路径别名；

## Runtime/Compiler

vue-cli 去初始化我们的 Vue.js 项目的时候会询问我们用 Runtime Only 版本的还是 Runtime + Compiler 版本：

**Runtime Only**：它只包含运行时的 Vue.js 代码，需要借助如 webpack 的 vue-loader 工具把 .vue 文件编译成 JavaScript。

**Runtime + Compiler**：Vue.js的全版本，包含编译部分

# 入口开始

在web应用下，分析 Runtime + Compiler 构建出来的Vue.js，它的入口是 `src/platforms/web/entry-runtime-with-compiler.js`

```js
// platforms/web/entry-runtime-with-compiler.js
import config from 'core/config'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'

import Vue from './runtime/index'
import { query } from './util/index'
import { compileToFunctions } from './compiler/index'
import { shouldDecodeNewlines, shouldDecodeNewlinesForHref } from './util/compat'

// ......
```

当我们  `import Vue from 'vue'` 引入的Vue对象就是这个文件导出的；

## Vue 的入口

注意到 web 应用入口文件有代码 `import Vue from './runtime/index'`，从该文件引入Vue类；

```js
// platforms/web/entry-runtime-with-compiler.js
import Vue from 'core/index'
import config from 'core/config'
import { extend, noop } from 'shared/util'
import { mountComponent } from 'core/instance/lifecycle'
import { devtools, inBrowser } from 'core/util/index'
//...

// install platform specific utils
Vue.config.mustUseProp = mustUseProp
Vue.config.isReservedTag = isReservedTag
Vue.config.isReservedAttr = isReservedAttr
Vue.config.getTagNamespace = getTagNamespace
Vue.config.isUnknownElement = isUnknownElement

// 之后的逻辑都是对 Vue 这个对象做一些扩展
// ......
```

注意到第一行 `import Vue from 'core/index'`，开始指向 `src/core` 核心代码：

```js
// core/index.js
import Vue from './instance/index'
import { initGlobalAPI } from './global-api/index'
import { isServerRendering } from 'core/util/env'
import { FunctionalRenderContext } from 'core/vdom/create-functional-component'

initGlobalAPI(Vue)
// ......
```

## Vue定义

注意到 `import Vue from './instance/index'` 和 `initGlobalAPI`，这2个关键代码，先对Vue类追查到底 `core/instance/index.js`：

```js
// core/instance/index.js
import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

// 给 Vue 的 prototype 上扩展一些方法
initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
```

## initGlobalAPI

除了 `core/instance/index.js` 定义了Vue类并拓展原型，还有前面 `src/core/index.js`  中这行代码：

```js
// src/core/index.js
import Vue from './instance/index'
import { initGlobalAPI } from './global-api/index'
// ...
initGlobalAPI(Vue)
```

去查看 `core/global-api/index.js`：

```js
import config from '../config'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'

export function initGlobalAPI (Vue: GlobalAPI) {
  // config
  const configDef = {}
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  Object.defineProperty(Vue, 'config', configDef)

  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  extend(Vue.options.components, builtInComponents)

  initUse(Vue)
  initMixin(Vue)
  initExtend(Vue)
  initAssetRegisters(Vue)
}
```

可以看到 initGlobalAPI 是对 Vue 上扩展的一些全局方法的定义，如官网中关于全局 API `config`， `set`，`del` 等都在这里；
