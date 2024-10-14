# 响应式

## Vue响应式原理

响应式，我倾向于先简化描述为**对数据修改作出响应**的原理；

Vue2使用defineProperty设置data的set,get实现对数据劫持，有了数据劫持，使vue能够在mounted生命周期也就是挂载时，因为这个过程会读取数据，完成【依赖收集】，然后在数据修改时作出【响应处理】；

这些【依赖收集】和【响应式】的逻辑，都在数据劫持时注入了，在数据被读取和修改时自动执行，所谓的响应式对象；

## new Vue干了什么？

1. 初始化和调用挂载

2. 编译template和挂载，其中挂载时依赖收集

3. 解析虚拟DOM替换真实DOM，完成挂载

## Vue如何实现依赖收集？

基于【观察者】设计模式，

每个数据的属性都有一个"订阅者"身份的对象，它有一个“观察者”组成的集合，负责存放依赖的观察者以及通知观察着更新各自视图

观察者，能够视图更新操作；将在依赖收集时，被订阅者们收集

有了上面两种对象，Vue在created时对数据执行observer逻辑：为每个属性创建Dep，规定属性的getter中将视图的Watch收集到属性的dep(订阅器)，setter中调用dep.notify；

# 生命周期

## Vue生命周期

**setup**：vue3新增，用于支持组合式API的方式

**beforeCreated**：初始化声明周期和事件

**created**：为data defineProperty 添加set，get；实现数据劫持，这是后续依赖收集和响应式基础；调用挂载

**beforeMounted**：编译template生成渲染函数，并执行渲染函数生成虚拟DOM，在此过程依赖收集完成

**mounted**：解析虚拟DOM替换真实DOM

**beforeUpdated**：监听到数据修改

**Updated**：重新调用渲染函数生成虚拟DOM，对比新旧虚拟DOM，更新真实DOM

**beforeDestory**：清除watcher监听，子组件，事件监听器

# 编译过程
