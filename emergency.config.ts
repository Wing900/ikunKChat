/**
 * 应急路由配置文件
 * --------------------------
 * 本文件用于控制应用在主要API服务不可用时，是否切换到备用服务。
 * 重要提示：修改此文件后，必须重新构建和部署网站，更改才会生效。
 */

/**
 * 是否启用应急备用路由。
 * - 设置为 `true`：应用将强制使用 `VITE_FALLBACK_API_BASE_URL` 和 `VITE_FALLBACK_GEMINI_API_KEY` 环境变量中定义的备用API端点和密钥。
 * - 设置为 `false`：应用将使用标准的主要API配置。
 * 
 * 这是一个开发者级别的开关，用于快速响应服务中断。
 * 应急流程：
 * 1. 将此处的 `false` 修改为 `true`。
 * 2. 重新运行 `npm run build` 进行构建。
 * 3. 将新的构建产物部署到服务器。
 */
export const USE_EMERGENCY_ROUTE = false;
