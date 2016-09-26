namespace ngui.uploader {
    export interface IUriResolver {
        (modelValue: any, attrUri: string): string
    }
    export interface IResponceParser {
        (resp: string): any
    }
    export interface IUploaderServiceOptions {
        target?: string
        uploadFieldName?: string
        uploadUriResolver?: IUriResolver
        previewUriResolver?: IUriResolver
        responseParser?: IResponceParser,
        onError?: Function
    }
    export class UploaderService {
        constructor(public options?: IUploaderServiceOptions) {
        }
        responceParse(responce: string): any {
            if (this.options && this.options.responseParser) {
                return this.options.responseParser(responce);
            }
            return responce;
        }
        previewUri(modelValue, attrUri) {
            if (this.options && this.options.previewUriResolver) {
                let uri = this.options.previewUriResolver(modelValue, attrUri);
                if (uri) return uri;
            }
            if (attrUri) {
                return attrUri;
            }
            return modelValue;
        }
        uploadUriResolve(modelValue, attrUri) {
            if (this.options && this.options.uploadUriResolver) {
                let uri = this.options.uploadUriResolver(modelValue, attrUri);
                if (uri) return uri;
            }
            if (attrUri) {
                return attrUri;
            }
            if (this.options && this.options.target) {
                return this.options.target;
            }
            throw new Error('Not found function');
        }
        onError(err) {
            if (this.options && this.options.onError) {
                this.options.onError(err);
            }
        }
    }
    export interface IUploaderServiceFactory {
        (options?: IUploaderServiceOptions): UploaderService
    }
    
    module UploaderServiceFactory {
        export function factory($nguiUploaderConfig): IUploaderServiceFactory {
            return function (options?: IUploaderServiceOptions) {
                return new UploaderService(options);
            }
        }
        factory.$inject = ['$nguiUploaderConfig'];
    }
    module UploaderDirective {

        export function factory($nguiUploaderConfig, $nguiUploaderServiceFactory: IUploaderServiceFactory): ng.IDirective {
            return {
                require: '?ngModel',
                templateUrl: function (elem, attrs: any) {
                    return attrs.templateUrl || $nguiUploaderConfig.baseTemplateUrl + '/uploader.htm';
                },
                scope: {
                    uploader: '=nguiUploader',
                    uploadUri: '=',
                    acceptFile: '@',
                    uploadFieldName: '@'
                },

                link: function ($scope, $ele: JQuery, $attr, $ngModel: ng.INgModelController) {
                    console.log('$ngModel', $ngModel)
                    let uploaderService: UploaderService = $scope.uploader || $nguiUploaderServiceFactory();
                    let flowOptions: flowjs.IFlowOptions = {
                        testChunks: false,
                        singleFile: true,
                        fileParameterName: $scope.uploadFieldName || uploaderService.options && uploaderService.options.uploadFieldName || 'file'
                    };
                    let flow: flowjs.IFlow = new Flow(flowOptions);
                    let $data = $scope.$data = {
                        uploadProcess: 0,
                        uploadSuccess: false,
                        uploadError: false,
                        uploadErrorMessage: null,
                        get previewUri() {
                            return uploaderService.previewUri($ngModel.$modelValue, $scope.uploadUri)
                        }
                    };
                    flow.on('filesSubmitted', (files: flowjs.IFlowFile[], event) => {
                        let uri = uploaderService.uploadUriResolve($ngModel.$modelValue, $scope.uploadUri);
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
                    console.log('$scope.acceptType', )

                    flow.assignBrowse(doms, false, true, {
                        accept: $scope.acceptFile
                    });
                }
            }
        }
        factory.$inject = ['$nguiUploaderConfig', '$nguiUploaderServiceFactory'];



    }

    export interface IUploaderConfigProvider {
        setBaseTemplateUrl(uri:string): IUploaderConfigProvider
    }

    angular.module('ngui-uploader', [])
        .directive('nguiUploader', UploaderDirective.factory)
        //.directive('nguiUploaderInput', UploaderDirectiveInput.factory)
        .factory('$nguiUploaderServiceFactory', UploaderServiceFactory.factory)
        .provider("$nguiUploaderConfig", function () {
            var baseTemplateUrl = "/ngui";

            var self = {
                setBaseTemplateUrl: function (url) {
                    baseTemplateUrl = url;
                    return self;
                },
                $get: function () {
                    return {
                        get baseTemplateUrl() {
                            return baseTemplateUrl;
                        }
                    };
                }
            };
            return self;
        });
}

declare var Flow: any;