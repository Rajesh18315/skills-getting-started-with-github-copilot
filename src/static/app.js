document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

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

        const showEmptyParticipants = () => {
          const emptyMessage = document.createElement("li");
          emptyMessage.className = "participants-empty";
          emptyMessage.textContent = "No participants yet";
          participantsList.appendChild(emptyMessage);
        };

        const removeParticipant = async (email, participant) => {
          const removeButton = participant.querySelector(".remove-participant");
          removeButton.disabled = true;

          try {
            const response = await fetch(
              `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
              { method: "DELETE" }
            );
            const result = await response.json();

            if (!response.ok) {
              throw new Error(result.detail || "Unable to unregister participant");
            }

            const participantIndex = details.participants.indexOf(email);
            if (participantIndex !== -1) {
              details.participants.splice(participantIndex, 1);
              spotsLeft += 1;
              activityCard.querySelector(".availability").textContent = `${spotsLeft} spots left`;
            }
            participant.remove();
            updateParticipantsCount();

            if (details.participants.length === 0) {
              showEmptyParticipants();
            }

            messageDiv.textContent = result.message;
            messageDiv.className = "success";
          } catch (error) {
            messageDiv.textContent = error.message || "Failed to unregister participant. Please try again.";
            messageDiv.className = "error";
            console.error("Error unregistering participant:", error);
          }

          messageDiv.classList.remove("hidden");
          removeButton.disabled = false;
        };

        const createParticipant = (email) => {
          const participant = document.createElement("li");
          participant.className = "participant";

          const participantEmail = document.createElement("span");
          participantEmail.textContent = email;

          const removeButton = document.createElement("button");
          removeButton.className = "remove-participant";
          removeButton.type = "button";
          removeButton.setAttribute("aria-label", `Unregister ${email} from ${name}`);
          removeButton.title = `Unregister ${email}`;
          removeButton.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" />
            </svg>
          `;
          removeButton.addEventListener("click", () => removeParticipant(email, participant));

          participant.append(participantEmail, removeButton);
          return participant;
        };

        if (details.participants.length === 0) {
          showEmptyParticipants();
        } else {
          details.participants.forEach((email) => {
            participantsList.appendChild(createParticipant(email));
          });
        }

        updateParticipantsCount();
        participantsSection.append(participantsHeading, participantsList);
        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

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
        signupForm.reset();
        await fetchActivities();
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
