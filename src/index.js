const BASE_URL = "https://phase-1-project-backend-u0oo.onrender.com";
const API1URL = `${BASE_URL}/bookings`;
const MPESA_API_URL = `${BASE_URL}/mpesa/stk`;

// Utility functions
const formatPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return "254" + cleaned.substring(1);
  }
  if (cleaned.startsWith("7") && cleaned.length === 9) {
    return "254" + cleaned;
  }
  if (cleaned.startsWith("254") && cleaned.length === 12) {
    return cleaned;
  }

  throw new Error("Invalid phone number format. Use 07... or 254...");
};

const showReceipt = (booking) => {
  const paymentStatus =
    booking.paymentStatus === "Completed"
      ? `✅ Paid (M-Pesa: ${booking.mpesaCode})`
      : booking.mpesaCode
      ? ` Processing...`
      : `❌ Unpaid`;

  const receiptDetails = `
👑 Luxury Rides Booking Receipt 

PAYMENT STATUS: ${paymentStatus}
Name: ${booking.name}
Phone: ${booking.phoneNumber}
Residence: ${booking.residence}
Route: ${booking.route}
Departure: ${booking.departureDate} at ${booking.departureTime}
Seats: ${booking.selectedSeats?.join(", ") || "N/A"}
Amount: KES ${booking.seats * 1000}

Thank you for choosing Luxury Rides! 🚐✨
`;

  const existingPopup = document.querySelector(".receipt-popup");
  if (existingPopup) existingPopup.remove();

  const popup = document.createElement("div");
  popup.className = "receipt-popup";
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.background = "white";
  popup.style.padding = "20px";
  popup.style.borderRadius = "10px";
  popup.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
  popup.style.zIndex = "1000";
  popup.style.maxWidth = "90%";
  popup.style.width = "400px";

  popup.innerHTML = `
    <pre style="white-space: pre-wrap; font-family: inherit;">${receiptDetails}</pre>
    <button id="closePopup" style="margin-top: 10px; padding: 8px 16px; background: #333; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
  `;

  document.body.appendChild(popup);
  document.getElementById("closePopup").addEventListener("click", () => {
    popup.remove();
  });
};

// Booking History Functions
const displayBookingHistory = async () => {
  const bookingHistoryList = document.getElementById("booking-history-list");
  bookingHistoryList.innerHTML = "<li>Loading bookings...</li>";

  try {
    const response = await fetch(API1URL);
    if (!response.ok) throw new Error("Failed to load bookings");
    const bookings = await response.json();

    if (bookings.length === 0) {
      bookingHistoryList.innerHTML = "<li>No bookings found</li>";
      return;
    }

    bookingHistoryList.innerHTML = bookings
      .map(
        (booking) => `
      <li class="booking-item" data-id="${booking.id}">
        <div class="booking-info">
          <span class="booking-route">${booking.route}</span>
          <span class="booking-date">${booking.departureDate} at ${
          booking.departureTime
        }</span>
          <span class="booking-status ${booking.paymentStatus.toLowerCase()}">
            ${booking.paymentStatus === "Completed" ? "✅ Paid" : "❌ Pending"}
          </span>
        </div>
        <div class="booking-actions">
          <button class="edit-booking" data-id="${booking.id}" ${
          booking.paymentStatus === "Completed" ? "disabled" : ""
        }>
            Mark as Paid
          </button>
          <button class="delete-booking" data-id="${booking.id}">Delete</button>
        </div>
      </li>
    `
      )
      .join("");

    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-booking").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const bookingId = e.target.dataset.id;
        if (confirm("Are you sure you want to cancel this booking?")) {
          await deleteBooking(bookingId);
        }
      });
    });

    // Add event listeners to edit buttons
    document.querySelectorAll(".edit-booking").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const bookingId = e.target.dataset.id;
        if (confirm("Mark this booking as paid?")) {
          await updateBookingStatus(bookingId);
        }
      });
    });
  } catch (error) {
    bookingHistoryList.innerHTML = `<li style="color: red;">Error: ${error.message}</li>`;
    console.error("Booking history error:", error);
  }
};

