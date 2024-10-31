# 浏览器基础知识

## 事件机制

事件触发3阶段：事件捕获（从window向触发处传播）、事件注册处触发、事件冒泡（从触发处向window传播）

**`addEventListener`**

该函数的第三个参数可以是布尔值，也可以是对象。对于布尔值 `useCapture` 参数来说，该参数默认值为 `false` ，`useCapture` 决定了注册的事件是捕获事件还是冒泡事件。

对于对象参数来说，可以使用以下几个属性

- `capture`：布尔值，和 `useCapture` 作用一样
- `once`：布尔值，值为 `true` 表示该回调只会调用一次，调用后会移除监听
- `passive`：布尔值，表示永远不会调用 `preventDefault`

**事件代理**

事件代理的方式相较于直接给目标注册事件来说，有以下优点：

- 节省内存
- 不需要给子节点注销事件

## 跨域

什么事跨域？因为浏览器出于安全考虑，有同源策略。也就是说，如果协议、域名或者端口有一个不同就是跨域，Ajax 请求会失败。

**那么是出于什么安全考虑才会引入这种机制呢？** 其实主要是用来防止 CSRF 攻击的。简单点说，CSRF 攻击是利用用户的登录态发起恶意请求。

**请求跨域了，那么请求到底发出去没有？** 请求必然是发出去了，但是浏览器拦截了响应（request has be blocked）。但是表单或get请求并不会获取新的内容，所以可以发起跨域请求。同时也说明了跨域并不能完全阻止 CSRF，因为请求毕竟是发出去了。

**跨域解决**

JSONP

CORS：服务端设置 `Access-Control-Allow-Origin` 就可以开启 CORS。 该属性表示哪些域名可以访问资源，如果设置通配符则表示所有网站都可以访问资源。

document.domain：只能用于**二级域名相同**的情况下，比如 `a.test.com` 和 `b.test.com` 适用于该方式。只需要给页面添加 `document.domain = 'test.com'` 表示二级域名都相同就可以实现跨域

postMessage：

```js
// 发送消息端
window.parent.postMessage('message', 'http://test.com')
// 接收消息端
var mc = new MessageChannel()
mc.addEventListener('message', event => {
  var origin = event.origin || event.originalEvent.origin
  if (origin === 'http://test.com') {
    console.log('验证通过')
  }
})
```

## web存储

**cookie**

数据生命周期：一般由服务器生成，可以设置过期时间；

数据存储大小：4K

与服务端通信：每次都会携带在 header 中，对于请求性能影响；

**localStorage**

数据生命周期：除非被清理，否则一直存在

数据存储大小：5M

**sessionStorage**

数据生命周期：页面关闭就清理

数据存储大小：5M

**精细度**

Cookie精细度不如其它存储，导致会有大量不可预知情况，如：

同域多页面共用问题、跨域Cookie收集

### Cookie

**第三方 Cookie**

第三方网站引导发出的跨域 Cookie，就称为第三方 Cookie。它除了用于 CSRF 攻击，还可以用于用户追踪；比如，Facebook 在第三方网站插入一张看不见的图片。

**cookie其它属性**

| 属性        | 作用                                |
| --------- | --------------------------------- |
| value     | 如果用于保存用户登录态，应该将该值加密，不能使用明文的用户标识   |
| http-only | 不能通过 JS 访问 Cookie，减少 XSS 攻击       |
| secure    | 只能在协议为 HTTPS 的请求中携带               |
| same-site | 规定浏览器不能在跨域请求中携带 Cookie，减少 CSRF 攻击 |

## Service Worker

**特性**

- **独立性**：Service Worker 在主线程之外运行，独立于网页的生命周期。这意味着即使用户关闭所有相关页面（甚至浏览器），Service Worker 仍然可以保持运行。
- **生命周期管理**：Service Worker 有明确的生命周期，包括安装、激活和废弃状态。每个阶段都有相应的事件可以监听。
- **事件驱动**：Service Worker 使用事件驱动模型，响应特定的事件（如 `fetch`、`push` 和 `sync`）。
- **缓存 API**：Service Worker 内置的 Cache API 允许缓存请求和响应。

**HTTPS强制**：因为 Service Worker 中涉及到请求拦截，所以必须使用 HTTPS 协议来保障安全；

**缓存实现**

Service Worker 运行在浏览器背后的**独立线程**，一般可以用来实现缓存功能。分为三个步骤：

1. 注册 Service Worker

```js
// index.js
if (navigator.serviceWorker) {
  navigator.serviceWorker
    .register('sw.js')
    .then(function(registration) {
      console.log('service worker 注册成功')
    })
    .catch(function(err) {
      console.log('servcie worker 注册失败')
    })
}
```

2. 监听到 `install` 事件以后就可以缓存需要的文件，那么在下次用户访问的时候就可以通过拦截请求的方式查询是否存在缓存；存在缓存的话就可以直接读取缓存文件，否则就去请求数据。以下是这个步骤的实现：

```js
// sw.js（指向同域可访问js资源）
// 监听 `install` 事件，回调中缓存所需文件
self.addEventListener('install', e => {
  e.waitUntil( 
    // 返回与当前上下文相关联的 CacheStorage 对象
    // 自定义一个 ‘my-cache’ 缓存名称，用于存放缓存资源
    caches.open('my-cache').then(function(cache) {
      return cache.addAll(['./index.html', './index.js'])
    })
  )
})

// 拦截所有请求事件
// 如果缓存中已经有请求的数据就直接用缓存，否则去请求数据
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      if (response) {
        return response
      }
      console.log('fetch source')
    })
  )
})
```

