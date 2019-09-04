
var gl = null;
var viewportWidth = 0;
var viewportHeight = 0;

function initGL(canvas) {
    try {
        gl = canvas.getContext("webgl");
        if (!gl)
            gl = canvas.getContext("experimental-webgl");
        if (gl) {
            viewportWidth = canvas.width;
            viewportHeight = canvas.height;
        }
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL");
    }
}

function getShader(gl, id) {
    var script = document.getElementById(id);
    if (!script) {
        return null;
    }

    var shader;
    if (script.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (script.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, script.text);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

var program_item;
var program_sun;

function initShaders() {
    var vertexItemShader = getShader(gl, "shader-vs-item");
    var vertexSunShader = getShader(gl, "shader-vs-sun");
    var fragmentItemShader = getShader(gl, "shader-fs-item");
    var fragmentSunShader = getShader(gl, "shader-fs-sun");

    program_item = gl.createProgram();
    gl.attachShader(program_item, vertexItemShader);
    gl.attachShader(program_item, fragmentItemShader);
    gl.linkProgram(program_item);
    if (!gl.getProgramParameter(program_item, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
    gl.useProgram(program_item);
    program_item.positionAttr = gl.getAttribLocation(program_item, "positionAttr");
    program_item.colorVecAttr = gl.getAttribLocation(program_item, "colorVecAttr");
    gl.enableVertexAttribArray(program_item.positionAttr);
    gl.enableVertexAttribArray(program_item.colorVecAttr);
    program_item.model = gl.getUniformLocation(program_item, "model");

    program_sun = gl.createProgram();
    gl.attachShader(program_sun, vertexSunShader);
    gl.attachShader(program_sun, fragmentSunShader);
    gl.linkProgram(program_sun);
    gl.useProgram(program_sun);
    program_sun.positionAttr = gl.getAttribLocation(program_sun, "positionAttr");
    gl.enableVertexAttribArray(program_sun.positionAttr);
    program_sun.model = gl.getUniformLocation(program_sun, "model");
}

var buffer_item;
var buffer_sun;

function initGeometry() {
    buffer_item = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer_item);
    // Interleave vertex positions and colors
    var vertexData = [
       0.0, 0.0, 0.0,  0.0, 0.0, 0.0, 0.1,
       0.0, 0.1, 0.0,  1.0, 1.0, 1.0, 0.1,
       0.07, 0.05, 0.0,  1.0, 1.0, 1.0, 0.1,
       0.07, -0.05, 0.0,  1.0, 1.0, 1.0, 0.1,
       0.0, -0.1, 0.0,  1.0, 1.0, 1.0, 0.1,
       -0.07, -0.05, 0.0,  1.0, 1.0, 1.0, 0.1,
       -0.07, 0.05, 0.0,  1.0, 1.0, 1.0, 0.1,
       0.0, 0.1, 0.0,  1.0, 1.0, 1.0, 0.1
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

    buffer_sun = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer_sun);
    // Interleave vertex positions and colors
    var vertexData_sun = [
    -0.05, -0.05, -0.05,
     0.05, -0.05, -0.05,
     0.05,  0.05, -0.05,
     0.05,  0.05, -0.05,
    -0.05,  0.05, -0.05,
    -0.05, -0.05, -0.05,

    -0.05, -0.05,  0.05,
     0.05, -0.05,  0.05,
     0.05,  0.05,  0.05,
     0.05,  0.05,  0.05,
    -0.05,  0.05,  0.05,
    -0.05, -0.05,  0.05,

    -0.05,  0.05,  0.05,
    -0.05,  0.05, -0.05,
    -0.05, -0.05, -0.05,
    -0.05, -0.05, -0.05,
    -0.05, -0.05,  0.05,
    -0.05,  0.05,  0.05,

     0.05,  0.05,  0.05,
     0.05,  0.05, -0.05,
     0.05, -0.05, -0.05,
     0.05, -0.05, -0.05,
     0.05, -0.05,  0.05,
     0.05,  0.05,  0.05,

    -0.05, -0.05, -0.05,
     0.05, -0.05, -0.05,
     0.05, -0.05,  0.05,
     0.05, -0.05,  0.05,
    -0.05, -0.05,  0.05,
    -0.05, -0.05, -0.05,

    -0.05,  0.05, -0.05,
     0.05,  0.05, -0.05,
     0.05,  0.05,  0.05,
     0.05,  0.05,  0.05,
    -0.05,  0.05,  0.05,
    -0.05,  0.05, -0.05
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData_sun), gl.STATIC_DRAW);
}

var project;
var view;
var sun_position = glm.vec3(1.0, 1.0, 1.0);
var view_position = glm.vec3(0.0, 0.0, 5.0);

function drawItem(sun_pos_draw) {
    var item_pos = [0.0, glm.vec3(0.5, 0.5, 0.5),
                    0.1, glm.vec3(0.3, 0.3, 0.3),
                    0.2, glm.vec3(0.2, 0.2, 0.2),
                    0.3, glm.vec3(0.1, 0.1, 0.1),
                    0.5, glm.vec3(0.3, 0.3, 0.3),
                    0.7, glm.vec3(0.1, 0.1, 0.1),
                    0.8, glm.vec3(0.2, 0.2, 0.2),
                    0.9, glm.vec3(0.3, 0.3, 0.3)];

    gl.useProgram(program_item);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer_item);
    

    // There are 7 floating-point values per vertex
    var stride = 7 * Float32Array.BYTES_PER_ELEMENT;

    // Set up position stream
    gl.vertexAttribPointer(program_item.positionAttr, 3, gl.FLOAT, false, stride, 0);
    // Set up color stream
    gl.vertexAttribPointer(program_item.colorVecAttr, 4, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);
    
    for (var i = 0; i < item_pos.length; i += 2) {
        var model_item = glm.translate(glm.mat4(1.0), sun_pos_draw.xyz['*'](item_pos[i]));
        model_item = glm.scale(model_item, item_pos[i + 1]);
        gl.uniformMatrix4fv(program_item.model, false, model_item.array);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 8);
    }
}

