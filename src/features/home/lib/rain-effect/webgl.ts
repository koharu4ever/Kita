export function getWebGLContext(canvas: HTMLCanvasElement) {
  return (
    canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      premultipliedAlpha: false,
      stencil: false,
    }) ??
    (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null)
  );
}

export function createShader(
  gl: WebGLRenderingContext,
  source: string,
  type: number,
) {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error("Unable to create WebGL shader.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown shader error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

export function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
) {
  const vertexShader = createShader(gl, vertexSource, gl.VERTEX_SHADER);
  const fragmentShader = createShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
  const program = gl.createProgram();

  if (!program) {
    throw new Error("Unable to create WebGL program.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "Unknown program error.";
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

export function createTexture(
  gl: WebGLRenderingContext,
  unit: number,
  source?: TexImageSource,
) {
  const texture = gl.createTexture();

  if (!texture) {
    throw new Error("Unable to create WebGL texture.");
  }

  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  if (source) {
    updateTexture(gl, unit, source);
  }

  return texture;
}

export function updateTexture(
  gl: WebGLRenderingContext,
  unit: number,
  source: TexImageSource,
) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
}

export function setUniform1f(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  name: string,
  value: number,
) {
  gl.uniform1f(gl.getUniformLocation(program, `u_${name}`), value);
}

export function setUniform1i(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  name: string,
  value: number | boolean,
) {
  gl.uniform1i(gl.getUniformLocation(program, `u_${name}`), Number(value));
}

export function setUniform2f(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  name: string,
  valueA: number,
  valueB: number,
) {
  gl.uniform2f(gl.getUniformLocation(program, `u_${name}`), valueA, valueB);
}
