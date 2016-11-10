/**
 * 瓦片背景解析
 * Created by coderk on 16/8/8.
 */
module ext{
    export class TilesAnalyzer extends RES.BinAnalyzer{

        private static IsSync:boolean = false;

        public static get SyncInstance():any{
            TilesAnalyzer.IsSync = true;
            return TilesAnalyzer;
        }

        public static get ASyncInstance():any{
            TilesAnalyzer.IsSync = false;
            return TilesAnalyzer;
        }

        private _jsonData:any = {};

        public constructor(){
            super();
            this._dataFormat = egret.HttpResponseType.TEXT;
        }

        public loadFile(resItem: RES.ResourceItem, compFunc: Function, thisObject: any):void{
            if(TilesAnalyzer.IsSync){
                //请求json数据
                super.loadFile(resItem, this.getJsonLoadCallback(compFunc, thisObject), this);
            } else {
                super.loadFile(resItem, compFunc, thisObject);
            }
        }

        private getJsonLoadCallback(compFunc, context){
            return (resItem:RES.ResourceItem)=>{
                this.loadGroup(getGroupName(resItem.name), ()=>compFunc.call(context, resItem), null);
            };
        }

        //加载资源组
        private loadGroup(groupName, compFunc, context){
            var onComplete = (event:RES.ResourceEvent)=>{
                if(event.groupName == groupName){
                    removeEventListener();
                    compFunc.call(context);
                }
            };
            var onError = (event:RES.ResourceEvent)=>{
                if(event.groupName == groupName){
                    removeEventListener();
                    egret.error("资源组加载失败！", groupName);
                }
            };
            var removeEventListener = ()=>{
                RES.addEventListener(RES.ResourceEvent.GROUP_COMPLETE, onComplete, null);
                RES.addEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, onError, null);
            };
            RES.addEventListener(RES.ResourceEvent.GROUP_COMPLETE, onComplete, null);
            RES.addEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, onError, null);
            //最高优先集
            RES.loadGroup(groupName, Number.MAX_VALUE);
        }

        /**
         * 解析并缓存加载成功的数据
         */
        public analyzeData(resItem: RES.ResourceItem, data: any): void{
            const name = resItem.name;
            if (this._jsonData[name] || !data) {
                return;
            }
            try {
                this._jsonData[name] = new TilesData(name,
                    MyJSON.parse(data,"TilesAnalyzer analyzeData->resItem.name:"+resItem.name +" data:  "+data));
            } catch (e) {
                return egret.$warn(1017, resItem.url, data);
            }

            //注册相关资源组
            this.registerGroup(resItem);
        }

        private registerGroup(resItem:RES.ResourceItem):void{
            const groupName:string = getGroupName(resItem.name);
            const baseUrl:string = resItem.url.split(".")[0];
            const jsonData:TilesData = this._jsonData[resItem.name];
            const res = [];
            var type;
            var extension;
            if(egret.Capabilities.runtimeType == egret.RuntimeType.WEB && egret.Capabilities.renderMode=="webgl" && egret.Capabilities.os == "iOS") {
                type = extension = "pvr";
            }
            else {
                type = "image";
                extension = jsonData.extension;
            }
            //创建组
            for (var i = 0; i < jsonData.row; ++i) {
                for (var j = 0; j < jsonData.column; ++j) {
                    let name:string = resItem.name + "_" + i + "_" + j;
                    let url:string = baseUrl + "/" + i + "_" + j + "." + extension;
                    res.push(name);
                    RES.$addResourceData({name: name, type: type, url: url});
                }
            }
            RES.createGroup(groupName, res, true);
        }


        /**
         * @inheritDoc
         */
        public getRes(name:string): any{
            //返回值为 TilesData实例 || undefined
            return this._jsonData[name];
        }

        /**
         * @inheritDoc
         */
        public hasRes(name:string): boolean{
            return this._jsonData[name] != null;
        }
        /**
         * @inheritDoc
         */
        public destroyRes(name:string): boolean{
            if(this._jsonData.hasOwnProperty(name)){
                delete this._jsonData[name];
            }
            return RES.destroyRes(getGroupName(name));
        }
    }

    /**
     * Tiles文件转化为可用显示对象的基类
     */
    export class TilesContainerBase extends egret.DisplayObjectContainer{

        protected _data:TilesData;

        public constructor(tilesData:TilesData){
            super();
            this._data = tilesData;
        }
        public get tilesData(){
            return this._data;
        }

    }

    /**
     * .tiles缓存文件结构
     */
    export class TilesData{

        public width:number;
        public height:number;
        public itemWidth:number;
        public itemHeight:number;
        public extension:string;
        public name:string;
        public column:number;
        public row:number;

        public constructor(name:string, jsonData:any){
            this.name = name;

            for(var key in jsonData)
                this[key] = jsonData[key];

            this.column = Math.ceil(jsonData.width / jsonData.itemWidth);
            this.row = Math.ceil(jsonData.height / jsonData.itemHeight);
        }

        private getItemName(row, column):string{
            return this.name + "_" + row + "_" + column;
        }

        /**
         * 获取指定行列素材，调用前请判断素材是否已加载
         * @param row
         * @param column
         * @return {egret.Texture}
         */
        public getTextureByRowAndColumn(row, column):egret.Texture{
            return RES.getRes(this.getItemName(row, column));
        }

        /**
         * 异步获取指定行列素材
         * @param row
         * @param column
         * @param callback 回调函数。示例：compFunc(texture, key):void。
         * @param context
         */
        public getTextureByRowAndColumnAsync(row, column, callback:(texture:egret.Texture)=>void, context):void{
            RES.getResAsync(this.getItemName(row, column), callback, context);
        }

        /**
         * 判断是否所有资源加载完毕
         * @returns {boolean}
         */
        public itemsLoaded():boolean{
            return RES.isGroupLoaded(getGroupName(this.name));
        }
    }

    function getGroupName(name:string):string{
        return name + "_group";
    }
}
