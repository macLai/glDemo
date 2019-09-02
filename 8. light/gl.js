
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
    gl.enableVertexAttribArray(program_item.positionAttr);
    program_item.normalVecAttr = gl.getAttribLocation(program_item, "normalVecAttr");
    gl.enableVertexAttribArray(program_item.normalVecAttr);
    program_item.project = gl.getUniformLocation(program_item, "project");
    program_item.view = gl.getUniformLocation(program_item, "view");
    program_item.model = gl.getUniformLocation(program_item, "model");
    program_item.lightPos = gl.getUniformLocation(program_item, "lightPos");
    program_item.viewPos = gl.getUniformLocation(program_item, "viewPos");

    program_sun = gl.createProgram();
    gl.attachShader(program_sun, vertexSunShader);
    gl.attachShader(program_sun, fragmentSunShader);
    gl.linkProgram(program_sun);
    gl.useProgram(program_sun);
    program_sun.positionAttr = gl.getAttribLocation(program_sun, "positionAttr");
    gl.enableVertexAttribArray(program_sun.positionAttr);
    program_sun.project = gl.getUniformLocation(program_sun, "project");
    program_sun.view = gl.getUniformLocation(program_sun, "view");
    program_sun.model = gl.getUniformLocation(program_sun, "model");
}

var buffer_item;
var buffer_sun;

function initGeometry() {
    buffer_item = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer_item);
    // Interleave vertex positions and colors
    var vertexData = [
       -0.5, -0.5, -0.5,  0.0,  0.0, -1.0,
        0.5, -0.5, -0.5,  0.0,  0.0, -1.0,
        0.5,  0.5, -0.5,  0.0,  0.0, -1.0,
        0.5,  0.5, -0.5,  0.0,  0.0, -1.0,
       -0.5,  0.5, -0.5,  0.0,  0.0, -1.0,
       -0.5, -0.5, -0.5,  0.0,  0.0, -1.0,

       -0.5, -0.5,  0.5,  0.0,  0.0,  1.0,
        0.5, -0.5,  0.5,  0.0,  0.0,  1.0,
        0.5,  0.5,  0.5,  0.0,  0.0,  1.0,
        0.5,  0.5,  0.5,  0.0,  0.0,  1.0,
       -0.5,  0.5,  0.5,  0.0,  0.0,  1.0,
       -0.5, -0.5,  0.5,  0.0,  0.0,  1.0,

       -0.5,  0.5,  0.5, -1.0,  0.0,  0.0,
       -0.5,  0.5, -0.5, -1.0,  0.0,  0.0,
       -0.5, -0.5, -0.5, -1.0,  0.0,  0.0,
       -0.5, -0.5, -0.5, -1.0,  0.0,  0.0,
       -0.5, -0.5,  0.5, -1.0,  0.0,  0.0,
       -0.5,  0.5,  0.5, -1.0,  0.0,  0.0,

        0.5,  0.5,  0.5,  1.0,  0.0,  0.0,
        0.5,  0.5, -0.5,  1.0,  0.0,  0.0,
        0.5, -0.5, -0.5,  1.0,  0.0,  0.0,
        0.5, -0.5, -0.5,  1.0,  0.0,  0.0,
        0.5, -0.5,  0.5,  1.0,  0.0,  0.0,
        0.5,  0.5,  0.5,  1.0,  0.0,  0.0,

       -0.5, -0.5, -0.5,  0.0, -1.0,  0.0,
        0.5, -0.5, -0.5,  0.0, -1.0,  0.0,
        0.5, -0.5,  0.5,  0.0, -1.0,  0.0,
        0.5, -0.5,  0.5,  0.0, -1.0,  0.0,
       -0.5, -0.5,  0.5,  0.0, -1.0,  0.0,
       -0.5, -0.5, -0.5,  0.0, -1.0,  0.0,

       -0.5,  0.5, -0.5,  0.0,  1.0,  0.0,
        0.5,  0.5, -0.5,  0.0,  1.0,  0.0,
        0.5,  0.5,  0.5,  0.0,  1.0,  0.0,
        0.5,  0.5,  0.5,  0.0,  1.0,  0.0,
       -0.5,  0.5,  0.5,  0.0,  1.0,  0.0,
       -0.5,  0.5, -0.5,  0.0,  1.0,  0.0
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

var model_item = glm.mat4(1.0);
var project;
var view;

function drawItem() {
    model_item = glm.rotate(model_item,  0.01, glm.vec3(4.0, 1.0, 0.0));

    gl.useProgram(program_item);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer_item);

    // There are 7 floating-point values per vertex
    var stride = 6 * Float32Array.BYTES_PER_ELEMENT;

    // Set up position stream
    gl.vertexAttribPointer(program_item.positionAttr, 3, gl.FLOAT, false, stride, 0);
    // Set up color stream
    gl.vertexAttribPointer(program_item.texturePositionAttr, 3, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);

    gl.uniformMatrix4fv(program_item.project, false, project.array);
    gl.uniformMatrix4fv(program_item.view, false, view.array);
    gl.uniformMatrix4fv(program_item.model, false, model_item.array);
    gl.uniform3f(program_item.lightPos, false, 1.0, 1.0, -4.0);
    gl.uniform3f(program_item.viewPos, false, 0.0, 0.0, 5.0);

    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function drawSun() {
    var model_sun = glm.translate(glm.mat4(1.0), glm.vec3(1.0, 1.0, 1.0));

    gl.useProgram(program_sun);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer_sun);

    // There are 7 floating-point values per vertex
    var stride = 3 * Float32Array.BYTES_PER_ELEMENT;

    // Set up position stream
    gl.vertexAttribPointer(program_sun.positionAttr, 3, gl.FLOAT, false, stride, 0);

    gl.uniformMatrix4fv(program_sun.project, false, project.array);
    gl.uniformMatrix4fv(program_sun.view, false, view.array);
    gl.uniformMatrix4fv(program_sun.model, false, model_sun.array);

    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function drawScene() {
    gl.viewport(0, 0, viewportWidth, viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    project = glm.perspective(glm.radians(45.0), viewportWidth / viewportHeight, 0.1, 100.0);
    view  = glm.translate(glm.mat4(1.0), glm.vec3(0.0, 0.0, -5.0));

    drawItem();
    drawSun();
    
    requestAnimationFrame(drawScene);
}

function webGLStart() {
    var canvas = document.getElementById("can");
    initGL(canvas);
    initShaders();
    initGeometry();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    drawScene();
    
}