# 数据驱动

作为Vue.js 核心思想之一的数据驱动，是指视图是由数据驱动生成的；这使得我们只关心数据的修改会让代码的逻辑变的非常清晰，因为 DOM 变成了数据的映射，我们所有的逻辑都是对数据的修改，而不用碰触 DOM，这样的代码非常利于维护。

Vue实现了采用模板语法来声明式的将数据渲染为 DOM，本部分研究模板和数据如何渲染成最终的 DOM，对于 ”数据更新驱动视图变化“ 放在另一部分；

# new Vue 发生了什么（初始化）

`new Vue()` 即通过构造函数实例化一个类，注意到 `core/instace/index.js` 的构造函数内部代码：

```js
// src/core/instance/index.js
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

**总结**：`mountComponent` 方法的逻辑会完成整个渲染工作，其中包含关键方法 `vm._render` 和 `vm._update`。

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

其中渲染函数所需要的 `vm.$createElement`，在 `Vue.prototype._render` 同一文件的 `initRender` 内初始化给实例：

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

Virtual DOM 实际上是一个树状结构，每一个 VNode 可能会有若干个子节点，这些子节点应该也是 VNode 的类型。`_createElement` 接收的第 4 个参数 children 是任意类型的，因此我们需要把它们规范成 VNode 类型。

```js
export function _createElement (
  context: Component,
  tag?: string | Class<Component> | Function | Object,
  data?: VNodeData,
  children?: any,
  normalizationType?: number
): VNode | Array<VNode> {
  // ......
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children)
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children)
  }
  // ......
}
```

这里根据 `normalizationType` 的不同，调用了 `normalizeChildren(children)` 和 `simpleNormalizeChildren(children)` 方法，它们的定义都在 `core/vdom/helpers/normalzie-children.js` 中：

```js
// src/core/vdom/helpers/normalzie-children.js
export function simpleNormalizeChildren (children: any) {
  for (let i = 0; i < children.length; i++) {
    if (Array.isArray(children[i])) {
      // 存在任意数组项，则打平数组
      return Array.prototype.concat.apply([], children)
    }
  }
  return children
}
export function normalizeChildren (children: any): ?Array<VNode> {
  return isPrimitive(children)
    ? [createTextVNode(children)]
    : Array.isArray(children)
      ? normalizeArrayChildren(children)
      : undefined
}
```

`normalizationType` 由 `$createElement` 和 `_c` 方法定义时传递给 `_createElement` 第4个参数决定；这区分了：

`simpleNormalizeChildren` 方法调用场景是 `render` 函数是编译生成的。理论上编译生成的 `children` 都已经是 VNode 类型的，但这里有一个例外，就是 `functional component` 函数式组件返回的是一个数组而不是一个根节点，所以会通过 `Array.prototype.concat` 方法把整个 `children` 数组打平，让它的深度只有一层。

`normalizeChildren` 方法的调用场景有 2 种，一个场景是 `render` 函数是用户手写的，当 `children` 只有一个节点的时候，Vue.js 从接口层面允许用户把 `children` 写成基础类型用来创建单个简单的文本节点，这种情况会调用 `createTextVNode` 创建一个文本节点的 VNode；另一个场景是当编译 `slot`、`v-for` 的时候会产生嵌套数组的情况，会调用 `normalizeArrayChildren` 方法：

```js
// src/core/vdom/helpers/normalzie-children.js
// 主要处理：基础类型child转VNode，以及合并连续文本子节点的child
function normalizeArrayChildren (children: any, nestedIndex?: string): Array<VNode> {
  const res = []
  let i, c, lastIndex, last
  for (i = 0; i < children.length; i++) {
    c = children[i]
    lastIndex = res.length - 1
    last = res[lastIndex]
    //  nested
    if (Array.isArray(c)) {
      if (c.length > 0) {
        c = normalizeArrayChildren(c, `${nestedIndex || ''}_${i}`)
        // merge adjacent text nodes
        if (isTextNode(c[0]) && isTextNode(last)) {
          res[lastIndex] = createTextVNode(last.text + (c[0]: any).text)
          c.shift()
        }
        res.push.apply(res, c)
      }
    } else if (isPrimitive(c)) {
      if (isTextNode(last)) {
        // merge adjacent text nodes
        // this is necessary for SSR hydration because text nodes are
        // essentially merged when rendered to HTML strings
        res[lastIndex] = createTextVNode(last.text + c)
      } else if (c !== '') {
        // convert primitive to vnode
        res.push(createTextVNode(c))
      }
    } else {
      if (isTextNode(c) && isTextNode(last)) {
        // merge adjacent text nodes
        res[lastIndex] = createTextVNode(last.text + c.text)
      } else {
        // default key for nested array children (likely generated by v-for)
        if (isTrue(children._isVList) &&
          isDef(c.tag) &&
          isUndef(c.key) &&
          isDef(nestedIndex)) {
          c.key = `__vlist${nestedIndex}_${i}__`
        }
        res.push(c)
      }
    }
  }
  return res
}
```

`normalizeArrayChildren` 接收 2 个参数，`children` 表示要规范的子节点，`nestedIndex` 表示嵌套的索引，因为单个 `child` 可能是一个数组类型。 `normalizeArrayChildren` 主要的逻辑就是遍历 `children`，获得单个节点 `c`，然后对 `c` 的类型判断，

如果是一个数组类型，则递归调用 `normalizeArrayChildren`; 

如果是基础类型，则通过 `createTextVNode` 方法转换成 VNode 类型；

否则就已经是 VNode 类型了，如果 `children` 是一个列表并且列表还存在嵌套的情况，则根据 `nestedIndex` 去更新它的 key。这里需要注意一点，在遍历的过程中，对这 3 种情况都做了如下处理：

如果存在两个连续的 `text` 节点，会把它们合并成一个 `text` 节点。

经过对 `children` 的规范化，`children` 变成了一个类型为 VNode 的 Array；

## VNode的创建

回到 `createElement` 函数，规范化 `children` 后，接下来会去创建一个 VNode 的实例：

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
  let vnode, ns
  if (typeof tag === 'string') {
    let Ctor
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag)
    if (config.isReservedTag(tag)) {
      vnode = new VNode(
        config.parsePlatformTagName(tag), data, children,
        undefined, undefined, context
      )
    } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
      // component
      vnode = createComponent(Ctor, data, context, children, tag)
    } else {
      // unknown or unlisted namespaced elements
      // check at runtime because it may get assigned a namespace when its
      // parent normalizes children
      vnode = new VNode(
        tag, data, children,
        undefined, undefined, context
      )
    }
  } else {
    // direct component options / constructor
    vnode = createComponent(tag, data, context, children)
  } 
}
```

