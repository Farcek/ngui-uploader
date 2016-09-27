var ngui;
(function (ngui) {
    var uploader;
    (function (uploader) {
        var UploaderService = (function () {
            function UploaderService(options, uploaderConfig) {
                this.options = options;
                this.uploaderConfig = uploaderConfig;
                this.cacheIndex = 1;
            }
            UploaderService.prototype.responceParse = function (responce) {
                if (this.options && this.options.responseParser) {
                    return this.options.responseParser(responce);
                }
                if (this.uploaderConfig && this.uploaderConfig.responseParser) {
                    return this.uploaderConfig.responseParser(responce);
                }
                return responce;
            };
            UploaderService.prototype.previewUri = function (modelValue, path) {
                if (modelValue) {
                    if (this.options && this.options.previewUriResolver) {
                        var uri = this.options.previewUriResolver(modelValue, path, this.cacheIndex);
                        if (uri)
                            return uri;
                    }
                    if (this.uploaderConfig && this.uploaderConfig.previewUriResolver) {
                        var uri = this.uploaderConfig.previewUriResolver(modelValue, path, this.cacheIndex);
                        if (uri)
                            return uri;
                    }
                    return this.uploaderConfig.baseUploadingTargetUri + '/' + path + '/' + modelValue;
                }
                return this.uploaderConfig.emptyImageUri;
            };
            UploaderService.prototype.uploadUriResolve = function (modelValue, path, uploadStatic) {
                if (this.options && this.options.uploadUriResolver) {
                    var uri = this.options.uploadUriResolver(modelValue, path);
                    if (uri)
                        return uri;
                }
                if (this.options && this.options.target) {
                    return this.options.target;
                }
                if (uploadStatic) {
                    return this.uploaderConfig.baseUploadingTargetUri + '/' + path + '/' + modelValue;
                }
                else {
                    return this.uploaderConfig.baseUploadingTargetUri + '/' + path;
                }
            };
            UploaderService.prototype.onError = function (err) {
                if (this.options && this.options.onError) {
                    this.options.onError(err);
                }
            };
            UploaderService.prototype.onUploadSuccess = function () {
                this.cacheIndex++;
                if (this.options && this.options.onUploadSaccess) {
                    this.options.onUploadSaccess();
                }
            };
            return UploaderService;
        }());
        uploader.UploaderService = UploaderService;
        var UploaderServiceFactory;
        (function (UploaderServiceFactory) {
            function factory(nguiUploaderConfig) {
                return function (options) {
                    return new UploaderService(options, nguiUploaderConfig);
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
                        uploadPath: '=',
                        uploadStatic: '=',
                        acceptFile: '@',
                        uploadFieldName: '@'
                    },
                    link: function ($scope, $ele, $attr, $ngModel) {
                        var uploaderService = $scope.uploader || $nguiUploaderServiceFactory();
                        var flowOptions = {
                            testChunks: false,
                            singleFile: true,
                            fileParameterName: $scope.uploadFieldName || uploaderService.options && uploaderService.options.uploadFieldName || 'file'
                        };
                        if ($nguiUploaderConfig.flowOptioner) {
                            $nguiUploaderConfig.flowOptioner(flowOptions);
                        }
                        var flow = new Flow(flowOptions);
                        var $data = $scope.$data = {
                            uploadProcess: 0,
                            uploadSuccess: false,
                            uploadError: false,
                            uploadErrorMessage: null,
                            get previewUri() {
                                return uploaderService.previewUri($ngModel.$modelValue, $scope.uploadPath);
                            }
                        };
                        flow.on('filesSubmitted', function (files, event) {
                            var uri = uploaderService.uploadUriResolve($ngModel.$modelValue, $scope.uploadPath, $scope.uploadStatic);
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
            var baseUploadingTargetUri = "/upload";
            var emptyImageUri = "/empty.jpg";
            var flowOptioner = null;
            var responseParser = null;
            var previewUriResolver = null;
            var self = {
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
                setFlowOptioner: function (optioner) {
                    flowOptioner = optioner;
                    return self;
                },
                setResponseParser: function (parser) {
                    responseParser = parser;
                    return self;
                },
                setPreviewUriResolver: function (resolver) {
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
    })(uploader = ngui.uploader || (ngui.uploader = {}));
})(ngui || (ngui = {}));
