document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.getElementById("userTableBody");
  
    try {
      const response = await fetch("/admin/users");
      if (!response.ok) throw new Error("Failed to fetch users");
  
      const users = await response.json();
  
      users.forEach(user => {
        const row = document.createElement("tr");
        row.classList.add("align-middle");
  
        // Name
        const nameCell = document.createElement("td");
        nameCell.classList.add("fw-semibold", "ps-3");
        nameCell.textContent = user.name;
  
        // Email
        const emailCell = document.createElement("td");
        emailCell.textContent = user.email;
        emailCell.classList.add("text-muted");
  
        // Role
        const roleCell = document.createElement("td");
        roleCell.classList.add("text-center", "p-1");
  
        const select = document.createElement("select");
        select.classList.add("form-select", "form-select-sm", "w-auto");
  
        ["user", "admin"].forEach(role => {
          const option = document.createElement("option");
          option.value = role;
          option.textContent = role.charAt(0).toUpperCase() + role.slice(1);
          if (user.role === role) option.selected = true;
          select.appendChild(option);
        });
  
        select.addEventListener("change", async () => {
          try {
            const res = await fetch("/admin/users/update-role", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                name: user.name,
                newRole: select.value
              })
            });
  
            if (!res.ok) throw new Error("Failed to update role");
            console.log(`Updated role for ${user.name} to ${select.value}`);
          } catch (err) {
            console.error("Error updating role:", err);
            alert(`Failed to update role for ${user.name}`);
          }
        });
  
        roleCell.appendChild(select);
  
        // Created At
        const createdAtCell = document.createElement("td");
        const createdAtDate = new Date(user.createdAt);
        createdAtCell.textContent = createdAtDate.toLocaleDateString() + " " + createdAtDate.toLocaleTimeString();
        createdAtCell.classList.add("text-secondary");
  
        row.appendChild(nameCell);
        row.appendChild(emailCell);
        row.appendChild(roleCell);
        row.appendChild(createdAtCell);
        tableBody.appendChild(row);
      });
  
    } catch (err) {
      console.error("Error loading users:", err);
      tableBody.innerHTML = `<tr><td colspan="4" class="text-danger text-center">Error loading users.</td></tr>`;
    }
  });
  