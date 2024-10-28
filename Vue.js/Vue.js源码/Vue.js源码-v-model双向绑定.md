# v-model

双向绑定除了数据驱动 DOM 外， DOM 的变化反过来影响数据，是一个双向关系，在 Vue 中，我们可以通过 `v-model` 来实现双向绑定。

`v-model` 即可以作用在普通表单元素上，又可以作用在组件上，它其实是一个语法糖；

## 表单元素

```js
let vm = new Vue({
  el: '#app',
  template: '<div>'
  + '<input v-model="message" placeholder="edit me">' +
  '<p>Message is: {{ message }}</p>' +
  '</div>',
  data() {
    return {
      message: ''
    }
  }
})
```

这是一个非常简单 demo，我们在 `input` 元素上设置了 `v-model` 属性，绑定了 `message`，当我们在 `input` 上输入了内容，`message` 也会同步变化。接下来我们就来分析 Vue 是如何实现这一效果的，其实非常简单。

从编译阶段分析，首先是 `parse` 阶段， `v-model` 被当做普通的指令解析到 `el.directives` 中，然后在 `codegen` 阶段，执行 `genData` 的时候，会执行 `const dirs = genDirectives(el, state)`，它的定义在 `compiler/codegen/index.js` 中：

```js
function genDirectives (el: ASTElement, state: CodegenState): string | void {
  const dirs = el.directives
  if (!dirs) return
  let res = 'directives:['
  let hasRuntime = false
  let i, l, dir, needRuntime
  for (i = 0, l = dirs.length; i < l; i++) {
    dir = dirs[i]
    needRuntime = true
    const gen: DirectiveFunction = state.directives[dir.name]
    if (gen) {
      // 执行 model 函数
      needRuntime = !!gen(el, dir, state.warn)
    }
    if (needRuntime) {
      hasRuntime = true
      res += `{name:"${dir.name}",rawName:"${dir.rawName}"${
        dir.value ? `,value:(${dir.value}),expression:${JSON.stringify(dir.value)}` : ''
      }${
        dir.arg ? `,arg:${dir.isDynamicArg ? dir.arg : `"${dir.arg}"`}` : ''
      }${
        dir.modifiers ? `,modifiers:${JSON.stringify(dir.modifiers)}` : ''
      }},`
    }
  }
  if (hasRuntime) {
    return res.slice(0, -1) + ']'
  }
}
```

`genDrirectives` 方法就是遍历 `el.directives`，然后获取每一个指令对应的方法 `const gen: DirectiveFunction = state.directives[dir.name]`，这个指令方法实际上是在实例化 `CodegenState` 的时候通过 `option` 传入的，这个 `option` 就是编译相关的配置，它在不同的平台下配置不同，在 `web` 环境下的定义在 `platforms/web/compiler/options.js` 下：

```js
export const baseOptions: CompilerOptions = {
  expectHTML: true,
  modules,
  directives,
  isPreTag,
  isUnaryTag,
  mustUseProp,
  canBeLeftOpenTag,
  isReservedTag,
  getTagNamespace,
  staticKeys: genStaticKeys(modules)
}
```

`directives` 定义在 `src/platforms/web/compiler/directives/index.js` 中：

```js
export default {
  model,
  text,
  html
}
```

那么对于 `v-model` 而言，对应的 `directive` 函数是在 `platforms/web/compiler/directives/model.js` 中定义的 `model` 函数

```js
export default function model (
  el: ASTElement,
  dir: ASTDirective,
  _warn: Function
): ?boolean {
  warn = _warn
  const value = dir.value
  const modifiers = dir.modifiers
  const tag = el.tag
  const type = el.attrsMap.type
  // ......
  if (el.component) {
    genComponentModel(el, value, modifiers)
    return false
  } else if (tag === 'select') {
    genSelect(el, value, modifiers)
  } else if (tag === 'input' && type === 'checkbox') {
    genCheckboxModel(el, value, modifiers)
  } else if (tag === 'input' && type === 'radio') {
    genRadioModel(el, value, modifiers)
  } else if (tag === 'input' || tag === 'textarea') {
    genDefaultModel(el, value, modifiers)
  } else if (!config.isReservedTag(tag)) {
    genComponentModel(el, value, modifiers)
    // component v-model doesn't need extra runtime
    return false
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `<${el.tag} v-model="${value}">: ` +
      `v-model is not supported on this element type. ` +
      'If you are working with contenteditable, it\'s recommended to ' +
      'wrap a library dedicated for that purpose inside a custom component.',
      el.rawAttrsMap['v-model']
    )
  }
  return true
}
```

也就是说我们执行 `needRuntime = !!gen(el, dir, state.warn)` 就是在执行 `model` 函数，它会根据 AST 元素节点的不同情况去执行不同的逻辑，对于我们这个 case 而言，它会命中 `genDefaultModel(el, value, modifiers)` 的逻辑，稍后我们也会介绍组件的处理；`genDefaultModel` 的实现：

