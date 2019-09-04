
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

function initShaders() {
    var vertexItemShader = getShader(gl, "shader-vs-item");
    var fragmentItemShader = getShader(gl, "shader-fs-item");

    program_item = gl.createProgram();
    gl.attachShader(program_item, vertexItemShader);
    gl.attachShader(program_item, fragmentItemShader);
    gl.linkProgram(program_item);
    if (!gl.getProgramParameter(program_item, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
    gl.useProgram(program_item);
    program_item.positionAttr = gl.getAttribLocation(program_item, "positionAttr");
    gl.enableVertexAttribArray(program_item.positionAttr);
    program_item.project = gl.getUniformLocation(program_item, "project");
    program_item.view = gl.getUniformLocation(program_item, "view");
    program_item.model = gl.getUniformLocation(program_item, "model");
}

var buffer_item;

function initGeometry() {
    buffer_item = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer_item);
    // Interleave vertex positions and colors
    var vertexData = [
       -0.5, -0.5, -5.0,
        0.5, -0.5, -5.0,
        0.5,  0.5, -5.0,
        0.5,  0.5, -5.0,
       -0.5,  0.5, -5.0,
       -0.5, -0.5, -5.0,

       -0.5, -0.5,  0.5,
        0.5, -0.5,  0.5,
        0.5,  0.5,  0.5,
        0.5,  0.5,  0.5,
       -0.5,  0.5,  0.5,
       -0.5, -0.5,  0.5,

       -0.5,  0.5,  0.5,
       -0.5,  0.5, -5.0,
       -0.5, -0.5, -5.0,
       -0.5, -0.5, -5.0,
       -0.5, -0.5,  0.5,
       -0.5,  0.5,  0.5,

        0.5,  0.5,  0.5,
        0.5,  0.5, -5.0,
        0.5, -0.5, -5.0,
        0.5, -0.5, -5.0,
        0.5, -0.5,  0.5,
        0.5,  0.5,  0.5,

       -0.5, -0.5, -5.0,
        0.5, -0.5, -5.0,
        0.5, -0.5,  0.5,
        0.5, -0.5,  0.5,
       -0.5, -0.5,  0.5,
       -0.5, -0.5, -5.0,

       -0.5,  0.5, -5.0,
        0.5,  0.5, -5.0,
        0.5,  0.5,  0.5,
        0.5,  0.5,  0.5,
       -0.5,  0.5,  0.5,
       -0.5,  0.5, -5.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);
}

var model_item = glm.rotate(glm.mat4(1.0),  0.1, glm.vec3(4.0, 1.0, 0.0));
var project;
var view;
var view_position = glm.vec3(0.0, 0.0, 3.0);

function drawItem() {
    gl.useProgram(program_item);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer_item);

    // There are 7 floating-point values per vertex
    var stride = 3 * Float32Array.BYTES_PER_ELEMENT;

    // Set up position stream
    gl.vertexAttribPointer(program_item.positionAttr, 3, gl.FLOAT, false, stride, 0);

    gl.uniformMatrix4fv(program_item.project, false, project.array);
    gl.uniformMatrix4fv(program_item.view, false, view.array);
    gl.uniformMatrix4fv(program_item.model, false, model_item.array);

    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function drawScene() {
    gl.viewport(0, 0, viewportWidth, viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    project = glm.perspective(glm.radians(45.0), viewportWidth / viewportHeight, 0.1, 100.0);
    view  = glm.lookAt(view_position, glm.vec3(0.0, 0.0, 0.0), glm.vec3(0.0, 1.0, 0.0));

    drawItem();
    
    requestAnimationFrame(drawScene);
}

var isMove = false;

function doMouseMove(e) {
    if (!isMove) return;
    var trans = glm.rotate(glm.mat4(1.0), -0.01 * e.movementX, glm.vec3(0.0, 1.0, 0.0));
    trans = glm.rotate(trans, -0.01 * e.movementY, glm.vec3(1.0, 0.0, 0.0));
    view_position = trans['*'](glm.vec4(view_position, 1.0)).xyz;
}

function webGLStart() {
    var canvas = document.getElementById("can");
    initGL(canvas);
    initShaders();
    initGeometry();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    drawScene();

    canvas.addEventListener('mousemove', doMouseMove, false);
    canvas.onmousedown = function(e){ isMove = true; }
    canvas.onmouseup = function(e){ isMove = false; }
}