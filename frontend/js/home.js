fetch('/session-info')
  .then(res => res.json())
  .then(data => {
    if (data.loggedIn) {
        document.getElementById("Title").innerHTML = "Welcome " + data.name + " !";
    } else {
      console.log("User not logged in.");
    }
  });
