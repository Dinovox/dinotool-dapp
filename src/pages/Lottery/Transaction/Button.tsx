import React, { FC, CSSProperties, MouseEventHandler, ReactNode } from 'react';

interface ButtonProps {
  className?: string;
  text?: React.ReactNode;
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  textColor?: string;
  onClick?: MouseEventHandler;
  background?: string | [string, string];
  gradientDirection?: string;
  buttonHeight?: string;
  buttonWidth?: string;
  hasBorder?: boolean;
  borederGradientDirection?: string;
  borderColor?: string | [string, string];
  borderWidth?: string | number;
  borderRadius?: number;
  disabled?: boolean;
  grayscale?: string;
  boxShadow?: string;
  LeftHtml?: ReactNode;
  rightHtml?: ReactNode;
  padding?: string;
}

export const Button: FC<ButtonProps> = ({
  className = '',
  background = 'blue',
  buttonWidth = '120px',
  disabled = false,
  buttonHeight = '39px',
  borderColor = 'black',
  borderWidth = '1px',
  borderRadius = 5,
  fontSize = '14px',
  fontFamily = 'BitCell',
  textColor = 'white',
  hasBorder = false,
  grayscale = '50%',
  fontWeight = '600',
  onClick,
  text = 'Texte a difinir',
  gradientDirection = 'to right',
  borederGradientDirection = 'to right',
  boxShadow = '',
  LeftHtml = <div />,
  rightHtml = <div />,
  padding = ''
}) => {
  const isGradient = (
    value: string | [string, string]
  ): value is [string, string] => {
    return Array.isArray(value);
  };

  // filter: disabled ? `grayscale(${grayscale})` : 'none',

  const buttonStyle: CSSProperties = {
    boxShadow: boxShadow,
    display: 'flex',
    justifyContent: 'center',
    filter: disabled ? `grayscale(${grayscale})` : 'none',
    alignItems: 'center',
    background: disabled
      ? '#F2F2F2'
      : isGradient(background)
      ? `linear-gradient(${gradientDirection}, ${background[0]}, ${background[1]})`
      : background,
    borderStyle: 'none',
    borderRadius,
    width: '100%',
    height: '100%',
    color: disabled ? '#D1CFCA' : textColor,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily,
    fontSize,
    // padding: hasBorder
    //   ? '10px 20px'
    //   : `calc(10px + ${borderWidth}) calc(20px + ${borderWidth})`,
    textAlign: 'center',
    textDecoration: 'none',
    userSelect: 'none',
    fontWeight: fontWeight,
    padding
    // Fill: 'Solid #FFFFFF'
  };

  const borderGradient = isGradient(borderColor)
    ? `linear-gradient(${borederGradientDirection}, ${borderColor[0]}, ${borderColor[1]})`
    : borderColor;

  const wrapperStyle: CSSProperties = {
    width: buttonWidth,
    filter: disabled ? `grayscale(${grayscale})` : 'none',
    height: buttonHeight,
    background: hasBorder ? borderGradient : 'transparent',
    borderRadius,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: hasBorder ? borderWidth : 0
  };

  const HtmlLeftSvgStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '5px'
  };
  const HtmlRightSvgStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: '5px'
  };

  return (
    <div style={wrapperStyle}>
      <button
        disabled={disabled}
        style={buttonStyle}
        onClick={onClick}
        className={'dinoButton'}
      >
        <div style={HtmlLeftSvgStyle}>{LeftHtml}</div>
        {text}
        <div style={HtmlRightSvgStyle}>{rightHtml}</div>
      </button>
    </div>
  );
};
