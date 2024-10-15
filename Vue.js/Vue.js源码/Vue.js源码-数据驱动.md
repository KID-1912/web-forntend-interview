# 数据驱动

作为Vue.js 核心思想之一的数据驱动，是指视图是由数据驱动生成的；这使得我们只关心数据的修改会让代码的逻辑变的非常清晰，因为 DOM 变成了数据的映射，我们所有的逻辑都是对数据的修改，而不用碰触 DOM，这样的代码非常利于维护。

Vue实现了采用模板语法来声明式的将数据渲染为 DOM，本部分研究模板和数据如何渲染成最终的 DOM，对于 ”数据更新驱动视图变化“ 放在另一部分；

# new Vue 发生了什么（初始化）

`new Vue()` 即通过构造函数实例化一个类，注意到 `core/instace.js` 的构造函数内部代码：

```js
// src/core/instance.js
import { initMixin } from './init'
// ......

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options) // 调用this._init，传入实例化参数
}

initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
```

仅执行了 `this._init(options)`，`_init` 方法是在 `initMixin(Vue)` 处理中为原型拓展的方法；可见 `core/init.js`：

```js
// src/core/init.js
// ......
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'

export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // ......合并配置到vm.$options
    vm._self = vm
    initLifecycle(vm) // 初始化声明周期
    initEvents(vm)  // 初始化事件
    initRender(vm)  // 初始化渲染
    callHook(vm, 'beforeCreate')
    initInjections(vm) // resolve injections before data/props
    initState(vm) // 初始化data
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')
    // ......
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)  // 挂载
    }
  }
}
```

整个 `_init` 方法处理包括：**合并配置**，**初始化生命周期**，**初始化事件中心**，**初始化渲染**，**初始化 data、props、computed、watcher** 等等。

跳过初始化逻辑，我们注意到 `vm.mount(vm.options.el)`，去查看挂载逻辑

# Vue 实例挂载

`$mount` 在多个文件有定义：

- `platforms/web/entry-runtime-with-compiler.js`

- `platform/web/runtime/index.js`

- `platform/weex/runtime/index.js`

这个方法的实现是和平台、构建方式都相关的；查看 `compiler` 版本的 `$mount` 实现：

```js
// platforms/web/entry-runtime-with-compiler.js

// ......
const mount = Vue.prototype.$mount // 缓存原型上$mount方法
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && query(el)
  // ......
  const options = this.$options
  // resolve template/el and convert to render function
  if (!options.render) {
    let template = options.template
    // ......
    if (template) {
      // ..... 
      // 编译模板语法为渲染函数
      const { render, staticRenderFns } = compileToFunctions(template, {
        outputSourceRange: process.env.NODE_ENV !== 'production',
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      options.render = render
      options.staticRenderFns = staticRenderFns
      // .....
    }
  }
  return mount.call(this, el, hydrating)
}
```

首先，缓存了原型上的 `$mount` 方法，再重新定义该方法；

接下来关键逻辑：如果没有定义 `render` 方法，则会把 `el.innerHTML` 或者 `template` 字符串转换成 `render` 方法到 `$options`。Vue 2.0 版本中，所有 Vue 的组件的渲染最终都需要 `render` 方法，调用 `compileToFunctions` 方法实现；

最后，调用原来 Vue.prototype 上 `$mount` 方法执行挂载；

原先的 `Vue.prototype.$mount` 在 `platforms/web/runtime.index.js` 定义，这是为了在 `Runtime Only` 和 `Runtime + Compiler` 都能复用；同理 `platforms/weex/runtime.index.js` 中也会定义 `$mount` 方法；

```js
// platforms/web/runtime/index.js
import { mountComponent } from 'core/instance/lifecycle'

// ......
// public mount method
Vue.prototype.$mount = function (
  el?: string | Element, // 挂载元素
  hydrating?: boolean  // 和服务端渲染相关参数
): Component {
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}
```

 注意到 `Vue.prototype.$mount` 内部调用了公共的核心代码目录下 `core/instance/lifecycle.js` 的 `mountComponent`：

```js
// src/core/instance/lifecycle.js
import Watcher from '../observer/watcher'

// ......

export function mountComponent (
  vm: Component,
  el: ?Element,
  hydrating?: boolean
): Component {
  vm.$el = el
  // ......
  callHook(vm, 'beforeMount')
  let updateComponent
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    updateComponent = () => {
      // ......
      const vnode = vm._render()
      // ......
      vm._update(vnode, hydrating)
      // ......
    }
  } else {
    updateComponent = () => {
      vm._update(vm._render(), hydrating)
    }
  } 
  new Watcher(vm, updateComponent, noop, {
    before () {
      if (vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'beforeUpdate')
      }
    }
  }, true /* isRenderWatcher */) // 内部会立即调用一次updateComponent
  // 判断为根节点，则实例已经挂载了
  if (vm.$vnode == null) {
    vm._isMounted = true
    callHook(vm, 'mounted')
  }
  return vm
}
```

`mountComponent` 挂载组件逻辑中，会定义组件的更新方法 `updateComponent`，它会调用 `vm._render` 方法先生成虚拟 Node，最终调用 `vm._update` 更新 DOM；

