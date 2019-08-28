
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
}

var buffer;

function initGeometry() {
    var B0 = glm.vec2(-0.2, 0.5);
    var B1 = glm.vec2(0.0, 0.9);
    var B2 = glm.vec2(0.6, 0.3);
    var B3 = glm.vec2(0.2, -0.5);
    var vertexData = new Array();
    for(var i = 0; i < 100; i += 1)
    {
        var U0 = Math.pow((1.0 - i / 100), 3.0);
        var U1 = 3.0 * i / 100 * Math.pow((1.0 - i / 100), 2.0);
        var U2 = 3.0 * Math.pow(i / 100, 2.0) * (1.0 - i / 100);
        var U3 = Math.pow(i / 100, 3.0);
        var point = B0['*'](U0)['+'](B1['*'](U1))['+'](B2['*'](U2))['+'](B3['*'](U3));
        vertexData[i * 3] = point.x;
        vertexData[i * 3 + 1] = point.y;
        vertexData[i * 3 + 2] = 0;
    }

    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);
}

function drawScene() {
    gl.viewport(0, 0, viewportWidth, viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    // There are 3 floating-point values per vertex
    var stride = 3 * Float32Array.BYTES_PER_ELEMENT;

    // Set up position stream
    gl.vertexAttribPointer(program.positionAttr, 3, gl.FLOAT, false, stride, 0);

    gl.lineWidth(5);
    gl.drawArrays(gl.LINE_STRIP, 0, 100);
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