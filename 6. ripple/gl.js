
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

var program_add_drop;
var program_calculate_pos;
var program_draw_frame;

function initShaders() {
    var vertexShader = getShader(gl, "shader-vs");
    var fragmentShader_add_drop = getShader(gl, "shader-fs-add_drop");
    var fragmentShader_calculate_pos = getShader(gl, "shader-fs-calculate_pos");
    var fragmentShader_draw_frame = getShader(gl, "shader-fs-draw_frame");

    program_add_drop = gl.createProgram();
    gl.attachShader(program_add_drop, vertexShader);
    gl.attachShader(program_add_drop, fragmentShader_add_drop);
    gl.linkProgram(program_add_drop);
    gl.useProgram(program_add_drop);
    program_add_drop.u_widthInc = gl.getUniformLocation(program_add_drop, "u_widthInc");
    program_add_drop.u_heightInc = gl.getUniformLocation(program_add_drop, "u_heightInc");
    program_add_drop.u_dropX = gl.getUniformLocation(program_add_drop, "u_dropX");
    program_add_drop.u_dropY = gl.getUniformLocation(program_add_drop, "u_dropY");
    program_add_drop.u_dropSize = gl.getUniformLocation(program_add_drop, "u_dropSize");
    program_add_drop.a_position = gl.getAttribLocation(program_add_drop, "a_position");
    gl.enableVertexAttribArray(program_add_drop.a_position);
    program_add_drop.a_texCoord = gl.getAttribLocation(program_add_drop, "a_texCoord");
    gl.enableVertexAttribArray(program_add_drop.a_texCoord);
    program_add_drop.u_currHBuf = gl.getUniformLocation(program_add_drop, "u_currHBuf");
    gl.uniform1i(program_add_drop.u_currHBuf, 0);

    program_calculate_pos = gl.createProgram();
    gl.attachShader(program_calculate_pos, vertexShader);
    gl.attachShader(program_calculate_pos, fragmentShader_calculate_pos);
    gl.linkProgram(program_calculate_pos);
    gl.useProgram(program_calculate_pos);
    program_calculate_pos.u_widthInc = gl.getUniformLocation(program_calculate_pos, "u_widthInc");
    program_calculate_pos.u_heightInc = gl.getUniformLocation(program_calculate_pos, "u_heightInc");
    program_calculate_pos.u_damping = gl.getUniformLocation(program_calculate_pos, "u_damping");
    program_calculate_pos.a_position = gl.getAttribLocation(program_calculate_pos, "a_position");
    gl.enableVertexAttribArray(program_calculate_pos.a_position);
    program_calculate_pos.a_texCoord = gl.getAttribLocation(program_calculate_pos, "a_texCoord");
    gl.enableVertexAttribArray(program_calculate_pos.a_texCoord);
    program_calculate_pos.u_prevHBuf = gl.getUniformLocation(program_calculate_pos, "u_prevHBuf");
    gl.uniform1i(program_calculate_pos.u_prevHBuf, 0);
    program_calculate_pos.u_currHBuf = gl.getUniformLocation(program_calculate_pos, "u_currHBuf");
    gl.uniform1i(program_calculate_pos.u_currHBuf, 1);

    program_draw_frame = gl.createProgram();
    gl.attachShader(program_draw_frame, vertexShader);
    gl.attachShader(program_draw_frame, fragmentShader_draw_frame);
    gl.linkProgram(program_draw_frame);
    gl.useProgram(program_draw_frame);
    program_draw_frame.u_refract = gl.getUniformLocation(program_draw_frame, "u_refract");
    program_draw_frame.a_position = gl.getAttribLocation(program_draw_frame, "a_position");
    gl.enableVertexAttribArray(program_draw_frame.a_position);
    program_draw_frame.a_texCoord = gl.getAttribLocation(program_draw_frame, "a_texCoord");
    gl.enableVertexAttribArray(program_draw_frame.a_texCoord);
    program_draw_frame.u_heights = gl.getUniformLocation(program_draw_frame, "u_heights");
    gl.uniform1i(program_draw_frame.u_heights, 1);
    program_draw_frame.u_origImg = gl.getUniformLocation(program_draw_frame, "u_origImg");
    gl.uniform1i(program_draw_frame.u_origImg, 2);
}

var buffer;

function initGeometry() {
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // Interleave vertex positions and colors
    var vertexData = [
        -1.0,  1.0,  0.0,  0.0,  0.0,
        -1.0, -1.0,  0.0,  0.0,  1.0,
        1.0,  -1.0,  0.0,  1.0,  1.0,

        -1.0,  1.0,  0.0,  0.0,  0.0,
        1.0,  -1.0,  0.0,  1.0,  1.0,
        1.0,   1.0,  0.0,  1.0,  0.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);
}

