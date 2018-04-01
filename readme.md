## 作者 stark.wang
> 博客 http://shudong.wang

## 为什么要开发这个插件
  平时写markdown的最大的痛点就是，怎么上传到图片问题
  这样直接黏贴复制，就可以到远程服务器器，一篇文章可以贴很多平台

## markdown图片上传到七牛

## 用法
可以在设置里面，选择存储本地或上传到七牛

### 填写好七牛的配置 域名即可
filePrefix  设置自己生成链接的前缀 默认stark

下面是列子
`![](http://md.shudong.wang/stark-20180401122423216.png)`
http://md.shudong.wang 是配置的七牛的域名
stark-20180401122423216.png 文件名
stark 是自定义前缀

下面这几个是七牛的配置，去七牛注册账号了解一下
AccessKey
SecretKey
Bucket
Domain

大家用着不方便，或有什么需求可以提issue
