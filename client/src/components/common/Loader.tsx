import './Loader.css'; // Import the CSS file

const Loader = ({ className }: { className?: string }) => {
  return (
    <div className={`loader ${className}`}></div>
  );
};

export default Loader;