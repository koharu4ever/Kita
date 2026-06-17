import {
  waterFragmentShaderSource,
  vertexShaderSource,
} from "@/features/home/lib/rain-effect/shaders";
import {
  createProgram,
  createTexture,
  getWebGLContext,
  setUniform1f,
  setUniform1i,
  setUniform2f,
  updateTexture,
} from "@/features/home/lib/rain-effect/webgl";

type RainRendererOptions = {
  brightness: number;
  alphaMultiply: number;
  alphaSubtract: number;
  minRefraction: number;
  maxRefraction: number;
  parallaxBg: number;
  parallaxFg: number;
  renderShadow: boolean;
};

const defaultOptions: RainRendererOptions = {
  brightness: 1.04,
  alphaMultiply: 6,
  alphaSubtract: 3,
  minRefraction: 140,
  maxRefraction: 430,
  parallaxBg: 4,
  parallaxFg: 18,
  renderShadow: false,
};

export class RainRenderer {
  private readonly gl: WebGLRenderingContext;
  private readonly program: WebGLProgram;
  private readonly liquidCanvas: HTMLCanvasElement;
  private readonly backgroundImage: HTMLImageElement;
  private readonly shineImage: HTMLImageElement | null;
  private readonly positionBuffer: WebGLBuffer;
  private readonly options: RainRendererOptions;
  private parallaxX = 0;
  private parallaxY = 0;

  constructor(
    canvas: HTMLCanvasElement,
    liquidCanvas: HTMLCanvasElement,
    backgroundImage: HTMLImageElement,
    shineImage: HTMLImageElement | null,
    options: Partial<RainRendererOptions> = {},
  ) {
    const gl = getWebGLContext(canvas);

    if (!gl) {
      throw new Error("WebGL is not available.");
    }

    this.gl = gl;
    this.program = createProgram(
      gl,
      vertexShaderSource,
      waterFragmentShaderSource,
    );
    this.liquidCanvas = liquidCanvas;
    this.backgroundImage = backgroundImage;
    this.shineImage = shineImage;
    this.options = { ...defaultOptions, ...options };

    const positionBuffer = gl.createBuffer();
    if (!positionBuffer) {
      throw new Error("Unable to create WebGL position buffer.");
    }
    this.positionBuffer = positionBuffer;

    this.init();
  }

  setParallax(x: number, y: number) {
    this.parallaxX = x;
    this.parallaxY = y;
  }

  draw() {
    const gl = this.gl;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(this.program);
    setUniform2f(gl, this.program, "parallax", this.parallaxX, this.parallaxY);
    updateTexture(gl, 0, this.liquidCanvas);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  destroy() {
    this.gl.deleteProgram(this.program);
    this.gl.deleteBuffer(this.positionBuffer);
  }

  private init() {
    const gl = this.gl;

    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const positionLocation = gl.getAttribLocation(this.program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.clearColor(0, 0, 0, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);

    createTexture(gl, 0, this.liquidCanvas);
    createTexture(
      gl,
      1,
      this.shineImage ?? this.createTransparentTexturePlaceholder(),
    );
    createTexture(gl, 2, this.backgroundImage);
    createTexture(gl, 3, this.backgroundImage);

    setUniform2f(
      gl,
      this.program,
      "resolution",
      gl.canvas.width,
      gl.canvas.height,
    );
    setUniform1f(
      gl,
      this.program,
      "textureRatio",
      this.backgroundImage.width / this.backgroundImage.height,
    );
    setUniform1i(gl, this.program, "waterMap", 0);
    setUniform1i(gl, this.program, "textureShine", 1);
    setUniform1i(gl, this.program, "textureFg", 2);
    setUniform1i(gl, this.program, "textureBg", 3);
    setUniform1i(gl, this.program, "renderShine", Boolean(this.shineImage));
    setUniform1i(gl, this.program, "renderShadow", this.options.renderShadow);
    setUniform1f(gl, this.program, "minRefraction", this.options.minRefraction);
    setUniform1f(
      gl,
      this.program,
      "refractionDelta",
      this.options.maxRefraction - this.options.minRefraction,
    );
    setUniform1f(gl, this.program, "brightness", this.options.brightness);
    setUniform1f(gl, this.program, "alphaMultiply", this.options.alphaMultiply);
    setUniform1f(gl, this.program, "alphaSubtract", this.options.alphaSubtract);
    setUniform1f(gl, this.program, "parallaxBg", this.options.parallaxBg);
    setUniform1f(gl, this.program, "parallaxFg", this.options.parallaxFg);
    setUniform2f(gl, this.program, "parallax", 0, 0);
  }

  private createTransparentTexturePlaceholder() {
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 2;

    return canvas;
  }
}