另一个逻辑是创建渲染 Watcher，它有两个作用：一个是初始化的时候会执行回调函数，另一个是当 vm 实例中的监测的数据发生变化的时候执行回调函数，

**总结**：`mountComponent` 方法的逻辑会完成整个渲染工作，其中包含关键方法`vm._render` 和 `vm._update`。

# render

`_render` 方法是实例的一个私有方法，它用来把实例渲染成一个虚拟 Node。它的定义在 `core/instance/render.js`，在 `core/instance/index.js` 中拓展到原型

```js
// src/core/instance/render.js
export function renderMixin (Vue: Class<Component>) {
  // install runtime convenience helpers
  installRenderHelpers(Vue.prototype)
  // ......
  Vue.prototype._render = function (): VNode {
    const vm: Component = this
    const { render, _parentVnode } = vm.$options // 取出vm的渲染函数
    // ......
    try {
      // There's no need to maintain a stack because all render fns are called
      // separately from one another. Nested component's render fns are called
      // when parent component is patched.
      currentRenderingInstance = vm
      vnode = render.call(vm._renderProxy, vm.$createElement)
    } catch (e) {
      // ......
    }
    // ......
  } 
  // ......
}
```

在之前的 `mounted` 方法的实现中，会把 `template` 编译成 `render` 方法；

这里关键是 `render` 方法的调用，官方文档的 render 选项就被视为该方法，`render` 函数的第一个参数是 `createElement`，类似：

```js
render: function (createElement) {
  return createElement('div', {
     attrs: {
        id: 'app'
      },
  }, this.message)
}
```

`_render` 的调用是 `vnode = render.call(vm._renderProxy, vm.$createElement)`

其中渲染函数多需要的 `vm.$createElement`，在 `Vue.prototype._render` 同一文件的 `initRender` 内初始化给实例：

```js
export function initRender (vm: Component) {
  vm._vnode = null // the root of the child tree
  vm._staticTrees = null // v-once cached trees
  // .....
  // bind the createElement fn to this instance
  // so that we get proper render context inside it.
  // args order: tag, data, children, normalizationType, alwaysNormalize
  // internal version is used by render functions compiled from templates
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
  // normalization is always applied for the public version, used in
  // user-written render functions.
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)
```

注意到 `vm.$createElement` 和 `vm._c`，前者是用户手写 `render` 方法使用的，后者是被模板编译成的 `render` 函数中使用；

`vm._render` 最终是通过执行 `createElement` 方法并返回的是 `vnode`，它是一个虚拟 Node；

# Virtual DOM

用一个原生的 JS 对象去描述一个 DOM 节点；在 Vue.js 中，Virtual DOM 是用 `VNode` 这么一个 Class 去描述，可见 `core/vdom/vnode.js`：

```js
// src/core/vdom/vnode.js
export default class VNode {
  tag: string | void;
  data: VNodeData | void;
  children: ?Array<VNode>;
  text: string | void; 
  // ......
  constructor (
    tag?: string,
    data?: VNodeData,
    children?: ?Array<VNode>,
    text?: string,
    elm?: Node,
    context?: Component,
    componentOptions?: VNodeComponentOptions,
    asyncFactory?: Function
  ) {
    this.tag = tag
    this.data = data
    this.children = children
    this.text = text
    // ......
  }
}
export const createEmptyVNode = (text: string = '') => { ... }
export function createTextVNode (val: string | number) { ... }
export function cloneVNode (vnode: VNode): VNode { ... }
```

# createElement

Vue.js 利用 createElement 方法创建 VNode，见 `core/vdom/create-element.js`：

```js
// src/core/vdom/create-element.js
export function createElement (
  context: Component,
  tag: any,
  data: any,
  children: any,
  normalizationType: any,
  alwaysNormalize: boolean
): VNode | Array<VNode> {
  // ......
  return _createElement(context, tag, data, children, normalizationType)
}
export function _createElement(){ // ...... }
```

`createElement` 是对 `_createElement` 方法的封装，调用真正创建 VNode 的函数 `_createElement`：

```js
// src/core/vdom/create-element.js
export function _createElement (
  context: Component,
  tag?: string | Class<Component> | Function | Object,
  data?: VNodeData,
  children?: any,
  normalizationType?: number
): VNode | Array<VNode> {
  // ......
}
```

`_createElement` 方法有 5 个参数：

`context` 表示 VNode 的上下文环境，它是 `Component` 类型；

`tag` 表示标签，它可以是一个字符串，也可以是一个 `Component`；

`data` 表示 VNode 的数据，它是一个 `VNodeData` 类型，可以在 `flow/vnode.js` 中找到它的定义，这里先不展开说；

`children` 表示当前 VNode 的子节点，它是任意类型的，它接下来需要被规范为标准的 VNode 数组；

`normalizationType` 表示子节点规范的类型，类型不同规范的方法也就不一样，它主要是参考 `render` 函数是编译生成的还是用户手写的。

createElement的流程中，重点是 **`children` 的规范化**以及 **VNode 的创建**：

## children 的规范化