```js
function genDefaultModel (
  el: ASTElement,
  value: string,
  modifiers: ?ASTModifiers
): ?boolean {
  const type = el.attrsMap.type

  if (process.env.NODE_ENV !== 'production') {
    const value = el.attrsMap['v-bind:value'] || el.attrsMap[':value']
    const typeBinding = el.attrsMap['v-bind:type'] || el.attrsMap[':type']
    if (value && !typeBinding) {
      const binding = el.attrsMap['v-bind:value'] ? 'v-bind:value' : ':value'
      warn(
        `${binding}="${value}" conflicts with v-model on the same element ` +
        'because the latter already expands to a value binding internally',
        el.rawAttrsMap[binding]
      )
    }
  }

  const { lazy, number, trim } = modifiers || {}
  const needCompositionGuard = !lazy && type !== 'range'
  const event = lazy
    ? 'change'
    : type === 'range'
      ? RANGE_TOKEN
      : 'input'

  let valueExpression = '$event.target.value'
  if (trim) {
    valueExpression = `$event.target.value.trim()`
  }
  if (number) {
    valueExpression = `_n(${valueExpression})`
  }

  let code = genAssignmentCode(value, valueExpression)
  if (needCompositionGuard) {
    code = `if($event.target.composing)return;${code}`
  }

  addProp(el, 'value', `(${value})`)
  addHandler(el, event, code, null, true)
  if (trim || number) {
    addHandler(el, 'blur', '$forceUpdate()')
  }
}
```

`genDefaultModel` 函数先处理了 `modifiers`，它的不同主要影响的是 `event` 和 `valueExpression` 的值，对于我们的例子，`event` 为 `input`，`valueExpression` 为 `$event.target.value`。然后去执行 `genAssignmentCode` 去生成代码，它的定义在 `compiler/directives/model.js` 中：

```js
export function genAssignmentCode (
  value: string,
  assignment: string
): string {
  const res = parseModel(value)
  if (res.key === null) {
    return `${value}=${assignment}`
  } else {
    return `$set(${res.exp}, ${res.key}, ${assignment})`
  }
}
```

该方法首先对 `v-model` 对应的 `value` 做了解析，它处理了非常多的情况，对我们的例子，`value` 就是 `messgae`，所以返回的 `res.key` 为 `null`，然后我们就得到 `${value}=${assignment}`，也就是 `message=$event.target.value`。然后我们又命中了 `needCompositionGuard` 为 true 的逻辑，所以最终的 `code` 为 `if($event.target.composing)return;message=$event.target.value`。

`code` 生成完后，又执行了 2 句非常关键的代码：

```js
addProp(el, 'value', `(${value})`)
addHandler(el, event, code, null, true)
```

这实际上就是 `input` 实现 `v-model` 的精髓，通过修改 AST 元素，给 `el` 添加一个 `prop`，相当于我们在 `input` 上动态绑定了 `value`，又给 `el` 添加了事件处理，相当于在 `input` 上绑定了 `input` 事件，其实转换成模板如下：

```js
<input
  v-bind:value="message"
  v-on:input="message=$event.target.value">
```

其实就是动态绑定了 `input` 的 `value` 指向了 `messgae` 变量，并且在触发 `input` 事件的时候去动态把 `message` 设置为目标值，这样实际上就完成了数据双向绑定了，所以说 `v-model` 实际上就是语法糖。

再回到 `genDirectives`，它接下来的逻辑就是根据指令生成一些 `data` 的代码：

```js
if (needRuntime) {
  hasRuntime = true
  res += `{name:"${dir.name}",rawName:"${dir.rawName}"${
    dir.value ? `,value:(${dir.value}),expression:${JSON.stringify(dir.value)}` : ''
  }${
    dir.arg ? `,arg:"${dir.arg}"` : ''
  }${
    dir.modifiers ? `,modifiers:${JSON.stringify(dir.modifiers)}` : ''
  }},`
}
```

对我们的例子而言，最终生成的 `render` 代码如下：

```js
with(this) {
  return _c('div',[_c('input',{
    directives:[{
      name:"model",
      rawName:"v-model",
      value:(message),
      expression:"message"
    }],
    attrs:{"placeholder":"edit me"},
    domProps:{"value":(message)},
    on:{"input":function($event){
      if($event.target.composing)
        return;
      message=$event.target.value
    }}}),_c('p',[_v("Message is: "+_s(message))])
    ])
}
```

关于事件的处理我们之前的章节已经分析过了，所以对于 `input` 的 `v-model` 而言，完全就是语法糖，并且对于其它表单元素套路都是一样，区别在于生成的事件代码会略有不同。

## 组件上

其实就相当于我们在这样编写父组件：

```js
let vm = new Vue({
  el: '#app',
  template: '<div>' +
  '<child :value="message" @input="message=arguments[0]"></child>' +
  '<p>Message is: {{ message }}</p>' +
  '</div>',
  data() {
    return {
      message: ''
    }
  },
  components: {
    Child
  }
})
```

子组件传递的 `value` 绑定到当前父组件的 `message`，同时监听自定义 `input` 事件，当子组件派发 `input` 事件的时候，父组件会在事件回调函数中修改 `message` 的值，同时 `value` 也会发生变化，子组件的 `input` 值被更新。

这就是典型的 Vue 的父子组件通讯模式，父组件通过 `prop` 把数据传递到子组件，子组件修改了数据后把改变通过 `$emit` 事件的方式通知父组件，所以说组件上的 `v-model` 也是一种语法糖。

## 总结

`v-model` 的实现就分析完了，我们了解到它是 Vue 双向绑定的真正实现，但本质上就是一种语法糖，它即可以支持原生表单元素，也可以支持自定义组件。在组件的实现中，我们是可以配置子组件接收的 `prop` 名称，以及派发的事件名称。
