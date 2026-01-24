<div align="center">
  <img src="https://github.com/Wing900/ikunKChat/raw/main/public/ikunchat.svg" alt="ikunKChat Logo" width="180" />
  
  <br/>
  
  <!-- Typing SVG Animation -->
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=48&duration=2000&pause=1000&color=1D1D1F&center=true&vCenter=true&width=500&lines=ikunKChat" alt="Typing SVG" />
  
  <p style="margin-top: 20px;">
    <strong>一个轻量、快速、优雅的聊天网页UI</strong>
  </p>
  <p>
    专为低成本私有化部署而设计的现代化 AI 对话界面
  </p>

  <p>
    <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  </p>

  <p>
    <a href="#在线体验">在线体验</a> •
    <a href="#功能特性">功能特性</a> •
    <a href="#部署指南">部署指南</a> •
    <a href="#技术栈">技术栈</a> •
    <a href="#致谢">致谢</a>
  </p>
</div>

---

<details open>
<summary><b>💭 开发者的话</b></summary>

<br>

> 二开这个项目的时候，作者本身不是程序员，也没有 webchat 需求。当时作者我第一次学会反向代理，可以中转谷歌的模型，心里很兴奋。

那个夏天刚好和暗恋对象暧昧，于是想让她用上谷歌的顶尖模型，但是无可奈何当时 iOS 端还没有 AI 代理 chatApp，而网页端 nextchat、owu 这些项目太过于笨重，手机体验不好。

为了让暗恋对象可以美美地使用上谷歌的模型，我找到然后熬了好几天夜改进了原作者的作品，并且学习了大量的前端的 React 技术栈的知识，利用着 AI 和自己拙劣的 debug 技术，开发了第一个可用的版本，让 ta 用上了。后来也根据她的各种反馈不断加功能与设计。

直到现在，这个网页变得完善，可爱。

只是可惜，**萧瑟秋风过，缘如流水去**。ikunKchat仍在，只是人南北。

**关于项目风格：** 如果你不喜欢 ikunKChat 的各种梗，可以考虑 Fork 下来二开，作者也在考虑更换其元素，开发出非 ikun 版本。

</details>

---

## 目录