function drawSun() {
    var model_sun = glm.translate(glm.mat4(1.0), sun_position);
    model_sun = glm.scale(model_sun, glm.vec3(1.3, 1.3, 1.3));
    model_sun = project['*'](view)['*'](model_sun);

    var sun_pos_draw = model_sun['*'](glm.vec4(0.0, 0.0, 0.0, 1.0));
    sun_pos_draw = sun_pos_draw['/'](sun_pos_draw.w);
    if(sun_pos_draw.x > 1 || sun_pos_draw.y > 1) {
        return false;
    }
    gl.useProgram(program_sun);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer_sun);

    // There are 7 floating-point values per vertex
    var stride = 3 * Float32Array.BYTES_PER_ELEMENT;

    // Set up position stream
    gl.vertexAttribPointer(program_sun.positionAttr, 3, gl.FLOAT, false, stride, 0);

    gl.uniformMatrix4fv(program_sun.model, false, model_sun.array);

    gl.drawArrays(gl.TRIANGLES, 0, 36);

    return sun_pos_draw;
}

function drawScene() {
    gl.viewport(0, 0, viewportWidth, viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    project = glm.perspective(glm.radians(45.0), viewportWidth / viewportHeight, 0.1, 100.0);
    // view  = glm.lookAt(view_position, glm.vec3(0.0, 0.0, 0.0), glm.vec3(0.0, 1.0, 0.0));

    var result = drawSun();
    if(result != false) {
        drawItem(result);
    }
    
    
    requestAnimationFrame(drawScene);
}

var isMove = false;

function doMouseMove(e) {
    if (!isMove) return;
    var trans = glm.rotate(glm.mat4(1.0), -0.01 * e.movementX, glm.vec3(0.0, 1.0, 0.0));
    trans = glm.rotate(trans, -0.01 * e.movementY, glm.vec3(1.0, 0.0, 0.0));
    view = trans['*'](view);
}

function webGLStart() {
    var canvas = document.getElementById("can");
    initGL(canvas);
    initShaders();
    initGeometry();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    view  = glm.lookAt(view_position, glm.vec3(0.0, 0.0, 0.0), glm.vec3(0.0, 1.0, 0.0));

    drawScene();

    canvas.addEventListener('mousemove', doMouseMove, false);
    canvas.onmousedown = function(e){ isMove = true; }
    canvas.onmouseup = function(e){ isMove = false; }
}