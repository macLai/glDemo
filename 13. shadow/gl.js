
var gl = null;
var viewportWidth = 0;
var viewportHeight = 0;

function initGL(canvas) {
    try {
        gl = canvas.getContext("webgl2");
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
var program_shadow;

function initShaders() {
    var vertexItemShader = getShader(gl, "shader-vs-item");
    var vertexSunShader = getShader(gl, "shader-vs-sun");
    var vertexShadowShader = getShader(gl, "shader-vs-shadow");
    var fragmentItemShader = getShader(gl, "shader-fs-item");
    var fragmentSunShader = getShader(gl, "shader-fs-sun");
    var fragmentShadowShader = getShader(gl, "shader-fs-shadow");

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
    program_item.modelTransformed = gl.getUniformLocation(program_item, "modelTransformed");
    program_item.lightPos = gl.getUniformLocation(program_item, "lightPos");
    program_item.viewPos = gl.getUniformLocation(program_item, "viewPos");
    program_item.lightSpaceMatrix = gl.getUniformLocation(program_item, "lightSpaceMatrix");

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

    program_shadow = gl.createProgram();
    gl.attachShader(program_shadow, vertexShadowShader);
    gl.attachShader(program_shadow, fragmentShadowShader);
    gl.linkProgram(program_shadow);
    gl.useProgram(program_shadow);
    program_shadow.positionAttr = gl.getAttribLocation(program_shadow, "positionAttr");
    gl.enableVertexAttribArray(program_shadow.positionAttr);
    program_shadow.lightSpaceMatrix = gl.getUniformLocation(program_shadow, "lightSpaceMatrix");
    program_shadow.model = gl.getUniformLocation(program_shadow, "model");
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
       -0.5,  0.5, -0.5,  0.0,  1.0,  0.0,

       -5.0,  -1.0, -5.0,  0.0,  1.0,  0.0,
        5.0,  -1.0, -5.0,  0.0,  1.0,  0.0,
        5.0,  -1.0,  5.0,  0.0,  1.0,  0.0,
        5.0,  -1.0,  5.0,  0.0,  1.0,  0.0,
       -5.0,  -1.0,  5.0,  0.0,  1.0,  0.0,
       -5.0,  -1.0, -5.0,  0.0,  1.0,  0.0
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

var texture_shadow_size = 1024;
var texture_shadow;

function initTexture() {
    texture_shadow = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture_shadow);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, texture_shadow_size, texture_shadow_size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
}

var offScrBuffer;

function initFrameBuffer() {
    offScrBuffer = gl.createFramebuffer();
}

var model_item = glm.mat4(1.0);
var project;
var view;
var sun_position = glm.vec3(1.0, 4.0, 1.0);
var view_position = glm.vec3(0.0, 5.0, 10.0);
var lightSpaceMatrix;

function drawShadow() {
    gl.useProgram(program_shadow);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, offScrBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture_shadow, 0);
    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);

    gl.viewport(0, 0, texture_shadow_size, texture_shadow_size);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer_item);

    // There are 7 floating-point values per vertex
    var stride = 6 * Float32Array.BYTES_PER_ELEMENT;

    // Set up position stream
    gl.vertexAttribPointer(program_shadow.positionAttr, 3, gl.FLOAT, false, stride, 0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 0);

    var near_plane = 1.0, far_plane = 7.5;
    var lightProjection = glm.ortho(-10.0, 10.0, -10.0, 10.0, near_plane, far_plane);
    var lightView = glm.lookAt(sun_position, glm.vec3(0.0), glm.vec3(1.0));
    lightSpaceMatrix = lightProjection['*'](lightView);

    gl.uniformMatrix4fv(program_shadow.lightSpaceMatrix, false, lightSpaceMatrix.array);
    gl.uniformMatrix4fv(program_shadow.model, false, model_item.array);

    gl.drawArrays(gl.TRIANGLES, 0, 42);

    gl.bindFramebuffer(gl.FRAMEBUFFER, undefined);
}

function drawItem() {
    gl.useProgram(program_item);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer_item);

    // There are 7 floating-point values per vertex
    var stride = 6 * Float32Array.BYTES_PER_ELEMENT;

    // Set up position stream
    gl.vertexAttribPointer(program_item.positionAttr, 3, gl.FLOAT, false, stride, 0);
    // Set up color stream
    gl.vertexAttribPointer(program_item.normalVecAttr, 3, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);

    gl.bindTexture(gl.TEXTURE_2D, texture_shadow);

    gl.uniformMatrix4fv(program_item.project, false, project.array);
    gl.uniformMatrix4fv(program_item.view, false, view.array);
    gl.uniformMatrix4fv(program_item.model, false, model_item.array);
    gl.uniformMatrix4fv(program_item.modelTransformed, false, glm.transpose(glm.inverse(model_item)).array);
    gl.uniformMatrix4fv(program_item.lightSpaceMatrix, false, lightSpaceMatrix.array);
    gl.uniform3fv(program_item.lightPos, sun_position.array);
    gl.uniform3fv(program_item.viewPos, view_position.array);

    gl.drawArrays(gl.TRIANGLES, 0, 42);
}

function drawSun() {
    var model_sun = glm.translate(glm.mat4(1.0), sun_position);

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
    project = glm.perspective(glm.radians(45.0), viewportWidth / viewportHeight, 0.1, 100.0);
    view  = glm.lookAt(view_position, glm.vec3(0.0, 0.0, 0.0), glm.vec3(0.0, 1.0, 0.0));

    gl.cullFace(gl.FRONT);
    drawShadow();
    gl.cullFace(gl.BACK);
    
    gl.viewport(0, 0, viewportWidth, viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    drawItem();
    drawSun();
    
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
    initTexture();
    initFrameBuffer();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    drawScene();

    canvas.addEventListener('mousemove', doMouseMove, false);
    canvas.onmousedown = function(e){ isMove = true; }
    canvas.onmouseup = function(e){ isMove = false; }
}