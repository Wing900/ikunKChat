# PWA 图标生成说明

为了完整实现 PWA 功能，您需要生成以下尺寸的 PNG 图标：

1. icon-192.png (192x192 pixels)
2. icon-512.png (512x512 pixels)

您可以使用以下方法之一生成这些图标：

## 方法一：在线工具
1. 访问 https://www.favicon-generator.org/
2. 上传您的 favicon.svg 文件
3. 下载生成的图标包
4. 将 icon-192.png 和 icon-512.png 放入 public 目录

## 方法二：使用图像编辑软件
1. 使用 Photoshop、GIMP 或其他图像编辑软件打开 favicon.svg
2. 导出为 PNG 格式，分别设置为 192x192 和 512x512 尺寸
3. 保存到 public 目录并命名为 icon-192.png 和 icon-512.png

## 方法三：使用命令行工具 (如 ImageMagick)
如果您安装了 ImageMagick，可以使用以下命令：

```bash
# 从 SVG 生成 PNG 图标
magick convert -background none -density 300 -resize 192x192 favicon.svg icon-192.png
magick convert -background none -density 300 -resize 512x512 favicon.svg icon-512.png
```