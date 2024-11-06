# 数据驱动

## new Vue 干了什么？

1. 初始化

2. 编译 template 和挂载（render+update），render 生成 vnode 完成依赖收集

3. update 的 patch 解析虚拟 DOM 替换真实 DOM，完成挂载

# 响应式

## Vue 响应式原理

响应式，我倾向于先简化描述为**对数据修改作出响应**的原理；

Vue2 使用 defineProperty 设置 data 的 set,get 实现对数据劫持，有了数据劫持，使 vue 挂载过程中的 render 方法读取数据，完成【依赖收集】，然后在数据修改时作出【响应处理】；

这些【依赖收集】和【响应式】的逻辑，都在数据劫持时注入了，在数据被读取和修改时自动执行，所谓的响应式对象；

## Vue 如何实现依赖收集？

基于非典型的【观察者】设计模式；

每个数据的属性都持有一个 Dep 类实例（依赖管理器），它有一个“依赖订阅者”（Watcher）组成的集合，负责存放依赖的订阅者者以及通知订阅者更新各自视图

观察者，能够视图更新操作；将在依赖收集时，被订阅者们收集

有了上面两种对象，Vue 在 created 时对数据执行 observer 逻辑：为每个属性创建 Dep，规定属性的 getter 中将视图的 Watch 收集到属性的 dep(订阅器)，setter 中调用 dep.notify；

## key 的关键

用于 diff 算法，key 决定了是否可复用 dom 节点，不正确的 key 可能导致节点被错误复用导致意外情况；

# 生命周期

## Vue 生命周期

**setup**：vue3 新增，用于支持组合式 API 的方式

**beforeCreated**：初始化生命周期和事件

**created**：为 data defineProperty 添加 set，get；实现数据劫持，这是后续依赖收集和响应式基础；调用挂载

**beforeMounted**：编译 template 生成渲染函数，并执行渲染函数生成虚拟 DOM，在此过程依赖收集完成

**mounted**：解析虚拟 DOM 替换真实 DOM

**beforeUpdated**：监听到数据修改

**Updated**：重新调用渲染函数生成虚拟 DOM，对比新旧虚拟 DOM，更新真实 DOM

**beforeDestory**：清除 watcher 监听，子组件，事件监听器

## 父子组件生命周期执行顺序

父 beforeCreate->父 created->父 beforeMount->子 beforeCreate->子 created->子 beforeMount->子 mounted->父 mounted

根本原因是**组件挂载流程**

# computed

**computed 和 watch 有什么区别？什么情况用 computed?**

computed 源码实际内部就是基于 watcher，这是由响应式原理决定的；但是是特殊的 computed watcher；

什么情况用 computed，答案是当你需要定义某个值，他不是直接被访问而是基于其它值计算出来的；此时使用 vue computed，vue 会在最合适的时候去计算值；

你也可以使用 watch 实现计算属性的需求，但是会很难受；1. 没有自动收集依赖；2. 会频繁执行计算求值，而计算属性仅最终值改变时才会渲染更新，这种缓存的特性使他性能更好；

**原理**：惰性求值；

## computed，watch，created 执行顺序

created 最先，computed 被 render 访问时其次，watch 是数据修改才触发；

vue3 reactive 编写
