# 目录设计

源码地址：[GitHub - vuejs/vue: This is the repo for Vue 2. ](https://github.com/vuejs/vue/tree/main)

```
package
├──compiler-sfc # 单文件组件编译
src
├──compiler  # 编译相关
├──core      # 核心源码
├──platforms # 多平台支持
├──shared    # 共享代码
├──types     # 共享代码
├──v3
```

**compiler**：compiler 目录包含 Vue.js 所有编译相关的代码

**core**： Vue.js 的核心代码，包括内置组件、全局 API 封装，Vue 实例化、观察者、虚拟 DOM、工具函数等等

**platforms**：Vue.js 的入口，2 个目录代表 2 个主要入口，分别打包成运行在 web 上和 weex 上的 Vue.js

**shared**：一些共享的工具方法，这里定义的都是被浏览器端的 Vue.js 和服务端的 Vue.js 所共享

# 构建

## 构建脚本

`package.json` 文件的 `scripts` 字段包含脚本：

```json
{
  "build": "node scripts/build.js",
  "build:ssr": "npm run build -- runtime-cjs,server-renderer",
  "build:types": "rimraf temp && tsc --declaration --emitDeclarationOnly --outDir temp && api-extractor run && api-extractor run -c packages/compiler-sfc/api-extractor.json",
}
```

**构建脚本** `scripts/build.js`

```js
let builds = require('./config').getAllBuilds()

// 读取构建配置，并根据构建命令参数过滤构建配置
if (process.argv[2]) {
  const filters = process.argv[2].split(',')
  builds = builds.filter(b => {
    return filters.some(f => b.output.file.indexOf(f) > -1 || b._name.indexOf(f) > -1)
  })
}

build(builds)
```

**构建配置** `scripts/config.js`

```js
const builds = {
  // Runtime only (CommonJS). Used by bundlers e.g. Webpack & Browserify
  'runtime-cjs-dev': {
    entry: resolve('web/entry-runtime.ts'),
    dest: resolve('dist/vue.runtime.common.dev.js'),
    format: 'cjs',
    env: 'development',
    banner
  },
  'runtime-cjs-prod': {
    entry: resolve('web/entry-runtime.ts'),
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
