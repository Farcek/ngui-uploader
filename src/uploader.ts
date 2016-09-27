namespace ngui.uploader {
    export interface IUriResolver {
        (modelValue: any, path: string): string
    }
    export interface IUriPreviewResolver {
        (modelValue: any, path: string, catchIndexer: number): string
    }
    export interface IResponseParser {
        (resp: string): any
    }
    export interface IFlowOptioner {
        (options: flowjs.IFlowOptions): void
    }
    export interface IUploaderServiceOptions {
        target?: string
        uploadFieldName?: string
        uploadUriResolver?: IUriResolver
        previewUriResolver?: IUriPreviewResolver
        responseParser?: IResponseParser
        flowOptioner?: IFlowOptioner
        onError?: Function
        onUploadSaccess?: Function
    }
    export class UploaderService {
        constructor(public options: IUploaderServiceOptions, public uploaderConfig: IUploaderConfig) {
        }
        cacheIndex: number = 1;
        responceParse(responce: string): any {
            if (this.options && this.options.responseParser) {
                return this.options.responseParser(responce);
            }
            if (this.uploaderConfig && this.uploaderConfig.responseParser) {
                return this.uploaderConfig.responseParser(responce);
            }
            return responce;
        }
        previewUri(modelValue, path) {

            if (modelValue) {
                if (this.options && this.options.previewUriResolver) {                    
                    let uri = this.options.previewUriResolver(modelValue, path, this.cacheIndex);
                    if (uri) return uri;
                }

                if (this.uploaderConfig && this.uploaderConfig.previewUriResolver) {
                    let uri = this.uploaderConfig.previewUriResolver(modelValue, path, this.cacheIndex);
                    if (uri) return uri;
                }

                return this.uploaderConfig.baseUploadingTargetUri + '/' + path + '/' + modelValue;
            }

            return this.uploaderConfig.emptyImageUri;
        }
        uploadUriResolve(modelValue, path, uploadStatic) {
            if (this.options && this.options.uploadUriResolver) {
                let uri = this.options.uploadUriResolver(modelValue, path);
                if (uri) return uri;
            }
            if (this.options && this.options.target) {
                return this.options.target;
            }

            if (uploadStatic) {
                return this.uploaderConfig.baseUploadingTargetUri + '/' + path + '/' + modelValue;
            } else {
                return this.uploaderConfig.baseUploadingTargetUri + '/' + path;
            }
        }
        onError(err) {
            if (this.options && this.options.onError) {
                this.options.onError(err);
            }
        }
        onUploadSuccess() {
            this.cacheIndex++;
            if (this.options && this.options.onUploadSaccess) {
                this.options.onUploadSaccess();
            }
        }
    }
    export interface IUploaderServiceFactory {
        (options?: IUploaderServiceOptions): UploaderService
    }

    module UploaderServiceFactory {
        export function factory(nguiUploaderConfig: IUploaderConfig): IUploaderServiceFactory {
            return function (options?: IUploaderServiceOptions) {
                return new UploaderService(options, nguiUploaderConfig);
            }
        }
        factory.$inject = ['$nguiUploaderConfig'];
    }
    module UploaderDirective {

        export function factory($nguiUploaderConfig: IUploaderConfig, $nguiUploaderServiceFactory: IUploaderServiceFactory): ng.IDirective {
            return {
                require: '?ngModel',
                templateUrl: function (elem, attrs: any) {
                    return attrs.templateUrl || $nguiUploaderConfig.baseTemplateUrl + '/uploader.htm';
                },
                scope: {
                    uploader: '=nguiUploader',
                    uploadPath: '=',
                    uploadStatic: '=',
                    acceptFile: '@',
                    uploadFieldName: '@'
                },

                link: function ($scope, $ele: JQuery, $attr, $ngModel: ng.INgModelController) {
                    
                    let uploaderService: UploaderService = $scope.uploader || $nguiUploaderServiceFactory();
                    let flowOptions: flowjs.IFlowOptions = {
                        testChunks: false,
                        singleFile: true,
                        fileParameterName: $scope.uploadFieldName || uploaderService.options && uploaderService.options.uploadFieldName || 'file'
                    };

                    if ($nguiUploaderConfig.flowOptioner) {
                        $nguiUploaderConfig.flowOptioner(flowOptions)
                    }


                    let flow: flowjs.IFlow = new Flow(flowOptions);
                    let $data = $scope.$data = {
                        uploadProcess: 0,
                        uploadSuccess: false,
                        uploadError: false,
                        uploadErrorMessage: null,
                        get previewUri() {
                            return uploaderService.previewUri($ngModel.$modelValue, $scope.uploadPath)
                        }
                    };
                    flow.on('filesSubmitted', (files: flowjs.IFlowFile[], event) => {
                        let uri = uploaderService.uploadUriResolve($ngModel.$modelValue, $scope.uploadPath, $scope.uploadStatic);
                        if (uri) {
                            flow.opts['target'] = uri;
                            flow.upload();
                        } else {
                            throw new Error('upload target is undefined');
                        }
                    });
                    flow.on('progress', () => {
                        $data.uploadProcess = flow.progress();
                        $scope.$apply();
                    });
                    flow.on('fileSuccess', (file, message) => {
                        $data.uploadSuccess = true;
                        $ngModel.$setViewValue(uploaderService.responceParse(message));
                        uploaderService.onUploadSuccess();
                        $scope.$apply();
                    });
                    flow.on('fileError', function (file, message) {
                        //console.log('fileError', file, message);
                        $data.uploadError = true;
                        $data.uploadErrorMessage = message;
                        uploaderService.onError(message);
                        $scope.$apply();

                    });
                    var doms = $ele.find('.flow-assign').get();

                    flow.assignBrowse(doms, false, true, {
                        accept: $scope.acceptFile
                    });
                }
            }
        }
        factory.$inject = ['$nguiUploaderConfig', '$nguiUploaderServiceFactory'];



    }

    export interface IUploaderConfigProvider {
        setBaseTemplateUrl(uri: string): IUploaderConfigProvider
        setBaseUploadingTargetUri(uri: string | Function): IUploaderConfigProvider
        setEmptyImageUri(uri: string): IUploaderConfigProvider
        setFlowOptioner(optioner: IFlowOptioner): IUploaderConfigProvider
        setResponseParser(optioner: IResponseParser): IUploaderConfigProvider
        setPreviewUriResolver(resolver: IUriPreviewResolver): IUploaderConfigProvider
    }
    export interface IUploaderConfig {
        baseTemplateUrl: string
        baseUploadingTargetUri: string
        emptyImageUri: string
        flowOptioner?: IFlowOptioner
        responseParser?: IResponseParser
        previewUriResolver?: IUriPreviewResolver
    }

    angular.module('ngui-uploader', [])
        .directive('nguiUploader', UploaderDirective.factory)
        //.directive('nguiUploaderInput', UploaderDirectiveInput.factory)
        .factory('$nguiUploaderServiceFactory', UploaderServiceFactory.factory)
        .provider("$nguiUploaderConfig", function () {

            let baseTemplateUrl = "/ngui";
            let baseUploadingTargetUri: any = "/upload";
            let emptyImageUri = "/empty.jpg";
            let flowOptioner = null;
            let responseParser = null;
            let previewUriResolver = null;

            let self = {
                setBaseTemplateUrl: function (url) {
                    baseTemplateUrl = url;
                    return self;
                },
                setBaseUploadingTargetUri: function (uri) {
                    baseUploadingTargetUri = uri;
                    return self;
                },
                setEmptyImageUri: function (uri) {
                    emptyImageUri = uri;
                    return self;
                },
                setFlowOptioner: function (optioner: IFlowOptioner) {
                    flowOptioner = optioner;
                    return self;
                },
                setResponseParser: function (parser: IResponseParser) {
                    responseParser = parser;
                    return self;
                },
                setPreviewUriResolver(resolver: IUriResolver) {
                    previewUriResolver = resolver;
                    return self;
                },
                $get: function () {
                    return {
                        get baseTemplateUrl() {
                            return baseTemplateUrl;
                        },
                        get baseUploadingTargetUri() {
                            if (typeof (baseUploadingTargetUri) === 'function') {
                                return baseUploadingTargetUri();
                            }
                            return baseUploadingTargetUri;
                        },
                        get emptyImageUri() {
                            return emptyImageUri;
                        },
                        get flowOptioner() {
                            return flowOptioner;
                        },
                        get responseParser() {
                            return responseParser;
                        },
                        get previewUriResolver() {
                            return previewUriResolver;
                        }
                    };
                }
            };
            return self;
        });
}

declare var Flow: any;