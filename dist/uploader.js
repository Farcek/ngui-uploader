var ngui;
(function (ngui) {
    var uploader;
    (function (uploader) {
        var UploaderService = (function () {
            function UploaderService(options, configProvider, $injector) {
                this.options = options;
                this.configProvider = configProvider;
                this.$injector = $injector;
                this.cacheIndexer = 1;
            }
            UploaderService.prototype.flowOptioner = function (flowOptions) {
                if (this.configProvider.flowOptioner) {
                    this.configProvider.flowOptioner(flowOptions);
                }
                if (this.options && this.options.flowOptioner) {
                    this.options.flowOptioner(flowOptions);
                }
            };
            UploaderService.prototype.preUpload = function (flowOptions) {
                if (this.configProvider.preUpload) {
                    var preLoader = this.$injector.invoke(this.configProvider.preUpload);
                    preLoader(flowOptions);
                }
                if (this.options && this.options.preUpload) {
                    var preLoader = this.$injector.invoke(this.options.preUpload);
                    preLoader(flowOptions);
                }
            };
            UploaderService.prototype.responceParse = function (responce) {
                if (this.options && this.options.responseParser) {
                    return this.options.responseParser(responce);
                }
                if (this.configProvider && this.configProvider.responseParser) {
                    return this.configProvider.responseParser(responce);
                }
                return responce;
            };
            UploaderService.prototype.previewUri = function (modelValue, path) {
                if (modelValue) {
                    if (this.options && this.options.previewUriResolver) {
                        var uri = this.options.previewUriResolver(modelValue, path, this.cacheIndexer);
                        if (uri)
                            return uri;
                    }
                    if (this.configProvider && this.configProvider.previewUriResolver) {
                        var uri = this.configProvider.previewUriResolver(modelValue, path, this.cacheIndexer);
                        if (uri)
                            return uri;
                    }
                    return this.configProvider.baseUploadingTargetUri + '/' + path + '/' + modelValue;
                }
                return this.configProvider.emptyImageUri;
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
                    return this.configProvider.baseUploadingTargetUri + '/' + path + '/' + modelValue;
                }
                else {
                    return this.configProvider.baseUploadingTargetUri + '/' + path;
                }
            };
            UploaderService.prototype.onError = function (err) {
                if (this.options && this.options.onError) {
                    this.options.onError(err);
                }
            };
            UploaderService.prototype.onUploadSuccess = function () {
                this.cacheIndexer++;
                if (this.options && this.options.onUploadSaccess) {
                    this.options.onUploadSaccess();
                }
            };
            return UploaderService;
        }());
        uploader.UploaderService = UploaderService;
        var UploaderServiceFactory;
        (function (UploaderServiceFactory) {
            function factory(uploaderConfig, $injector) {
                return function (options) {
                    return new UploaderService(options, uploaderConfig, $injector);
                };
            }
            UploaderServiceFactory.factory = factory;
            factory.$inject = ['$nguiUploaderConfig', '$injector'];
        })(UploaderServiceFactory || (UploaderServiceFactory = {}));
        var UploaderDirective;
        (function (UploaderDirective) {
            function factory(configProvider, ServiceFactory, $injector) {
                return {
                    require: '?ngModel',
                    templateUrl: function (elem, attrs) {
                        return attrs.templateUrl || configProvider.baseTemplateUrl + '/uploader.htm';
                    },
                    scope: {
                        uploader: '=nguiUploader',
                        uploadPath: '=',
                        uploadStatic: '=',
                        acceptFile: '@',
                        uploadFieldName: '@'
                    },
                    link: function ($scope, $ele, $attr, $ngModel) {
                        var uploaderService = $scope.uploader || ServiceFactory();
                        var flowOptions = {
                            testChunks: false,
                            singleFile: true,
                            fileParameterName: $scope.uploadFieldName || uploaderService.options && uploaderService.options.uploadFieldName || 'file'
                        };
                        uploaderService.flowOptioner(flowOptions);
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
                                uploaderService.preUpload(flow.opts);
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
            factory.$inject = ['$nguiUploaderConfig', '$nguiUploaderServiceFactory', '$injector'];
        })(UploaderDirective || (UploaderDirective = {}));
        var UploaderConfigProvider = (function () {
            function UploaderConfigProvider() {
                this.baseTemplateUrl = "/ngui";
                this.baseUploadingTargetUri = "/upload";
                this.emptyImageUri = "/empty.jpg";
                this.flowOptioner = null;
                this.preUpload = null;
                this.responseParser = null;
                this.previewUriResolver = null;
            }
            UploaderConfigProvider.prototype.$get = function () {
                return this;
            };
            return UploaderConfigProvider;
        }());
        uploader.UploaderConfigProvider = UploaderConfigProvider;
        angular.module('ngui-uploader', [])
            .directive('nguiUploader', UploaderDirective.factory)
            .factory('$nguiUploaderServiceFactory', UploaderServiceFactory.factory)
            .provider('$nguiUploaderConfig', UploaderConfigProvider);
    })(uploader = ngui.uploader || (ngui.uploader = {}));
})(ngui || (ngui = {}));
