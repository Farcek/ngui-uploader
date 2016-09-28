namespace ngui.uploader {

    export interface IUriResolver {
        (modelValue: any, path: string): string
    }
    export interface IUriPreviewResolver {
        (modelValue: any, path: string, cacheIndexer: number): string
    }
    export interface IResponseParser {
        (resp: string): any
    }
    export interface IFlowOptioner {
        (options: flowjs.IFlowOptions): void
    }
    export interface IPreUploadFactory {
        (...injects: any[]): IPreUpload
    }
    export interface IPreUpload extends Function {
        (options: flowjs.IFlowOptions): void
    }
    export interface IUploaderServiceOptions {
        target?: string
        uploadFieldName?: string
        uploadUriResolver?: IUriResolver
        previewUriResolver?: IUriPreviewResolver
        responseParser?: IResponseParser
        flowOptioner?: IFlowOptioner

        preUpload?: (string | IPreUploadFactory)[];
        onError?: Function
        onUploadSaccess?: Function
    }

    export class UploaderService {
        constructor(public options: IUploaderServiceOptions, public configProvider: UploaderConfigProvider, private $injector) {
        }



        cacheIndexer: number = 1;
        flowOptioner(flowOptions: flowjs.IFlowOptions) {
            if (this.configProvider.flowOptioner) {
                this.configProvider.flowOptioner(flowOptions)
            }

            if (this.options && this.options.flowOptioner) {
                this.options.flowOptioner(flowOptions);
            }
        }
        preUpload(flowOptions: flowjs.IFlowOptions) {

            if (this.configProvider.preUpload) {
                var preLoader = this.$injector.invoke(this.configProvider.preUpload)
                preLoader(flowOptions);
            }

            if (this.options && this.options.preUpload) {
                var preLoader = this.$injector.invoke(this.options.preUpload)
                preLoader(flowOptions);
            }
        }
        responceParse(responce: string): any {
            if (this.options && this.options.responseParser) {
                return this.options.responseParser(responce);
            }
            if (this.configProvider && this.configProvider.responseParser) {
                return this.configProvider.responseParser(responce);
            }
            return responce;
        }
        previewUri(modelValue, path) {

            if (modelValue) {
                if (this.options && this.options.previewUriResolver) {
                    let uri = this.options.previewUriResolver(modelValue, path, this.cacheIndexer);
                    if (uri) return uri;
                }

                if (this.configProvider && this.configProvider.previewUriResolver) {
                    let uri = this.configProvider.previewUriResolver(modelValue, path, this.cacheIndexer);
                    if (uri) return uri;
                }

                return this.configProvider.baseUploadingTargetUri + '/' + path + '/' + modelValue;
            }

            return this.configProvider.emptyImageUri;
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
                return this.configProvider.baseUploadingTargetUri + '/' + path + '/' + modelValue;
            } else {
                return this.configProvider.baseUploadingTargetUri + '/' + path;
            }
        }
        onError(err) {
            if (this.options && this.options.onError) {
                this.options.onError(err);
            }
        }
        onUploadSuccess() {
            this.cacheIndexer++;
            if (this.options && this.options.onUploadSaccess) {
                this.options.onUploadSaccess();
            }
        }
    }
    export interface IUploaderServiceFactory {
        (options?: IUploaderServiceOptions): UploaderService
    }

    module UploaderServiceFactory {
        export function factory(uploaderConfig: UploaderConfigProvider, $injector): IUploaderServiceFactory {
            return function (options?: IUploaderServiceOptions) {
                return new UploaderService(options, uploaderConfig, $injector);
            }
        }
        factory.$inject = ['$nguiUploaderConfig', '$injector'];
    }
    module UploaderDirective {

        export function factory(configProvider: UploaderConfigProvider, ServiceFactory: IUploaderServiceFactory, $injector): ng.IDirective {

            return {
                require: '?ngModel',
                templateUrl: function (elem, attrs: any) {
                    return attrs.templateUrl || configProvider.baseTemplateUrl + '/uploader.htm';
                },
                scope: {
                    uploader: '=nguiUploader',
                    uploadPath: '=',
                    uploadStatic: '=',
                    acceptFile: '@',
                    uploadFieldName: '@'
                },

                link: function ($scope, $ele: JQuery, $attr, $ngModel: ng.INgModelController) {

                    let uploaderService: UploaderService = $scope.uploader || ServiceFactory();
                    let flowOptions: flowjs.IFlowOptions = {
                        testChunks: false,
                        singleFile: true,
                        fileParameterName: $scope.uploadFieldName || uploaderService.options && uploaderService.options.uploadFieldName || 'file'
                    };

                    uploaderService.flowOptioner(flowOptions);



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
                            uploaderService.preUpload(flow.opts);
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
        factory.$inject = ['$nguiUploaderConfig', '$nguiUploaderServiceFactory', '$injector'];



    }




    export class UploaderConfigProvider {
        baseTemplateUrl = "/ngui";
        baseUploadingTargetUri: any = "/upload";
        emptyImageUri = "/empty.jpg";
        flowOptioner: IFlowOptioner = null;
        preUpload: (string | IPreUploadFactory)[] = null;
        responseParser: IResponseParser = null;
        previewUriResolver: IUriPreviewResolver = null;

        $get() {
            return this;
        }
    }

    angular.module('ngui-uploader', [])
        .directive('nguiUploader', UploaderDirective.factory)
        .factory('$nguiUploaderServiceFactory', UploaderServiceFactory.factory)
        .provider('$nguiUploaderConfig', UploaderConfigProvider)

}

declare var Flow: any;