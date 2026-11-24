import { Config } from '@remotion/cli/config';

// O chrome-headless-shell baixado pelo Remotion trava neste Mac; use o do
// Playwright (ou outro) apontando REMOTION_BROWSER para o executável.
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
