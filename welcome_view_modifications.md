# WelcomeView 修改计划

## 需要进行的修改

根据用户反馈，需要对 `components/WelcomeView.tsx` 进行以下修改：

1. **移除选择模型选项**
   - 删除 ModelSelector 相关的代码
   - 移除 "选择模型" 标签

2. **移除"选择助手"标签**
   - 删除 "选择助手" 这个标签文本

3. **调整布局**
   - 使内容居中对齐上面的 "欢迎来到ikunKChat"
   - 简化界面，只保留默认助手信息和开始聊天按钮

## 具体修改内容

1. 删除以下部分：
   ```jsx
   <div className="mb-6">
     <label className="block text-sm font-medium text-[var(--text-color-secondary)] mb-2">
       选择模型
     </label>
     <ModelSelector
       models={availableModels}
       selectedModel={currentModel}
       onModelChange={onSetCurrentModel}
     />
   </div>
   ```

2. 修改助手显示部分：
   ```jsx
   <div className="mb-6">
     <label className="block text-sm font-medium text-[var(--text-color-secondary)] mb-2">
       选择助手
     </label>
   ```
   删除 "选择助手" 标签

3. 调整整体布局，使内容更加居中对齐