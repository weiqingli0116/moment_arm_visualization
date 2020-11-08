// load pic
function onFileSelected(event) {
    var selectedFile = event.target.files[0];
    var reader = new FileReader();
        imgtag.title = selectedFile.name;
    reader.onload = function(event) {
        imgtag.src = event.target.result;
    };
    reader.readAsDataURL(selectedFile);
}

var imgtag = new Image();
    imgtag.src = "";

imgtag.onload = function(){
    let imgRatio = imgtag.width / imgtag.height;
    let dwidth = imgRatio * 500;
    let scaleRatio = 500 / imgtag.height;

    if (imgLayer.findOne('#background')) {
        imgLayer.findOne('#background').destroy();
        clearForceArm();
    }

    var bg = new Konva.Image({
        id: 'background',
        x: (1300-dwidth)/2,
        y: 50,
        image: imgtag,
        scaleX: scaleRatio,
        scaleY: scaleRatio,
    }) // resize to height = 500
    imgLayer.add(bg);
    imgLayer.batchDraw();
    var panel = document.getElementById('controlPanel');
    panel.removeAttribute('hidden');
}
