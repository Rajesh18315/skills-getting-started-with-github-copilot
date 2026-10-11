document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const activityCards = new Map();

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        let spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span class="availability">${spotsLeft} spots left</span></p>
        `;

        const participantsSection = document.createElement("section");
        participantsSection.className = "participants";

        const participantsHeading = document.createElement("h5");
        participantsHeading.className = "participants-heading";

        const participantsLabel = document.createElement("span");
        participantsLabel.textContent = "Participants";

        const participantsCount = document.createElement("span");
        participantsCount.className = "participants-count";
        participantsHeading.append(participantsLabel, participantsCount);

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        const updateParticipantsCount = () => {
          participantsCount.textContent = details.participants.length;
        };

        const addParticipant = (email) => {
          const emptyMessage = participantsList.querySelector(".participants-empty");
          if (emptyMessage) {
            emptyMessage.remove();
          }

          const participant = document.createElement("li");
          participant.textContent = email;
          participantsList.appendChild(participant);
          details.participants.push(email);
          updateParticipantsCount();
          spotsLeft -= 1;
          activityCard.querySelector(".availability").textContent = `${spotsLeft} spots left`;
        };

        if (details.participants.length === 0) {
          const emptyMessage = document.createElement("li");
          emptyMessage.className = "participants-empty";
          emptyMessage.textContent = "No participants yet";
          participantsList.appendChild(emptyMessage);
        } else {
          details.participants.forEach((email) => {
            const participant = document.createElement("li");
            participant.textContent = email;
            participantsList.appendChild(participant);
          });
        }

        updateParticipantsCount();
        participantsSection.append(participantsHeading, participantsList);
        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);
        activityCards.set(name, { addParticipant });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        const card = activityCards.get(activity);
        if (card) {
          card.addParticipant(email);
        }
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
