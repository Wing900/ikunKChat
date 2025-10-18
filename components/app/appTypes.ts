export type AppView = 'chat' | 'personas' | 'editor' | 'archive';

export interface ConfirmationState {
  title: string;
  message: string;
  onConfirm: () => void;
}
