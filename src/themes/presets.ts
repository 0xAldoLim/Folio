import type { CustomPreset } from '../shared/types';
export const PRESETS: CustomPreset[] = [
  { id: 'paper', name: 'Natural Paper', background: '#F5F1E8', text: '#292923', secondary: '#626158', accent: '#76654C' },
  { id: 'white', name: 'Classic White', background: '#FAFAF8', text: '#202124', secondary: '#606368', accent: '#48617A' },
  { id: 'sepia', name: 'Sepia', background: '#EDE0C8', text: '#433629', secondary: '#68543F', accent: '#805B40' },
  { id: 'eink', name: 'E-Ink', background: '#E7E7E2', text: '#202020', secondary: '#585858', accent: '#585858' },
  { id: 'dark', name: 'Dark Reading', background: '#1D2023', text: '#D6D6D0', secondary: '#A8A9A5', accent: '#9DAFC0' },
  { id: 'oled', name: 'OLED Black', background: '#000000', text: '#D3D3D3', secondary: '#9C9C9C', accent: '#A7B8C8' }
];
export const FONTS = { system: 'system-ui, sans-serif', georgia: 'Georgia, "Times New Roman", serif', arial: 'Arial, sans-serif', verdana: 'Verdana, sans-serif' };
