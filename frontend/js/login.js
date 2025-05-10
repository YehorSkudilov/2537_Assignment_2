async function Login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
  
    let missingFields = [];
  
    if (!email) missingFields.push("Email");
    if (!password) missingFields.push("Password");
  
    if (missingFields.length > 0) {
      alert("Please fill in: " + missingFields.join(", "));
    } else {
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
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
  
  
  
  document.getElementById("login").addEventListener("click", Login);