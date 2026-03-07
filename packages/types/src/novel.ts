// Novel generation types
// Full definitions in Phase 2

export type NovelStyle = 'literary' | 'webnovel' | 'commentary';

export interface NovelOutput {
  id: string;
  instanceId: string;
  style: NovelStyle;
  content: string;
  wordCount: number;
  createdAt: Date;
}
