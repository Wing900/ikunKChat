# WelcomeView 进一步简化计划

## 需要进行的修改

根据用户反馈，需要对 `components/WelcomeView.tsx` 进行以下修改：

1. **移除默认助手显示信息**
   - 删除显示默认助手头像、名称和简介的部分
   - 简化界面，只保留欢迎信息和开始聊天按钮

2. **修改按钮样式为苹果风格**
   - 将按钮样式改为更加轻淡的设计
   - 移除蓝色背景，使用更简洁的颜色
   - 采用苹果风格的圆角和阴影效果

3. **确保默认使用 default-assistant 角色**
   - 保留自动选择默认助手的逻辑
   - 确保点击"开始聊天"时使用默认助手

## 具体修改内容

1. 删除以下部分：
   ```jsx
   <div className="flex flex-col items-center justify-center mb-6">
     <div className="flex items-center gap-4 p-4 rounded-[var(--radius-2xl)] glass-pane">
       <div className="w-12 h-12 flex-shrink-0 rounded-full bg-white/10 dark:bg-black/10 flex items-center justify-center text-white overflow-hidden">
         {selectedPersona && <PersonaAvatar avatar={selectedPersona.avatar} className="text-2xl" />}
       </div>
       <div className="flex-grow text-left">
         <h3 className="font-semibold">{selectedPersona?.name || '默认助手'}</h3>
         <p className="text-sm text-[var(--text-color-secondary)] truncate">
           {selectedPersona?.bio || '您的智能助手'}
         </p>
       </div>
     </div>
   </div>
   ```

2. 修改按钮样式：
   ```jsx
   <button
     onClick={handleStartChat}
     className="py-2 px-6 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium transition-all hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 shadow-sm"
   >
     开始聊天
   </button>
   ```

3. 简化整体布局，使界面更加简洁