- [在线体验](#在线体验)
- [功能特性](#功能特性)
- [界面展示](#界面展示)
- [部署指南](#部署指南)
  - [Vercel 一键部署](#1-vercel-一键部署-推荐)
  - [Docker 镜像部署](#2-docker-镜像部署-推荐)
  - [Docker Compose 部署](#3-docker-compose-部署)
  - [本地开发部署](#4-本地开发部署)
- [环境变量配置](#环境变量配置)
- [技术栈](#技术栈)
- [致谢](#致谢)

---

## 在线体验

<table>
  <tr>
    <td><strong>🌐 演示地址</strong></td>
    <td><a href="https://ikun-k-chat-demo.vercel.app/">https://ikun-k-chat-demo.vercel.app/</a></td>
  </tr>
  <tr>
    <td><strong>🔑 访问密码</strong></td>
    <td><code>ikuninlinuxdo</code></td>
  </tr>
</table>

### 一键部署

<div align="center">
  <table>
    <tr>
      <td align="center">
        <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FWing900%2FikunKChat">
          <img src="https://vercel.com/button" alt="Deploy with Vercel" height="32" />
        </a>
      </td>
      <td align="center">
        <a href="https://app.netlify.com/start/deploy?repository=https://github.com/Wing900/ikunKChat">
          <img src="https://www.netlify.com/img/deploy/button.svg" alt="Deploy to Netlify" height="32" />
        </a>
      </td>
      <td align="center">
        <a href="https://dash.cloudflare.com/?to=/:account/pages/new/provider/github">
          <img src="https://img.shields.io/badge/Cloudflare-Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Deploy to Cloudflare Pages" height="32" />
        </a>
      </td>
    </tr>
    <tr>
      <td align="center"><strong>Vercel</strong></td>
      <td align="center"><strong>Netlify</strong></td>
      <td align="center"><strong>Cloudflare Pages</strong></td>
    </tr>
  </table>
</div>

---

## 功能特性

<div align="center">
  <table>
    <tr>
      <td width="50%">
        <h3>💬 智能对话</h3>
        <ul>
          <li>支持 Gemini 和 OpenAI 双 API</li>
          <li>多模型智能切换</li>
          <li>上下文管理与会话导出</li>
          <li>Markdown 渲染与代码高亮</li>
        </ul>
      </td>
      <td width="50%">
        <h3>🎨 个性化体验</h3>
        <ul>
          <li>多主题切换（浅色/深色）</li>
          <li>自定义 AI 角色与头像</li>
          <li>灵活的界面布局</li>
          <li>多语言支持</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>
        <h3>📁 数据管理</h3>
        <ul>
          <li>本地 IndexedDB 存储</li>
          <li>聊天记录分组与归档</li>
          <li>导入/导出功能</li>
          <li>隐私保护模式</li>
        </ul>
      </td>
      <td>
        <h3>🚀 部署友好</h3>
        <ul>
          <li>单页应用，无需后端</li>
          <li>Docker 容器化支持</li>
          <li>PWA 渐进式应用</li>
          <li>轻量级资源占用</li>
        </ul>
      </td>
    </tr>
  </table>
</div>

### ikunKChat 和其他 webchat 应用（如 NextChat、Openui 等）相比，有什么优势？

**纯前端 · 轻小快 · 无成本**

- **纯前端架构**：无需后端服务器，部署即用
- **轻量体积**：资源占用极小，加载迅速
- **极速响应**：优化的性能，流畅的体验
- **零运行成本**：静态部署，免费托管平台即可

劣势也很明显，作者明白这一点。不过事实上，作者只追求一件事，简单，极致，无干扰的聊天，不需要其它任何功能。

> Less is more


---

## 界面展示

### 唱 - 登录界面

<div align="center">
  <img src="https://github.com/Wing900/ikunKChat/raw/main/public/show/login.png" alt="登录界面" width="80%" />
</div>

### 跳 - 聊天体验

<div align="center">
  <table>
    <tr>
      <td width="50%">
        <img src="https://github.com/Wing900/ikunKChat/raw/main/public/show/chat1_comp.png" alt="桌面端聊天-1" />
      </td>
      <td width="50%">
        <img src="https://github.com/Wing900/ikunKChat/raw/main/public/show/chat2_comp.png" alt="桌面端聊天-2" />
      </td>
    </tr>
  </table>
</div>

### RAP - 角色定制

<div align="center">
  <img src="https://github.com/Wing900/ikunKChat/raw/main/public/show/role.png" alt="角色定制" width="80%" />
</div>

### 篮球 - 移动端适配

<div align="center">
  <table>
    <tr>
      <td width="25%">
        <img src="https://github.com/Wing900/ikunKChat/raw/main/public/show/chat1_ph.png" alt="移动端-i" />
      </td>
      <td width="25%">
        <img src="https://github.com/Wing900/ikunKChat/raw/main/public/show/chat2_ph.png" alt="移动端-k" />
      </td>
      <td width="25%">
        <img src="https://github.com/Wing900/ikunKChat/raw/main/public/show/chat3_ph.png" alt="移动端-u" />
      </td>
      <td width="25%">
        <img src="https://github.com/Wing900/ikunKChat/raw/main/public/show/chat4_ph.png" alt="移动端-n" />
      </td>
    </tr>
    <tr>
      <td align="center"><strong>i</strong></td>
      <td align="center"><strong>k</strong></td>
      <td align="center"><strong>u</strong></td>
      <td align="center"><strong>n</strong></td>
    </tr>
  </table>
</div>

---

## 部署指南

### 1. Vercel 一键部署 (推荐)

点击上方的 **"Deploy with Vercel"** 按钮，按照提示填入[环境变量](#️-环境变量配置)即可完成部署。

**优势：**
- ⚡ 零配置，一键部署
- 🌍 全球 CDN 加速
- 🔄 自动 CI/CD
- 💰 免费额度充足

---

### 2. Docker 镜像部署 (推荐)

使用预构建的 Docker 镜像快速部署：

```bash
# 拉取最新镜像
docker pull ghcr.io/wing900/ikunkchat:latest

# 运行容器
docker run -d \
  --name ikunkchat \
  -p 8080:80 \
  -e GEMINI_API_KEY="your_gemini_api_key" \
  -e VITE_ACCESS_PASSWORD="your_password" \
  ghcr.io/wing900/ikunkchat:latest

# 访问服务
# 打开浏览器访问: http://localhost:8080
```

**端口说明：**
- 容器内部端口：`80`
- 主机映射端口：`8080`（可自定义）

---

### 3. Docker Compose 部署

适合需要编排多个服务的场景：

```bash
# 克隆仓库
git clone https://github.com/Wing900/ikunKChat.git
cd ikunKChat

# 启动服务
docker-compose up -d

# 访问服务
# 打开浏览器访问: http://localhost:8080
```

⚠️ **注意事项：**
- 不建议使用 Hugging Face Spaces 部署（可能导致静态资源损坏）
- 配置文件位于 [`docker-compose.yml`](docker-compose.yml)

---

### 4. 本地开发部署

适合开发者进行二次开发：

```bash
# 1. 克隆仓库
git clone https://github.com/Wing900/ikunKChat.git
cd ikunKChat

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入必要的配置

# 4. 启动开发服务器
npm run dev

# 5. 构建生产版本
npm run build
```

**开发服务器默认地址：** `http://localhost:5173`

---

## 环境变量配置

### 核心配置

```env
# ============================================
# 🔐 访问控制 (必填)
# ============================================
VITE_ACCESS_PASSWORD="your_secure_password"

# ============================================
# 🤖 API 配置 (至少填一个)
# ============================================

# --- Gemini API ---
GEMINI_API_KEY="your_gemini_api_key"
VITE_API_BASE_URL=""  # 可选，留空使用官方地址

# --- OpenAI API ---
OPENAI_API_KEY="your_openai_api_key"
VITE_OPENAI_API_BASE_URL="https://api.openai.com"  # 支持兼容接口

# 💡 API 选择逻辑：
#   - 只填 GEMINI_API_KEY   → 使用 Gemini
#   - 只填 OPENAI_API_KEY   → 使用 OpenAI
#   - 两者都填             → 优先使用 Gemini
#   - 都不填               → 用户需在设置中手动配置
```

### 高级配置

```env
# ============================================
# 📋 模型列表 (可选)
# ============================================
# 用逗号分隔，第一个为默认模型
VITE_GEMINI_MODELS="gemini-2.5-pro-preview-06-05-maxthinking,gemini-2.5-flash"
VITE_OPENAI_MODELS=""  # 留空自动获取

# ============================================
# 🆘 应急备用 API (可选，仅 Gemini)
# ============================================
VITE_FALLBACK_GEMINI_API_KEY=""
VITE_FALLBACK_API_BASE_URL=""

# ============================================
# 🏷️ 专用标题生成 API (可选)
# ============================================
# 推荐使用免费的硅基流动 API
VITE_TITLE_API_URL="https://api.siliconflow.cn/v1/chat/completions"
VITE_TITLE_API_KEY="your_siliconflow_key"
VITE_TITLE_MODEL_NAME="THUDM/GLM-4-9B-0414"
```

**配置说明：**
- 模型列表若留空，系统将自动获取可用模型
- 若填写模型列表，系统会取获取列表与配置列表的**交集**
- 列表中第一个模型将作为**默认聊天模型**

---

## 技术栈

<div align="center">
  <table>
    <tr>
      <th>分类</th>
      <th>技术</th>
      <th>说明</th>
    </tr>
    <tr>
      <td><strong>前端框架</strong></td>
      <td>
        <img src="https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white" alt="React" />
        <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
      </td>
      <td>现代化组件开发</td>
    </tr>
    <tr>
      <td><strong>构建工具</strong></td>
      <td>
        <img src="https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white" alt="Vite" />
      </td>
      <td>快速构建与热更新</td>
    </tr>
    <tr>
      <td><strong>UI 框架</strong></td>
      <td>
        <img src="https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
      </td>
      <td>原子化 CSS 设计</td>
    </tr>
    <tr>
      <td><strong>数据存储</strong></td>
      <td>IndexedDB</td>
      <td>浏览器本地数据库</td>
    </tr>
    <tr>
      <td><strong>部署方案</strong></td>
      <td>
        <img src="https://img.shields.io/badge/Docker-Container-2496ED?logo=docker&logoColor=white" alt="Docker" />
        <img src="https://img.shields.io/badge/Vercel-Serverless-000000?logo=vercel&logoColor=white" alt="Vercel" />
      </td>
      <td>容器化与无服务器</td>
    </tr>
  </table>
</div>

### 核心依赖

```json
{
  "react": "^18.x",
  "typescript": "^5.x",
  "vite": "^5.x",
  "tailwindcss": "^3.x"
}
```

完整依赖列表请查看 [`package.json`](package.json)

---

## 致谢

本项目基于以下开源项目和社区：

- 🔗 **原始项目：** [KChat](https://github.com/KuekHaoYang/KChat) - 感谢原作者的优秀工作
- 🌐 **社区支持：** [Linux.do 社区](https://linux.do) - 提供技术交流与反馈

### 特别鸣谢

感谢所有为本项目贡献代码、提出建议和报告问题的开发者！

---

<div align="center">
  <p>
    <strong>如果这个项目对你有帮助，欢迎给个 ⭐ Star！</strong>
  </p>
  <p>
    Made with ❤️ by <a href="https://github.com/Wing900">Wing900</a>
  </p>
  <p>
    <sub>© 2026 ikunKChat. All rights reserved.</sub>
  </p>
</div>