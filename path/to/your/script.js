// Fix for hamburger button not working
document.querySelector('.hamburger-button').addEventListener('click', function() {
  const navMenu = document.querySelector('.nav-menu');
  navMenu.classList.toggle('active');
}); 