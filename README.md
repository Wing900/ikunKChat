# ikunKChat 🚀

> 一个基于 [KChat](https://github.com/KuekHaoYang/KChat) 的增强版 AI 聊天应用，为 iKun 量身打造，新增多主题、密码保护、角色构建器等强大功能。

![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FWing900%2FikunKChat)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Wing900/ikunKChat)

---

## 🙏 致敬原作者

**本项目基于 [Kuek Hao Yang](https://github.com/KuekHaoYang) 开发的 [KChat](https://github.com/KuekHaoYang/KChat) 进行二次开发。KChat 是一个功能强大、设计精美的 AI 聊天应用，为本项目奠定了坚实的基础。在此向原作者表示诚挚的感谢和敬意！**

---

### ✨ 应用预览

![ikunKChat 主界面](<img width="2559" height="1348" alt="image" src="https://github.com/user-attachments/assets/55512487-783c-4eed-87b0-0c88e860c9f2" />
)

|                         粉色海洋主题                         |                         苹果深色主题                         |
| :----------------------------------------------------------: | :----------------------------------------------------------: |
| <img src="<img width="2559" height="1348" alt="image" src="https://github.com/user-attachments/assets/c4449692-41b1-4db5-a324-6caa3e9ea0d4" />
" alt="Pink Ocean Theme" style="zoom: 50%;" /> | <img src="<img width="2559" height="1348" alt="image" src="https://github.com/user-attachments/assets/592619e0-5a65-4e38-a6c6-6a87424f9185" />
" alt="image-20250827191416575" style="zoom:50%;" /> |

|                         蓝色天空主题                         |                         苹果浅色主题                         |
| :----------------------------------------------------------: | :----------------------------------------------------------: |
| <img src="<img width="2559" height="1348" alt="image" src="https://github.com/user-attachments/assets/308b3fc5-55eb-4734-8e41-952f09f65541" />
" alt="image-20250827191828630" style="zoom:50%;" /> | <img src="<img width="2559" height="1348" alt="image" src="https://github.com/user-attachments/assets/8ef907ef-2980-481e-a7d7-e6843e6038f3" />
" alt="image-20250827191931142" style="zoom:50%;" /> |

## 🌟 功能特性

`ikunKChat` 不仅继承了原项目的所有优点，更在此基础上进行了一些的功能增强和体验优化。以下是全部介绍

#### 🎨 界面与个性化 (UI & Personalization)
- **多主题支持**: 内置浅色、深色、苹果亮暗、粉色海洋、蓝色天空等多种主题，一键切换。
- **字体选择**: 支持系统默认、霞鹜文楷、悠哉字体等多种选择，提升阅读体验。
- **IKUN 元素**: 从图标到角色设定，深度融入 IKUN 文化，专属性拉满。
- **移动端适配**: 优化移动端体验，提供专属侧边栏和模型选择器。
- **PWA 支持**: 支持将应用安装到桌面，提供离线访问和应用更新机制。

#### 💬 增强的聊天体验 (Enhanced Chat Experience)
- **文件拖拽上传**: 直接将文件拖入聊天框即可上传，方便快捷。
- **聊天记录管理**: 支持创建文件夹来组织聊天，可通过拖拽进行管理，并提供强大的搜索功能。
- **消息操作**: 支持编辑、删除（带确认）、重新提交消息。
- **一键复制代码**: Markdown 代码块右上角提供一键复制按钮。
- **视图切换**: 支持在 AI 回复的原始文本和渲染视图之间切换。
- **选择性导出**: 可按需选择特定聊天记录，导出为 **JSON** 或 **PDF** 格式。

#### 🧠 强大的 AI 控制 (Powerful AI Control)
- **AI 角色构建器**: 通过自然语言聊天即可创建和更新角色设定，支持自定义头像和长期记忆。
- **模型选择器**: 可为每个聊天会话单独选择不同的 AI 模型。
- **温度参数调节**: 可自由调节 AI 输出的随机性，平衡稳定与创意。
- **工具配置**: 可在设置中启用/禁用代码执行、Google 搜索等高级工具。
- **思维过程显示**: 可以查看 AI 的思考过程和时间消耗，了解其推理路径。
- **建议回复与引用**: AI 会根据上下文提供快速回复建议，并能展示引用的信息来源。

#### 🔒 安全与访问 (Security & Access)
- **密码保护**: 可设置访问密码，保护你的应用不被他人随意访问。
- **临时访问令牌**: 支持通过 URL 参数生成临时访问链接，安全地分享给朋友限时使用。

![image-20250827192112122](<img width="2559" height="1348" alt="image" src="https://github.com/user-attachments/assets/46fe161c-aa4f-46ea-adfc-15f528058725" />
)

---

## 🛠️ 技术栈

| 类别         | 技术/库             |
| :----------- | :------------------ |
| 前端框架     | React (v19)         |
| 构建工具     | Vite                |
| 语言         | TypeScript          |
| AI 服务      | @google/genai       |
| 标记语言渲染 | marked              |
| 代码高亮     | highlight.js        |
| 数学公式渲染 | KaTeX               |
| 图表渲染     | mermaid             |
| PDF 导出     | jspdf & html2canvas |
| PWA 支持     | vite-plugin-pwa     |

---

## 🚀 部署与使用指南

### 一键部署
点击 README 文件顶部的 "Deploy with Vercel" 或 "Deploy to Netlify" 按钮，按照提示操作即可。部署时，平台会提示你输入下述的环境变量。

### 本地运行
1.  **克隆项目**
    ```bash
    git clone https://github.com/Wing900/ikunKChat.git
    cd ikunKChat
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **配置环境变量**
    - 在项目根目录创建一个名为 `.env` 的新文件。
    - 复制以下内容到 `.env` 文件中，并填入你的配置：
      ```env
      # 必填：你的 Google Gemini API 密钥
      GEMINI_API_KEY="AIzaSy..."
      
      # 可选：设置网站的访问密码
      VITE_ACCESS_PASSWORD="your_password"
      
      # 可选：设置用于生成临时访问链接的令牌
      VITE_TEMP_ACCESS_TOKEN="your_temp_token_string"
      ```

4.  **启动开发服务器**
    ```bash
    npm run dev
    ```

---

## 🤝 贡献

欢迎提出 Issue 或提交 Pull Request 来改进 `ikunKChat`！如果你喜欢这个项目，请给一个 Star 🌟，这是对我们最大的鼓励！

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

---
## 📝 未来计划 
- [ ] 修复bug(新增功能可能不会很多,因为少即是多,本人专注于纯粹的文字聊天,如果增加更多功能无疑会导致网站效率下降,部署难度上升.这背离了轻量的初衷)
