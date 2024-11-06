# Vue-Router

Vue-Router 的能力十分强大，它支持 `hash`、`history`、`abstract` 3 种路由方式，提供了 `<router-link>` 和 `<router-view>` 2 种组件，还提供了简单的路由配置和一系列好用的 API。

**基础使用**

```html
<div id="app">
  <h1>Hello App!</h1>
  <p>
    <!-- 使用 router-link 组件来导航. -->
    <!-- 通过传入 `to` 属性指定链接. -->
    <!-- <router-link> 默认会被渲染成一个 `<a>` 标签 -->
    <router-link to="/foo">Go to Foo</router-link>
    <router-link to="/bar">Go to Bar</router-link>
  </p>
  <!-- 路由出口 -->
  <!-- 路由匹配到的组件将渲染在这里 -->
  <router-view></router-view>
</div>
```

```js
import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App'

Vue.use(VueRouter)

// 1. 定义（路由）组件。
// 可以从其他文件 import 进来
const Foo = { template: '<div>foo</div>' }
const Bar = { template: '<div>bar</div>' }

// 2. 定义路由
// 每个路由应该映射一个组件。 其中"component" 可以是
// 通过 Vue.extend() 创建的组件构造器，
// 或者，只是一个组件配置对象。
// 我们晚点再讨论嵌套路由。
const routes = [
  { path: '/foo', component: Foo },
  { path: '/bar', component: Bar }
]

// 3. 创建 router 实例，然后传 `routes` 配置
// 你还可以传别的配置参数, 不过先这么简单着吧。
const router = new VueRouter({
  routes // （缩写）相当于 routes: routes
})

// 4. 创建和挂载根实例。
// 记得要通过 router 配置参数注入路由，
// 从而让整个应用都有路由功能
const app = new Vue({
  el: '#app',
  render(h) {
    return h(App)
  },
  router
})
```

1. 定义路由

2. 创建router实例

3. 挂载根实例

## 路由注册

Vue 从它的设计上就是一个渐进式 JavaScript 框架，它本身的核心是解决视图渲染的问题，其它的能力就通过插件的方式来解决。Vue-Router 就是官方维护的路由插件，在介绍它的注册实现之前，我们先来分析一下 Vue 通用的插件注册原理。

### Vue.use

Vue 提供了 `Vue.use` 的全局 API 来注册插件，观察 `Vue.use` 内部实现

```js
// vue/src/core/global-api/use.js
export function initUse (Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | Object) {
    // 插件是否已安裝
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    const args = toArray(arguments, 1) // 提取 Vue 类
    args.unshift(this)
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args)
    }
    installedPlugins.push(plugin)
    return this
  }
}
```

Vue 提供的插件注册机制很简单，每个插件都需要实现一个静态的 `install` 方法，当我们执行 `Vue.use` 注册插件的时候，就会执行这个 `install` 方法，并且在这个 `install` 方法的第一个参数我们可以拿到 `Vue` 对象，这样的好处就是作为插件的编写方不需要再额外去`import Vue` 了。

### 路由安装

来到 Vue-Router 包的源码 的入口文件是 `src/index.js` 导出 VueRouter 类，其 `src/router.js` 中定义了 `VueRouter` 类 以及 `install` 的静态方法：`VueRouter.install = install`，它的定义在 `src/install.js` 中。

```

```


