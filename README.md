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
    <a href="#-在线体验">在线体验</a> •
    <a href="#-功能特性">功能特性</a> •
    <a href="#-部署指南">部署指南</a> •
    <a href="#-技术栈">技术栈</a> •
    <a href="#-致谢">致谢</a>
  </p>
</div>

---

## 📑 目录

- [在线体验](#-在线体验)
- [功能特性](#-功能特性)
- [界面展示](#-界面展示)
- [部署指南](#-部署指南)
  - [Vercel 一键部署](#1-vercel-一键部署-推荐)
  - [Docker 镜像部署](#2-docker-镜像部署-推荐)
  - [Docker Compose 部署](#3-docker-compose-部署)
  - [本地开发部署](#4-本地开发部署)
- [环境变量配置](#️-环境变量配置)
- [技术栈](#-技术栈)
- [致谢](#-致谢)

---

## ✨ 在线体验

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

### 🚀 一键部署

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

## 🎯 功能特性

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

---

## 🖼️ 界面展示

### 🎤 唱 - 登录界面

<div align="center">
  <img src="https://github.com/Wing900/ikunKChat/raw/main/public/show/login.png" alt="登录界面" width="80%" />
  <p><i>简洁优雅的登录入口，开启你的 AI 对话之旅</i></p>
</div>

### 🕺 跳 - 聊天体验

<div align="center">
  <table>
    <tr>
      <td width="50%">
        <img src="https://github.com/Wing900/ikunKChat/raw/main/public/show/chat1_comp.png" alt="桌面端聊天-1" />
        <p align="center"><i>桌面端 - 流畅对话</i></p>
      </td>
      <td width="50%">
        <img src="https://github.com/Wing900/ikunKChat/raw/main/public/show/chat2_comp.png" alt="桌面端聊天-2" />
        <p align="center"><i>桌面端 - 多模型切换</i></p>
      </td>
    </tr>
  </table>
</div>

### 🎵 RAP - 角色定制

<div align="center">
  <img src="https://github.com/Wing900/ikunKChat/raw/main/public/show/role.png" alt="角色定制" width="80%" />
  <p><i>个性化 AI 角色，让对话更有温度</i></p>
</div>

### 🏀 篮球 - 移动端适配

<details>
<summary>📱 点击展开移动端界面（完美响应式设计）</summary>

<div align="center">
  <table>
    <tr>
      <td width="33%">
        <img src="https://github.com/Wing900/ikunKChat/raw/main/public/show/chat1_ph.png" alt="移动端-1" />
      </td>
      <td width="33%">
        <img src="https://github.com/Wing900/ikunKChat/raw/main/public/show/chat2_ph.png" alt="移动端-2" />
      </td>
      <td width="33%">
        <img src="https://github.com/Wing900/ikunKChat/raw/main/public/show/chat3_ph.png" alt="移动端-3" />
      </td>
    </tr>
    <tr>
      <td align="center"><i>移动端对话</i></td>
      <td align="center"><i>功能切换</i></td>
      <td align="center"><i>侧边栏</i></td>
    </tr>
  </table>
  
  <img src="https://github.com/Wing900/ikunKChat/raw/main/public/show/chat4_ph.png" alt="移动端-4" width="33%" />
  <p><i>设置界面</i></p>
</div>

</details>

---

## 🚀 部署指南

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

## ⚙️ 环境变量配置

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

## 🛠️ 技术栈

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

## 🙏 致谢

本项目基于以下开源项目和社区：

- 🔗 **原始项目：** [KChat](https://github.com/KuekHaoYang/KChat) - 感谢原作者的优秀工作
- 🌐 **社区支持：** [Linux.do 社区](https://linux.do) - 提供技术交流与反馈

### 特别鸣谢

感谢所有为本项目贡献代码、提出建议和报告问题的开发者！

---

<div align="center">
  <p>
    <strong>如果这个项目对你有帮助，请考虑给个 ⭐ Star！</strong>
  </p>
  <p>
    Made with ❤️ by <a href="https://github.com/Wing900">Wing900</a>
  </p>
  <p>
    <sub>© 2024 ikunKChat. All rights reserved.</sub>
  </p>
</div>