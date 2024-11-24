# web性能优化

**个人理解**：

性能优化原则，任何优化应当在功能实现的后面，且不影响功能

性能优化层面涉及宏观（技术方案）和微观（开发细节），贯穿始终

性能关键词：压缩、缓存、并发

## 性能优化场景

按场景发现性能问题，寻找对应优化措施，场景包括：

### 开发构建场景

关系到开发体验，如打包时间过长；

**核心**：

- 并发

- 缓存

- 打包量小

### 资源加载和页面渲染场景

访问页面反应过慢

**资源加载**

- 传输量小：压缩代码（html/css/js）与图片，小图base64，雪碧图/SVG sprite/IconFont替代图片Icon，Gzip，TreeShaking，注意按需加载（异步组件，路由懒加载，图片懒加载）

- 距离近：CDN（内容分发网络）

- 并行传输不阻塞（效率高）：HTTP2.0，CSS前置

- 资源复用（不必要的重复工作）：浏览器缓存策略，检查分包

- 预先加载（合理利用时间）：prefetch尝试，DNS预解析

**页面渲染**

- 动画流畅：使用CSS动画而非JS动画，使用GPU加速（transform，translateZ/translate3d，opacity）, JS动画使用requestAnimationFrame

- 交互流畅（滚动/移动/操作）:​DOM增删操作要少(虚拟长列表、DOM Diff)，防抖/节流，注意DOM计算（offsetTop）

## 性能测试

### Lighthouse

从 **Performance** 、**Accessibility**、**Best Practices**、**SEO** 四个角度对你的网页评分

### NetWork

可以看到每项资源加载耗时，以及页面的加载耗时：

**Finish**：页面上所有网络资源的请求都完成的时间；

**DOMContentLoaded (DOM 内容加载完成)**：浏览器触发 `DOMContentLoaded` 事件的时间，表示初始 HTML 文档已经被完全加载和解析（即 DOM 树构建完成）；

**Load (页面完全加载)**：浏览器触发 `load` 事件的时间，表示页面的所有资源（包括图片、样式表和脚本等）都已加载完成；
