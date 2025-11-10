
export interface TranscriptEntry {
  speaker: 'user' | 'model';
  text: string;
  isFinal: boolean;
}
