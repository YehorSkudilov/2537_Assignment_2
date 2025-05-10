fetch('/session-info')
  .then(res => res.json())
  .then(data => {
    if (data.loggedIn) {
        document.getElementById("Title").innerHTML = "Welcome " + data.name + " !";
    } else {
      console.log("User not logged in.");
    }
  });

  function LoadCats(){
  let catImages = [
    '/images/Cat_August_2010-4.jpg',
    '/images/michael-sum-LEpfefQf4rU-unsplash.jpg',
    '/images/205719.jpg',
  ];
  let random_cat = catImages[Math.floor(Math.random() * catImages.length)];

  document.getElementById("cats").src = random_cat;
}
LoadCats();
