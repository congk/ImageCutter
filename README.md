# ImageCutter v1.1.0 for egret-core

该工程为flex工程，已打包好的工具安装包位于 bin-release 文件夹下

# 图片切割

该工具的作用是将单张背景大图切割为多张小图，小图最终存放在与大图同级的同名文件夹下，如：
对bg_1001.jpg进行切割，则最终在该图片所在的目录下可获得如下目录内容：
* bg_1001.jpg
* bg_1001.tiles
* bg_1001/
	- 0_0.jpg
	- 0_1.jpg
	- ...

# 使用
在入口Main.ts文件中对RES注入 .tiles 文件类型的解析器，解析器在other目录下可找到：
```typescript
RES.registerAnalyzer("tiles", RES.TilesAnalyzer);
```