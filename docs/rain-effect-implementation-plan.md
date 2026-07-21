# Rain Effect Implementation Plan

> **历史记录（非当前事实源）**：本文保留 WebGL 雨滴效果实施前的分析以及文末的落地记录。前半部分对 `RainyWindow` 的引用描述的是替换前状态；当前实现与操作边界以 [CODEX_HANDOFF.md](./CODEX_HANDOFF.md) 和 [current-project-status.md](./current-project-status.md) 为准。

## 结论

可以做，但只建议做成一个独立的首页玻璃层替换，不建议把 Codrops / Rainyscope 的整套页面逻辑搬进 Kita。

方案编写时，首页旧雨滴集中在 `src/features/home/components/rainy-window.tsx`，`HomeExperience` 只通过下面这一行使用它：

```tsx
<RainyWindow backgroundImageUrl={activeWallpaper.image.url} />
```

这说明当时的雨滴层和首页文字、导航、背景轮播没有深度耦合。新的 WebGL 雨滴层可以保持同样的输入接口，只替换这一层：

```tsx
<RainWaterLayer backgroundImageUrl={activeWallpaper.image.url} />
```

因此它满足两个要求：

- 结构清晰：雨滴效果封装为独立 client component，运行时逻辑放在 `features/home/lib`。
- 不耦合：首页仍然负责背景、文字、导航、滚动状态；雨滴层只负责 canvas 玻璃效果。

## 参考源码状态

参考源码已下载到：

```txt
_reference/rain-effect
```

说明：第一次 `git clone` 因 GitHub 连接被 reset 失败，随后通过 GitHub zip 下载成功并解压。

来源项目：

- GitHub: https://github.com/codrops/RainEffect
- Article: https://tympanus.net/codrops/2015/11/04/rain-water-effect-experiments/

项目 README 的许可说明是：可以在个人或商业项目中集成或基于它构建，但不要原样重新发布、再分发或销售。Kita 的用法应是“抽取并改造雨滴层”，不是原样发布 demo。

## 参考项目如何工作

Codrops RainEffect 分成两部分：

1. `src/raindrops.js`
   - 用 2D canvas 生成雨滴水图。
   - 负责雨滴生成、下滑、拖尾、合并、清理小水滴。
   - 输出 `raindrops.canvas`，这是后续 shader 的 water map。

2. `src/rain-renderer.js`
   - 用 WebGL 渲染最终画面。
   - 读取 water map、前景纹理、背景纹理。
   - 通过 `src/shaders/water.frag` 做折射、厚度、透明度、亮度和可选高光。

辅助文件：

- `src/webgl.js`：WebGL program、shader、texture、uniform 工具。
- `src/gl-obj.js`：对 WebGL helper 的一层对象封装。
- `src/create-canvas.js`：创建 canvas。
- `src/image-loader.js`：加载图片。
- `src/random.js`、`src/times.js`：雨滴模拟工具函数。
- `src/shaders/simple.vert`、`src/shaders/water.frag`：shader。

关键资产：

- `demo/img/drop-alpha.png`
- `demo/img/drop-color.png`
- 可选：`demo/img/drop-shine.png` 或 `demo/img/drop-shine2.png`

不应该搬的内容：

- `demo/index.html`、`demo/css/*`、`demo/js/*`
- weather 切换、hash 路由、slide 页面
- `gsap` 动画系统
- demo 字体、icons、音视频、天气纹理组
- gulp / browserify / Babel 5 构建链

## 与 Kita 的适配方案

Kita 现在不需要新增 UI 库，也不应该引入 demo 的旧构建链。建议用 TypeScript 重新封装运行时：

```txt
src/features/home/components/rain-water-layer.tsx
src/features/home/lib/rain-effect/create-canvas.ts
src/features/home/lib/rain-effect/image-loader.ts
src/features/home/lib/rain-effect/random.ts
src/features/home/lib/rain-effect/raindrops.ts
src/features/home/lib/rain-effect/rain-renderer.ts
src/features/home/lib/rain-effect/webgl.ts
src/features/home/lib/rain-effect/shaders.ts
```

资产放在：

```txt
public/rain-effect/drop-alpha.png
public/rain-effect/drop-color.png
public/rain-effect/drop-shine.png
```

组件边界：

```tsx
type RainWaterLayerProps = {
  backgroundImageUrl: string;
  intensity?: "drizzle" | "rain" | "storm";
};
```

组件职责：

- client-only 渲染。
- 创建一个 absolute inset-0 canvas。
- 根据容器尺寸和 `devicePixelRatio` 初始化 WebGL。
- 使用 `backgroundImageUrl` 作为折射背景来源。
- 页面不可见时暂停 animation loop。
- 组件卸载时取消 `requestAnimationFrame`、移除事件监听、释放引用。

首页只改这一处：

```tsx
<RainyWindow backgroundImageUrl={activeWallpaper.image.url} />
```

