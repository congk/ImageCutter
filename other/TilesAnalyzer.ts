/**
 * 瓦片背景解析
 * Created by coderk on 16/8/8.
 */
module RES{
    export class TilesAnalyzer extends BinAnalyzer{

        private _jsonData:any = {};
        private _texture:any = {};

        public constructor(){
            super();
            this._dataFormat = egret.HttpResponseType.TEXT;
        }

        public loadFile(resItem: ResourceItem, compFunc: Function, thisObject: any):void{
            //请求json数据
            super.loadFile(resItem, this.getJsonLoadCallback(compFunc, thisObject), this);
        }

        private getJsonLoadCallback(compFunc, context){
            return (resItem:ResourceItem)=>{

                const baseUrl:string = resItem.url.split(".")[0];
                const jsonData = this._jsonData[resItem.name];

                const column:number = this.getColumnNum(jsonData);		//列数
                const row:number = this.getRowNum(jsonData);		//行数

                var res = [];
                for(var i = 0; i<row; ++i){
                    for(var j = 0; j < column; ++j){
                        var name = i + "_" + j;
                        res.push({
                            id: name, url: baseUrl + "/" + name + "." + jsonData.extension
                        });
                    }
                }
                var loadingNum = column * row;

                var resLoaded = (data, item)=>{
                    this._texture[resItem.name][item.id] = data;
                    loadingNum --;
                    if(loadingNum <= 0){
                        compFunc.call(context, resItem);
                    }
                };
                res.forEach((item)=>this.loadRes(item, resLoaded, this));
            };
        }

        //加载单张小图
        private loadRes(item, compFunc, context){
            var loader = new egret.ImageLoader();
            loader.addEventListener(egret.Event.COMPLETE, ()=>{
                var texture = new egret.Texture();
                texture._setBitmapData(loader.data);
                compFunc.call(context, texture, item);
            }, this);
            loader.addEventListener(egret.IOErrorEvent.IO_ERROR, (event:egret.IOErrorEvent)=>{
                egret.warn(event.toString());
            }, this);
            //api兼容
            var virtualUrl = RES["getVirtualUrl"]
                ? RES["getVirtualUrl"](item.url)
                : RES["getVersionController"]()["getVirtualUrl"](item.url);
            loader.load(virtualUrl);
        }



        /**
         * 解析并缓存加载成功的数据
         */
        public analyzeData(resItem: ResourceItem, data: any): void{
            var name = resItem.name;
            if (this._jsonData[name] || !data) {
                return;
            }
            try {
                this._jsonData[name] = JSON.parse(data);
            } catch (e) {
                egret.$warn(1017, resItem.url, data);
            }
            this._texture[name] = {};
        }

        /**
         * @inheritDoc
         */
        public getRes(name:string): any{
            const jsonData:any = this._jsonData[name];
            const textures:any = this._texture[name];

            const column:number = this.getColumnNum(jsonData);		//列数
            const row:number = this.getRowNum(jsonData);		//行数

            const container:egret.DisplayObjectContainer = new egret.DisplayObjectContainer();
            for(var i = 0; i < row; ++i){
                for(var j = 0; j < column; ++j) {
                    let name:string = i + "_" + j;
                    let bitmap:egret.Bitmap = new egret.Bitmap(textures[name]);
                    bitmap.x = j * jsonData.itemWidth;
                    bitmap.y = i * jsonData.itemHeight;
                    container.addChild(bitmap);
                }
            }
            return container;
        }

        private getColumnNum(jsonData:any):number{
            return Math.ceil(jsonData.width / jsonData.itemWidth);
        }

        private getRowNum(jsonData:any):number{
            return Math.ceil(jsonData.height / jsonData.itemHeight);
        }

        /**
         * @inheritDoc
         */
        public hasRes(name:string): boolean{
            return this._jsonData[name] && this._texture[name] && Object.keys(this._texture[name]).length > 0;
        }
        /**
         * @inheritDoc
         */
        public destroyRes(name:string): boolean{
            if(this._jsonData[name])
                delete this._jsonData[name];
            if(this._texture[name]){
                for(var key in this._texture[name]){
                    var texture:egret.Texture = this._texture[name][key];
                    texture.dispose();
                }
                delete this._texture[name];
            }
            return true;
        }
    }

    export class AbstractTilesBase extends egret.DisplayObjectContainer{

    }
}