var texture_pre_frame;
var texture_cur_frame;
var texture_temp;
var texture_origin;
var image;

function initTexture() {
    texture_origin = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture_origin);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    texture_pre_frame = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture_pre_frame);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, viewportWidth, viewportHeight, 0, gl.RGBA, gl.FLOAT, new Float32Array(viewportWidth * viewportHeight * 4));

    texture_cur_frame = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture_cur_frame);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, viewportWidth, viewportHeight, 0, gl.RGBA, gl.FLOAT, new Float32Array(viewportWidth * viewportHeight * 4));

    texture_temp = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture_temp);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, viewportWidth, viewportHeight, 0, gl.RGBA, gl.FLOAT, new Float32Array(viewportWidth * viewportHeight * 4));
}

var offScrBuffer;

function initFrameBuffer() {
    offScrBuffer = gl.createFramebuffer();
}

function drawDrop() { // from prev to cur
    gl.useProgram(program_add_drop);
    gl.bindFramebuffer(gl.FRAMEBUFFER, offScrBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture_temp, 0);

    gl.viewport(0, 0, viewportWidth, viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    // There are 7 floating-point values per vertex
    var stride = 5 * Float32Array.BYTES_PER_ELEMENT;
    // Set up position stream
    gl.vertexAttribPointer(program_add_drop.a_position, 3, gl.FLOAT, false, stride, 0);
    // Set up color stream
    gl.vertexAttribPointer(program_add_drop.a_texCoord, 2, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);

    gl.uniform1f(program_add_drop.u_widthInc, 1.0 / viewportWidth);
    gl.uniform1f(program_add_drop.u_heightInc, 1.0 / viewportHeight);
    gl.uniform1f(program_add_drop.u_dropX, Math.random());
    gl.uniform1f(program_add_drop.u_dropY, Math.random());
    gl.uniform1f(program_add_drop.u_dropSize, Math.random());

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture_cur_frame);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindFramebuffer(gl.FRAMEBUFFER, undefined);

    // clean up
    var swapTex = texture_cur_frame;
    texture_cur_frame = texture_temp;
    texture_temp = swapTex;
}

function drawPos() { // from prev and cur to cur
    gl.useProgram(program_calculate_pos);
    gl.bindFramebuffer(gl.FRAMEBUFFER, offScrBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture_temp, 0);

    gl.viewport(0, 0, viewportWidth, viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    // There are 7 floating-point values per vertex
    var stride = 5 * Float32Array.BYTES_PER_ELEMENT;
    // Set up position stream
    gl.vertexAttribPointer(program_calculate_pos.a_position, 3, gl.FLOAT, false, stride, 0);
    // Set up color stream
    gl.vertexAttribPointer(program_calculate_pos.a_texCoord, 2, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);

    gl.uniform1f(program_calculate_pos.u_widthInc, 1.0 / viewportWidth);
    gl.uniform1f(program_calculate_pos.u_heightInc, 1.0 / viewportHeight);
    gl.uniform1f(program_calculate_pos.u_damping, 0.95);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture_pre_frame);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture_cur_frame);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindFramebuffer(gl.FRAMEBUFFER, undefined);

    // clean up
    var swapTex = texture_cur_frame;
    texture_cur_frame = texture_temp;
    texture_temp = texture_pre_frame;
    texture_pre_frame = swapTex;
}

function drawFrame() { // from cur to origin
    gl.useProgram(program_draw_frame);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    // There are 7 floating-point values per vertex
    var stride = 5 * Float32Array.BYTES_PER_ELEMENT;
    // Set up position stream
    gl.vertexAttribPointer(program_draw_frame.a_position, 3, gl.FLOAT, false, stride, 0);
    // Set up color stream
    gl.vertexAttribPointer(program_draw_frame.a_texCoord, 2, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);

    gl.uniform1f(program_draw_frame.u_refract, 1.33);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture_cur_frame);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texture_origin);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function drawScene() {
    gl.viewport(0, 0, viewportWidth, viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    drawDrop();
    drawPos();
    drawFrame();
    requestAnimationFrame(drawScene);
}

function webGLStart() {
    var canvas = document.getElementById("can");
    initGL(canvas);
    initShaders();
    initGeometry();
    initFrameBuffer();

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.disable(gl.DEPTH_TEST);
    gl.getExtension('OES_texture_float');

    image = new Image();
    image.src = "./stone.jpg";  // MUST BE SAME DOMAIN!!!
    image.onload = function() {
        initTexture();
        
        drawScene();
    }
    // requestAnimationFrame(webGLStart);
}