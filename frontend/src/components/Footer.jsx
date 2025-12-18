import React from "react";

const Footer = () => {
  return (
    <footer
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px 0",
        background: "#f34911ff",
        color: "#f5f5f5",
      }}
    >
      <div
        className="container"
        style={{
          width: "100%",
          maxWidth: "900px",
          padding: "0 16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div
          className="banner"
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "24px",
            flexWrap: "wrap",
          }}
        >
          <div className="left" style={{ fontWeight: 600, fontSize: "1.1rem" }}>
            Legit
          </div>
          <div
            className="right"
            style={{
              display: "flex",
              gap: "16px",
              alignItems: "center",
              flexWrap: "wrap",
              opacity: 0.9,
            }}
          >
            <p style={{ margin: 0 }}>India, Karnataka</p>
          </div>
        </div>

        <div
          className="banner"
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "24px",
            flexWrap: "wrap",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: "12px",
          }}
        >
          <div className="left" style={{ opacity: 0.9 }}>
            <p style={{ margin: 0 }}>Developed By Legit</p>
          </div>
          <div className="right" style={{ opacity: 0.9 }}>
            <p style={{ margin: 0 }}>All Rights Reserved By Legit.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
