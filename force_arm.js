var width="1300";
var height="600";

var stage = new Konva.Stage({
    container: 'canvasContainer',
    width: width,
    height: height,
});

var imgLayer = new Konva.Layer();
var mainLayer = new Konva.Layer();
stage.add(imgLayer, mainLayer);

var ablePaint = false;
var isPaint = false;
var arrow;
var anchorStart;
var anchorEnd;
var pivot;
var forceArm;
var extendLine;
var rightAngle;
var elements = [arrow, anchorStart, anchorEnd, pivot, forceArm, extendLine, rightAngle];

const anchorStyle = {
    name: 'anchor',
    radius: 4,
    stroke: 'skyblue',
    strokeWidth: 2,
    draggable: true,
};

const pivotStyle = {
    radius: 4,
    fill: 'red',
    strokeWidth: 4,
    draggable: true,
};

const forceStyle = {
    name: 'force',
    pointerLength: 10,
    pointerWidth : 10,
    fill: 'black',
    stroke: 'black',
    strokeWidth: 4
};

stage.on('contentMousedown', function() {
    if (ablePaint) {
        isPaint = true;
        let pos = stage.getPointerPosition();

        anchorStart = new Konva.Circle(Object.assign({
            id: 'anchorStart',
            x: pos.x,
            y: pos.y
        }, anchorStyle));

        anchorStart.on('dragmove', function() {
            updateForce();
            updateForceArm();
        });
        addCursorStyle(anchorStart, 'move');

        arrow = new Konva.Arrow(Object.assign({
            id: 'force',
            points: [pos.x, pos.y, pos.x, pos.y],
        },forceStyle));
        addCursorStyle(arrow, 'pointer');

        mainLayer.add(anchorStart);
        mainLayer.add(arrow);
    }
});

stage.on('contentMouseup', function() {
    if (isPaint) {
        let pos = stage.getPointerPosition();
        anchorEnd = new Konva.Circle(Object.assign({
            id: 'anchorEnd',
            x: pos.x,
            y: pos.y
        }, anchorStyle));
        anchorEnd.on('dragmove', function() {
            updateForce();
            updateForceArm();
        });
        addCursorStyle(anchorEnd, 'move');
        mainLayer.add(anchorEnd);
        setAnchorVisible(false);
        // mainLayer.draw();
    }
    isPaint = false;
    ablePaint = false;
});

stage.on('click tap', function (e) {
    if (e.target.hasName('anchor') || e.target.hasName('force')) {
        if (anchorStart.visible()) return; // already selected
        setAnchorVisible(true);
        return;
    } else {
        if (mainLayer.findOne('#anchorStart') && mainLayer.findOne('#anchorEnd')) {
            setAnchorVisible(false);
            return;
        }
    }
})

// and core function - drawing
stage.on('contentMousemove', function() {
    if (!isPaint) {
        return;
    }
    let pos = stage.getPointerPosition();
    arrow.points([anchorStart.x(), anchorStart.y(), pos.x, pos.y])
    mainLayer.batchDraw();
});

function setAnchorVisible(isVisible) {
    anchorStart.visible(isVisible);
    anchorEnd.visible(isVisible);
    mainLayer.draw();
}

function addCursorStyle(obj, style) {
    obj.on('mouseover', function () {
        document.body.style.cursor = style;
    });
    obj.on('mouseout', function () {
        document.body.style.cursor = 'default';
    });
}

function drawPivot() {
    // if pivot already exist, don't draw a new one
    if (mainLayer.findOne('#pivot')) return;
    pivot = new Konva.Circle(Object.assign({
        id: 'pivot',
        x: stage.width() / 2,
        y: stage.height() / 2,
    }, pivotStyle));

    pivot.on('dragmove', updateForceArm);

      // add cursor styling
    addCursorStyle(pivot, 'move');

    mainLayer.add(pivot);
    mainLayer.draw();
}

function updateForce() {
    if (mainLayer.findOne('#force') && arrow) {
        arrow.points([anchorStart.x(), anchorStart.y(), anchorEnd.x(), anchorEnd.y()]);
        mainLayer.batchDraw();
    }
}

function drawForceLine() {
    // if arrow already exist, don't draw a new one
    if (mainLayer.findOne('#force')) return;
    ablePaint = true;
}

function calculateLinear(x1, y1, x2, y2) {
    if (Math.abs(x1-x2) < 0.000001) return null;
    const k = (y2-y1) / (x2-x1);
    return {k: k, b: y1-k*x1};
}

function calculatePerpendicular(xp, yp, k, b) {
    const x = (yp*k+xp-b*k) / (k*k+1)
    return {x: x, y: k*x+b}
}

function getPerpendicular(o, f) {
    let perpendicular;
    const linear = calculateLinear(f[0], f[1], f[2], f[3]);
    if (!linear) {
        perpendicular = {x: f[0], y: o.y};
    } else {
       perpendicular = calculatePerpendicular(o.x, o.y, linear.k, linear.b);
    }
    return {perpendicular: perpendicular, linear: linear};
}