## Web Worker

## 缓存机制

**缓存规则**

浏览器每次拿到返回的请求结果都会将该结果和缓存标识存入浏览器缓存中；特别是未命中任何缓存时；

**缓存位置**

Service Worker、Memory Cache、Disk Cache、Push Cache

**缓存策略**

根据读取缓存规则不同，区分**强缓存**和**协商缓存**

**强缓存**：浏览器每次发起请求，都会先在浏览器缓存中查找该请求的结果以及缓存标识，尝试复用；

**协商缓存**：强制缓存失效后，浏览器携带缓存标识向服务器发起请求，由服务器根据缓存标识决定是否使用缓存的过程（协商）；

### 强缓存

**header字段**：`Expires`  `Cache-Control`

**`state code`**：200，缓存期间不需要请求

**Expires**

HTTP/1.0控制网页缓存的字段，其值为服务器返回该请求结果缓存的到期时间，即再次发起该请求时，如果客户端的时间小于Expires的值时，直接使用缓存结果。

**注**：现在浏览器最低是HTTP/1.1，Expire已经被Cache-Control替代，原因在于Expires控制缓存的原理是使用客户端的时间与服务端返回的时间做对比，那么如果客户端与服务端的时间因为某些原因（例如时区不同；手动修改）发生误差，那么强制缓存则会直接失效；

**Cache-Control**

`Cache-Control` 出现于 HTTP/1.1，**优先级高于 `Expires`** 。

取值包括：

- `public`：所有内容都将被缓存（客户端和代理服务器都可缓存）

- `private`：所有内容只有客户端可以缓存，Cache-Control的默认取值

- `no-cache`：客户端缓存内容，但是是否使用缓存则需要经过协商缓存来验证决定

- `no-store`：所有内容都不会被缓存，即不使用强制缓存，也不使用协商缓存

- `max-age=`xxx (xxx is numeric)：缓存内容将在xxx秒后失效

### 协商缓存

**header字段**：`Last-Modified/If-Modified-Since` 和 `ETag/If-None-Match`

**`state code`**：304，从缓存读取

**`Last-Modified / If-Modified-Since`**

Last-Modified：服务器响应请求时，返回该资源文件在服务器最后被修改的时间

If-Modified-Since：客户端再次发起该请求时，携带上次请求返回的Last-Modified值，通过此字段值告诉服务器该资源上次请求返回的最后被修改时间。

**协商处理**

服务器收到该请求，发现请求头含有If-Modified-Since字段，则会根据If-Modified-Since的字段值与该资源在服务器的最后被修改时间做对比，若服务器的资源最后被修改时间大于If-Modified-Since的字段值，则重新返回资源，状态码为200；否则则返回304，代表资源无更新，可继续使用缓存文件，

**Etag / If-None-Match**

Etag：服务器响应请求时，返回当前资源文件的一个唯一标识(由服务器生成)

If-None-Match：客户端再次发起该请求时，携带上次请求返回的唯一标识Etag值，通过此字段值告诉服务器该资源上次请求返回的唯一标识值。

**协商处理**

服务器收到该请求后，发现该请求头中含有If-None-Match，则会根据If-None-Match的字段值与该资源在服务器的Etag值做对比，一致则返回304，代表资源无更新，继续使用缓存文件；不一致则重新返回资源文件，状态码为200，

注：`Etag/If-None-Match` 优先级高于 `Last-Modified/If-Modified-Since`，前者通过协商资源唯一标识，后者协商修改实现；

### 使用策略

前端影响浏览器缓存策略方案：

- 设置发起请求缓存标识，如 `Cache-Control: no-store/no-cache` 或 `max-age=0` 强制过期

- 使用 Service Workers拦截请求

- 请求资源 URL 中添加查询参数（例如时间戳、版本号、Hash值）

## 浏览器渲染原理

浏览器每个标签页对应一个进程，其多线程配合实现页面渲染（HTML解析线程，渲染线程，主线程）；

**解析HTML文件**：将HTML字符串**词法分析**进行标记，生成DOM树，

**CSSOM**：CSS转换成CSSOM树

**生成渲染树**：渲染树只会包括**需要显示的节点**和这些节点的样式信息

**布局与合成**：根据渲染树来进行布局（也可以叫做回流），然后调用 GPU 绘制，合成图层

**如何加速：**

1. 从文件大小考虑
2. 从 `script` 标签使用上来考虑
3. 从 CSS、HTML 的代码书写上来考虑
4. 从需要下载的内容是否需要在首屏使用上来考虑

### 操作DOM

**为什么操作DOM慢**？

通过 JS 操作 DOM，DOM 属于渲染引擎中的东西，JS 是 JS 引擎中的东西；

这个操作涉及到了两个线程之间的通信，那么势必会带来一些性能上的损耗。并且操作 DOM 可能还会带来重绘回流的情况，所以也就导致了性能上的问题。

**插入几万个 DOM，如何实现页面不卡顿**？

`requestAnimationFrame` 的方式去循环的插入 DOM 或 **虚拟滚动**

### 重绘与回流

以下几个动作可能会导致性能问题：

- 改变 `window` 大小
- 改变字体
- 添加或删除样式
- 文字改变
- 定位或者浮动
- 盒模型

**减少重绘和回流**

- 使用 `transform` 替代 `top`
- 使用 `visibility` 替换 `display: none`
- 禁止频繁获取节点的属性值（如offsetTop）,因为会实时计算
- 动画实现的速度的选择，动画速度越快，回流次数越多，可以选择使用 `requestAnimationFrame`
