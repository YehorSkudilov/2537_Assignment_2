fetch('/session-info')
  .then(res => res.json())
  .then(data => {
    if (data.loggedIn) {
        document.getElementById("Title").innerHTML = "Welcome " + data.name + " !";
    } else {
      console.log("User not logged in.");
    }
  });

  function LoadCats() {
    let catImages = [
      '/images/Cat_August_2010-4.jpg',
      '/images/michael-sum-LEpfefQf4rU-unsplash.jpg',
      '/images/205719.jpg',
    ];
  
    // Shuffle and pick 3 unique
    let shuffled = catImages.sort(() => 0.5 - Math.random()).slice(0, 3);
  
    const catRow = document.getElementById("catRow");
    catRow.innerHTML = ""; // clear old images
  
    shuffled.forEach(src => {
      const col = document.createElement("div");
      col.className = "col-12 col-sm-6 col-md-4 mb-3";
  
      const img = document.createElement("img");
      img.src = src;
      img.alt = "Random Cat";
      img.className = "img-fluid rounded";
  
      col.appendChild(img);
      catRow.appendChild(col);
    });
  }
  
  LoadCats();