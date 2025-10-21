# ikunKChat 🏀

一个轻量、快速、优雅的聊天网页UI，专为低成本私有化部署而设计。

<a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FWing900%2FikunKChat">
  <img src="https://vercel.com/button" alt="Deploy with Vercel" width="120">
</a>

---

## ✨ 在线体验

-   **演示地址:** [https://ikun-k-chat-demo.vercel.app/](https://ikun-k-chat-demo.vercel.app/)
-   **访问密码:** `ikuninlinuxdo`

## 🚀 部署

### 1. Vercel 一键部署 (推荐)

点击本文档顶部的 "Deploy with Vercel" 按钮，根据提示填入下方的环境变量即可。

### 2. Docker 部署

⚠️ **重要提示：不建议使用 Hugging Face Spaces 部署，因为可能导致静态资源（图片文件）损坏。**

```bash
# 克隆仓库
git clone https://github.com/Wing900/ikunKChat.git
cd ikunKChat

# 使用 docker-compose 部署
docker-compose up -d

# 访问 http://localhost:8080
```

### 3. 本地部署

**克隆仓库**

```bash
git clone https://github.com/Wing900/ikunKChat.git
cd ikunKChat
```

**安装依赖**

```bash
npm install
```

**配置环境变量**
复制 `.env.example` 文件为 `.env`，并参考下方说明进行配置。

```bash
cp .env.example .env
```

**启动项目**

```bash
npm run dev
```

---

## ⚙️ 环境变量

```
# 访问密码 (必须得设置哦)
VITE_ACCESS_PASSWORD="ikun"

# -------------------
# 主要API配置 
# -------------------
# 你的主要Gemini API密钥 

GEMINI_API_KEY=""    

# 你的主要中转站地址 (可选，可以留空或指向官方)
VITE_API_BASE_URL=""

# 你的OpenAI API密钥 (可选，如果填了会自动使用)
OPENAI_API_KEY=""

# 你的OpenAI API地址 (可选，默认为 https://api.openai.com，也支持兼容OpenAI格式的第三方API)
VITE_OPENAI_API_BASE_URL=""

# API选择逻辑说明：
# - 只填 GEMINI_API_KEY: 使用 Gemini
# - 只填 OPENAI_API_KEY: 使用 OpenAI
# - 两个都填: 优先使用 Gemini
# - 都不填: 用户需要在设置中手动填写



# 可用的Gemini模型列表 (英文逗号隔开) 若设置为空则自动使用获取模型列表 ；第一个模型为聊天默认模型
VITE_GEMINI_MODELS="gemini-2.5-pro-preview-06-05-maxthinking,gemini-2.5-pro-preview-06-05-nothinking,gemini-2.5-flash,gemini-2.5-pro,gemini-2.5-flash-lite"

# 可用的OpenAI模型列表 (英文逗号隔开) 若设置为空则自动使用获取模型列表 ；第一个模型为聊天默认模型
VITE_OPENAI_MODELS=""

# 如果填写了模型列表，那么自动取fetch到模型列表和环境变量填写的列表取交集，按环境变量列表的模型列表顺序排序，第一个模型为默认聊天模型
# 如果没有填写，自动按fetch的模型列表排序，第一个模型为默认聊天模型

# -------------------
# 应急备用API配置（暂时只有gemini）
# -------------------
# 你的备用Gemini API密钥
VITE_FALLBACK_GEMINI_API_KEY=""

# 你的备用中转站地址
VITE_FALLBACK_API_BASE_URL=""


# -------------------
# 专用标题生成API配置 （可选，如果不选，默认生成标题模型是gemini-2.5-flash，但是多人使用生成量大，建议用硅基流动免费模型）
# -------------------
# 你的专用标题API地址 (例如: https://api.siliconflow.cn/v1/chat/completions)
VITE_TITLE_API_URL=" https://api.siliconflow.cn/v1/chat/completions"

# 你的专用标题API密钥 我用了硅基流动的
VITE_TITLE_API_KEY=""

# 你要使用的专用标题API模型名称
VITE_TITLE_MODEL_NAME="THUDM/GLM-4-9B-0414"

```



## 🙏 致谢

-   本项目基于 [KChat](https://github.com/KuekHaoYang/KChat) 二次开发。
-   感谢 Linux.do 社区。