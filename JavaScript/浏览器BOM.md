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

与服务端通信：每次都会携带在 header 中，对于请求性能影响

**localStorage**

数据生命周期：除非被清理，否则一直存在

数据存储大小：5M

**sessionStorage**

数据生命周期：页面关闭就清理

数据存储大小：5M

### Cookie

**第三方 Cookie**

第三方网站引导发出的 Cookie，就称为第三方 Cookie。它除了用于 CSRF 攻击，还可以用于用户追踪；比如，Facebook 在第三方网站插入一张看不见的图片。

**cookie其它属性**

| 属性        | 作用                                |
| --------- | --------------------------------- |
| value     | 如果用于保存用户登录态，应该将该值加密，不能使用明文的用户标识   |
| http-only | 不能通过 JS 访问 Cookie，减少 XSS 攻击       |
| secure    | 只能在协议为 HTTPS 的请求中携带               |
| same-site | 规定浏览器不能在跨域请求中携带 Cookie，减少 CSRF 攻击 |

## Service Worker

运行在浏览器背后的**独立线程**，一般可以用来实现缓存功能。使用 Service Worker的话，传输协议必须为 **HTTPS**。因为 Service Worker 中涉及到请求拦截，所以必须使用 HTTPS 协议来保障安全。

Service Worker 实现缓存功能一般分为三个步骤：

首先需要先注册 Service Worker，

然后监听到 `install` 事件以后就可以缓存需要的文件，那么在下次用户访问的时候就可以通过拦截请求的方式查询是否存在缓存，

存在缓存的话就可以直接读取缓存文件，否则就去请求数据。以下是这个步骤的实现：

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
// sw.js
// 监听 `install` 事件，回调中缓存所需文件
self.addEventListener('install', e => {
  e.waitUntil( 
    // 返回与当前上下文相关联的 CacheStorage 对象
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

## 缓存机制

**缓存位置**

Service Worker、Memory Cache、Disk Cache、Push Cache

**缓存策略**

**强缓存**和**协商缓存**，并且缓存策略都是通过设置 HTTP Header 来实现的。

### 强缓存

相关header字段：`Expires`  `Cache-Control`

强缓存表示在缓存期间不需要请求，`state code` 为 200

**Expires**

`Expires` 是 HTTP/1 的产物，表示资源会在 `Wed, 22 Oct 2018 08:41:00 GMT` 后过期，需要再次请求。并且 `Expires` **受限于本地时间**，如果修改了本地时间，可能会造成缓存失效。

**Cache-control**

`Cache-Control` 出现于 HTTP/1.1，**优先级高于 `Expires`** 。

`Cache-control: max-age=30`，该属性值表示资源会在 30 秒后过期，需要再次请求。

`Cache-Control` **可以在请求头或者响应头中设置**，并且可以组合使用多种指令

![](https://raw.githubusercontent.com/KID-1912/Github-PicGo-Images/master/2024/10/30/20241030122105.webp)



使用 `Cache-Control` HTTP 头部

使用 Service Workers拦截请求

请求的 URL 中添加查询参数（例如时间戳或版本号）

## 协商缓存

相关Header字段：`Last-Modified` 和 `ETag`
