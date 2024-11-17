# React

## state

状态更新队列 - 执行赋值计算快照 - 更新界面

## reducer

对一个state状态的所有更新，整合到一个函数

## context

为组件树提供值

## context + reducer

为组件树提供值和状态操作

## effect

副作用，react中只有3中代码

- 渲染逻辑代码：位于组件顶层，只负责**计算**最终jsx，不包含任何逻辑；

- 事件处理程序：组件中除了计算值的函数之外的函数，由用户操作引发的副作用；

- effect：由渲染本身引发的副作用，执行在渲染后；

**cleanup**

## memo + callback

核心：避免不必要的计算；

**memo(记忆化)**

组件记忆化：props未变化，跳过子组件渲染；

**useCallback(缓存函数)**

缓存函数：props传递的函数未变化，跳过子组件渲染；

## 编写hooks