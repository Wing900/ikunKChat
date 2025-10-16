import React, { useState } from 'react';
import { COLOR_PALETTES } from '../data/colorPalettes';
import { Icon } from './Icon';
import { useLocalization } from '../contexts/LocalizationContext';

interface ColorPickerProps {
  selectedColorId: string;
  customColor?: string;
  onSelectColor: (colorId: string) => void;
  onSelectCustomColor: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColorId,
  customColor,
  onSelectColor,
  onSelectCustomColor,
}) => {
  const { language } = useLocalization();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputValue, setCustomInputValue] = useState(customColor || '#007aff');
  const [inputError, setInputError] = useState('');

  const isValidHexColor = (color: string): boolean => {
    return /^#[0-9A-F]{6}$/i.test(color);
  };

  const handleCustomColorSubmit = () => {
    const trimmedValue = customInputValue.trim();
    if (!isValidHexColor(trimmedValue)) {
      setInputError(language === 'zh' ? '请输入有效的HEX颜色值 (例如: #007aff)' : 'Please enter a valid HEX color (e.g., #007aff)');
      return;
    }
    setInputError('');
    onSelectCustomColor(trimmedValue);
    setShowCustomInput(false);
  };

  const handlePresetClick = (colorId: string) => {
    onSelectColor(colorId);
    setShowCustomInput(false);
  };

  return (
    <div className="color-picker-container">
      {/* 预设颜色网格 */}
      <div className="color-palette-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        {COLOR_PALETTES.map((palette) => (
          <button
            key={palette.id}
            onClick={() => handlePresetClick(palette.id)}
            className={`color-palette-option ${selectedColorId === palette.id && !customColor ? 'selected' : ''}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              borderRadius: 'var(--radius-2xl)',
              border: selectedColorId === palette.id && !customColor 
                ? '2px solid var(--md-sys-color-primary)' 
                : '1px solid var(--md-sys-color-outline-variant)',
              background: selectedColorId === palette.id && !customColor
                ? 'color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent)'
                : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (selectedColorId !== palette.id || customColor) {
                e.currentTarget.style.borderColor = 'var(--md-sys-color-primary)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedColorId !== palette.id || customColor) {
                e.currentTarget.style.borderColor = 'var(--md-sys-color-outline-variant)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-full)',
              background: palette.primaryLight,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }} />
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--md-sys-color-on-surface)',
              textAlign: 'center',
            }}>
              {language === 'zh' ? palette.nameZh : palette.name}
            </div>
            {selectedColorId === palette.id && !customColor && (
              <Icon icon="check" className="w-4 h-4" style={{ color: 'var(--md-sys-color-primary)' }} />
            )}
          </button>
        ))}
      </div>

      {/* 自定义颜色按钮 */}
      {!showCustomInput && (
        <button
          onClick={() => setShowCustomInput(true)}
          className="custom-color-btn"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            borderRadius: 'var(--radius-2xl)',
            border: customColor 
              ? '2px solid var(--md-sys-color-primary)' 
              : '1px dashed var(--md-sys-color-outline-variant)',
            background: customColor 
              ? 'color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent)'
              : 'transparent',
            color: 'var(--md-sys-color-on-surface)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--md-sys-color-primary)';
          }}
          onMouseLeave={(e) => {
            if (!customColor) {
              e.currentTarget.style.borderColor = 'var(--md-sys-color-outline-variant)';
            }
          }}
        >
          <Icon icon="palette" className="w-5 h-5" />
          <span style={{ fontWeight: 500 }}>
            {customColor 
              ? (language === 'zh' ? `自定义颜色 ${customColor}` : `Custom Color ${customColor}`)
              : (language === 'zh' ? '自定义颜色' : 'Custom Color')
            }
          </span>
          {customColor && (
            <div style={{
              width: '1.5rem',
              height: '1.5rem',
              borderRadius: 'var(--radius-full)',
              background: customColor,
              border: '2px solid white',
              boxShadow: '0 0 0 1px var(--md-sys-color-outline-variant)',
            }} />
          )}
        </button>
      )}

      {/* 自定义颜色输入 */}
      {showCustomInput && (
        <div className="custom-color-input" style={{
          padding: '1rem',
          borderRadius: 'var(--radius-2xl)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          background: 'color-mix(in srgb, var(--md-sys-color-on-surface) 3%, transparent)',
        }}>
          <div style={{ marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
            {language === 'zh' ? '输入HEX颜色值' : 'Enter HEX Color'}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="text"
              value={customInputValue}
              onChange={(e) => {
                setCustomInputValue(e.target.value);
                setInputError('');
              }}
              placeholder="#007aff"
              className="input-glass"
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                fontSize: '0.9rem',
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCustomColorSubmit();
                }
              }}
            />
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-2xl)',
              background: isValidHexColor(customInputValue) ? customInputValue : '#cccccc',
              border: '2px solid var(--md-sys-color-outline-variant)',
              flexShrink: 0,
            }} />
          </div>
          {inputError && (
            <div style={{ 
              color: 'var(--md-sys-color-error)', 
              fontSize: '0.8rem',
              marginBottom: '0.5rem' 
            }}>
              {inputError}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setShowCustomInput(false);
                setInputError('');
              }}
              className="btn-outline"
              style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
            >
              {language === 'zh' ? '取消' : 'Cancel'}
            </button>
            <button
              onClick={handleCustomColorSubmit}
              className="btn-outline"
              style={{ 
                fontSize: '0.85rem', 
                padding: '0.4rem 0.75rem',
                background: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
                border: 'none',
              }}
            >
              {language === 'zh' ? '应用' : 'Apply'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};