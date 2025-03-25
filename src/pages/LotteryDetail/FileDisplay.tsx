import React from 'react';

interface FileDisplayProps {
  source: string;
  fileType: string;
  width?: string;
  height?: string;
}

const FileDisplay: React.FC<FileDisplayProps> = ({
  source,
  fileType,
  width = '168px', // Valeur par défaut
  height = '168px' // Valeur par défaut
}: FileDisplayProps) => {
  if (!source) {
    return <div style={{ width, height, backgroundColor: '#f0f0f0' }} />; // Placeholder pour garder l'espace réservé
  }

  if (fileType === 'video/mp4') {
    return (
      <video
        controls
        autoPlay
        muted
        playsInline
        loop
        width={width}
        height={height}
        style={{
          width,
          height,
          objectFit: 'cover',
          maxWidth: 'none',
          maxHeight: 'none'
        }}
      >
        <source src={source} type='video/mp4' />
        Your browser does not support the video tag.
      </video>
    );
  }

  return (
    <img
      src={source}
      alt='SFT'
      width={width}
      height={height}
      style={{
        width,
        height,
        objectFit: 'cover',
        maxWidth: 'none',
        maxHeight: 'none'
      }}
    />
  );
};

export default FileDisplay;
