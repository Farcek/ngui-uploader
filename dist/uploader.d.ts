declare namespace ngui.uploader {
    interface IUriResolver {
        (modelValue: any, path: string): string;
    }
    interface IUriPreviewResolver {
        (modelValue: any, path: string, cacheIndexer: number): string;
    }
    interface IResponseParser {
        (resp: string): any;
    }
    interface IFlowOptioner {
        (options: flowjs.IFlowOptions): void;
    }
    interface IPreUploadFactory {
        (...injects: any[]): IPreUpload;
    }
    interface IPreUpload extends Function {
        (options: flowjs.IFlowOptions): void;
    }
    interface IUploaderServiceOptions {
        target?: string;
        uploadFieldName?: string;
        uploadUriResolver?: IUriResolver;
        previewUriResolver?: IUriPreviewResolver;
        responseParser?: IResponseParser;
        flowOptioner?: IFlowOptioner;
        preUpload?: (string | IPreUploadFactory)[];
        onError?: Function;
        onUploadSaccess?: Function;
    }
    class UploaderService {
        options: IUploaderServiceOptions;
        configProvider: UploaderConfigProvider;
        private $injector;
        constructor(options: IUploaderServiceOptions, configProvider: UploaderConfigProvider, $injector: any);
        cacheIndexer: number;
        flowOptioner(flowOptions: flowjs.IFlowOptions): void;
        preUpload(flowOptions: flowjs.IFlowOptions): void;
        responceParse(responce: string): any;
        previewUri(modelValue: any, path: any): string;
        uploadUriResolve(modelValue: any, path: any, uploadStatic: any): string;
        onError(err: any): void;
        onUploadSuccess(): void;
    }
    interface IUploaderServiceFactory {
        (options?: IUploaderServiceOptions): UploaderService;
    }
    class UploaderConfigProvider {
        baseTemplateUrl: string;
        baseUploadingTargetUri: any;
        emptyImageUri: string;
        flowOptioner: IFlowOptioner;
        preUpload: (string | IPreUploadFactory)[];
        responseParser: IResponseParser;
        previewUriResolver: IUriPreviewResolver;
        $get(): this;
    }
}
declare var Flow: any;
