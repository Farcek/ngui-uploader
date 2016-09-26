angular.module('demo', ['ng', 'ngui-uploader'])
    .config(function ($nguiUploaderConfigProvider) {
        $nguiUploaderConfigProvider.setBaseTemplateUrl('/tpl-bootstrap');
    })
    .controller('ctrlMain', function ($nguiUploaderServiceFactory, $timeout) {
        var self = this;
        this.mdl = {
            name: 'farcek',
            img: '1.jpg'
        };
        var successUri = 'https://beamingnotes.com/wp-content/uploads/thumbs_dir/28ae5ec-mugbsfg1sag1352eynan9daqgbshyoaokfgb04i9so.jpg';
        var errorUri = 'https://valleytechnologies.net/wp-content/uploads/2015/07/error.png';
        var uploadOk = null;
        this.myUploader = $nguiUploaderServiceFactory({
            target: 'http://localhost:4001/upload/test',
            uploadFieldName:'image',
            // uploadUriResolver : function(value,attrUri){
                
            // },
            previewUriResolver: function () {
                if (uploadOk === null)
                    return 'https://dummyimage.com/600x400/000/fff&text=test';
                return uploadOk ? successUri : errorUri;
            },
            responseParser: function (resp) {
                uploadOk = true;
            },
            onError:function(){
                uploadOk=false;
            }
        });

        $timeout(function () {
            self.mdl.id = 1;
        }, 1000);
    })
    ;