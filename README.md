# 异地恋见面地图

这是一个可以发布成公共网址的网页，用来记录异地恋每次见面的城市、时间、住处、场景、备注和照片。

## 当前能力

- 地图点位展示见面城市
- 支持具体地点、纬度、经度
- 点击点位查看详情
- 新增见面记录
- 上传照片
- 导出 / 导入记录
- 接入 Supabase 后支持云端同步

## 文件说明

- `index.html`：网页结构
- `styles.css`：页面样式
- `script.js`：地图、表单、云端同步逻辑
- `config.js`：Supabase 配置
- `supabase-schema.sql`：Supabase 建表脚本
- `.nojekyll`：让 GitHub Pages 按普通静态网页发布

## 上线和同步步骤

### 1. 创建 Supabase 项目

1. 打开 https://supabase.com
2. 登录后新建一个 Project
3. 进入左侧 SQL Editor
4. 把 `supabase-schema.sql` 里的内容复制进去执行

如果你之前已经执行过一次，也可以再次执行同一个文件。它会追加具体地点、纬度、经度字段，不会清空已有记录。

### 2. 填写网页配置

在 Supabase 项目里找到：

- Project URL
- anon public key

然后填到 `config.js`：

```js
window.LOVE_MAP_SUPABASE = {
  url: "你的 Project URL",
  anonKey: "你的 anon public key",
  tableName: "meeting_records",
  photoBucket: "meeting-photos"
};
```

### 3. 发布到 GitHub Pages

1. 新建一个 GitHub 仓库
2. 上传这个文件夹里的所有文件
3. 打开仓库 Settings -> Pages
4. Source 选择 main 分支
5. 保存后等待 GitHub 生成公开网址

之后你和女朋友访问同一个网址，就会看到同一份云端记录。

## 注意

现在的 Supabase 权限是为了先跑通同步，适合只有你们知道网址的小项目。后面如果要更私密，可以继续加登录或密码保护。