function getExtendLinePoints(linear, perpendicular, f) {
    if (!linear) {
        if ([1] < f[3] && perpendicular.y < f[1]) {
            const newY = perpendicular.y - 10;
            return [f[0], f[1], f[0], newY];
        } else if (f[1] < f[3] && perpendicular.y > f[3]) {
            const newY = perpendicular.y + 10;
            return [f[2], f[3], f[2], newY];
        }else if (f[1] > f[3] && perpendicular.y < f[3]) {
            const newY = perpendicular.y - 10;
            return [f[2], f[3], f[2], newY];
        }else if (f[1] > f[3] && perpendicular.y > f[1]) {
            const newY = perpendicular.y + 10;
            return [f[0], f[1], f[0], newY];
        }
    } else {
        if (f[0] < f[2] && perpendicular.x < f[0]) {
            const newX = perpendicular.x - 10;
            const newY = linear.k * newX + linear.b;
            return [f[0], f[1], newX, newY];
        } else if (f[0] < f[2] && perpendicular.x > f[2]) {
            const newX = perpendicular.x + 10;
            const newY = linear.k * newX + linear.b;
            return [f[2], f[3], newX, newY];
        }else if (f[0] > f[2] && perpendicular.x > f[0]) {
            const newX = perpendicular.x + 10;
            const newY = linear.k * newX + linear.b;
            return [f[0], f[1], newX, newY];
        }else if (f[0] > f[2] && perpendicular.x < f[2]) {
            const newX = perpendicular.x - 10;
            const newY = linear.k * newX + linear.b;
            return [f[2], f[3], newX, newY];
        }
    }
}

function addExtendLine(pts) {
    extendLine = new Konva.Line({
        id: 'extendLine',
        points: pts,
        stroke: 'black',
        strokeWidth: 4,
        dash: [15, 5]
    })
    mainLayer.add(extendLine);
}

function getRightAngleSign(perpendicular, posP) {
    let l = 10;
    const a = Math.sqrt((perpendicular.x - posP.x)**2 + (perpendicular.y - posP.y)**2);
    if (a < l) l = a / 2;
    const point1 = {
        x: ((a-l) * perpendicular.x + l * posP.x) / a - perpendicular.x,
        y: ((a-l) * perpendicular.y + l * posP.y) / a - perpendicular.y
    };

    return [perpendicular.x + point1.x, perpendicular.y + point1.y, perpendicular.x + point1.x + point1.y, perpendicular.y -point1.x + point1.y, perpendicular.x + point1.y, perpendicular.y - point1.x];
}


function drawForceArm() {
    if (!mainLayer.findOne('#pivot') || !mainLayer.findOne('#force')) return;
    if (!pivot || !arrow) return;
    const posP = pivot.position();
    const pointsF = arrow.points();
    const {perpendicular, linear} = getPerpendicular(posP, pointsF);
    forceArm = new Konva.Line({
        id: 'forceArm',
        points: [posP.x, posP.y, perpendicular.x, perpendicular.y],
        stroke: 'blue',
        strokeWidth: 5,
    });
    mainLayer.add(forceArm);

    let pts = forceArm.points();
    let armLen = Math.sqrt((pts[0] - pts[2])**2 + (pts[1] - pts[3])**2)
    forceArm.dashOffset(armLen);
    forceArm.dash([armLen]);

    // make some animation with stop
    var anim = new Konva.Animation(function (frame) {
        var dashLen =  armLen - frame.time / 5;
        forceArm.dashOffset(dashLen);
        if (dashLen < 0) {
            anim.stop();
            forceArm.dash([]);
        }
    }, mainLayer);

    const extendPts = getExtendLinePoints(linear, perpendicular, pointsF);
    if (extendPts) addExtendLine(extendPts);

    const rightAnglePts = getRightAngleSign(perpendicular, posP);
    setTimeout(() => {
        rightAngle = new Konva.Line({
            id: 'rightAngle',
            points: rightAnglePts,
            stroke: 'blue',
            strokeWidth: 3,
        })
        mainLayer.add(rightAngle);
        mainLayer.batchDraw();
   }, 1000);
    anim.start();
    mainLayer.draw();
}

function updateForceArm() {
    if (!mainLayer.findOne('#forceArm') || !pivot || !arrow || !forceArm) return;
    const posP = pivot.position();
    const pointsF = arrow.points();
    const {perpendicular, linear} = getPerpendicular(posP, pointsF);
    forceArm.points([posP.x, posP.y, perpendicular.x, perpendicular.y]);

    const extendPts = getExtendLinePoints(linear, perpendicular, pointsF);
    let extendLine_ = mainLayer.findOne('#extendLine');
    if (extendPts) {
        if (extendLine_) {
            extendLine.points(extendPts);
        } else {
            addExtendLine(extendPts);
        }
    } else {
        if (extendLine_) extendLine_.destroy();
    }

    const rightAnglePts = getRightAngleSign(perpendicular, posP);
    rightAngle.points(rightAnglePts);

    mainLayer.batchDraw();
}

function clearForceArm() {
    mainLayer.find('#pivot').destroy();
    mainLayer.find('#force').destroy();
    mainLayer.find('#forceArm').destroy();
    mainLayer.find('#anchorStart').destroy();
    mainLayer.find('#anchorEnd').destroy();
    mainLayer.find('#extendLine').destroy();
    mainLayer.find('#rightAngle').destroy();
    mainLayer.draw();
}


