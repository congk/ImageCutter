/**
 * 瓦片背景解析
 * Created by coderk on 16/8/8.
 */
module RES{
    export class TilesAnalyzer extends BinAnalyzer{

        private _jsonData:any = {};

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
                const groupName:string = resItem.name + "_group";
                if(RES.hasRes(groupName)){
                    compFunc.call(context, resItem)
                } else {
                    const baseUrl:string = resItem.url.split(".")[0];
                    const jsonData = this._jsonData[resItem.name];

                    const column:number = this.getColumnNum(jsonData);        //列数
                    const row:number = this.getRowNum(jsonData);        //行数

                    const res = [];
                    //创建组
                    for(var i = 0; i<row; ++i){
                        for(var j = 0; j < column; ++j){
                            let name:string = resItem.name + "_" + i + "_" + j;
                            let url:string = baseUrl + "/" + i + "_" + j + "." + jsonData.extension;
                            res.push(name);
                            RES.$addResourceData({name: name, type: "image", url: url});
                        }
                    }

                    RES.createGroup(groupName, res, true);
                    this.loadGroup(groupName, ()=>compFunc.call(context, resItem), null);
                }
            };
        }

        //加载资源组
        private loadGroup(groupName, compFunc, context){
            var onComplete = (event:ResourceEvent)=>{
                if(event.groupName == groupName){
                    removeEventListener();
                    compFunc.call(context);
                }
            };
            //var onProgress = (event:ResourceEvent)=>{
            //    if(event.groupName == groupName)
            //        console.log(event.itemsLoaded + " / " + event.itemsTotal);
            //};
            var onError = (event:ResourceEvent)=>{
                if(event.groupName == groupName){
                    removeEventListener();
                    egret.error("资源组加载失败！", groupName);
                }
            };
            var removeEventListener = ()=>{
                RES.addEventListener(ResourceEvent.GROUP_COMPLETE, onComplete, null);
                RES.addEventListener(ResourceEvent.GROUP_LOAD_ERROR, onError, null);
                //RES.addEventListener(ResourceEvent.GROUP_PROGRESS, onProgress, null);
            };
            RES.addEventListener(ResourceEvent.GROUP_COMPLETE, onComplete, null);
            RES.addEventListener(ResourceEvent.GROUP_LOAD_ERROR, onError, null);
            //RES.addEventListener(ResourceEvent.GROUP_PROGRESS, onProgress, null);
            //最高优先集
            RES.loadGroup(groupName, Number.MAX_VALUE);
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
        }

        /**
         * @inheritDoc
         */
        public getRes(name:string): any{
            const jsonData:any = this._jsonData[name];
            const column:number = this.getColumnNum(jsonData);        //列数
            const row:number = this.getRowNum(jsonData);        //行数

            const container:egret.DisplayObjectContainer = new egret.DisplayObjectContainer();
            for(var i = 0; i < row; ++i){
                for(var j = 0; j < column; ++j) {
                    var bitmap:egret.Bitmap = new egret.Bitmap(RES.getRes(name + "_" + i + "_" + j));
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
            return RES.hasRes(name + "_group");
        }
        /**
         * @inheritDoc
         */
        public destroyRes(name:string): boolean{
            if(this._jsonData[name])
                delete this._jsonData[name];
            return RES.destroyRes(name + "_group");
        }
    }

    export class AbstractTilesBase extends egret.DisplayObjectContainer{

    }
}
