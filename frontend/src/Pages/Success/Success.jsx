import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HiOutlineArrowNarrowRight } from "react-icons/hi";

/**
 * Success page after successful reservation
 * Expects optional state passed via navigate, e.g.:
 *   navigate("/success", { state: { seatId, reservedUntil, firstName } })
 * If not provided, it still shows a generic success and countdown redirect.
 */
const Success = () => {
  const [countdown, setCountdown] = useState(10);
  const navigate = useNavigate();
  const location = useLocation();

  const seatId = location.state?.seatId || null;
  const reservedUntilIso = location.state?.reservedUntil || null;
  const firstName = location.state?.firstName || null;

  const reservedUntil = useMemo(
    () => (reservedUntilIso ? new Date(reservedUntilIso) : null),
    [reservedUntilIso]
  );

  useEffect(() => {
    const timeoutId = setInterval(() => {
      setCountdown((preCount) => {
        if (preCount === 1) {
          clearInterval(timeoutId);
          navigate("/");
        }
        return preCount - 1;
      });
    }, 1000);
    return () => clearInterval(timeoutId);
  }, [navigate]);

  return (
    <>
      <section className="notFound">
        <div className="container" style={{ textAlign: "center" }}>
          <img src="/sandwich.png" alt="success" />
          <h1 style={{ marginTop: 12 }}>
            {firstName ? `Thanks, ${firstName}!` : "Reservation Confirmed!"}
          </h1>
          <p style={{ marginTop: 8 }}>
            {seatId
              ? `Seat ${seatId} is reserved for 1 hour.`
              : "Your reservation hold has been created for 1 hour."}
          </p>
          <p style={{ marginTop: 4 }}>
            {reservedUntil
              ? `Reserved until ${reservedUntil.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}.`
              : "You can view your reserved seat in the reservation page."}
          </p>

          <h2 style={{ marginTop: 18 }}>
            Redirecting to Home in {countdown} seconds...
          </h2>

          <div style={{ marginTop: 16, display: "flex", gap: 12, justifyContent: "center" }}>
            <Link to={"/"}>
              Back to Home <HiOutlineArrowNarrowRight />
            </Link>
            <Link to={"/reservation"}>
              View Seats <HiOutlineArrowNarrowRight />
            </Link>
            <button
              style={{
                border: "none",
                background: "transparent",
                color: "#c0392b",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
              onClick={() => navigate("/reservation")}
              title="Make another reservation"
            >
              Reserve Another <HiOutlineArrowNarrowRight />
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Success;
