declare namespace ngui.uploader {
    interface IUriResolver {
        (modelValue: any, path: string): string;
    }
    interface IUriPreviewResolver {
        (modelValue: any, path: string, catchIndexer: number): string;
    }
    interface IResponseParser {
        (resp: string): any;
    }
    interface IFlowOptioner {
        (options: flowjs.IFlowOptions): void;
    }
    interface IUploaderServiceOptions {
        target?: string;
        uploadFieldName?: string;
        uploadUriResolver?: IUriResolver;
        previewUriResolver?: IUriPreviewResolver;
        responseParser?: IResponseParser;
        flowOptioner?: IFlowOptioner;
        onError?: Function;
        onUploadSaccess?: Function;
    }
    class UploaderService {
        options: IUploaderServiceOptions;
        uploaderConfig: IUploaderConfig;
        constructor(options: IUploaderServiceOptions, uploaderConfig: IUploaderConfig);
        cacheIndex: number;
        responceParse(responce: string): any;
        previewUri(modelValue: any, path: any): string;
        uploadUriResolve(modelValue: any, path: any, uploadStatic: any): string;
        onError(err: any): void;
        onUploadSuccess(): void;
    }
    interface IUploaderServiceFactory {
        (options?: IUploaderServiceOptions): UploaderService;
    }
    interface IUploaderConfigProvider {
        setBaseTemplateUrl(uri: string): IUploaderConfigProvider;
        setBaseUploadingTargetUri(uri: string | Function): IUploaderConfigProvider;
        setEmptyImageUri(uri: string): IUploaderConfigProvider;
        setFlowOptioner(optioner: IFlowOptioner): IUploaderConfigProvider;
        setResponseParser(optioner: IResponseParser): IUploaderConfigProvider;
        setPreviewUriResolver(resolver: IUriPreviewResolver): IUploaderConfigProvider;
    }
    interface IUploaderConfig {
        baseTemplateUrl: string;
        baseUploadingTargetUri: string;
        emptyImageUri: string;
        flowOptioner?: IFlowOptioner;
        responseParser?: IResponseParser;
        previewUriResolver?: IUriPreviewResolver;
    }
}
declare var Flow: any;
