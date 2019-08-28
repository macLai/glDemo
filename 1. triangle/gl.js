
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

var program;

function initShaders() {
    var vertexShader = getShader(gl, "shader-vs");
    var fragmentShader = getShader(gl, "shader-fs");

    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(program);

    program.positionAttr = gl.getAttribLocation(program, "positionAttr");
    gl.enableVertexAttribArray(program.positionAttr);

    program.colorAttr = gl.getAttribLocation(program, "colorAttr");
    gl.enableVertexAttribArray(program.colorAttr);
}

var buffer;

function initGeometry() {
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // Interleave vertex positions and colors
    var vertexData = [
        -1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,
        -1.0, -1.0,  0.0,  0.0,  1.0,  0.0,  1.0,
        0.0,  -1.0,  0.0,  0.0,  0.0,  1.0,  1.0,

        0.0,   1.0,  0.0,  1.0,  0.0,  0.0,  1.0,
        1.0,   0.0,  0.0,  0.0,  0.0,  1.0,  1.0,
        1.0,   1.0,  0.0,  0.0,  0.0,  0.0,  1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);
}

function drawScene() {
    gl.viewport(0, 0, viewportWidth, viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    // There are 7 floating-point values per vertex
    var stride = 7 * Float32Array.BYTES_PER_ELEMENT;

    // Set up position stream
    gl.vertexAttribPointer(program.positionAttr, 3, gl.FLOAT, false, stride, 0);
    // Set up color stream
    gl.vertexAttribPointer(program.colorAttr, 4, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function webGLStart() {
    var canvas = document.getElementById("can");
    initGL(canvas);
    initShaders()
    initGeometry();

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.disable(gl.DEPTH_TEST);

    drawScene();
}