如果是 `string` 类型，则接着判断如果是内置的一些节点，则直接创建一个普通 VNode，

如果是为已注册的组件名，则通过 `createComponent` 创建一个组件类型的 VNode，

否则创建一个未知的标签的 VNode。 

如果是 `tag` 一个 `Component` 类型，则直接调用 `createComponent` 创建一个组件类型的 VNode 节点。对于 `createComponent` 创建组件类型的 VNode 的过程，我们之后会去介绍，本质上它还是返回了一个 VNode。

那么至此，我们大致了解了 `createElement` 创建 VNode 的过程，每个 VNode 有 `children`，`children` 每个元素也是一个 VNode，这样就形成了一个 VNode Tree，它很好的描述了我们的 DOM Tree。

# update

Vue 的 `_update` 是实例的一个私有方法，它被调用的时机有 2 个，一个是首次渲染，一个是数据更新的时候；`core/instance/lifecycle.js`：

```js
// src/core/instance/lifecycle.js
export function lifecycleMixin (Vue: Class<Component>) {
  Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
    const vm: Component = this
    const prevEl = vm.$el
    const prevVnode = vm._vnode
    const restoreActiveInstance = setActiveInstance(vm)
    vm._vnode = vnode
    // Vue.prototype.__patch__ is injected in entry points 定义在入口文件
    // based on the rendering backend used.
    if (!prevVnode) {
      // initial render
      vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
    } else {
      // updates
      vm.$el = vm.__patch__(prevVnode, vnode)
    }
    // ......
  } 
}
```

`_update` 的核心就是调用 `vm.__patch__` 方法，定义在各平台入口文件：

```js
// src/platforms/web/runtime/index.js
import { patch } from './patch'  // src/platforms/web/runtime/patch.js
// ......
Vue.prototype.__patch__ = inBrowser ? patch : noop
```

甚至在 web 平台上，是否是服务端渲染也会对这个方法产生影响。因为在服务端渲染中，没有真实的浏览器 DOM 环境，所以不需要把 VNode 最终转换成 DOM，因此是一个空函数，而在浏览器端渲染中，它指向了 `patch` 方法，它的定义在 `platforms/web/runtime/patch.js` 中：

```js
// src/platforms/web/runtime/patch.js
import { createPatchFunction } from 'core/vdom/patch'
import baseModules from 'core/vdom/modules/index'
import platformModules from 'web/runtime/modules/index'

const modules = platformModules.concat(baseModules)
export const patch: Function = createPatchFunction({ nodeOps, modules })
```

调用 `createPatchFunction` 方法的返回值，这里传入了一个对象，包含 `nodeOps` 参数和 `modules` 参数。其中：

`nodeOps` 封装了一系列 DOM 操作的方法；

`modules` 定义了一些模块的钩子函数的实现；

查看 `createPatchFunction` 实现：

