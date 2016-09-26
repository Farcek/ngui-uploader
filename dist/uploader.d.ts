declare namespace ngui.uploader {
    interface IUriResolver {
        (modelValue: any, attrUri: string): string;
    }
    interface IResponceParser {
        (resp: string): any;
    }
    interface IUploaderServiceOptions {
        target?: string;
        uploadFieldName?: string;
        uploadUriResolver?: IUriResolver;
        previewUriResolver?: IUriResolver;
        responseParser?: IResponceParser;
        onError?: Function;
    }
    class UploaderService {
        options: IUploaderServiceOptions;
        constructor(options?: IUploaderServiceOptions);
        responceParse(responce: string): any;
        previewUri(modelValue: any, attrUri: any): any;
        uploadUriResolve(modelValue: any, attrUri: any): any;
        onError(err: any): void;
    }
    interface IUploaderServiceFactory {
        (options?: IUploaderServiceOptions): UploaderService;
    }
    interface IUploaderConfigProvider {
        setBaseTemplateUrl(uri: string): IUploaderConfigProvider;
    }
}
declare var Flow: any;
