import React, { useEffect, useMemo, useState } from "react";
import { HiOutlineArrowNarrowRight } from "react-icons/hi";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE = "http://localhost:5000";

// Simple seat layout (can be moved to server)
const SEAT_IDS = [
  "A1","A2","A3","A4","A5",
  "B1","B2","B3","B4","B5",
  "C1","C2","C3","C4","C5",
  "D1","D2","D3","D4","D5",
];

const Reservation = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");

  // Raw reservations for the 7-day window
  const [reservations, setReservations] = useState([]);
  // Live holds (reservedUntil > now) for NOW-only
  const [seatsNow, setSeatsNow] = useState([]);

  const [selectedSeat, setSelectedSeat] = useState(null);

  // Weekly window
  const [week, setWeek] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Calendar start date (YYYY-MM-DD)
  const [calendarStart, setCalendarStart] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [loading, setLoading] = useState(false);

  const fetchWeek = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/reservations/slots`, {
        params: { start: calendarStart, days: 7 },
        withCredentials: true,
      });
      setWeek(data.week || []);
      if ((data.week || []).length > 0) {
        const stillVisible = (data.week || []).some(w => w.date === selectedDate);
        setSelectedDate(stillVisible ? selectedDate : data.week[0].date);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load weekly slots.");
    }
  };

  const fetchActiveHolds = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/reservations/seats`, {
        withCredentials: true,
      });
      setSeatsNow(data.seats || []);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load seats.");
    }
  };

  const fetchRawWeek = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/reservations/rawWeek`, {
        params: { start: calendarStart, days: 7 },
        withCredentials: true,
      });
      setReservations(data.reservations || []);
    } catch {
      setReservations([]);
    }
  };

  useEffect(() => {
    fetchWeek();
    fetchActiveHolds();
    fetchRawWeek();
    const t = setInterval(fetchActiveHolds, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Also refetch when calendarStart changes
  useEffect(() => {
    fetchWeek();
    fetchRawWeek();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarStart]);

  const overlaps = (aS, aE, bS, bE) => aS < bE && bS < aE;

  const seatReservedForSelectedSlot = (seatId) => {
    if (!selectedDate || !selectedSlot) return false;
    const list = reservations.filter(
      (r) => r.seatId === seatId && r.date === selectedDate && ["held", "confirmed"].includes(r.status)
    );
    return list.some((r) => overlaps(selectedSlot.startTime, selectedSlot.endTime, r.startTime, r.endTime));
  };

  const seatReservedNow = (seatId) => !!seatsNow.find((s) => s.seatId === seatId);

  const isSeatGreen = (seatId) => {
    if (selectedDate && selectedSlot) return seatReservedForSelectedSlot(seatId);
    return seatReservedNow(seatId);
  };

  const handleHoldNow = async () => {
    if (!selectedSeat) return toast.error("Choose a seat first.");
    if (!firstName.trim()) return toast.error("First name is required.");
    if (lastName.trim().length < 1) return toast.error("Last name must be at least 1 character.");
    if (!/^\d{10,}$/.test(phone.trim())) return toast.error("Phone must be at least 10 digits.");

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${API_BASE}/api/reservations/hold`,
        { seatId: selectedSeat, firstName, lastName, email, phone },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );
      toast.success(data.message || "Seat reserved for 1 hour.");
      await fetchActiveHolds();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to reserve seat.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedSeat) return toast.error("Select the reserved seat to cancel.");
    if (!/^\d{10,}$/.test(phone.trim())) return toast.error("Enter the phone number used to reserve (10+ digits).");
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${API_BASE}/api/reservations/cancel`,
        { seatId: selectedSeat, phone },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );
      toast.success(data.message || "Reservation canceled.");
      await Promise.all([fetchActiveHolds(), fetchRawWeek(), fetchWeek()]);
    } catch (e) {
      toast.error(e.response?.data?.message || "Cancel failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleBookSeatAndSlot = async () => {
    if (!selectedSeat) return toast.error("Pick a seat from the grid first.");
    if (!selectedDate || !selectedSlot) return toast.error("Pick a day and time slot.");
    if (!firstName.trim() || lastName.trim().length < 1) return toast.error("Enter valid first and last names.");
    if (!/^\d{10,}$/.test(phone.trim())) return toast.error("Phone must be at least 10 digits.");

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${API_BASE}/api/reservations/bookSeatSlot`,
        {
          seatId: selectedSeat,
          firstName,
          lastName,
          phone,
          email,
          date: selectedDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
        },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );
      toast.success(data.message || "Seat and slot reserved.");
      await Promise.all([fetchRawWeek(), fetchWeek()]);
    } catch (e) {
      toast.error(e.response?.data?.message || "Booking failed.");
    } finally {
      setLoading(false);
    }
  };

  const selectedDay = week.find((d) => d.date === selectedDate);

  return (
    <section className="reservation" id="reservation">
      <div className="container">
        <div className="banner">
          <div className="reservation_form_box" style={{ width: "100%" }}>
            <h1>MAKE A RESERVATION</h1>
            <p>Pick any start date to view a 7-day window; seats turn green only when reserved in the selected hour on that day.</p>

            {/* Calendar start date (shifts 7-day window) */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "8px 0 12px" }}>
              <label>Start date:</label>
              <input
                type="date"
                value={calendarStart}
                onChange={(e) => setCalendarStart(e.target.value)}
              />
              <button className="btn" onClick={() => { fetchWeek(); fetchRawWeek(); }}>
                Load Week
              </button>
            </div>

            {/* Day selector */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
              {week.map((d) => (
                <button
                  key={d.date}
                  className="btn"
                  style={{
                    background: selectedDate === d.date ? "#c0392b" : "#fff",
                    color: selectedDate === d.date ? "#fff" : "#c0392b",
                    border: "1px solid #c0392b",
                  }}
                  onClick={() => setSelectedDate(d.date)}
                >
                  {d.dayName} ({d.date})
                </button>
              ))}
            </div>

            {/* Hour slot selector */}
            {selectedDay && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8, marginBottom: 12 }}>
                {selectedDay.slots.map((slot) => {
                  const isSel = selectedSlot && selectedSlot.startTime === slot.startTime && selectedSlot.endTime === slot.endTime;
                  return (
                    <button
                      key={`${selectedDay.date}-${slot.startTime}`}
                      className="btn"
                      style={{
                        background: slot.reserved ? "#ffdcdc" : isSel ? "#2ecc71" : "#fff",
                        color: slot.reserved ? "#b30000" : isSel ? "#fff" : "#2c3e50",
                        border: "1px solid #ccc",
                        cursor: "pointer",
                      }}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot.startTime} - {slot.endTime}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Pentagon seat grid driven by selected date/time */}
            <div className="seat-grid">
              {SEAT_IDS.map((id) => {
                const green = isSeatGreen(id);
                const selected = selectedSeat === id;
                return (
                  <button
                    type="button"
                    key={id}
                    className={[
                      "seat",
                      "pentagon",
                      green ? "reserved" : "free",
                      selected ? "selected" : "",
                    ].join(" ")}
                    title={green ? "Reserved for this time" : "Available"}
                    onClick={() => setSelectedSeat(id)}
                    disabled={loading}
                  >
                    <span className="seat-label">{id}</span>
                  </button>
                );
              })}
            </div>

            {/* Customer fields */}
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="tel"
                  placeholder="Phone (10+ digits)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button type="button" onClick={handleHoldNow} disabled={loading || !selectedSeat}>
                  Hold 1hr (Now) <HiOutlineArrowNarrowRight />
                </button>
                <button type="button" onClick={handleCancel} disabled={loading || !selectedSeat}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleBookSeatAndSlot}
                  disabled={loading || !selectedSeat || !selectedDate || !selectedSlot}
                >
                  Book Seat + Slot
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Reservation;
