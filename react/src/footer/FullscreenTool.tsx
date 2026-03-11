export default function FullscreenTool() {
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="fullscreen" title="Fullscreen" onClick={handleFullscreen}>
      <i></i>
    </div>
  );
}
