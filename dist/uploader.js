var ngui;
(function (ngui) {
    var uploader;
    (function (uploader) {
        var UploaderService = (function () {
            function UploaderService(options) {
                this.options = options;
            }
            UploaderService.prototype.responceParse = function (responce) {
                if (this.options && this.options.responseParser) {
                    return this.options.responseParser(responce);
                }
                return responce;
            };
            UploaderService.prototype.previewUri = function (modelValue, attrUri) {
                if (this.options && this.options.previewUriResolver) {
                    var uri = this.options.previewUriResolver(modelValue, attrUri);
                    if (uri)
                        return uri;
                }
                if (attrUri) {
                    return attrUri;
                }
                return modelValue;
            };
            UploaderService.prototype.uploadUriResolve = function (modelValue, attrUri) {
                if (this.options && this.options.uploadUriResolver) {
                    var uri = this.options.uploadUriResolver(modelValue, attrUri);
                    if (uri)
                        return uri;
                }
                if (attrUri) {
                    return attrUri;
                }
                if (this.options && this.options.target) {
                    return this.options.target;
                }
                throw new Error('Not found function');
            };
            UploaderService.prototype.onError = function (err) {
                if (this.options && this.options.onError) {
                    this.options.onError(err);
                }
            };
            return UploaderService;
        }());
        uploader.UploaderService = UploaderService;
        var UploaderServiceFactory;
        (function (UploaderServiceFactory) {
            function factory($nguiUploaderConfig) {
                return function (options) {
                    return new UploaderService(options);
                };
            }
            UploaderServiceFactory.factory = factory;
            factory.$inject = ['$nguiUploaderConfig'];
        })(UploaderServiceFactory || (UploaderServiceFactory = {}));
        var UploaderDirective;
        (function (UploaderDirective) {
            function factory($nguiUploaderConfig, $nguiUploaderServiceFactory) {
                return {
                    require: '?ngModel',
                    templateUrl: function (elem, attrs) {
                        return attrs.templateUrl || $nguiUploaderConfig.baseTemplateUrl + '/uploader.htm';
                    },
                    scope: {
                        uploader: '=nguiUploader',
                        uploadUri: '=',
                        acceptFile: '@',
                        uploadFieldName: '@'
                    },
                    link: function ($scope, $ele, $attr, $ngModel) {
                        console.log('$ngModel', $ngModel);
                        var uploaderService = $scope.uploader || $nguiUploaderServiceFactory();
                        var flowOptions = {
                            testChunks: false,
                            singleFile: true,
                            fileParameterName: $scope.uploadFieldName || uploaderService.options && uploaderService.options.uploadFieldName || 'file'
                        };
                        var flow = new Flow(flowOptions);
                        var $data = $scope.$data = {
                            uploadProcess: 0,
                            uploadSuccess: false,
                            uploadError: false,
                            uploadErrorMessage: null,
                            get previewUri() {
                                return uploaderService.previewUri($ngModel.$modelValue, $scope.uploadUri);
                            }
                        };
                        flow.on('filesSubmitted', function (files, event) {
                            var uri = uploaderService.uploadUriResolve($ngModel.$modelValue, $scope.uploadUri);
                            if (uri) {
                                flow.opts['target'] = uri;
                                flow.upload();
                            }
                            else {
                                throw new Error('upload target is undefined');
                            }
                        });
                        flow.on('progress', function () {
                            $data.uploadProcess = flow.progress();
                            $scope.$apply();
                        });
                        flow.on('fileSuccess', function (file, message) {
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
                        console.log('$scope.acceptType');
                        flow.assignBrowse(doms, false, true, {
                            accept: $scope.acceptFile
                        });
                    }
                };
            }
            UploaderDirective.factory = factory;
            factory.$inject = ['$nguiUploaderConfig', '$nguiUploaderServiceFactory'];
        })(UploaderDirective || (UploaderDirective = {}));
        angular.module('ngui-uploader', [])
            .directive('nguiUploader', UploaderDirective.factory)
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
    })(uploader = ngui.uploader || (ngui.uploader = {}));
})(ngui || (ngui = {}));