```js
// src/core/vdom/patch.js
export function createPatchFunction (backend) { 
  function createElm
  function createComponent
  function initComponent
  function reactivateComponent
  function insert
  function createChildren
  function isPatchable
  function invokeCreateHooks
  function setScope
  function addVnodes
  function invokeDestroyHook
  function removeVnodes
  function removeAndInvokeRemoveHook
  function updateChildren
  function checkDuplicateKeys
  function findIdxInOld
  function patchVnode
  function invokeInsertHook
  function hydrate
  function assertNodeMatch
  return function patch (oldVnode, vnode, hydrating, removeOnly) {
    // ......
  }
}
```

`createPatchFunction` 内部定义了一系列的辅助方法，最终返回了一个 `patch` 方法，这个方法就赋值给了 `vm._update` 函数里调用的 `vm.__patch__`。

为何 Vue.js 源码绕了这么一大圈，把相关代码分散到各个目录。因为前面介绍过，`patch` 是平台相关的，在 Web 和 Weex 环境，它们把虚拟 DOM 映射到 “平台 DOM” 的方法是不同的，并且对 “DOM” 包括的属性模块创建和更新也不尽相同。因此每个平台都有各自的 `nodeOps` 和 `modules`，它们的代码需要托管在 `src/platforms` 这个大目录下。

而不同平台的 `patch` 的主要逻辑部分是相同的，所以这部分公共的部分托管在 `core` 这个大目录下。差异化部分只需要通过参数来区别，这里用到了一个函数柯里化的技巧，通过 `createPatchFunction` 把差异化参数提前固化，这样不用每次调用 `patch` 的时候都传递 `nodeOps` 和 `modules` 了，这种编程技巧也非常值得学习。

## patch

通过update（更新视图）是基于 patch 方法比对，例如：

```js
var app = new Vue({
  el: '#app',
  render: function (createElement) {
    return createElement('div', {
      attrs: {
        id: 'app'
      },
    }, this.message)
  },
  data: {
    message: 'Hello Vue!'
  }
})
```

`vm._update` 调用 `patch` 如下：

```js
// initial render
vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
```

回到 `patch` 方法本身，它接收 4个参数：

`oldVnode` 表示旧的 VNode 节点，它也可以不存在或者是一个 DOM 对象；这里是我们在 index.html 模板中写的 `<div id="app">`

`vnode` 表示执行 `_render` 后返回的 VNode 的节点；

`hydrating` 表示是否是服务端渲染；

`removeOnly` 是给 `transition-group` 用的，

```js
// src/core/vdom/patch.js
export function createPatchFunction (backend) {
  // ......
  return function patch (oldVnode, vnode, hydrating, removeOnly) {\
    // .....
    let isInitialPatch = false
    const insertedVnodeQueue = []

    if (isUndef(oldVnode)) {
      // empty mount (likely as component), create new root element
      isInitialPatch = true
      createElm(vnode, insertedVnodeQueue)
    } else {
      const isRealElement = isDef(oldVnode.nodeType)
      if (!isRealElement && sameVnode(oldVnode, vnode)) {
        // patch existing root node：patch已存在的vnode根节点
        patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly)
      } else {
        if (isRealElement) {
          if (oldVnode.nodeType === 1 && oldVnode.hasAttribute(SSR_ATTR)) {
            oldVnode.removeAttribute(SSR_ATTR)
            hydrating = true
          }
          // ......
          oldVnode = emptyNodeAt(oldVnode)  // 将element转为emptyNode
        }

        // replacing existing element
        const oldElm = oldVnode.elm
        const parentElm = nodeOps.parentNode(oldElm)

        // create new node
        createElm(
          vnode,
          insertedVnodeQueue,
          oldElm._leaveCb ? null : parentElm,
          nodeOps.nextSibling(oldElm)
        )
        // ......
      }
    }
    // 
    invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch)
    return vnode.elm
  }
}
```

我们传入的 `oldVnode` 实际上是一个 DOM container，所以 `isRealElement` 为 true，接下来又通过 `emptyNodeAt` 方法把 `oldVnode` 转换成 `VNode` 对象，然后再调用 `createElm` 方法：

