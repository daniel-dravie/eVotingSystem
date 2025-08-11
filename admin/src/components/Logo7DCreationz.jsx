import PropTypes from 'prop-types';

const Logo7DCreationz = ({ width = 200, height = 60, className = "" }) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 200 60" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f093fb" />
          <stop offset="100%" stopColor="#f5576c" />
        </linearGradient>
      </defs>
      
      <text 
        x="10" 
        y="35" 
        fontFamily="Arial, sans-serif" 
        fontSize="28" 
        fontWeight="bold" 
        fill="url(#gradient1)"
      >
        7D
      </text>
      
      <text 
        x="50" 
        y="35" 
        fontFamily="Arial, sans-serif" 
        fontSize="24" 
        fontWeight="600" 
        fill="url(#gradient2)"
      >
        creationz
      </text>
      
      <circle 
        cx="170" 
        cy="20" 
        r="8" 
        fill="url(#gradient1)" 
        opacity="0.8"
      />
      <circle 
        cx="175" 
        cy="35" 
        r="6" 
        fill="url(#gradient2)" 
        opacity="0.7"
      />
      
      <path 
        d="M 10 42 Q 100 45 190 42" 
        stroke="url(#gradient1)" 
        strokeWidth="2" 
        fill="none"
      />
    </svg>
  );
};

Logo7DCreationz.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  className: PropTypes.string,
};

export default Logo7DCreationz;
