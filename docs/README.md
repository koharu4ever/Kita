# Kita 文档入口

> 最后核对：2026-08-12

`docs/` 只保存当前仍需维护的项目文档。早期学习笔记、一次性实施计划、阶段评估和事故全文已经从工作树移除；需要追溯时使用 Git 历史，不再把历史快照与当前操作混在一起。

2026-08-12 的文档收敛将 43 份、约 27,647 行 Markdown 合并为 11 份长期维护文档：数据流/技术栈/目录说明并入架构，开发环境/工作流/排障并入开发指南，测试与部署路线分别并入测试和部署指南，PostgreSQL/R2/灾备材料并入恢复手册，Payload Media、OpenList 与产品计划各保留一份专题文档。没有单独建立 `archive/`；被删除文件仍完整保存在 Git 历史中。

## 阅读顺序

新会话或新维护者按下面顺序开始：

1. [Codex 交接](./CODEX_HANDOFF.md)
2. [当前项目状态](./current-project-status.md)
3. 根据任务选择下面的一份专题文档

| 文档                                                           | 唯一职责                                        | 什么时候阅读                 |
| -------------------------------------------------------------- | ----------------------------------------------- | ---------------------------- |
| [architecture.md](./architecture.md)                           | 当前架构、目录边界和数据流                      | 修改结构、理解前后端关系     |
| [development.md](./development.md)                             | 本地开发、Payload schema、migration、Git 和排障 | 开发或修复功能               |
| [testing-and-ci.md](./testing-and-ci.md)                       | 测试分层、命令和 GitHub Actions                 | 增加测试、排查 CI            |
| [deployment.md](./deployment.md)                               | Docker Compose、Coolify、环境变量和发布/回滚    | 部署或调整生产配置           |
| [backup-and-recovery.md](./backup-and-recovery.md)             | 备份资产、恢复边界和演练步骤                    | 备份、换机或灾难恢复         |
| [payload-content-and-media.md](./payload-content-and-media.md) | Collections、Media/R2 和内容维护                | 修改 Payload 或录入内容      |
| [openlist.md](./openlist.md)                                   | Kita 与 OpenList 的产品及部署边界               | 修改 archive 入口或 OpenList |
| [product-roadmap.md](./product-roadmap.md)                     | 产品定位、真实内容和后续优先级                  | 选择下一项产品工作           |

## 事实来源优先级

发生冲突时按以下顺序判断：

1. 当前代码、配置和 Git 状态；
2. [current-project-status.md](./current-project-status.md)；
3. 对应专题文档；
4. Git 历史中的旧文档和旧 PR。

`CODEX_HANDOFF.md` 是快速入口，不复制专题文档全文。任何可变状态只写入 `current-project-status.md`；操作步骤只写入相应专题文档。

## 文档维护规则

- 新增文档前先判断能否更新现有专题文档。
- 不为单个 PR、事故或学习过程永久新增顶层文档；在 PR 描述和 Git 历史中保留过程即可。
- 不使用“当前”“下一步”描述历史计划；历史证据必须带明确日期。
- 不在多个文件复制环境变量表、恢复清单或待办列表。
- 不记录 secret、token、密码、完整连接串、private key 或恢复码。
- 文档中的 commit SHA 只能作为带日期的验证快照，不能冒充当前 `main`。
- 删除文档时同步修复仓库内链接，并运行格式与链接检查。

## 历史资料如何查找

旧文档仍可通过 Git 找回：

```bash
git log -- docs
git show <commit>:docs/<old-file>.md
```

不要为了“保留历史”重新创建 `docs/archive/`。Git 已经承担版本历史；工作树应当只呈现现在真正需要阅读和维护的内容。