```js
// src/core/vdom/patch.js
  function createElm (
    vnode,
    insertedVnodeQueue,
    parentElm,
    refElm,
    nested,
    ownerArray,
    index
  ) {
    // ......
    vnode.isRootInsert = !nested // for transition enter check
    // 去创建组件
    if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
      return
    }

    const data = vnode.data
    const children = vnode.children
    const tag = vnode.tag
    if (isDef(tag)) {
      // ......
      // 占位符元素
      vnode.elm = vnode.ns
        ? nodeOps.createElementNS(vnode.ns, tag)
        : nodeOps.createElement(tag, vnode)
      setScope(vnode)

      /* istanbul ignore if */
      if (__WEEX__) {
        // ......
      } else {
        createChildren(vnode, children, insertedVnodeQueue)
        if (isDef(data)) {
          invokeCreateHooks(vnode, insertedVnodeQueue)
        }
        insert(parentElm, vnode.elm, refElm)
      }
      // ......
    } else if (isTrue(vnode.isComment)) {
      vnode.elm = nodeOps.createComment(vnode.text)
      insert(parentElm, vnode.elm, refElm)
    } else {
      vnode.elm = nodeOps.createTextNode(vnode.text)
      insert(parentElm, vnode.elm, refElm)
    }
  }
```

判断 `vnode` 是否包含 tag，去调用平台 DOM 的操作去创建一个占位符元素

```js
vnode.elm = vnode.ns
  ? nodeOps.createElementNS(vnode.ns, tag)
  : nodeOps.createElement(tag, vnode)
```

调用 `createChildren` 方法去创建子元素：

```js
// src/core/vdom/patch.js
createChildren(vnode, children, insertedVnodeQueue)

function createChildren (vnode, children, insertedVnodeQueue) {
  if (Array.isArray(children)) {
    if (process.env.NODE_ENV !== 'production') {
      checkDuplicateKeys(children)
    }
    for (let i = 0; i < children.length; ++i) {
      createElm(children[i], insertedVnodeQueue, vnode.elm, null, true, children, i)
    }
  } else if (isPrimitive(vnode.text)) {
    nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(String(vnode.text)))
  }
}
```

接着再调用 `invokeCreateHooks` 方法执行所有的 create 的钩子并把 `vnode` push 到 `insertedVnodeQueue` 中。

```js
// src/core/vdom/patch.js
if (isDef(data)) {
  invokeCreateHooks(vnode, insertedVnodeQueue)
}

function invokeCreateHooks (vnode, insertedVnodeQueue) {
  for (let i = 0; i < cbs.create.length; ++i) {
    cbs.create[i](emptyNode, vnode)
  }
  i = vnode.data.hook // Reuse variable
  if (isDef(i)) {
    if (isDef(i.create)) i.create(emptyNode, vnode)
    if (isDef(i.insert)) insertedVnodeQueue.push(vnode)
  }
}
```

最后调用 `insert` 方法把 `DOM` 插入到父节点中，因为是递归调用，子元素会优先调用 `insert`，所以整个 `vnode` 树节点的插入顺序是先子后父。来看一下 `insert` 方法，它的定义在 `src/core/vdom/patch.js` 上。

```js
insert(parentElm, vnode.elm, refElm)

function insert (parent, elm, ref) {
  if (isDef(parent)) {
    if (isDef(ref)) {
      if (ref.parentNode === parent) {
        nodeOps.insertBefore(parent, elm, ref)
      }
    } else {
      nodeOps.appendChild(parent, elm)
    }
  }
}
```

在 `createElm` 过程中，如果 `vnode` 节点不包含 `tag`，则它有可能是一个注释或者纯文本节点，可以直接插入到父元素中。在我们这个例子中，最内层就是一个文本 `vnode`，它的 `text` 值取的就是之前的 `this.message` 的值 `Hello Vue!`。

再回到 `patch` 方法，首次渲染我们调用了 `createElm` 方法，这里传入的 `parentElm` 是 `oldVnode.elm` 的父元素，在我们的例子是 id 为 `#app` div 的父元素，也就是 Body；实际上整个过程就是递归创建了一个完整的 DOM 树并插入到 Body 上。

最后，我们根据之前递归 `createElm` 生成的 `vnode` 插入顺序队列，执行相关的 `insert` 钩子函数；

# 总结

至此我们从主线上把模板和数据如何渲染成最终的 DOM 的过程分析完毕了，我们可以通过下图更直观地看到从初始化 Vue 到最终渲染的整个过程。

![](https://raw.githubusercontent.com/KID-1912/Github-PicGo-Images/master/2024/10/16/20241016161014.png)

我们这里只是分析了最简单和最基础的场景，在实际项目中，我们是把页面拆成很多组件的，Vue 另一个核心思想就是组件化。那么下一章我们就来分析 Vue 的组件化过程。

**初始化和挂载**

`init` => platform各入口文件 `Vue.prototype.$mount` 重新定义（为了加上编译逻辑） => platform各平台runtime下  `Vue.prototype.$mount` 定义=>  lifeCycle的`mountComponnent` => `vm._render` 和 `vm._update`

**render**

 `vm._render` => `vm.$createElement` => vdom下 `createElement` 返回VNode

**update**

`vm._update` => platforms下定义的 `Vue.prototype.patch` => vdom/patch.js的`createPatchFunction` 返回的`patch` => `createPatchFunction` 内 `createElm` => 插入所有元素
