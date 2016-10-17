本文主要介绍Electron应用如何打包成msi和exe文件。
由于介绍Electron打包成msi和exe的文章很少，官方的文档也一笔带过，在研究的过程中踩了很多坑，所以写下此文，给其他人一个参考。
关于Electron基础知识的文章，官方文档很详细，在此不再赘述，还没入门的童鞋可以看看方的入门文档:
https://github.com/electron/electron/blob/master/docs-translations/zh-CN/tutorial/quick-start.md

<!-- more -->
照着本文操作前，请确保电脑上已经安装了NodeJs,Electron模块,然后有一个写好的Electron应用。

![未打包前的文件目录](http://7xn0vc.com1.z0.glb.clouddn.com/1.jpg)

## 1. 打包成运行包
没打包之前，想要用Electron运行你的应用有两种方式
- 在应用目录打开命令行，输入`electron .`
- 在命令行输入`electron`,启动一个Electron窗口，并把mian.js拖入窗口中。

这种方式不太优雅，我想直接双击就能运行呢？那就要用到常规打包(以下步骤都是在应用根目录,即上图的Electron_Zhihu下)：

**1.1 安装依赖**
常规打包需要用到`electron-packager`模块，所以先在命令行中输入`npm install --save-dev electron-packager`安装。
**1.2 package.json里添加一条打包命令，免得每次打包都要输入一长串命令**
```
"scripts": {
	"package": "electron-packager ./ zhihu --win --out zhihu --arch=x64 --version 1.3.4 --overwrite --ignore=node_modules" 
} 
```
> 参数说明
`electron-packager <location of project> <name of project> <platform> <architecture> <electron version> <optional options>`
location of project：应用目录;
name of project：应用名称;
platform：要打包的平台;
architecture：x86 or x64架构;
electron version：electron 版本(不是应用版本);
optional options：其它选项;

**1.3 执行`npm run-script package`开始打包,第一次打包会下载相应平台的包,可能会比较久**
打包完毕后，会多出来一个目录,比如我的是`zhihu`,打开之后，会有一个`zhihu-win32-x64`目录，里面就是打包生成的各种文件:
![常规打包生成的文件](http://7xn0vc.com1.z0.glb.clouddn.com/electron_3.png)

`zhihu.exe`是可以直接双击运行的，`resources`里是源文件。
**注意,node_modules不会被打包进去，如果有依赖，记得进入`resources/app`目录输入`npm install`安装一下依赖。**

## 2. 打包成安装包
Electron官方推荐使用`grunt-electron-installer`模块自动生成 Windows 安装向导。
**注意：以下操作都在`zhihu-win32-x64`的父级目录中**

**2.1 安装grunt-electron-installer**
新建`package.json`文件
![新建package.json](http://7xn0vc.com1.z0.glb.clouddn.com/Electron_7.jpg)

`package.json`的内容可以简单写下:
```
{
  "name": "zhihu",
  "version": "1.0.0"  
}
```
打开命令行，输入`npm install grunt-electron-installer --save-dev`安装`grunt-electron-installer`模块,接着输入`npm install grunt --save-dev`安装grunt。

**2.2 配置Gruntfile.js**
因为要用到grunt执行打包任务，所以，新建一个`Gruntfile.js`文件，并配置gurnt.config,我的配置如下：
```
var grunt = require("grunt");
grunt.config.init({
    pkg: grunt.file.readJSON('package.json'),
    'create-windows-installer': {
        x64: {
            appDirectory: './zhihu-win32-x64',
            authors: 'yohnz.',
            exe: 'zhihu.exe',
            description:"zhihu",
        }       
    }
})

grunt.loadNpmTasks('grunt-electron-installer');
grunt.registerTask('default', ['create-windows-installer']);
```
配置说明：

|Config Name|	Required|	Description|
| ---- | :--: | ---- |
|appDirectory | Yes|Electron App 的目录|
|outputDirectory|	No|	输出exe的目录. 默认生成在installer目录.|
|loadingGif|	No|	安装过程中的加载动画图片.|
|authors|	Yes|	作者,若未指明，则从应用的package.json文件中读取|
|owners|	No|	应用拥有者，若未定义则与作者相同.|
|exe|	No|	应用的入口exe名称.|
|description|	No|	应用描述|
|version|	No|	应用版本号.|
|title|	No|	应用的标题.|
|certificateFile|	No|	证书文件|
|certificatePassword|	No|	加密密钥|
|signWithParams|	No|	传递给signtool签名工具的参数，如果软件不签名，可以忽略这个|
|iconUrl|	No|应用图标链接，默认是Atom的图标.|
|setupIcon|	No|	Setup.exe 的icon|
|noMsi|	No|	是否创建.msi安装文件?|
|remoteReleases|	No|	更新链接，如果填写，当链接中有新版本，会自动下载安装。|

**2.3 grunt打包**
在命令行输入`npm grunt`,就会执行自动构建安装程序。在构建完之后的installer目录(或者你配置的输出目录)中会有如下几个文件
![生成的安装文件](http://7xn0vc.com1.z0.glb.clouddn.com/Electron_8.jpg)
运行setup.exe就开始自动安装了,我们去'控制面板->程序和功能'里检验一下,发现应用已经安装了。
![卸载列表里](http://7xn0vc.com1.z0.glb.clouddn.com/Electron_9.jpg)

**2.4 生成快捷方式**
到此处，Electron的安装文件就打包好了，但是装完之后，没有自动生成快捷方式，所以，我们要在main.js里加入生成快捷方式的功能。

- 添加监听并生成快捷方式

```
var handleStartupEvent = function () {
  if (process.platform !== 'win32') {
    return false;
  }

  var squirrelCommand = process.argv[1];

  switch (squirrelCommand) {
    case '--squirrel-install':
    case '--squirrel-updated':
      install();
      return true;
    case '--squirrel-uninstall':
      uninstall();
      app.quit();
      return true;
    case '--squirrel-obsolete':
      app.quit();
      return true;
  }
    // 安装
  function install() {
    var cp = require('child_process');    
    var updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
    var target = path.basename(process.execPath);
    var child = cp.spawn(updateDotExe, ["--createShortcut", target], { detached: true });
    child.on('close', function(code) {
        app.quit();
    });
  }
   // 卸载
   function uninstall() {
    var cp = require('child_process');    
    var updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
    var target = path.basename(process.execPath);
    var child = cp.spawn(updateDotExe, ["--removeShortcut", target], { detached: true });
    child.on('close', function(code) {
        app.quit();
    });
  }

};

if (handleStartupEvent()) {
  return;
}
```
运行步骤1.3和2.3重新打包,此时，再次运行setup.exe进行安装，就会自动再桌面和开始菜单生成快捷方式了。但是，你可能会发现快捷方式的名字是Electron而不是你设置的应用名。如果比较处女座，可以继续执行一下步骤：
**2.5. 修改打包参数**
修改步骤1.2中的打包参数，添加：`--version-string.CompanyName=zhihu --version-string.ProductName=zhihu`
完整命令如下：
```
  "scripts": {
    "package": "electron-packager ./ zhihu --win --out zhihu --arch=x64 --version 1.3.4 --overwrite --ignore=node_modules --version-string.CompanyName=zhihu --version-string.ProductName=zhihu"
  },
```
然后重新运行步骤1.3和2.3进行打包，此时再编译好的安装包就可以运行并生成桌面快捷方式和开始菜单了。
![桌面快捷方式](http://7xn0vc.com1.z0.glb.clouddn.com/Electron_10.jpg)
![开始菜单](http://7xn0vc.com1.z0.glb.clouddn.com/Electron_11.jpg)



参考资料：
https://github.com/electron/grunt-electron-installer
https://github.com/electron/electron/blob/master/docs-translations/zh-CN/api/auto-updater.md
http://blog.csdn.net/w342916053/article/details/51701722  