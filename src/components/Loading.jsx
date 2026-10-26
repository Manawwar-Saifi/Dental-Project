import logo from "../../public/dental-clinic-logo.png";

/**
 * Full-screen preloader with dental clinic branding
 */
const Loading = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100vw",
        background: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
      }}
    >
      {/* Clinic Logo */}
      <img
        src={logo}
        alt="Dental Clinic"
        style={{
          width: 240,
          height: 240,
          objectFit: "contain",
          marginBottom: 16,
          animation: "pulse 2s ease-in-out infinite",
        }}
      />

      {/* Spinning loader below logo */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "3px solid #e0e0e0",
          borderTop: "3px solid #1976d2",
          animation: "spin 0.8s linear infinite",
          marginBottom: 20,
        }}
      />

      {/* Clinic name */}
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#1976d2",
          letterSpacing: 1,
          marginBottom: 8,
          fontFamily: "Arial, sans-serif",
        }}
      >
        Dental Clinic
      </div>

      {/* Loading text with dots animation */}
      <div
        style={{
          fontSize: 14,
          color: "#888",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
          Loading, please wait...
        </span>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Loading;
