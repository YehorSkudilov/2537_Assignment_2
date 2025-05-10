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

document.querySelectorAll(".logout").forEach(el => {
  el.addEventListener("click", Logout);
});
