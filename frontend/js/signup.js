async function Signup() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  let missingFields = [];

  if (!name) missingFields.push("Name");
  if (!email) missingFields.push("Email");
  if (!password) missingFields.push("Password");

  if (missingFields.length > 0) {
    alert("Please fill in: " + missingFields.join(", "));
  } else {
    const response = await fetch('/signup', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        password,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      alert(errorText);
      return;
    }
    if (response.redirected) {
      window.location.href = response.url;
    }
  }
}



document.getElementById("signup").addEventListener("click", Signup);