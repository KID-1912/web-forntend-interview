# 数据驱动

## new Vue干了什么？

1. 初始化

2. 编译template和挂载（render+update），render生成vnode完成依赖收集

3. update的patch解析虚拟DOM替换真实DOM，完成挂载

# 响应式

## Vue响应式原理

响应式，我倾向于先简化描述为**对数据修改作出响应**的原理；

Vue2使用defineProperty设置data的set,get实现对数据劫持，有了数据劫持，使vue挂载过程中的render方法读取数据，完成【依赖收集】，然后在数据修改时作出【响应处理】；

这些【依赖收集】和【响应式】的逻辑，都在数据劫持时注入了，在数据被读取和修改时自动执行，所谓的响应式对象；

## Vue如何实现依赖收集？

基于【观察者】设计模式；

每个数据的属性都持有一个Dep类实例（依赖管理器），它有一个“依赖订阅者”（Watcher）组成的集合，负责存放依赖的订阅者者以及通知订阅者更新各自视图

观察者，能够视图更新操作；将在依赖收集时，被订阅者们收集

有了上面两种对象，Vue在created时对数据执行observer逻辑：为每个属性创建Dep，规定属性的getter中将视图的Watch收集到属性的dep(订阅器)，setter中调用dep.notify；

## key的关键

用于diff算法，key决定了是否可复用dom节点，不正确的key可能导致节点被错误复用导致意外情况；

# 生命周期

## Vue生命周期

**setup**：vue3新增，用于支持组合式API的方式

**beforeCreated**：初始化生命周期和事件

**created**：为data defineProperty 添加set，get；实现数据劫持，这是后续依赖收集和响应式基础；调用挂载

**beforeMounted**：编译template生成渲染函数，并执行渲染函数生成虚拟DOM，在此过程依赖收集完成

**mounted**：解析虚拟DOM替换真实DOM

**beforeUpdated**：监听到数据修改

**Updated**：重新调用渲染函数生成虚拟DOM，对比新旧虚拟DOM，更新真实DOM

**beforeDestory**：清除watcher监听，子组件，事件监听器

## 父子组件生命周期执行顺序

父beforeCreate->父created->父beforeMount->子beforeCreate->子created->子beforeMount->子mounted->父mounted

根本原因是**组件挂载流程**

# computed

**computed和watch有什么区别？什么情况用computed?**

computed源码实际内部就是基于watcher，这是由响应式原理决定的；但是是特殊的computed watcher；

什么情况用computed，答案是当你需要定义某个值，他不是直接被访问而是基于其它值计算出来的；此时使用vue computed，vue会在最合适的时候去计算值；

你也可以使用watch实现计算属性的需求，但是会很难受；1. 没有自动收集依赖；2. 会频繁执行计算求值，而计算属性仅最终值改变时才会渲染更新，这种缓存的特性使他性能更好；

**原理**：惰性求值；

## computed，watch，created执行顺序

created最先，computed被render访问时其次，watch是数据修改才触发；

vue3 reactive 编写
