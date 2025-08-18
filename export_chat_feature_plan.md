# 选择性导出聊天功能实现计划

## 功能概述
实现一个允许用户选择特定聊天记录进行导出的功能，保持与现有UI风格一致的苹果玻璃效果。

## 实现步骤

### 1. 更新本地化文件
- 添加新功能所需的文本
- 文件：`contexts/locales/zh.ts` 和 `contexts/locales/en.ts`

需要添加的文本：
- `exportSelectedChats`: '导出所选聊天'
- `exportSelectedChatsDesc`: '选择要导出的聊天记录'
- `selectAll`: '全选'
- `deselectAll`: '取消全选'
- `noChatsSelected`: '未选择任何聊天'
- `selectedChatsCount`: '已选择 {count} 个聊天'
- `exportChats': '导出聊天'
- `searchChats': '搜索聊天'
- `filterByFolder': '按文件夹筛选'

### 2. 创建聊天选择器组件
- 文件：`components/settings/ChatExportSelector.tsx`
- 功能：
  - 显示所有聊天记录的列表
  - 每个聊天项包含复选框、标题、创建时间和消息数量
  - 提供全选/取消全选功能
  - 添加搜索框，支持按标题搜索聊天
  - 添加文件夹筛选器

### 3. 实现选择性导出功能的服务
- 文件：`services/storageService.ts`
- 扩展现有的 `exportData` 函数，支持选择性导出聊天

### 4. 优化数据管理组件的UI布局
- 文件：`components/settings/DataManagement.tsx`
- 重新设计布局，将功能分组
- 添加"导出所选聊天"按钮
- 改进按钮排列和样式

### 5. 集成到设置页面
- 文件：`components/settings/SettingsModal.tsx`
- 将新功能添加到设置模态框中

## UI设计考虑
- 使用模态框展示聊天选择器，避免页面跳转
- 保持与现有设计风格的一致性，特别是苹果玻璃效果
- 提供清晰的视觉反馈，如选中状态、加载状态等
- 确保在移动设备上也有良好的体验

## 数据流
```
用户点击"导出所选聊天" 
→ 打开聊天选择器模态框 
→ 用户选择要导出的聊天 
→ 点击"导出"按钮 
→ 调用导出服务 
→ 生成并下载文件