替换为：

```tsx
<RainWaterLayer backgroundImageUrl={activeWallpaper.image.url} />
```

## 重要实现取舍

### 不使用 Three.js

可以用 Three.js / React Three Fiber，但当前不建议。

原因：

- Kita 当前没有 `three`，新增依赖会扩大维护面。
- Codrops 的核心 WebGL 代码很小，直接现代化移植更接近“只替换玻璃层”。
- 这里不需要 3D 场景、相机、几何管理，Three.js 反而会让一个 2D shader layer 更重。

### 不直接使用 Codrops 原入口

`src/index.js` 绑定了 demo 的天气数据、hash、nav、GSAP、slide class，不适合 Kita。

可用的是底层模块，不是入口页面。

### Shader 需要改造

原 `water.frag` 默认会把背景纹理和水滴结果一起画出来。Kita 首页已有真实背景图和遮罩层，所以更理想的是：

- 保留当前首页背景渲染。
- canvas 只画玻璃折射和水滴高光。
- `backgroundImageUrl` 只作为折射采样纹理使用，不把整张背景图重新绘制到 canvas 上。
- 如果 WebGL 透明合成效果不稳定，再退一步使用极轻的透明玻璃 fallback，而不是再铺一张完整背景图。

这是实现时最需要验证的点。

## 性能和兜底

必须加入这些保护：

- `prefers-reduced-motion: reduce` 时禁用 WebGL 雨滴，回退为静态暗色玻璃层或轻量 CSS。
- WebGL context 获取失败时，回退到当前 `RainyWindow` 或纯透明 overlay。
- 限制 DPR，例如 `Math.min(window.devicePixelRatio, 1.5)`，避免 4K 屏显存和 GPU 压力过大。
- 用 `ResizeObserver` 监听容器尺寸，resize 时重建尺寸和 texture。
- 用 `document.visibilityState` 暂停后台动画。
- 雨滴参数默认保守：
  - `maxDrops`: 350-500
  - `rainChance`: 0.12-0.25
  - `dropletsRate`: 10-25
  - `minR/maxR`: 比 demo 小一档

当前首页首屏还有背景轮播，不能让雨滴层抢走主线程。

## 推荐实施步骤

1. 保留现有 `RainyWindow`，新增 `RainWaterLayer`，先不替换首页。
2. 从 `_reference/rain-effect` 复制并 TypeScript 化最小运行时模块。
3. 只复制 `drop-alpha.png`、`drop-color.png`，先不复制天气纹理。
4. 写一个临时开关，例如在 `HomeExperience` 中手动切换组件，验证视觉和性能。
5. 用浏览器检查：
   - 首屏背景是否仍然清晰。
   - 雨滴是否有折射感。
   - 滚动到玻璃层时文字是否可读。
   - 移动端是否不卡。
   - WebGL 禁用时是否正常回退。
6. 验证通过后，再正式把 `RainyWindow` 替换为 `RainWaterLayer`。
7. 确认没有问题后，删除旧 CSS `.raindrop` 和 `@keyframes raindrop-life`。

## 风险

- Codrops 原项目是 2015 年代码，不能直接依赖它的构建方式。
- WebGL 透明 canvas 与现有 DOM 背景的合成需要验证，可能需要让 canvas 自己绘制背景图。
- 如果背景图频繁轮播，texture 更新必须控制好，避免闪烁。
- 移动端 GPU 压力不可忽视，必须保守调参。

## 最终建议

可以继续做，但应该按“现代化移植底层雨滴运行时”的方式做，而不是引入整站模板。

这次改造的理想结果是：

- Kita 首页结构几乎不变。
- `RainyWindow` 被一个同接口的 `RainWaterLayer` 替换。
- 所有复杂度都封装在 `src/features/home/lib/rain-effect`。
- 视觉效果从 CSS 小水滴升级为接近 Codrops / Rainyscope 的玻璃雨滴折射。

## 已实现结构

本次实现已经按上面的边界落地：

- `src/features/home/components/rain-water-layer.tsx`：首页雨滴玻璃层组件。
- `src/features/home/lib/rain-effect/*`：从 Codrops 思路现代化改造出来的 TypeScript 运行时。
- `public/rain-effect/drop-alpha.png`、`drop-color.png`、`drop-shine.png`：最小水滴贴图资产。
- `src/features/home/components/home-experience.tsx`：只把原来的 `RainyWindow` 调用替换为 `RainWaterLayer`。
- `src/features/home/components/rainy-window.tsx` 和全局 `.raindrop` CSS 已删除，避免保留两套雨滴实现。
- WebGL shader 已调整为透明输出：canvas 只显示水滴折射和高光，不再重复绘制首页背景图。

实现仍然保持 feature 内聚：路由层没有新增雨滴逻辑，首页编排层只依赖一个 feature component，WebGL 和 shader 细节全部留在 `features/home/lib/rain-effect`。
