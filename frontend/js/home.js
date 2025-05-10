fetch('/session-info')
  .then(res => res.json())
  .then(data => {
    if (data.loggedIn) {
        document.getElementById("Title").innerHTML = "Welcome " + data.name + " !";
    } else {
      console.log("User not logged in.");
    }
  });


async function Logout(){
    let response = await fetch("/logout", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    })
    console.log("Logout successful");

    if (response.redirected) {
        window.location.href = response.url;
    }
}

document.getElementById("logout").addEventListener("click", Logout);

