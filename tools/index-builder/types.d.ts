export type Config = {
  basePath: string;
  path: string;
  fontsPath: string;
  oldTargetVersion: number;
  targetVersion: string;
};

export type TemplateData = {
  alias?: string[];
  type?: string;
};