## project nguiUploader

``` 
// file uploading
angular.module('ngui-uploader',[])
```
---


- js import
```
--- requared
<script src="/bower_components/angular/angular.js"></script>
<script src="/bower_components/flow.js/dist/flow.min.js"></script>

<script src="/bower_components/ngui-uploader/dist/uploader.js"></script>
```
- config
```
    // auth config
    .config(function ($nguiUploaderConfigProvider: ngui.uploader.IUploaderConfigProvider) {
        $nguiUploaderConfigProvider
            .setBaseTemplateUrl('/tpl-bootstrap');
    })
```

- using controller

```javascript
    ....
    .controller('ctrlMain', function ($nguiUploaderServiceFactory: ngui.uploader.IUploaderServiceFactory, $timeout) {
        var self = this;        
        this.myUploader = $nguiUploaderServiceFactory({
            target: 'http://localhost/upload',
            uploadFieldName: 'image',
            uploadUriResolver : function(value,attrUri){
                ...
            },
            previewUriResolver: function () {
                ...
            },
            responseParser: function (resp) {
               ...
            },
            onError: function (message) {
               ...
            }
        });
        ...
    })
```

```html
    <div class="form-group" >
        <div ngui-uploader="ctrlMain.myUploader" ng-model="ctrlMain.mdl.img"
        upload1-uri="'/upload/'+ctrlMain.mdl.id" accept-file="image/*"  ></div>
    </div>
```