const deleteBooking = async (bookingId) => {
  try {
    const response = await fetch(`${API1URL}/${bookingId}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete booking");
    await displayBookingHistory();
    alert("Booking cancelled successfully");
  } catch (error) {
    console.error("Delete booking error:", error);
    alert(`Failed to cancel booking: ${error.message}`);
  }
};

const updateBookingStatus = async (bookingId) => {
  try {
    const response = await fetch(`${API1URL}/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentStatus: "Completed",
        mpesaCode: "MANUAL_PAYMENT",
      }),
    });

    if (!response.ok) throw new Error("Failed to update booking status");
    await displayBookingHistory();
    alert("✅ Booking marked as paid!");
  } catch (error) {
    console.error("Update error:", error);
    alert(`❌ Failed: ${error.message}`);
  }
};

// Main application
document.addEventListener("DOMContentLoaded", () => {
  const seatButtons = document.querySelectorAll(".seat");
  const totalDisplay = document.getElementById("bookingTotal");
  let selectedSeats = [];

  // Initialize booking history
  displayBookingHistory();

  // Seat selection logic
  seatButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const seatNumber = button.textContent;
      if (selectedSeats.includes(seatNumber)) {
        selectedSeats = selectedSeats.filter((seat) => seat !== seatNumber);
        button.classList.remove("selected");
      } else {
        selectedSeats.push(seatNumber);
        button.classList.add("selected");
      }
      totalDisplay.innerHTML = `
        Total: KES ${selectedSeats.length * 1000} <br/>
        <button type="submit">Checkout</button>
      `;
    });
  });

  // Form submission
  const form = document.getElementById("Booking-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const booking = {
      name: document.getElementById("name").value,
      phoneNumber: document.getElementById("phoneNumber").value,
      residence: document.getElementById("residence").value,
      departureDate: document.getElementById("date").value,
      route: document.getElementById("route-selector").value,
      departureTime: document.getElementById("time-selctor").value,
      selectedSeats,
      seats: selectedSeats.length,
      paymentStatus: "Pending",
      mpesaCode: "",
    };

    try {
      // 1. Save booking first
      const saveRes = await fetch(API1URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking),
      });

      if (!saveRes.ok) {
        const error = await saveRes.json();
        throw new Error(error.message || "Failed to save booking");
      }

      // 2. Process payment (if phone provided)
      let mpesaPhone = prompt("Enter M-Pesa number (e.g. 0712345678):");
      if (mpesaPhone) {
        try {
          mpesaPhone = formatPhone(mpesaPhone);
          const amount = booking.seats * 1000;

          const paymentRes = await fetch(MPESA_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: mpesaPhone, amount }),
          });

          if (!paymentRes.ok) {
            const error = await paymentRes.json();
            throw new Error(error.message || "Payment request failed");
          }

          alert("📲 M-Pesa payment request sent to your phone!");

          // 3. Enhanced polling with timeout
          const startTime = Date.now();
          const pollPaymentStatus = async () => {
            try {
              const statusRes = await fetch(
                `${BASE_URL}/mpesa/status/${booking.phoneNumber}`
              );

              if (!statusRes.ok) throw new Error("Status check failed");

              const { bookings } = await statusRes.json();
              const updatedBooking = bookings[0];

              if (updatedBooking?.paymentStatus === "Completed") {
                showReceipt(updatedBooking);
                await displayBookingHistory();
                return;
              }

              // Stop polling after 5 minutes (300000ms)
              if (Date.now() - startTime > 300000) {
                showReceipt(booking);
                return;
              }

              setTimeout(pollPaymentStatus, 3000);
            } catch (error) {
              console.error("Polling error:", error);
              setTimeout(pollPaymentStatus, 3000);
            }
          };

          pollPaymentStatus();
        } catch (error) {
          console.error("Payment error:", error);
          alert(`⚠️ Payment error: ${error.message}`);
        }
      } else {
        alert("ℹ️ Booking saved without payment initiation");
      }

      // Show immediate receipt (with pending status)
      showReceipt(booking);

      // Reset form
      selectedSeats = [];
      seatButtons.forEach((btn) => btn.classList.remove("selected"));
      form.reset();
      totalDisplay.innerHTML = `Total: KES 0 <br/><button type="submit">Checkout</button>`;

      // Refresh history
      await displayBookingHistory();
    } catch (error) {
      console.error("Booking error:", error);
      alert(`❌ Error: ${error.message}`);
      showReceipt(booking);
    }
  });
});
